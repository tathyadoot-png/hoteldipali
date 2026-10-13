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
 * Rooms as an index rather than a card grid. On wide screens the large stage
 * on the right follows whichever room is hovered or keyboard-focused, wiping
 * the next photograph in from below. On small screens there is no hover to
 * rely on, so each room simply carries its own image inline.
 */
export function RoomDiscovery({ rooms }: { rooms: RoomPreview[] }) {
  const [active, setActive] = useState(0);
  const current = rooms[active] ?? rooms[0];

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
      <ol className="divide-y divide-line border-y border-line lg:col-span-5">
        {rooms.map((room, i) => (
          <li key={room.slug}>
            <Link
              href={roomHref(room.slug)}
              prefetch={false}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              data-active={i === active ? "" : undefined}
              className="group flex items-start gap-4 py-5 md:py-6"
            >
              <span aria-hidden="true" className="room-marker mt-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="heading-2 block transition-colors group-hover:text-accent">
                  {room.name}
                </span>
                <span className="caption mt-2 block not-italic">{facts(room)}</span>
              </span>
            </Link>
            <div className="pb-6 lg:hidden">
              <Picture image={room.image} ratio="4:3" sizes="100vw" />
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:col-span-7 lg:block">
        <div className="sticky top-28">
          <div className="room-stage">
            {rooms.map((room, i) => (
              <div
                key={room.slug}
                className="room-stage-item"
                data-active={i === active ? "" : undefined}
                aria-hidden={i === active ? undefined : true}
              >
                <Picture
                  image={room.image}
                  ratio="4:3"
                  sizes="58vw"
                  decorative={i !== active}
                />
              </div>
            ))}
          </div>
          {current ? <p className="caption mt-4">{current.summary}</p> : null}
        </div>
      </div>
    </div>
  );
}
