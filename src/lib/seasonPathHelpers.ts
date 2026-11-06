import path from 'path';
import fs from 'fs';
import { getCurrentSeason } from './seasonHelpers';

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
