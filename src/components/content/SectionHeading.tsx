import Link from "next/link";
import type { ReactNode } from "react";

type HeadingLevel = "h1" | "h2" | "h3";

// Each level maps to the matching type class from theme.css — no heading CSS
// is duplicated here.
const HEADING_CLASS: Record<HeadingLevel, string> = {
  h1: "heading-1",
  h2: "heading-2",
  h3: "heading-3",
};

type SectionHeadingProps = {
  /** Small uppercase kicker above the title. */
  eyebrow?: string;
  /** Title content; may include <em> for the one emphasised accent word. */
  title: ReactNode;
  /** Semantic level + matching type class. Defaults to h2. */
  as?: HeadingLevel;
  /** Supporting lead paragraph below the title. */
  description?: ReactNode;
  /** Optional trailing link (e.g. "View all rooms"). */
  action?: { label: string; href: string };
  align?: "start" | "center";
  /** id for the heading, to pair with aria-labelledby on the surrounding section. */
  id?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  as = "h2",
  description,
  action,
  align = "start",
  id,
  className,
}: SectionHeadingProps) {
  const Heading = as;
  const alignClass = align === "center" ? "items-center text-center" : "items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignClass} ${className ?? ""}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Heading id={id} className={HEADING_CLASS[as]}>
        {title}
      </Heading>
      {description ? (
        <p className={`body-lg max-w-prose${align === "center" ? " mx-auto" : ""}`}>
          {description}
        </p>
      ) : null}
      {action ? (
        <Link href={action.href} prefetch={false} className="link mt-1">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
