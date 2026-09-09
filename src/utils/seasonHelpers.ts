/**
 * Determine the current season based on the date
 * 
 * @returns Object containing season name and year
 */
export const getCurrentSeason = (): { season: string; year: number } => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  let season = '';

  if (
    (month === 3 && day >= 21) ||
    (month > 3 && month < 6) ||
    (month === 6 && day <= 20)
  ) {
    season = 'Spring';
  } else if (
    (month === 6 && day >= 21) ||
    (month > 6 && month < 9) ||
    (month === 9 && day <= 20)
  ) {
    season = 'Summer';
  } else if (
    (month === 9 && day >= 21) ||
    (month > 9 && month < 12) ||
    (month === 12 && day <= 20)
  ) {
    season = 'Fall';
  } else {
    season = 'Winter';
  }

  return { season, year };
};

export interface SeasonDateRange {
  startMonth: string;
  startDay: number;
  startYear: number;
  endMonth: string;
  endDay: number;
  endYear: number;
  shortFormatted: string;
  fullFormatted: string;
}

/**
 * Get submission window date range for a given season and year
 * 
 * Boundaries:
 * - Spring: 21 March Y – 20 June Y
 * - Summer: 21 June Y – 20 September Y
 * - Fall: 21 September Y – 20 December Y
 * - Winter: 21 December Y – 20 March Y+1
 * 
 * @param season - Season name ('Spring' | 'Summer' | 'Fall' | 'Winter')
 * @param year - Season starting year
 */
export const getSeasonDateRange = (season: string, year: number): SeasonDateRange => {
  const normSeason = season.toLowerCase();

  if (normSeason === 'spring') {
    return {
      startMonth: 'March',
      startDay: 21,
      startYear: year,
      endMonth: 'June',
      endDay: 20,
      endYear: year,
      shortFormatted: `21 Mar ${year} – 20 Jun ${year}`,
      fullFormatted: `21 March ${year} – 20 June ${year}`,
    };
  }

  if (normSeason === 'summer') {
    return {
      startMonth: 'June',
      startDay: 21,
      startYear: year,
      endMonth: 'September',
      endDay: 20,
      endYear: year,
      shortFormatted: `21 Jun ${year} – 20 Sep ${year}`,
      fullFormatted: `21 June ${year} – 20 September ${year}`,
    };
  }

  if (normSeason === 'fall') {
    return {
      startMonth: 'September',
      startDay: 21,
      startYear: year,
      endMonth: 'December',
      endDay: 20,
      endYear: year,
      shortFormatted: `21 Sep ${year} – 20 Dec ${year}`,
      fullFormatted: `21 September ${year} – 20 December ${year}`,
    };
  }

  // Winter: 21 December of start year until 20 March of the following year
  return {
    startMonth: 'December',
    startDay: 21,
    startYear: year,
    endMonth: 'March',
    endDay: 20,
    endYear: year + 1,
    shortFormatted: `21 Dec ${year} – 20 Mar ${year + 1}`,
    fullFormatted: `21 December ${year} – 20 March ${year + 1}`,
  };
};

export interface SeasonRemainingDays {
  daysRemaining: number;
  season: string;
  year: number;
  endDate: Date;
  formatted: string;
}

/**
 * Calculate the remaining days in the active season
 * 
 * @param date - Current date (defaults to new Date())
 * @returns Object with remaining days count, season, and formatted strings
 */
export const getSeasonRemainingDays = (date: Date = new Date()): SeasonRemainingDays => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  let season = 'Winter';
  let endYear = year;
  let endMonth = 3;
  let endDay = 20;

  if (
    (month === 3 && day >= 21) ||
    (month > 3 && month < 6) ||
    (month === 6 && day <= 20)
  ) {
    season = 'Spring';
    endYear = year;
    endMonth = 6;
    endDay = 20;
  } else if (
    (month === 6 && day >= 21) ||
    (month > 6 && month < 9) ||
    (month === 9 && day <= 20)
  ) {
    season = 'Summer';
    endYear = year;
    endMonth = 9;
    endDay = 20;
  } else if (
    (month === 9 && day >= 21) ||
    (month > 9 && month < 12) ||
    (month === 12 && day <= 20)
  ) {
    season = 'Fall';
    endYear = year;
    endMonth = 12;
    endDay = 20;
  } else {
    season = 'Winter';
    endYear = month === 12 ? year + 1 : year;
    endMonth = 3;
    endDay = 20;
  }

  const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
  const diffMs = endDate.getTime() - date.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    daysRemaining,
    season,
    year,
    endDate,
    formatted: `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`,
  };
};

/**
 * Get statistics for clip ratings
 * 
 * @param approvedClips - Number of approved clips
 * @param totalClips - Total number of clips
 * @returns Object with percentage strings
 */
export const getClipPercentages = (
  approvedClips: number,
  totalClips: number
): { approvedPercentage: string; deniedPercentage: string } => {
  if (totalClips === 0) {
    return {
      approvedPercentage: '0.0',
      deniedPercentage: '0.0'
    };
  }

  const approvedPercentage = ((approvedClips / totalClips) * 100).toFixed(1);
  const deniedPercentage = ((totalClips - approvedClips) / totalClips * 100).toFixed(1);

  return {
    approvedPercentage,
    deniedPercentage
  };
};

export const SEASON_ORDER: Record<string, number> = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

/**
 * Compare two items by year and season descending (newest year and latest season first).
 * Falls back to createdAt descending if year and season match.
 */
export const compareSeasonYear = <
  T extends { season?: string; year?: number; createdAt?: string | Date }
>(
  a: T,
  b: T
): number => {
  const yearA = Number(a.year) || 0;
  const yearB = Number(b.year) || 0;
  if (yearA !== yearB) {
    return yearB - yearA; // Newest year first
  }
  const seasonA = SEASON_ORDER[(a.season || '').toLowerCase()] ?? 0;
  const seasonB = SEASON_ORDER[(b.season || '').toLowerCase()] ?? 0;
  if (seasonA !== seasonB) {
    return seasonB - seasonA; // Newest season within year first (Winter > Fall > Summer > Spring)
  }
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return dateB - dateA; // Fallback to newest createdAt
};

