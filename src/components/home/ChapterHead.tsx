import { ScrollReveal } from "@/components/home/ScrollReveal";

type ChapterHeadProps = {
  /** Roman numeral of the chapter in The Living Experiences. */
  numeral: string;
  label: string;
  /** id of the h3, for the chapter's aria-labelledby. */
  headingId: string;
  /** `accent` (italic) ends the title. */
  title: { lead: string; accent: string };
  className?: string;
};

/**
 * The opening of one chapter of The Living Experiences: its numeral and label,
 * then the title rising out of a mask. Shared by every chapter so the four read
 * as one sequence; each chapter composes the rest in its own way.
 */
export function ChapterHead({ numeral, label, headingId, title, className }: ChapterHeadProps) {
  return (
    <div className={`chapter-head ${className ?? ""}`}>
      <ScrollReveal>
        <p className="chapter-marker">
          <span aria-hidden="true" className="chapter-numeral">
            {numeral}
          </span>
          {label}
        </p>
      </ScrollReveal>
      <ScrollReveal variant="mask" delay={60}>
        <h3 id={headingId} className="chapter-title">
          {title.lead} <em>{title.accent}</em>
        </h3>
      </ScrollReveal>
    </div>
  );
}
