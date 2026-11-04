/**
 * A photograph with depth, drawn with raw WebGL (no library). Each pixel is
 * shifted along the pointer by how far its depth — a grey map, nearer is
 * brighter — lies from a focal plane, so the near and far planes of the
 * picture slide against each other while the focal plane stays still.
 *
 * Loaded lazily by DepthPhoto (desktop rich motion only). It draws only while
 * the pointer's offset is easing toward its target and stops when it settles:
 * there is no idle animation loop. The canvas maps the photograph exactly as
 * `object-fit: cover` does for the <img> beneath it, so it can fade in over it
 * without a jump. Any failure (no WebGL, a shader error, a lost context)
 * leaves that <img> as it is.
 */

export type DepthOptions = {
  /** The grey depth map, the same crop as the photograph. */
  depthSrc: string;
  /** The photograph's object-position, 0–1 on each axis. */
  focus: { x: number; y: number };
  /** The depth (0 far – 1 near) that stays still. */
  plane: number;
  /** How far the nearest plane moves at the pointer's extreme, in CSS px. */
  maxShift: number;
};

export type DepthRenderer = {
  /** The pointer over the photograph's section, −1…1 on each axis (0, 0 at rest). */
  point(x: number, y: number): void;
  /** Re-reads the canvas's CSS size (call on resize). */
  resize(): void;
  destroy(): void;
};

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uScale;
uniform vec2 uOrigin;
uniform vec2 uShift;
uniform float uPlane;
void main() {
  vec2 uv = uOrigin + vec2(vUv.x, 1.0 - vUv.y) * uScale;
  float depth = texture2D(uDepth, uv).r;
  vec2 shifted = clamp(uv + uShift * (depth - uPlane), vec2(0.0), vec2(1.0));
  gl_FragColor = texture2D(uImage, shifted);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function texture(gl: WebGLRenderingContext, unit: number, source: TexImageSource): WebGLTexture | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Non-power-of-two images: clamp, no mipmaps (WebGL 1).
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  return tex;
}

/**
 * Sets up the renderer and draws the first frame, or resolves null if WebGL
 * is unavailable or anything fails. `onLost` runs if the context is lost
 * later (the caller then removes the canvas).
 */
export async function createDepthRenderer(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  options: DepthOptions,
  onLost: () => void,
): Promise<DepthRenderer | null> {
  const depth = new Image();
  depth.src = options.depthSrc;
  try {
    await Promise.all([depth.decode(), photo.complete ? Promise.resolve() : photo.decode()]);
  } catch {
    return null;
  }

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One quad covering the canvas.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const imageTex = texture(gl, 0, photo);
  const depthTex = texture(gl, 1, depth);
  if (!imageTex || !depthTex) return null;
  gl.uniform1i(gl.getUniformLocation(program, "uImage"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "uDepth"), 1);
  gl.uniform1f(gl.getUniformLocation(program, "uPlane"), options.plane);
  const uScale = gl.getUniformLocation(program, "uScale");
  const uOrigin = gl.getUniformLocation(program, "uOrigin");
  const uShift = gl.getUniformLocation(program, "uShift");

  // The photograph as object-fit: cover lays it out (in its own UV space).
  let shown = { w: 1, h: 1 };
  const layout = () => {
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, canvas.clientWidth || rect.width);
    const ch = Math.max(1, canvas.clientHeight || rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const iw = photo.naturalWidth;
    const ih = photo.naturalHeight;
    const s = Math.max(cw / iw, ch / ih);
    shown = { w: iw * s, h: ih * s };
    const sx = cw / shown.w;
    const sy = ch / shown.h;
    gl.uniform2f(uScale, sx, sy);
    gl.uniform2f(uOrigin, (1 - sx) * options.focus.x, (1 - sy) * options.focus.y);
  };

  // The nearest plane is about 0.56 above the focal plane in this map; scale
  // so that it moves `maxShift` CSS px at the pointer's extreme.
  const reach = Math.max(0.2, 1 - options.plane);
  let current = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let frame = 0;

  const draw = () => {
    gl.uniform2f(
      uShift,
      (current.x * options.maxShift) / shown.w / reach,
      (current.y * options.maxShift) / shown.h / reach,
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const step = () => {
    frame = 0;
    current = {
      x: current.x + (target.x - current.x) * 0.12,
      y: current.y + (target.y - current.y) * 0.12,
    };
    const settled = Math.abs(target.x - current.x) < 0.002 && Math.abs(target.y - current.y) < 0.002;
    if (settled) current = { ...target };
    draw();
    if (!settled) frame = requestAnimationFrame(step);
  };

  const lost = (event: Event) => {
    event.preventDefault();
    if (frame) cancelAnimationFrame(frame);
    onLost();
  };
  canvas.addEventListener("webglcontextlost", lost);

  layout();
  draw();

  return {
    point(x, y) {
      target = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
      if (!frame) frame = requestAnimationFrame(step);
    },
    resize() {
      layout();
      draw();
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
