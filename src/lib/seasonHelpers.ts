export interface SeasonInfo {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  year: number;
}

export function getCurrentSeason(date: Date = new Date()): SeasonInfo {
  const month = date.getMonth() + 1; // 0-based to 1-based
  const day = date.getDate();
  const year = date.getFullYear();
  let season: SeasonInfo['season'] = 'winter';

  if (
    (month === 3 && day >= 20) ||
    (month > 3 && month < 6) ||
    (month === 6 && day <= 20)
  ) {
    season = 'spring';
  } else if (
    (month === 6 && day >= 21) ||
    (month > 6 && month < 9) ||
    (month === 9 && day <= 20)
  ) {
    season = 'summer';
  } else if (
    (month === 9 && day >= 21) ||
    (month > 9 && month < 12) ||
    (month === 12 && day <= 20)
  ) {
    season = 'fall';
  } else {
    season = 'winter';
  }

  return { season, year };
}

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

export function getSeasonDateRange(season: string, year: number): SeasonDateRange {
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
}

export interface SeasonRemainingDays {
  daysRemaining: number;
  season: string;
  year: number;
  endDate: Date;
  formatted: string;
}

export function getSeasonRemainingDays(date: Date = new Date()): SeasonRemainingDays {
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
}

export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isLegacyPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const pathParts = normalized.split('/').filter(Boolean);
  if (pathParts.length === 2 && pathParts[0] === 'uploads') {
    return true;
  }
  if (pathParts.length >= 3) {
    const seasonFolder = pathParts[1];
    const seasonPattern = /^\d{4}-(spring|summer|fall|winter)$/;
    return !seasonPattern.test(seasonFolder);
  }
  return false;
}

export const SEASON_ORDER: Record<string, number> = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

export type SeasonName = 'Spring' | 'Summer' | 'Fall' | 'Winter';

export interface SeasonTransitionDef {
  boundaryMonth: number; // 3 = March, 6 = June, 9 = September, 12 = December
  closingSeason: SeasonName;
  openingSeason: SeasonName;
}

export const SEASON_TRANSITIONS: SeasonTransitionDef[] = [
  { boundaryMonth: 3, closingSeason: 'Winter', openingSeason: 'Spring' },
  { boundaryMonth: 6, closingSeason: 'Spring', openingSeason: 'Summer' },
  { boundaryMonth: 9, closingSeason: 'Summer', openingSeason: 'Fall' },
  { boundaryMonth: 12, closingSeason: 'Fall', openingSeason: 'Winter' },
];

export interface SeasonAutomationDates {
  seasonEndDay?: number;
  newSeasonStartDay?: number;
  zipArchiveDay?: number;
}

export interface SeasonLifecycleStatus {
  phase: 'ACTIVE_SUBMISSIONS' | 'VOTING_GRACE_PERIOD' | 'POST_ARCHIVE_ACTIVE';
  currentSeason: SeasonName;
  currentYear: number;
  isTransitionMonth: boolean;
  closingSeason?: SeasonName;
  closingYear?: number;
  openingSeason?: SeasonName;
  openingYear?: number;
  submissionCutoffDate: Date;
  newSeasonStartDate: Date;
  zipArchiveDate: Date;
  daysUntilCutoff: number;
  daysUntilArchive: number;
}

/**
 * Determine lifecycle status across the 4 seasons (Spring, Summer, Fall, Winter)
 * Transitions occur exclusively during months 3 (Mar), 6 (Jun), 9 (Sep), and 12 (Dec).
 */
export function getSeasonLifecycleStatus(
  date: Date = new Date(),
  config?: SeasonAutomationDates
): SeasonLifecycleStatus {
  const endDay = config?.seasonEndDay ?? 20;
  const startDay = config?.newSeasonStartDay ?? 21;
  const zipDay = config?.zipArchiveDay ?? 25;

  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  const transition = SEASON_TRANSITIONS.find((t) => t.boundaryMonth === month);
  const isTransitionMonth = !!transition;

  if (!isTransitionMonth) {
    // Non-transition months: Jan, Feb, Apr, May, Jul, Aug, Oct, Nov
    const { season: curSeasonLower, year: curYear } = getCurrentSeason(date);
    const curSeason = (curSeasonLower.charAt(0).toUpperCase() + curSeasonLower.slice(1)) as SeasonName;

    // Find the next upcoming transition month
    const nextTransition =
      SEASON_TRANSITIONS.find((t) => t.boundaryMonth > month) || SEASON_TRANSITIONS[0];
    const nextYear = nextTransition.boundaryMonth < month ? year + 1 : year;

    const submissionCutoffDate = new Date(nextYear, nextTransition.boundaryMonth - 1, endDay, 23, 59, 59, 999);
    const newSeasonStartDate = new Date(nextYear, nextTransition.boundaryMonth - 1, startDay, 0, 0, 0, 0);
    const zipArchiveDate = new Date(nextYear, nextTransition.boundaryMonth - 1, zipDay, 0, 1, 0, 0);

    const diffCutoff = Math.max(0, Math.ceil((submissionCutoffDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
    const diffArchive = Math.max(0, Math.ceil((zipArchiveDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      phase: 'ACTIVE_SUBMISSIONS',
      currentSeason: curSeason,
      currentYear: curYear,
      isTransitionMonth: false,
      submissionCutoffDate,
      newSeasonStartDate,
      zipArchiveDate,
      daysUntilCutoff: diffCutoff,
      daysUntilArchive: diffArchive,
    };
  }

  // Inside transition months (March, June, September, December)
  const { closingSeason, openingSeason } = transition;
  // Winter closing year is start year (year - 1 in March)
  const closingYear = month === 3 && closingSeason === 'Winter' ? year - 1 : year;
  const openingYear = month === 12 && openingSeason === 'Winter' ? year : year;

  const submissionCutoffDate = new Date(year, month - 1, endDay, 23, 59, 59, 999);
  const newSeasonStartDate = new Date(year, month - 1, startDay, 0, 0, 0, 0);
  const zipArchiveDate = new Date(year, month - 1, zipDay, 0, 1, 0, 0);

  const diffCutoff = Math.ceil((submissionCutoffDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const diffArchive = Math.ceil((zipArchiveDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (day <= endDay) {
    // 1st to 20th: Active submissions for closing season
    return {
      phase: 'ACTIVE_SUBMISSIONS',
      currentSeason: closingSeason,
      currentYear: closingYear,
      isTransitionMonth: true,
      closingSeason,
      closingYear,
      openingSeason,
      openingYear,
      submissionCutoffDate,
      newSeasonStartDate,
      zipArchiveDate,
      daysUntilCutoff: Math.max(0, diffCutoff),
      daysUntilArchive: Math.max(0, diffArchive),
    };
  }

  if (day < zipDay) {
    // 21st to 24th: Voting grace period for closing season; opening season accepts new submissions
    return {
      phase: 'VOTING_GRACE_PERIOD',
      currentSeason: openingSeason,
      currentYear: openingYear,
      isTransitionMonth: true,
      closingSeason,
      closingYear,
      openingSeason,
      openingYear,
      submissionCutoffDate,
      newSeasonStartDate,
      zipArchiveDate,
      daysUntilCutoff: 0,
      daysUntilArchive: Math.max(0, diffArchive),
    };
  }

  // 25th+: Auto-zip & Archive phase
  return {
    phase: 'POST_ARCHIVE_ACTIVE',
    currentSeason: openingSeason,
    currentYear: openingYear,
    isTransitionMonth: true,
    closingSeason,
    closingYear,
    openingSeason,
    openingYear,
    submissionCutoffDate,
    newSeasonStartDate,
    zipArchiveDate,
    daysUntilCutoff: 0,
    daysUntilArchive: 0,
  };
}

/**
 * Returns the season and year that should be archived if today is on or after zipArchiveDay
 * in a transition month (March, June, September, December).
 */
export function getSeasonToArchive(
  date: Date = new Date(),
  config?: SeasonAutomationDates
): { season: SeasonName; year: number; fallbackYears: number[] } | null {
  const zipDay = config?.zipArchiveDay ?? 25;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // Only transition months can trigger season archiving
  const transition = SEASON_TRANSITIONS.find((t) => t.boundaryMonth === month);
  if (!transition) return null;

  if (day < zipDay) return null;

  const { closingSeason } = transition;
  if (closingSeason === 'Winter') {
    // Winter started in Dec of (year - 1) and ends in March of year
    return {
      season: 'Winter',
      year: year - 1,
      fallbackYears: [year - 1, year],
    };
  }

  return {
    season: closingSeason,
    year,
    fallbackYears: [year],
  };
}

/**
 * Compare two items by year and season descending (newest year and latest season first).
 * Falls back to createdAt descending if year and season match.
 */
export function compareSeasonYear<
  T extends { season?: string; year?: number; createdAt?: string | Date }
>(a: T, b: T): number {
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
}


