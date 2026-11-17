"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRichMotion, useScrollProgress } from "@/components/motion/useScrollProgress";

// Where (in --h, 0–1) the name lands in the header and hands over to it —
// mirrors the end of --m in theme.css (.home-hero).
const LANDED_AT = 0.72;

/** An element's layout offset inside an ancestor (transforms ignored). */
function layoutOffset(el: HTMLElement, root: HTMLElement): { x: number; y: number } | null {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }
  return node === root ? { x, y } : null;
}

/**
 * The home hero's scroll (rich motion only): writes --h (0 at the top of the
 * page, 1 one viewport down) on the hero, and CSS does the rest (theme.css,
 * .home-hero) — the letters spread and sink behind the building, which rises
 * faster; then the name shrinks and travels into the header's centre slot.
 *
 * The travel's end (--mx, --my, --ms: translate and one uniform scale from
 * the name's resting box to the header logotype's) is measured on resize and
 * font load, never per frame — the hero is pinned at the top while it plays
 * and the header is stuck there, so both boxes are fixed on screen. At
 * LANDED_AT the hero's name hides and the header's logotype shows, at the
 * same size and place (data-landed on both). Renders an inert marker.
 */
export function HeroMorph() {
  const rich = useRichMotion();
  const marker = useRef<HTMLSpanElement>(null);
  const [layers, setLayers] = useState<HTMLElement | null>(null);
  const layersRef = useMemo(() => ({ current: layers }), [layers]);

  useEffect(() => {
    setLayers(marker.current?.closest<HTMLElement>(".layers") ?? null);
  }, []);

  // The travel's end, from layout boxes.
  useEffect(() => {
    const hero = marker.current?.closest<HTMLElement>(".home-hero");
    const header = document.querySelector<HTMLElement>(".header-shell");
    if (!rich || !hero || !header) return;
    const wordmark = hero.querySelector<HTMLElement>(".home-hero-name .wordmark");
    const dipali = wordmark?.querySelector<HTMLElement>(".wordmark-dipali");
    const target = header.querySelector<HTMLElement>(".header-logotype .wordmark-dipali");
    if (!wordmark || !dipali || !target) return;

    const measure = () => {
      const group = layoutOffset(wordmark, hero);
      const from = layoutOffset(dipali, hero);
      const to = layoutOffset(target, header);
      if (!group || !from || !to || dipali.offsetWidth === 0) return;
      const scale = target.offsetWidth / dipali.offsetWidth;
      // The name shrinks toward its top centre (transform-origin: 50% 0).
      const ox = group.x + wordmark.offsetWidth / 2;
      const oy = group.y;
      wordmark.style.setProperty("--mx", `${(to.x - ox - scale * (from.x - ox)).toFixed(2)}px`);
      wordmark.style.setProperty("--my", `${(to.y - oy - scale * (from.y - oy)).toFixed(2)}px`);
      wordmark.style.setProperty("--ms", scale.toFixed(5));
    };
    const resize = new ResizeObserver(measure);
    for (const el of [hero, header, dipali, target]) resize.observe(el);
    void document.fonts?.ready.then(measure);
    measure();
    return () => {
      resize.disconnect();
      for (const name of ["--mx", "--my", "--ms"]) wordmark.style.removeProperty(name);
    };
  }, [rich]);

  useScrollProgress(layersRef, {
    enabled: rich && layers !== null,
    mode: "leave",
    cssVar: null,
    onProgress: (p) => {
      const hero = marker.current?.closest<HTMLElement>(".home-hero");
      const header = document.querySelector<HTMLElement>(".header-shell");
      if (!hero) return;
      hero.style.setProperty("--h", String(p));
      const landed = p >= LANDED_AT;
      if (landed === (hero.dataset.landed !== undefined)) return;
      for (const el of [hero, header]) {
        if (!el) continue;
        if (landed) el.dataset.landed = "";
        else delete el.dataset.landed;
      }
    },
  });

  // Leaving the page (or rich motion switching off): the header shows its own name.
  useEffect(() => {
    if (rich) return;
    const hero = marker.current?.closest<HTMLElement>(".home-hero");
    hero?.style.removeProperty("--h");
    delete hero?.dataset.landed;
  }, [rich]);
  useEffect(
    () => () => {
      const header = document.querySelector<HTMLElement>(".header-shell");
      if (header) delete header.dataset.landed;
    },
    [],
  );

  return <span ref={marker} hidden />;
}
