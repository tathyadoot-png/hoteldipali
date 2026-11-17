import localFont from "next/font/local";

// This file and src/styles/theme.css are the ONLY places allowed to name fonts.
// Three families (2026-11-04, plum & gold): all OFL-licensed, self-hosted
// latin subsets.

// Display serif: headings and the hotel's name. Preloaded — the home hero's
// name is set in it and is the page's largest text.
export const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-400-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  variable: "--font-cormorant",
  adjustFontFallback: "Times New Roman",
  preload: true,
});

// Interface and body sans: body copy, navigation, buttons and eyebrows.
export const manrope = localFont({
  src: "../fonts/manrope-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-manrope",
  preload: true,
});

// Script accent: at most one word per page. Never for navigation or body.
export const greatVibes = localFont({
  src: "../fonts/great-vibes-latin.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-great-vibes",
  adjustFontFallback: false,
  preload: false,
});
