"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useSiteData } from "@/components/providers/SiteDataProvider";
import { track } from "@/lib/analytics";

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

type DirectionsLinkProps = {
  className?: string;
  /** Classes for the label next to the icon. */
  labelClassName?: string;
  children?: ReactNode;
};

/** "Get directions": the hotel on Google Maps (site.mapsUrl), in a new tab. */
export function DirectionsLink({ className, labelClassName, children }: DirectionsLinkProps) {
  const { site } = useSiteData();
  const pathname = usePathname();

  return (
    <a
      href={site.mapsUrl.value}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 min-w-11 items-center gap-2 ${className ?? ""}`}
      onClick={() => track("directions_click", { page: pathname })}
    >
      <PinIcon />
      <span className={labelClassName}>{children ?? "Get directions"}</span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
