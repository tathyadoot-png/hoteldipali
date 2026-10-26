import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "@playwright/test";

/**
 * Makes the web clip for the home hero's arched window from a source video.
 *
 * The source is read only — never renamed, moved or re-encoded in place. It
 * is 1920×1080 H.264 at ~13 Mbit/s with an audio track and its index at the
 * end of the file (not web-optimised), so it is never served as is.
 *
 * Uses the Chromium that Playwright already installs (no ffmpeg, no muxing
 * library):
 * 1. plays the source at quarter speed and grabs every frame, cropped to the
 *    arch, through requestVideoFrameCallback (seeking returns stale frames in
 *    headless Chromium);
 * 2. ends at `end` (or at an earlier scene cut) and closes the loop: the
 *    last `crossfade` seconds dissolve back to the opening frame, so the file
 *    starts — and every loop restarts — on the poster's framing;
 * 3. encodes with WebCodecs (H.264 Constrained Baseline: no B-frames, plays
 *    everywhere) at exact 1/fps timestamps;
 * 4. writes a web-optimised MP4 here in Node (index first, video only).
 *
 * Run: pnpm make:video
 */

const PUBLIC = join(process.cwd(), "public");

type Job = {
  /** Source path, relative to public/. */
  src: string;
  /** Output path, relative to public/. */
  out: string;
  /** Crop in source pixels. */
  crop: { x: number; y: number; w: number; h: number };
  /** Output size (even numbers). */
  width: number;
  height: number;
  fps: number;
  /** Seconds of dissolve that close the loop. */
  crossfade: number;
  /** Use the source up to here (seconds) — before any closing transition. */
  end: number;
  /** Target bitrate, bits per second. */
  bitrate: number;
};

// The source: an AI animation (Google Veo) of the night photograph
// DJI_20260909011702_0042_D.JPG. Its picture is pillarboxed for the first
// second (1441 px wide, from x = 240) and frames the entrance exactly like the
// photograph, so the hero's arch crop of that photo maps into it directly:
// x 0.335, y 0.25, w 0.37, h 0.685 of the picture. The crop stays clear of
// the bars, the watermark (bottom right) and — under the arch's round top —
// the rooftop sign. The camera pushes in slowly toward the porch until ~7 s,
// then dissolves (7.2–7.8 s) into a wide shot of other buildings: the clip
// ends at 7.0 s, before that dissolve.
const JOBS: Job[] = [
  {
    src: "video/1.mp4",
    out: "video/entrance-night-arch-532.mp4",
    crop: { x: 240 + 0.335 * 1441, y: 0.25 * 1080, w: 0.37 * 1441, h: 0.685 * 1080 },
    width: 532,
    height: 740,
    fps: 24,
    crossfade: 0.75,
    end: 7.0,
    bitrate: 1_200_000,
  },
];

type Encoded = {
  description: string;
  frames: { key: boolean; data: string }[];
  sourceFrames: number;
  cutAt: number | null;
  /** Median and largest frame-to-frame changes (for checking the cut). */
  median: number;
  top: (readonly [number, number])[];
};

async function encode(job: Job): Promise<Encoded> {
  statSync(join(PUBLIC, job.src)); // fail loudly if the source is missing
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // tsx (esbuild keepNames) wraps the named helpers inside the evaluated
  // function in __name(); give the page a no-op one.
  await page.addInitScript("globalThis.__name = (fn) => fn;");
  // WebCodecs needs a secure context, hence the https origin (routed, no TLS).
  await page.route("https://video.local/**", (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
    if (!path) return route.fulfill({ body: "<!doctype html>", contentType: "text/html" });
    return route.fulfill({ body: readFileSync(join(PUBLIC, path)), contentType: "video/mp4" });
  });
  await page.goto("https://video.local/");

  const result = await page.evaluate(
    async ({ src, crop, width, height, fps, crossfade, end, bitrate }) => {
      const codec = "avc1.42001f"; // Constrained Baseline 3.1
      const config: VideoEncoderConfig = {
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
        bitrateMode: "variable",
        latencyMode: "quality",
        avc: { format: "avc" },
      };
      if (!(await VideoEncoder.isConfigSupported(config)).supported) {
        throw new Error(`${codec} encoding is not supported by this Chromium`);
      }

      // 1. Every frame, cropped, keyed by its index.
      const video = document.createElement("video");
      video.muted = true;
      video.src = `/${src}`;
      video.preload = "auto";
      await new Promise((resolve, reject) => {
        video.oncanplaythrough = resolve;
        video.onerror = () => reject(new Error(`cannot decode ${src}`));
      });
      const frames: ImageBitmap[] = [];
      const pending: Promise<void>[] = [];
      // The first presented frame may not be at mediaTime 0 (edit lists).
      let base = -1;
      const onFrame: VideoFrameRequestCallback = (_now, meta) => {
        if (base < 0) base = Math.round(meta.mediaTime * fps);
        const index = Math.round(meta.mediaTime * fps) - base;
        pending.push(
          createImageBitmap(video, crop.x, crop.y, crop.w, crop.h, {
            resizeWidth: width,
            resizeHeight: height,
            resizeQuality: "high",
          }).then((bitmap) => {
            frames[index] = bitmap;
          }),
        );
        if (!video.ended) video.requestVideoFrameCallback(onFrame);
      };
      video.requestVideoFrameCallback(onFrame);
      video.playbackRate = 0.25;
      await video.play();
      await new Promise((resolve) => (video.onended = resolve));
      await Promise.all(pending);
      // Fill any frame the callback skipped with its predecessor.
      for (let i = 1; i < frames.length; i++) frames[i] ??= frames[i - 1]!;
      if (!frames[0]) throw new Error("no frames captured");

      // 2. Find a scene cut: a frame-to-frame change far above the median.
      const probe = new OffscreenCanvas(48, 64);
      const pctx = probe.getContext("2d", { willReadFrequently: true })!;
      const thumb = (b: ImageBitmap) => {
        pctx.drawImage(b, 0, 0, 48, 64);
        return pctx.getImageData(0, 0, 48, 64).data;
      };
      const diffs: number[] = [0];
      let previous = thumb(frames[0]);
      for (let i = 1; i < frames.length; i++) {
        const current = thumb(frames[i]!);
        let sum = 0;
        for (let p = 0; p < current.length; p += 4) {
          sum += Math.abs(current[p]! - previous[p]!) + Math.abs(current[p + 1]! - previous[p + 1]!);
        }
        diffs.push(sum / (current.length / 2));
        previous = current;
      }
      const median = [...diffs].sort((a, b) => a - b)[diffs.length >> 1]!;
      let cutAt: number | null = null;
      for (let i = 1; i < diffs.length; i++) {
        if (diffs[i]! > Math.max(12, median * 6)) {
          cutAt = i;
          break;
        }
      }
      const usable = Math.min(cutAt ?? frames.length, Math.round(end * fps), frames.length);

      // 3. The loop: frames 0 … usable-1, the last K dissolving into frame 0
      // (the poster's framing), so the wrap lands on the frame it ends on.
      const K = Math.round(crossfade * fps);
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d")!;

      const chunks: { key: boolean; data: string }[] = [];
      let description = "";
      const toBase64 = (bytes: Uint8Array) => {
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(bin);
      };
      const encoder = new VideoEncoder({
        output: (chunk, meta) => {
          const desc = meta?.decoderConfig?.description;
          if (desc && !description) {
            description = toBase64(
              ArrayBuffer.isView(desc)
                ? new Uint8Array(desc.buffer, desc.byteOffset, desc.byteLength)
                : new Uint8Array(desc),
            );
          }
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunks.push({ key: chunk.type === "key", data: toBase64(data) });
        },
        error: (e) => {
          throw e;
        },
      });
      encoder.configure(config);
      const step = 1e6 / fps;
      for (let n = 0; n < usable; n++) {
        ctx.globalAlpha = 1;
        ctx.drawImage(frames[n]!, 0, 0);
        const into = n - (usable - K) + 1;
        if (into > 0) {
          ctx.globalAlpha = into / K;
          ctx.drawImage(frames[0], 0, 0);
        }
        const frame = new VideoFrame(canvas, { timestamp: Math.round(n * step), duration: Math.round(step) });
        encoder.encode(frame, { keyFrame: n % (fps * 2) === 0 });
        frame.close();
      }
      await encoder.flush();
      encoder.close();
      for (const b of new Set(frames)) b.close();
      const top = diffs
        .map((d, i) => [i, Math.round(d * 10) / 10] as const)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      return { description, frames: chunks, sourceFrames: frames.length, cutAt, median, top };
    },
    job,
  );
  await browser.close();
  return result;
}

// ── A minimal MP4 writer: one H.264 video track, index first (faststart). ──

function box(type: string, ...parts: Buffer[]): Buffer {
  const body = Buffer.concat(parts);
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length + 8, 0);
  head.write(type, 4, "latin1");
  return Buffer.concat([head, body]);
}

function fullBox(type: string, version: number, flags: number, ...parts: Buffer[]): Buffer {
  const vf = Buffer.alloc(4);
  vf.writeUInt32BE(((version & 0xff) << 24) | (flags & 0xffffff), 0);
  return box(type, vf, ...parts);
}

function u32(...values: number[]): Buffer {
  const b = Buffer.alloc(values.length * 4);
  values.forEach((v, i) => b.writeUInt32BE(v >>> 0, i * 4));
  return b;
}

function u16(...values: number[]): Buffer {
  const b = Buffer.alloc(values.length * 2);
  values.forEach((v, i) => b.writeUInt16BE(v & 0xffff, i * 2));
  return b;
}

const MATRIX = u32(0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000);

function mp4({ width, height, fps }: Job, avcC: Buffer, samples: { key: boolean; data: Buffer }[]): Buffer {
  const timescale = fps * 1000;
  const delta = 1000;
  const duration = samples.length * delta;
  const movieTimescale = 1000;
  const movieDuration = Math.round((duration / timescale) * movieTimescale);

  const ftyp = box("ftyp", Buffer.from("isom", "latin1"), u32(0x200), Buffer.from("isomiso2avc1mp41", "latin1"));

  const build = (chunkOffset: number) => {
    const mvhd = fullBox(
      "mvhd", 0, 0,
      u32(0, 0, movieTimescale, movieDuration, 0x00010000), u16(0x0100), Buffer.alloc(10),
      MATRIX, Buffer.alloc(24), u32(2),
    );
    const tkhd = fullBox(
      "tkhd", 0, 3,
      u32(0, 0, 1, 0, movieDuration), Buffer.alloc(8), u16(0, 0, 0, 0),
      MATRIX, u32(width << 16, height << 16),
    );
    const mdhd = fullBox("mdhd", 0, 0, u32(0, 0, timescale, duration), u16(0x55c4, 0)); // language "und"
    const hdlr = fullBox("hdlr", 0, 0, u32(0), Buffer.from("vide", "latin1"), Buffer.alloc(12), Buffer.from("VideoHandler\0", "latin1"));
    const vmhd = fullBox("vmhd", 0, 1, Buffer.alloc(8));
    const dinf = box("dinf", fullBox("dref", 0, 0, u32(1), fullBox("url ", 0, 1)));
    const avc1 = box(
      "avc1",
      Buffer.alloc(6), u16(1), // reserved, data_reference_index
      Buffer.alloc(16), u16(width, height),
      u32(0x00480000, 0x00480000, 0), u16(1), // 72 dpi, reserved, frame_count
      Buffer.alloc(32), u16(0x0018, 0xffff), // compressor name, depth, pre_defined
      box("avcC", avcC),
    );
    const stsd = fullBox("stsd", 0, 0, u32(1), avc1);
    const stts = fullBox("stts", 0, 0, u32(1, samples.length, delta));
    const keys = samples.flatMap((s, i) => (s.key ? [i + 1] : []));
    const stss = fullBox("stss", 0, 0, u32(keys.length, ...keys));
    const stsc = fullBox("stsc", 0, 0, u32(1, 1, samples.length, 1));
    const stsz = fullBox("stsz", 0, 0, u32(0, samples.length, ...samples.map((s) => s.data.length)));
    const stco = fullBox("stco", 0, 0, u32(1, chunkOffset));
    const stbl = box("stbl", stsd, stts, stss, stsc, stsz, stco);
    const minf = box("minf", vmhd, dinf, stbl);
    const mdia = box("mdia", mdhd, hdlr, minf);
    const trak = box("trak", tkhd, mdia);
    return box("moov", mvhd, trak);
  };

  // The index's size does not depend on the offset value, so size it first.
  const moovSize = build(0).length;
  const moov = build(ftyp.length + moovSize + 8);
  const mdat = box("mdat", ...samples.map((s) => s.data));
  return Buffer.concat([ftyp, moov, mdat]);
}

async function main(): Promise<void> {
  for (const job of JOBS) {
    const { description, frames, sourceFrames, cutAt, median, top } = await encode(job);
    if (!description) throw new Error("the encoder returned no avcC description");
    const samples = frames.map((f) => ({ key: f.key, data: Buffer.from(f.data, "base64") }));
    const file = mp4(job, Buffer.from(description, "base64"), samples);
    mkdirSync(join(PUBLIC, job.out, ".."), { recursive: true });
    writeFileSync(join(PUBLIC, job.out), file);
    console.log(
      `${job.out}: ${job.width}×${job.height}, ${samples.length} frames (${(samples.length / job.fps).toFixed(2)} s loop) ` +
        `from ${sourceFrames} source frames${cutAt === null ? "" : `, scene cut at frame ${cutAt} dropped`}, ` +
        `${(file.length / 1024).toFixed(0)} KB`,
    );
    console.log(
      `  frame changes: median ${median.toFixed(1)}; largest ${top.map(([i, d]) => `#${i} ${d}`).join(", ")}`,
    );
  }
}

await main();
