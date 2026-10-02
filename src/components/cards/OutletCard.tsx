import Link from "next/link";

import { Picture } from "@/components/media/Picture";
import type { Outlet } from "@/content";
import { outletHref } from "@/lib/routes";

export function OutletCard({ outlet }: { outlet: Outlet }) {
  const href = outletHref(outlet.slug);
  const cover = outlet.images[0];
  // Cuisine is a menu category, not a dietary claim. Diet policy and timings are
  // deliberately NOT rendered here (unverified; see CLAUDE.md §G).
  const cuisine = outlet.cuisine.slice(0, 3).join(" · ");

  return (
    <article className="card flex h-full flex-col">
      {cover ? <Picture image={cover} ratio="4:3" sizes="(min-width: 1024px) 24rem, 100vw" /> : null}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {cuisine ? <p className="eyebrow">{cuisine}</p> : null}
        <h3 className="heading-3">{outlet.name}</h3>
        <p className="body text-ink-muted">{outlet.summary}</p>
        <Link href={href} prefetch={false} className="link mt-auto pt-2">
          Explore {outlet.name}
        </Link>
      </div>
    </article>
  );
}
