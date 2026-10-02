"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { track } from "@/lib/analytics";
import { buildWhatsAppUrl, whatsappMessages, type WhatsAppContext } from "@/lib/whatsapp";
import { useSiteData } from "@/components/providers/SiteDataProvider";

function ChatIcon() {
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
      <path d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.4-3.5A7.96 7.96 0 0 1 4 12Z" />
    </svg>
  );
}

type WhatsAppLinkProps = {
  context: WhatsAppContext;
  roomName?: string;
  className?: string;
  children?: ReactNode;
};

export function WhatsAppLink({ context, roomName, className, children }: WhatsAppLinkProps) {
  const { site } = useSiteData();
  const pathname = usePathname();

  const contact = site.contacts.find((c) => c.department === site.primaryWhatsapp);
  const number = contact?.whatsapp ?? contact?.phone;
  if (!number) return null;

  const href = buildWhatsAppUrl(number.value, whatsappMessages[context](roomName));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 min-w-11 items-center gap-2 ${className ?? ""}`}
      onClick={() => track("whatsapp_click", { context, page: pathname })}
    >
      <ChatIcon />
      <span>{children ?? "WhatsApp us"}</span>
    </a>
  );
}
