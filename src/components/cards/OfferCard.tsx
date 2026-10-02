import Link from "next/link";

import { Picture } from "@/components/media/Picture";
import type { Offer } from "@/content";
import { formatIsoDate } from "@/lib/format";

// Offers are filtered by date in the loader (getOffers({ activeOn })), so the
// card never hides itself — it just renders whatever it's given.
export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article className="card flex h-full flex-col">
      <Picture image={offer.image} ratio="16:9" sizes="(min-width: 1024px) 32rem, 100vw" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="eyebrow">Offer · valid until {formatIsoDate(offer.validTo)}</p>
        <h3 className="heading-3">{offer.title}</h3>
        <p className="body text-ink-muted">{offer.summary}</p>
        <Link href={offer.cta.href} prefetch={false} className="btn-primary mt-auto self-start">
          {offer.cta.label}
        </Link>
      </div>
    </article>
  );
}
