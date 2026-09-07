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
