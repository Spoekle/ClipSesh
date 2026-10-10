import { User, Rating, RatingUser } from '@/types/adminTypes';

export interface ClipRatingSummary {
  userRating: string | null;
  hasRated: boolean;
  isDenied: boolean;
  averageRating: string;
  denialCount: number;
  totalRatings: number;
}

/**
 * Computes rating aggregations and status for an individual clip.
 *
 * @param clipId - The clip ID to aggregate ratings for
 * @param ratings - Dictionary of all fetched ratings indexed by clipId
 * @param user - Current user if authenticated
 * @param denyThreshold - Threshold of deny votes required to consider a clip denied
 * @returns Summary of ratings, user rating, denial count, and averages
 *
 * @example
 * ```ts
 * const summary = computeClipRatingSummary('clip123', ratings, currentUser, 3);
 * console.log(summary.averageRating);
 * ```
 */
export function computeClipRatingSummary(
  clipId: string,
  ratings?: Record<string, Rating>,
  user?: User | null,
  denyThreshold = 3
): ClipRatingSummary {
  if (!ratings || !ratings[clipId]) {
    return {
      userRating: null,
      hasRated: false,
      isDenied: false,
      averageRating: '0.0',
      denialCount: 0,
      totalRatings: 0,
    };
  }

  const clipRatings = ratings[clipId];

  // User rating
  let userRating: string | null = null;
  if (user) {
    if (clipRatings.ratings) {
      const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;
      for (const category of ratingCategories) {
        const ratingUsers = clipRatings.ratings[category] || [];
        if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
          userRating = category;
          break;
        }
      }
    } else if (clipRatings.ratingCounts) {
      for (const ratingCount of clipRatings.ratingCounts) {
        if (
          ratingCount.users &&
          ratingCount.users.some((u: RatingUser) => u && u.userId === user._id)
        ) {
          userRating = ratingCount.rating.toString();
          break;
        }
      }
    }
  }

  // Denial check
  let isDenied = false;
  let denialCount = 0;

  if (clipRatings.ratingCounts) {
    const denyData = clipRatings.ratingCounts.find((r) => r && r.rating === 'deny');
    denialCount = denyData?.count || 0;
    isDenied = denialCount >= denyThreshold;
  } else if (clipRatings.ratings) {
    denialCount = clipRatings.ratings.deny?.length || 0;
    isDenied = denialCount >= denyThreshold;
  }

  // Average and total ratings
  let totalRatings = 0;
  let averageRating = '0.0';

  if (clipRatings.ratings) {
    const ratingCategories = ['1', '2', '3', '4'] as const;
    let weightedSum = 0;
    for (const category of ratingCategories) {
      const count = clipRatings.ratings[category]?.length || 0;
      totalRatings += count;
      weightedSum += parseInt(category, 10) * count;
    }
    if (totalRatings > 0) {
      averageRating = (weightedSum / totalRatings).toFixed(1);
    }
  } else if (clipRatings.ratingCounts) {
    const numericRatings = clipRatings.ratingCounts.filter(
      (r) => r && r.rating !== 'deny' && ['1', '2', '3', '4'].includes(r.rating.toString())
    );
    totalRatings = numericRatings.reduce((acc, curr) => acc + (curr?.count || 0), 0);
    const weightedSum = numericRatings.reduce(
      (acc, curr) => acc + parseInt(curr.rating.toString(), 10) * (curr?.count || 0),
      0
    );
    if (totalRatings > 0) {
      averageRating = (weightedSum / totalRatings).toFixed(1);
    }
  }

  return {
    userRating,
    hasRated: userRating !== null,
    isDenied,
    averageRating,
    denialCount,
    totalRatings,
  };
}
