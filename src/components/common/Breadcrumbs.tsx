import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { BreadcrumbItem, routeCrumbs } from '@/lib/breadcrumbs';

interface BreadcrumbsProps {
  /** Trail after "Home". The last item is always rendered as the current page. */
  items: BreadcrumbItem[];
  className?: string;
}

const Separator = () => (
  <span className="text-muted-foreground/60 select-none" aria-hidden="true">
    /
  </span>
);

const linkClass =
  'block truncate max-w-40 sm:max-w-60 text-muted-foreground hover:text-foreground transition-colors';

const Crumb: React.FC<{ item: BreadcrumbItem }> = ({ item }) => {
  if (item.href) {
    return (
      <Link href={item.href} onClick={item.onClick} className={linkClass} title={item.label}>
        {item.label}
      </Link>
    );
  }
  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={linkClass} title={item.label}>
        {item.label}
      </button>
    );
  }
  return (
    <span className="block truncate max-w-40 sm:max-w-60" title={item.label}>
      {item.label}
    </span>
  );
};

/**
 * Single-line breadcrumb trail. "Home" is always prepended, the last item is
 * the current page, and on small screens only the direct parent is kept
 * (earlier levels collapse into an ellipsis).
 *
 * @example
 * <Breadcrumbs items={[routeCrumbs.clips, { label: clip.title }]} />
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const current = items.at(-1);
  if (!current) return null;

  const parents = [routeCrumbs.home, ...items.slice(0, -1)];
  const hasCollapsed = parents.length > 2;

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 text-sm text-muted-foreground ${className}`}>
      <ol className="flex items-center gap-1.5 min-w-0">
        {parents.map((item, index) => {
          const isHome = index === 0;
          const isDirectParent = index === parents.length - 1;
          const hideOnMobile = !isHome && !isDirectParent;

          return (
            <li
              key={`${index}-${item.label}`}
              className={`items-center gap-1.5 shrink-0 ${hideOnMobile ? 'hidden sm:flex' : 'flex'}`}
            >
              {isHome && item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  title={item.label}
                >
                  <Home className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              ) : (
                <Crumb item={item} />
              )}
              <Separator />
              {isHome && hasCollapsed && (
                <span className="flex sm:hidden items-center gap-1.5" aria-hidden="true">
                  <span>…</span>
                  <Separator />
                </span>
              )}
            </li>
          );
        })}
        <li className="flex min-w-0">
          <span className="truncate text-foreground font-medium" aria-current="page" title={current.label}>
            {current.label}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
