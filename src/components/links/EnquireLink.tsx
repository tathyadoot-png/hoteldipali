"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { enquireHref } from "@/lib/routes";

/**
 * The "enquire" action: this page's own form (#enquire) where it has one,
 * otherwise the contact page's — the same target as the phone sticky bar.
 */
export function EnquireLink({ className, children }: { className?: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <a href={enquireHref(pathname)} className={className}>
      {children}
    </a>
  );
}
