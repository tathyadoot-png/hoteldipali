import type { Metadata } from "next";
import type { ReactNode } from "react";
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
    <html lang="en">
      <body>
        <a href="#main">Skip to main content</a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
