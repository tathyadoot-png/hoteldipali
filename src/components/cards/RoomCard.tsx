import Link from "next/link";

import { Picture } from "@/components/media/Picture";
import type { Room } from "@/content";
import { formatMoney } from "@/lib/format";
import { roomHref } from "@/lib/routes";

export function RoomCard({ room }: { room: Room }) {
  const href = roomHref(room.slug);
  const cover = room.images[0];
  // Prices are only shown when the fact is explicitly cleared for the site.
  const showPrice = room.priceFrom?.showOnSite === true && room.priceFrom;

  const facts: string[] = [room.bed, `Up to ${room.maxGuests} guests`];
  if (room.sizeSqft) facts.push(`${room.sizeSqft} sq ft`);

  return (
    <article className="card flex h-full flex-col">
      {cover ? <Picture image={cover} ratio="4:3" sizes="(min-width: 1024px) 24rem, 100vw" /> : null}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="eyebrow">Stay</p>
        <h3 className="heading-3">{room.name}</h3>
        <p className="body text-ink-muted">{room.summary}</p>
        <p className="caption not-italic text-ink-muted">{facts.join(" · ")}</p>
        {showPrice ? (
          <p className="body font-semibold">From {formatMoney(showPrice)}</p>
        ) : null}
        <Link href={href} prefetch={false} className="link mt-auto pt-2">
          View {room.name}
        </Link>
      </div>
    </article>
  );
}
