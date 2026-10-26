"use client";

import { useEffect } from "react";

import { markBooted } from "@/lib/app-boot";

/** Records that the first hydration has finished (see src/lib/app-boot.ts). */
export function BootMarker() {
  useEffect(() => {
    markBooted();
  }, []);
  return null;
}
