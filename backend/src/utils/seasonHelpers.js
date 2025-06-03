const path = require('path');
const fs = require('fs');

/**
 * Determine the current season based on the date
 * 
 * @param {Date} [date] - The date to check (defaults to current date)
 * @returns {Object} Object containing season name and year
 */
function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 0-based to 1-based
  const day = date.getDate();
  const year = date.getFullYear();
  let season = '';

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

/**
 * Get the season directory path for a given date
 * 
 * @param {string} baseDir - Base directory for uploads
 * @param {Date} [date] - The date to check (defaults to current date)
 * @returns {string} Full path to the season directory
 */
function getSeasonDirectory(baseDir, date = new Date()) {
  const { season, year } = getCurrentSeason(date);
  return path.join(baseDir, `${year}-${season}`);
}

/**
 * Get the daily directory path for a given date within its season
 * 
 * @param {string} baseDir - Base directory for uploads
 * @param {Date} [date] - The date to check (defaults to current date)
 * @returns {string} Full path to the daily directory
 */
function getDailyDirectory(baseDir, date = new Date()) {
  const seasonDir = getSeasonDirectory(baseDir, date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 1-based, zero-padded
  const day = String(date.getDate()).padStart(2, '0'); // zero-padded
  
  const dailyDir = path.join(seasonDir, `${year}-${month}-${day}`);
  return dailyDir;
}

/**
 * Ensure that the directory exists, creating it if necessary
 * 
 * @param {string} directory - Directory path to ensure exists
 * @returns {string} The directory path
 */
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o777 });
      // Set permissions to ensure writability
      fs.chmodSync(directory, 0o777);
      console.log(`Created directory: ${directory}`);
    } catch (err) {
      console.error(`Error creating directory ${directory}:`, err);
      throw err;
    }
  }
  return directory;
}

/**
 * Get a formatted date string for a file (YYYY-MM-DD)
 * 
 * @param {Date} [date] - The date to format (defaults to current date)
 * @returns {string} Formatted date string
 */
function getDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the full path for a clip file based on date
 * 
 * @param {string} baseDir - Base directory for uploads
 * @param {string} filename - The filename
 * @param {Date} [date] - The date to use for directory structure (defaults to current date)
 * @returns {Object} Object containing the full path and relative path from baseDir
 */
function getClipPath(baseDir, filename, date = new Date()) {
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

/**
 * Check if a file path uses the legacy flat structure (no season/date folders)
 * 
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the path uses legacy structure
 */
function isLegacyPath(filePath) {
  // Legacy paths are directly in uploads/ without season/date folders
  // Example: "uploads/1234567890-video.mp4"
  // Season paths would be: "uploads/2025-summer/2025-06-02/1234567890-video.mp4"
  
  const pathParts = filePath.split(path.sep);
  
  // If the file is directly in uploads/ (only 2 parts: "uploads" and "filename")
  if (pathParts.length === 2 && pathParts[0] === 'uploads') {
    return true;
  }
  
  // If it doesn't match the season pattern YYYY-season
  if (pathParts.length >= 3) {
    const seasonFolder = pathParts[1];
    const seasonPattern = /^\d{4}-(spring|summer|fall|winter)$/;
    return !seasonPattern.test(seasonFolder);
  }
  
  return false;
}

module.exports = {
  getCurrentSeason,
  getSeasonDirectory,
  getDailyDirectory,
  ensureDirectoryExists,
  getDateString,
  getClipPath,
  isLegacyPath
};