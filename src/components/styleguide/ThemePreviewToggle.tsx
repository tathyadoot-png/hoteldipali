"use client";

import { useState, type ReactNode } from "react";

type Mode = "light" | "dark" | "deep" | "side-by-side";

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "deep", label: "Deep" },
  { value: "side-by-side", label: "Side-by-side" },
];

type Props = {
  light: ReactNode;
  dark: ReactNode;
  deep: ReactNode;
};

/**
 * Renders the styleguide preview in one variant (light, dark, deep) or all of
 * them side by side. data-theme is set on the preview panes only — never on <html>.
 */
export function ThemePreviewToggle({ light, dark, deep }: Props) {
  const [mode, setMode] = useState<Mode>("side-by-side");

  const showLight = mode === "light" || mode === "side-by-side";
  const showDark = mode === "dark" || mode === "side-by-side";
  const showDeep = mode === "deep" || mode === "side-by-side";

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="container-site flex flex-wrap items-center gap-3 py-3">
          <span className="eyebrow">Preview</span>
          <div role="group" aria-label="Theme preview mode" className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className="chip"
                aria-pressed={mode === m.value}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={
          mode === "side-by-side"
            ? "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3"
            : "grid grid-cols-1"
        }
      >
        {showLight ? (
          <div data-preview-pane="light" className="bg-surface text-ink">
            {light}
          </div>
        ) : null}
        {showDark ? (
          <div data-preview-pane="dark" data-theme="dark" className="bg-surface text-ink">
            {dark}
          </div>
        ) : null}
        {showDeep ? (
          <div data-preview-pane="deep" data-theme="deep" className="bg-surface text-ink">
            {deep}
          </div>
        ) : null}
      </div>
    </>
  );
}
