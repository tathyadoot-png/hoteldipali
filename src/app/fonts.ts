import localFont from "next/font/local";

// This file and src/styles/theme.css are the ONLY places allowed to name fonts.

export const instrumentSerif = localFont({
  src: [
    { path: "../fonts/instrument-serif-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  variable: "--font-instrument",
  preload: false,
});

export const figtree = localFont({
  src: "../fonts/figtree-latin.woff2",
  weight: "400 600",
  display: "swap",
  variable: "--font-figtree",
  preload: true,
});

// The royal identity (opening experience: loader, navigation, home hero —
// 2026-10-24). All OFL-licensed, self-hosted latin subsets.

// Editorial display serif. Not preloaded: on the home page the loader covers
// the swap; elsewhere it appears only in the navigation menu.
export const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-400-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  variable: "--font-cormorant",
  adjustFontFallback: "Times New Roman",
  preload: false,
});

// Interface sans for navigation labels, buttons and eyebrows (every page).
export const manrope = localFont({
  src: "../fonts/manrope-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-manrope",
  preload: true,
});

// Script accent — one word in the home hero. Never for navigation or body.
export const greatVibes = localFont({
  src: "../fonts/great-vibes-latin.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-great-vibes",
  adjustFontFallback: false,
  preload: false,
});
