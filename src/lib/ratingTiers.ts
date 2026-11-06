import { UserRatingData } from '@/types/ratingTypes';

export type RatingKey = UserRatingData['rating'];

export interface RatingTier {
  key: RatingKey;
  label: string;
  shortLabel: string;
  subtitle: string;
  /** Raw hex so it also works in canvas-based charts, which can't resolve CSS variables. */
  color: string;
}

/**
 * The single source of truth for rating tier labels and colors, ordered from
 * best (Tier 1) to Denied.
 *
 * @example
 * RATING_TIERS.map((tier) => <span style={{ color: tier.color }}>{tier.label}</span>);
 */
export const RATING_TIERS: readonly RatingTier[] = [
  { key: '1', label: 'Tier 1', shortLabel: '1', subtitle: 'Top Tier', color: '#00a63e' },
  { key: '2', label: 'Tier 2', shortLabel: '2', subtitle: '', color: '#d08700' },
  { key: '3', label: 'Tier 3', shortLabel: '3', subtitle: '', color: '#ff6900' },
  { key: '4', label: 'Tier 4', shortLabel: '4', subtitle: 'Filler', color: '#fb2c36' },
  { key: 'deny', label: 'Denied', shortLabel: 'Deny', subtitle: 'Rejected', color: '#e7000b' },
];
