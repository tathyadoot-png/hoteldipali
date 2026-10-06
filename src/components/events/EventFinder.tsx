"use client";

import { useState } from "react";

import { Picture } from "@/components/media/Picture";
import type { Venue } from "@/content";

const KIND_LABEL: Record<Venue["kind"], string> = {
  lawn: "Lawn",
  hall: "Banquet hall",
  poolside: "Poolside lawn",
  terrace: "Terrace",
};

export type EventType = { slug: string; label: string };

const ALL = "all";

/**
 * The page's signature device: pick an event type and see the spaces that suit
 * it. Matches are computed from each venue's `suitableFor`, so nothing here is
 * invented — the filter only ever hides or shows real content.
 */
export function EventFinder({
  venues,
  eventTypes,
}: {
  venues: Venue[];
  eventTypes: EventType[];
}) {
  const [selected, setSelected] = useState<string>(ALL);

  const matches =
    selected === ALL ? venues : venues.filter((v) => v.suitableFor.includes(selected));
  const selectedLabel =
    selected === ALL ? "All spaces" : (eventTypes.find((e) => e.slug === selected)?.label ?? "");

  const countText =
    selected === ALL
      ? `${matches.length} ${matches.length === 1 ? "space" : "spaces"} in total`
      : `${matches.length} ${matches.length === 1 ? "space" : "spaces"} for ${selectedLabel.toLowerCase()}`;

  return (
    <div>
      <div role="group" aria-label="Filter spaces by event type" className="flex flex-wrap gap-3">
        <FilterChip
          label="All spaces"
          pressed={selected === ALL}
          onClick={() => setSelected(ALL)}
        />
        {eventTypes.map((type) => (
          <FilterChip
            key={type.slug}
            label={type.label}
            pressed={selected === type.slug}
            onClick={() => setSelected(type.slug)}
          />
        ))}
      </div>

      <p role="status" aria-live="polite" className="visually-hidden">
        {countText}
      </p>

      <p className="eyebrow mt-8" aria-hidden="true">
        {selected === ALL ? "All spaces" : `For ${selectedLabel.toLowerCase()}`} · {matches.length}
      </p>

      <ul className="mt-6 grid gap-x-8 gap-y-12 md:grid-cols-2">
        {matches.map((venue) => {
          const cover = venue.images[0];
          return (
            <li key={venue.slug} className="flex flex-col">
              {cover ? (
                <div className="img-hover">
                  <Picture
                    image={cover}
                    ratio="4:3"
                    sizes="(min-width: 768px) 44vw, 100vw"
                  />
                </div>
              ) : null}

              <p className="eyebrow mt-5">
                {KIND_LABEL[venue.kind]} · {venue.indoor ? "Indoor" : "Open-air"}
              </p>
              <h3 className="heading-3 mt-2">{venue.name}</h3>
              <p className="body mt-2 text-ink-muted">
                Seats {venue.capacitySeated} · up to {venue.capacityFloating} standing
              </p>
              {venue.highlights[0] ? (
                <p className="body mt-1 text-ink-muted">{venue.highlights[0]}</p>
              ) : null}

              <a href="#enquire" className="link mt-4 self-start">
                Enquire about the {venue.name}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="chip">
      {label}
    </button>
  );
}
