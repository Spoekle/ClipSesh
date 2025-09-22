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
