"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Outlet, Site } from "@/content";

type SiteData = {
  site: Site;
  outlets: Outlet[];
};

const SiteDataContext = createContext<SiteData | null>(null);

/**
 * Makes server-fetched content (site + outlets) available to client
 * components without them calling loaders directly. The server layout
 * fetches once via getSite()/getOutlets() and passes the result in here.
 */
export function SiteDataProvider({
  site,
  outlets,
  children,
}: SiteData & { children: ReactNode }) {
  return (
    <SiteDataContext.Provider value={{ site, outlets }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData(): SiteData {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error("useSiteData must be used within a SiteDataProvider");
  }
  return ctx;
}
