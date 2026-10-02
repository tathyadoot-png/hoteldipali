import type { Metadata } from "next";
import type { ReactNode } from "react";
import { figtree, instrumentSerif } from "./fonts";
import "@/styles/theme.css";

export const metadata: Metadata = {
  title: "Hotel Dipali, Sagar",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${figtree.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
