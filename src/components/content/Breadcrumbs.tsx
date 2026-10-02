import Link from "next/link";

export type Crumb = { label: string; href?: string };

type BreadcrumbsProps = {
  /** Ordered from root to current page; the last item is treated as current. */
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      {/* flex-wrap keeps long trails from overflowing at 360px. */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-x-2">
              {isLast || !item.href ? (
                <span className="caption not-italic" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} prefetch={false} className="link caption not-italic">
                  {item.label}
                </Link>
              )}
              {isLast ? null : (
                <span aria-hidden="true" className="caption not-italic">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
