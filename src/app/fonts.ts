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
