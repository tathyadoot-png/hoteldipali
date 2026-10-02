import { Instrument_Serif, Figtree } from "next/font/google";

// This file and src/styles/theme.css are the ONLY places allowed to name fonts.

export const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
  preload: false,
});

export const figtree = Figtree({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
  preload: true,
});
