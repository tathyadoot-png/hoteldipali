import { readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";

import { chromium } from "@playwright/test";

/**
 * Extracts still frames from the entrance video so the hero has a poster that
 * exactly matches the video's first frame (no flash when playback takes over)
 * and a lighter static still for mobile / reduced-motion visitors.
 *
 * There is no ffmpeg in this toolchain, so frames are decoded by a real
 * browser (Playwright, already a dev dependency) and written straight to disk.
 * Re-run after replacing public/video/entry.mp4 with the real footage:
 *
 *   pnpm make:video-frames                      # defaults below
 *   pnpm make:video-frames --poster=0 --still=11
 */

const VIDEO = join(process.cwd(), "public", "video", "entry.mp4");
const OUT_DIR = join(process.cwd(), "public", "video");
const QUALITY = 0.8;

function arg(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = hit ? Number(hit.split("=")[1]) : fallback;
  if (!Number.isFinite(value) || value < 0) throw new Error(`--${name} must be a number of seconds`);
  return value;
}

const FRAMES = [
  // Desktop poster: must be the very first frame the scrubbed video shows.
  { file: "entry-poster.webp", time: arg("poster", 0) },
  // Mobile / reduced-motion still: the most "establishing" moment.
  { file: "entry-still.webp", time: arg("still", 11) },
];

async function main(): Promise<void> {
  const video = readFileSync(VIDEO);

  // Serve the page and the whole file from memory; the page loads the video
  // into a Blob so seeking never depends on HTTP range support.
  const server = createServer((req, res) => {
    if (req.url === "/entry.mp4") {
      res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": video.length });
      res.end(video);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!doctype html><title>frames</title><body></body>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`);

    const frames = await page.evaluate(
      async ({ frames, quality }) => {
        const blob = await (await fetch("/entry.mp4")).blob();
        const v = document.createElement("video");
        v.muted = true;
        v.src = URL.createObjectURL(blob);
        await new Promise<void>((resolve, reject) => {
          v.addEventListener("loadeddata", () => resolve(), { once: true });
          v.addEventListener("error", () => reject(new Error("video failed to decode")), {
            once: true,
          });
        });

        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");

        const out: Array<{ file: string; time: number; dataUrl: string }> = [];
        for (const frame of frames) {
          const time = Math.min(frame.time, v.duration - 0.05);
          await new Promise<void>((resolve) => {
            v.addEventListener("seeked", () => resolve(), { once: true });
            v.currentTime = time;
          });
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          out.push({ file: frame.file, time, dataUrl: canvas.toDataURL("image/webp", quality) });
        }
        return {
          frames: out,
          width: v.videoWidth,
          height: v.videoHeight,
          duration: v.duration,
        };
      },
      { frames: FRAMES, quality: QUALITY },
    );

    console.log(
      `Video ${frames.width}×${frames.height}, ${frames.duration.toFixed(2)}s — writing ${frames.frames.length} frame(s):`,
    );
    for (const frame of frames.frames) {
      const base64 = frame.dataUrl.split(",")[1] ?? "";
      const path = join(OUT_DIR, frame.file);
      writeFileSync(path, Buffer.from(base64, "base64"));
      const kb = (statSync(path).size / 1024).toFixed(1);
      console.log(`  ${frame.file.padEnd(20)} t=${frame.time.toFixed(2)}s  ${kb} KB`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
