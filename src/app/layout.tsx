import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { StickyCtaBar } from "@/components/layout/StickyCtaBar";
import { MobileMenuProvider } from "@/components/providers/MobileMenuProvider";
import { SiteDataProvider } from "@/components/providers/SiteDataProvider";
import { getOutlets, getSite } from "@/content";
import { RICH_MOTION_BOOT_SCRIPT } from "@/lib/motion";
import { figtree, instrumentSerif } from "./fonts";
import "@/styles/theme.css";

export const metadata: Metadata = {
  title: "Hotel Dipali, Sagar",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, outlets] = await Promise.all([getSite(), getOutlets()]);

  return (
    // suppressHydrationWarning: the boot script below adds data-motion to
    // <html> before React hydrates. One level deep — children still checked.
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${figtree.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint so scroll scenes are laid out correctly from
            frame one (see src/lib/motion.ts). Static string, no user input. */}
        <script dangerouslySetInnerHTML={{ __html: RICH_MOTION_BOOT_SCRIPT }} />
      </head>
      <body className="pb-24 xl:pb-0">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {/* Observed by Header to flip between overlay and solid, never via a scroll listener. */}
        <div id="scroll-sentinel" aria-hidden="true" className="h-px w-full" />

        <MobileMenuProvider>
          <SiteDataProvider site={site} outlets={outlets}>
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <StickyCtaBar />
            <MobileMenu />
          </SiteDataProvider>
        </MobileMenuProvider>
      </body>
    </html>
  );
}
