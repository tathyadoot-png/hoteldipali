"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { Department } from "@/content";
import { track } from "@/lib/analytics";
import { useSiteData } from "@/components/providers/SiteDataProvider";

function PhoneIcon() {
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
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

type CallLinkProps = {
  department?: Department;
  className?: string;
  /** Classes for the label next to the icon (e.g. to hide it visually). */
  labelClassName?: string;
  children?: ReactNode;
};

export function CallLink({ department, className, labelClassName, children }: CallLinkProps) {
  const { site } = useSiteData();
  const pathname = usePathname();

  const contact =
    site.contacts.find((c) => c.department === department) ??
    site.contacts.find((c) => c.department === site.primaryPhone);
  if (!contact) return null;

  const digits = contact.phone.value.replace(/\s+/g, "");

  return (
    <a
      href={`tel:${digits}`}
      className={`inline-flex min-h-11 min-w-11 items-center gap-2 ${className ?? ""}`}
      onClick={() => track("call_click", { department: department ?? site.primaryPhone, page: pathname })}
    >
      <PhoneIcon />
      <span className={labelClassName}>{children ?? contact.phone.value}</span>
    </a>
  );
}
