import { Sprout, Sun, Leaf, Snowflake, type LucideIcon } from 'lucide-react';
import type { ArchiveSeasonSection } from '@/types/clipTypes';

export interface SeasonTheme {
  icon: LucideIcon;
  image: string;
  /** Accent text color, e.g. for icons and labels. */
  text: string;
  /** Soft tinted chip background + border. */
  chip: string;
  /** Solid accent fill, used for bars and dots. */
  solid: string;
  /** Gradient start color for tinted overlays (pair with `bg-linear-*`). */
  from: string;
  /** Hover border + glow for interactive cards. */
  hover: string;
}

const SEASON_THEMES: Record<ArchiveSeasonSection['season'], SeasonTheme> = {
  Winter: {
    icon: Snowflake,
    image: '/media/winter.jpg',
    text: 'text-sky-400',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    solid: 'bg-sky-400',
    from: 'from-sky-500/25',
    hover: 'hover:border-sky-400/40 hover:shadow-[0_8px_40px_-12px_rgba(56,189,248,0.35)]',
  },
  Spring: {
    icon: Sprout,
    image: '/media/spring.jpg',
    text: 'text-emerald-400',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    solid: 'bg-emerald-400',
    from: 'from-emerald-500/25',
    hover: 'hover:border-emerald-400/40 hover:shadow-[0_8px_40px_-12px_rgba(52,211,153,0.35)]',
  },
  Summer: {
    icon: Sun,
    image: '/media/summer.jpg',
    text: 'text-amber-400',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    solid: 'bg-amber-400',
    from: 'from-amber-500/25',
    hover: 'hover:border-amber-400/40 hover:shadow-[0_8px_40px_-12px_rgba(251,191,36,0.35)]',
  },
  Fall: {
    icon: Leaf,
    image: '/media/fall.jpg',
    text: 'text-orange-400',
    chip: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
    solid: 'bg-orange-400',
    from: 'from-orange-500/25',
    hover: 'hover:border-orange-400/40 hover:shadow-[0_8px_40px_-12px_rgba(251,146,60,0.35)]',
  },
};

/**
 * Returns the visual theme (icon, artwork and accent classes) for a season.
 *
 * @example
 * const theme = getSeasonTheme('Winter');
 * <theme.icon className={theme.text} />
 */
export const getSeasonTheme = (season: ArchiveSeasonSection['season']): SeasonTheme =>
  SEASON_THEMES[season];
