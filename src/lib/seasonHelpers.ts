import path from 'path';
import fs from 'fs';

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

export function getSeasonDirectory(baseDir: string, date: Date = new Date()): string {
  const { season, year } = getCurrentSeason(date);
  return path.join(baseDir, `${year}-${season}`);
}

export function getDailyDirectory(baseDir: string, date: Date = new Date()): string {
  const seasonDir = getSeasonDirectory(baseDir, date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return path.join(seasonDir, `${year}-${month}-${day}`);
}

export function ensureDirectoryExists(directory: string): string {
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o777 });
      try {
        fs.chmodSync(directory, 0o777);
      } catch {}
    } catch (err) {
      console.error(`Error creating directory ${directory}:`, err);
      throw err;
    }
  }
  return directory;
}

export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getClipPath(baseDir: string, filename: string, date: Date = new Date()): {
  fullPath: string;
  relativePath: string;
  directory: string;
} {
  const dailyDir = getDailyDirectory(baseDir, date);
  ensureDirectoryExists(dailyDir);

  const fullPath = path.join(dailyDir, filename);
  const relativePath = path.relative(baseDir, fullPath);

  return {
    fullPath,
    relativePath,
    directory: dailyDir
  };
}

export function isLegacyPath(filePath: string): boolean {
  const pathParts = filePath.split(path.sep);
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

