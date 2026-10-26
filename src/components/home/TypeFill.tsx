"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useRichMotion } from "@/components/motion/useScrollProgress";

type TypeFillProps = {
  /** Selector of the ancestor whose photograph the letters show. */
  scope: string;
  className?: string;
  children: ReactNode;
};

/**
 * Decorative type whose letters show a photograph of the scene they belong
 * to (CSS background-clip: text, from --fill). Under rich motion only, it
 * copies the file the browser actually chose for that photograph
 * (`currentSrc`, after its srcset) into --fill once it has loaded: the very
 * same file, so nothing is downloaded twice, and nothing at all elsewhere.
 */
export function TypeFill({ scope, className, children }: TypeFillProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const rich = useRichMotion();

  useEffect(() => {
    const el = ref.current;
    const img = el?.closest(scope)?.querySelector("img");
    if (!rich || !el || !img) return;
    const apply = () => {
      if (img.currentSrc) el.style.setProperty("--fill", `url("${img.currentSrc}")`);
    };
    if (img.complete) apply();
    img.addEventListener("load", apply);
    return () => {
      img.removeEventListener("load", apply);
      el.style.removeProperty("--fill");
    };
  }, [rich, scope]);

  return (
    <p ref={ref} aria-hidden="true" className={className}>
      {children}
    </p>
  );
}
