"use client";

import Link from "next/link";
import { useState } from "react";

import { Picture } from "@/components/media/Picture";
import type { Image } from "@/content";
import { roomHref } from "@/lib/routes";

export type RoomPreview = {
  slug: string;
  name: string;
  summary: string;
  sizeSqft?: number;
  maxGuests: number;
  image: Image;
};

function facts(room: RoomPreview): string {
  const parts = [`Sleeps ${room.maxGuests}`];
  if (room.sizeSqft) parts.unshift(`${room.sizeSqft} sq ft`);
  return parts.join(" · ");
}

/**
 * Rooms as an index rather than a card grid. On wide screens the stage beside
 * it — a photograph under a shallow lintel, standing on emerald stone in a fine
 * gold line — follows whichever room is hovered or keyboard-focused, the next
 * photograph sweeping in from the side. On small screens there is no hover to
 * rely on, so each room simply carries its own photograph inline (beside it
 * on tablets).
 */
export function RoomDiscovery({ rooms }: { rooms: RoomPreview[] }) {
  const [active, setActive] = useState(0);
  const current = rooms[active] ?? rooms[0];

  return (
    <div className="stay-discovery">
      <ol className="stay-index">
        {rooms.map((room, i) => (
          <li key={room.slug}>
            <Link
              href={roomHref(room.slug)}
              prefetch={false}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              data-active={i === active ? "" : undefined}
              className="stay-room"
            >
              <span aria-hidden="true" className="room-marker" />
              <span className="stay-room-text">
                <span className="stay-room-name">{room.name}</span>
                <span className="stay-room-facts">{facts(room)}</span>
              </span>
            </Link>
            <div className="stay-room-photo">
              <Picture image={room.image} ratio="3:2" sizes="(min-width: 768px) 46vw, 92vw" />
            </div>
          </li>
        ))}
      </ol>

      <div className="stay-stage-col">
        <div className="stay-stage-sticky">
          <div className="stay-stage-wrap">
            {/* Emerald stone tablet; data-theme needs its own text-ink (CLAUDE.md §E). */}
            <div aria-hidden="true" data-theme="emerald" className="stay-tablet text-ink" />
            <div className="room-stage">
              {rooms.map((room, i) => (
                <div
                  key={room.slug}
                  className="room-stage-item"
                  data-active={i === active ? "" : undefined}
                  aria-hidden={i === active ? undefined : true}
                >
                  <Picture image={room.image} fill sizes="(min-width: 1024px) 50vw, 1px" decorative={i !== active} />
                </div>
              ))}
              <span aria-hidden="true" className="room-stage-frame" />
            </div>
          </div>
          {current ? <p className="stay-stage-caption">{current.summary}</p> : null}
        </div>
      </div>
    </div>
  );
}
