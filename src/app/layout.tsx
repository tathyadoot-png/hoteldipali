import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { StickyCtaBar } from "@/components/layout/StickyCtaBar";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { BootMarker } from "@/components/providers/BootMarker";
import { MobileMenuProvider } from "@/components/providers/MobileMenuProvider";
import { SiteDataProvider } from "@/components/providers/SiteDataProvider";
import { getOutlets, getSite } from "@/content";
import { getBookingUrl } from "@/lib/booking";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion";
import { cormorant, figtree, greatVibes, instrumentSerif, manrope } from "./fonts";
// Lenis's structural rules (stopped state, data-lenis-prevent); no theming.
import "lenis/dist/lenis.css";
import "@/styles/theme.css";

export const metadata: Metadata = {
  title: "Hotel Dipali, Sagar",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, outlets, bookingUrl] = await Promise.all([
    getSite(),
    getOutlets(),
    getBookingUrl(),
  ]);

  return (
    // suppressHydrationWarning: the boot script below adds data-motion to
    // <html> before React hydrates. One level deep — children still checked.
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${figtree.variable} ${cormorant.variable} ${manrope.variable} ${greatVibes.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint so scroll scenes are laid out correctly from
            frame one, and the opening loader is skipped on a slow connection
            (see src/lib/motion.ts). Static string, no user input. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
        {/* Without JS nothing would reveal: show scroll-reveal content as-is. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}[data-reveal] img{transform:none!important}</style>",
          }}
        />
      </head>
      <body className="pb-24 xl:pb-0">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {/* Observed by Header to flip between overlay and solid, never via a scroll listener. */}
        <div id="scroll-sentinel" aria-hidden="true" className="h-px w-full" />

        <SmoothScroll />
        <BootMarker />
        <MobileMenuProvider>
          <SiteDataProvider site={site} outlets={outlets}>
            <Header bookingUrl={bookingUrl} />
            <main id="main">{children}</main>
            <Footer />
            <StickyCtaBar />
            <MobileMenu bookingUrl={bookingUrl} />
          </SiteDataProvider>
        </MobileMenuProvider>
      </body>
    </html>
  );
}
