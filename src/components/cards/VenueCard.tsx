import Link from "next/link";

import { Picture } from "@/components/media/Picture";
import type { Venue } from "@/content";
import { venueHref } from "@/lib/routes";

const KIND_LABEL: Record<Venue["kind"], string> = {
  lawn: "Lawn",
  hall: "Banquet hall",
  poolside: "Poolside",
  terrace: "Terrace",
};

export function VenueCard({ venue }: { venue: Venue }) {
  const href = venueHref(venue.slug);
  const cover = venue.images[0];
  const lead = venue.highlights[0];

  return (
    <article className="card flex h-full flex-col">
      {cover ? <Picture image={cover} ratio="3:2" sizes="(min-width: 1024px) 32rem, 100vw" /> : null}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="eyebrow">{KIND_LABEL[venue.kind]}</p>
        <h3 className="heading-3">{venue.name}</h3>
        {lead ? <p className="body text-ink-muted">{lead}</p> : null}
        <p className="caption not-italic text-ink-muted">
          Seated {venue.capacitySeated} · Floating {venue.capacityFloating}
        </p>
        <Link href={href} prefetch={false} className="link mt-auto pt-2">
          View {venue.name}
        </Link>
      </div>
    </article>
  );
}
