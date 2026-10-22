"use client";

import { useState, type ReactNode } from "react";

type Mode = "light" | "peacock" | "side-by-side";

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: "light", label: "Ivory" },
  { value: "peacock", label: "Peacock" },
  { value: "side-by-side", label: "Side-by-side" },
];

type Props = {
  light: ReactNode;
  peacock: ReactNode;
};

/**
 * Renders the styleguide preview in Ivory (light), Peacock, or both panes side by side.
 * data-theme is set on the preview panes only — never on <html>.
 */
export function ThemePreviewToggle({ light, peacock }: Props) {
  const [mode, setMode] = useState<Mode>("side-by-side");

  const showLight = mode === "light" || mode === "side-by-side";
  const showPeacock = mode === "peacock" || mode === "side-by-side";

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
            ? "grid grid-cols-1 lg:grid-cols-2"
            : "grid grid-cols-1"
        }
      >
        {showLight ? (
          <div data-preview-pane="light" className="bg-surface text-ink">
            {light}
          </div>
        ) : null}
        {showPeacock ? (
          <div data-preview-pane="peacock" data-theme="peacock" className="bg-surface text-ink">
            {peacock}
          </div>
        ) : null}
      </div>
    </>
  );
}
