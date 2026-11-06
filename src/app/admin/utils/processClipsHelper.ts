import { Clip, Rating } from '@/types/adminTypes';

export interface ProcessPayloadClip extends Clip {
  rating: string;
  index: number;
}

/**
 * Builds the payload for processing clips into a ZIP compilation archive.
 * Filters clips for the designated season/year, calculates average ratings,
 * and excludes clips with no actual ratings.
 */
export function buildProcessClipsPayload(
  clips: Clip[],
  ratings: Record<string, Rating>,
  season: string,
  year: number
): { clips: ProcessPayloadClip[]; season: string; year: number } {
  const filteredClips = clips.filter((clip) => {
    if (!clip._id) return false;
    const clipSeason = clip.season?.toLowerCase();
    return clipSeason === season.toLowerCase() && clip.year === year;
  });

  const processedClips = filteredClips
    .map((clip, index) => {
      const ratingData = ratings[clip._id];

      if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
        const ratingsObj = ratingData.ratings as Record<
          string,
          { userId: string; username: string }[] | undefined
        >;
        ratingData.ratingCounts = Object.entries(ratingsObj).map(([rating, users]) => ({
          rating,
          count: users?.length || 0,
          users: users || [],
        }));
      }

      if (
        !ratingData ||
        !ratingData.ratingCounts ||
        !Array.isArray(ratingData.ratingCounts) ||
        !ratingData.ratingCounts.length
      ) {
        return { ...clip, rating: '3', index };
      }

      let totalRatingSum = 0;
      let totalRatingCount = 0;

      ratingData.ratingCounts.forEach((rateData) => {
        if (rateData.rating !== 'deny' && rateData.count > 0) {
          const numericRating = parseInt(rateData.rating, 10);
          if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 4) {
            totalRatingSum += numericRating * rateData.count;
            totalRatingCount += rateData.count;
          }
        }
      });

      const hasActualRatings = ratingData.ratingCounts.some((rateData) => rateData.count > 0);

      let averageRating = '3';
      if (totalRatingCount > 0) {
        const avgValue = totalRatingSum / totalRatingCount;
        const roundedRating = Math.max(1, Math.min(4, Math.round(avgValue)));
        averageRating = roundedRating.toString();
      } else if (!hasActualRatings) {
        return null;
      }

      return { ...clip, rating: averageRating, index };
    })
    .filter((clip): clip is ProcessPayloadClip => clip !== null);

  return {
    clips: processedClips,
    season,
    year,
  };
}
