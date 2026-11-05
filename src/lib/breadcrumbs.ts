export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Canonical breadcrumb entries for every top-level route, so labels and
 * targets stay identical wherever a route appears in a trail.
 *
 * @example
 * <Breadcrumbs items={[routeCrumbs.archive, { label: 'Winter 2025' }]} />
 */
export const routeCrumbs = {
  home: { label: 'Home', href: '/' },
  clips: { label: 'Clips', href: '/clips' },
  archive: { label: 'The ClipVault', href: '/archive' },
  admin: { label: 'Admin Dashboard', href: '/admin' },
  notifications: { label: 'Notifications', href: '/notifications' },
  myReports: { label: 'My Reports', href: '/my-reports' },
} satisfies Record<string, BreadcrumbItem>;

/**
 * Builds the breadcrumb for a single archived season, linking back to its
 * season view inside the ClipVault.
 *
 * @example
 * archiveSeasonCrumb('Winter', 2025);
 * // { label: 'Winter 2025', href: '/archive?season=Winter&year=2025' }
 */
export function archiveSeasonCrumb(season: string, year: number): BreadcrumbItem & { href: string } {
  const params = new URLSearchParams({ season, year: String(year) });
  return { label: `${season} ${year}`, href: `/archive?${params.toString()}` };
}
