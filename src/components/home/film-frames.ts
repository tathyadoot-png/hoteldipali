/**
 * Frame cache for the scroll-scrubbed entrance film.
 *
 * Why: seeking an H.264 file with sparse keyframes forces the decoder to rebuild
 * each requested frame from the previous keyframe, which stalled frame
 * presentation (~40 ms frames, p95) whenever the visitor scrolled. Playing the
 * film forward is cheap, so we play it once, silently and offscreen, at a few
 * times normal speed, capture frames as they are presented, and keep them as
 * small JPEG blobs. Scrubbing then only decodes one still image per change
 * (off the main thread) and draws it to a canvas — no seeks at all.
 *
 * Measured in Chromium on the 854×480 prototype: 240 frame slots at 12 fps,
 * ~85% filled on one 2.5× pass in ~8 s, ~14 MB of blobs, zero dropped frames
 * while scrolling during capture.
 */

export type FilmFrames = {
  /** Number of frame slots across the film (duration × fps). */
  readonly count: number;
  readonly width: number;
  readonly height: number;
  /** Nearest captured slot to `index`, or -1 if nothing is captured yet. */
  nearest(index: number): number;
  get(index: number): Blob | undefined;
  /** True once the capture pass has finished. */
  readonly complete: boolean;
  dispose(): void;
};

type CaptureOptions = {
  /** Frame slots per second of film. */
  fps?: number;
  /** Playback speed of the capture pass. */
  rate?: number;
  /** Longest edge of stored frames; larger footage is scaled down. */
  maxEdge?: number;
  quality?: number;
  signal?: AbortSignal;
  /** Called after each newly captured slot is stored. */
  onFrame?: (index: number) => void;
};

type FrameCanvas = {
  draw(source: CanvasImageSource): void;
  toBlob(): Promise<Blob | null>;
};

function makeCanvas(width: number, height: number, quality: number): FrameCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (ctx && "convertToBlob" in canvas) {
      return {
        draw: (source) => ctx.drawImage(source, 0, 0, width, height),
        toBlob: () => canvas.convertToBlob({ type: "image/jpeg", quality }),
      };
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  return {
    draw: (source) => ctx?.drawImage(source, 0, 0, width, height),
    toBlob: () => new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality)),
  };
}

/**
 * Plays `src` (ideally a Blob URL, so nothing is re-fetched) once at `rate`
 * and resolves with a frame cache as soon as the first frame is stored; the
 * cache keeps filling in the background until the pass ends.
 */
export async function captureFilm(
  src: string,
  { fps = 12, rate = 2.5, maxEdge = 1280, quality = 0.8, signal, onFrame }: CaptureOptions = {},
): Promise<FilmFrames> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  // Must stay in the document and (barely) rendered, or browsers stop
  // presenting frames for it.
  video.style.cssText =
    "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;";
  video.src = src;
  document.body.appendChild(video);

  const cleanupVideo = () => {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener("loadeddata", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(new Error("film failed to decode")), {
        once: true,
      });
      signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
  } catch (error) {
    cleanupVideo();
    throw error;
  }

  const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);
  const count = Math.max(1, Math.floor(video.duration * fps));
  const frames: Array<Blob | undefined> = new Array(count);
  const taken = new Uint8Array(count);
  const canvas = makeCanvas(width, height, quality);
  let complete = false;
  let disposed = false;

  const cache: FilmFrames = {
    count,
    width,
    height,
    get complete() {
      return complete;
    },
    get: (index) => frames[index],
    nearest(index) {
      const i = Math.min(count - 1, Math.max(0, Math.round(index)));
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    },
    dispose() {
      disposed = true;
      frames.fill(undefined);
      cleanupVideo();
    },
  };

  const store = (index: number) => {
    if (disposed || index < 0 || index >= count || taken[index]) return;
    taken[index] = 1;
    canvas.draw(video);
    void canvas.toBlob().then((blob) => {
      if (!blob || disposed) return;
      frames[index] = blob;
      onFrame?.(index);
    });
  };

  const finish = () => {
    complete = true;
    if (!disposed) cleanupVideo();
  };

  const supportsFrameCallback = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
  if (supportsFrameCallback) {
    const onPresented = (_now: number, meta: VideoFrameCallbackMetadata) => {
      if (disposed) return;
      store(Math.round(meta.mediaTime * fps));
      if (!video.ended) video.requestVideoFrameCallback(onPresented);
    };
    video.requestVideoFrameCallback(onPresented);
  } else {
    // Fallback: sample on animation frames while playing.
    const poll = () => {
      if (disposed || video.ended) return;
      store(Math.round(video.currentTime * fps));
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }

  video.addEventListener("ended", finish, { once: true });
  signal?.addEventListener("abort", () => cache.dispose(), { once: true });
  video.playbackRate = rate;
  await video.play().catch(() => {
    finish();
    throw new Error("film playback was blocked");
  });

  return cache;
}
