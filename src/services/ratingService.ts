import { apiClient } from '@/lib/apiClient';
import { Rating } from '../types/adminTypes';
import { RatingQueryParams, MyRatingsResponse } from '../types/ratingTypes';

/**
 * Get user's own ratings with optional date filtering
 */
export const getMyRatings = async (params: RatingQueryParams = {}): Promise<MyRatingsResponse> => {
  try {
    const data = await apiClient.get<any>(`/api/ratings/my-ratings`, { params });

    return {
      ratings: data.ratings || [],
      total: data.total,
      page: data.page,
      pages: data.pages,
    };
  } catch (error) {
    console.error('Error fetching my ratings:', error);
    throw new Error('Failed to fetch user ratings');
  }
};

/**
 * Get ratings for a specific clip
 */
export const getRatingById = async (clipId: string): Promise<Rating> => {
  try {
    return await apiClient.get<Rating>(`/api/ratings/${clipId}`);
  } catch (error) {
    console.error('Error fetching rating:', error);
    throw new Error('Failed to fetch clip rating');
  }
};

/**
 * Submit a rating for a clip
 */
export const submitRating = async (clipId: string, rating: '1' | '2' | '3' | '4' | 'deny'): Promise<Rating> => {
  try {
    return await apiClient.post<Rating>(`/api/ratings/${clipId}`, { rating });
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw new Error('Failed to submit rating');
  }
};

/**
 * Update an existing rating for a clip
 */
export const updateRating = async (clipId: string, rating: '1' | '2' | '3' | '4' | 'deny'): Promise<Rating> => {
  try {
    return await apiClient.put<Rating>(`/api/ratings/${clipId}`, { rating });
  } catch (error) {
    console.error('Error updating rating:', error);
    throw new Error('Failed to update rating');
  }
};

/**
 * Delete a rating for a clip
 */
export const deleteRating = async (clipId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/ratings/${clipId}`);
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw new Error('Failed to delete rating');
  }
};

/**
 * Get all ratings for multiple clips (bulk fetch)
 */
export const getBulkRatings = async (clipIds: string[]): Promise<Record<string, Rating>> => {
  try {
    const ratingPromises = clipIds.map((clipId) =>
      apiClient.get<Rating>(`/api/ratings/${clipId}`)
    );

    const ratingResponses = await Promise.all(ratingPromises);
    return ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
      acc[clipIds[index]] = res;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching bulk ratings:', error);
    throw new Error('Failed to fetch ratings');
  }
};

/**
 * Get rating statistics for a user
 */
export const getUserRatingStats = async (
  userId?: string
): Promise<{
  totalRatings: number;
  ratingBreakdown: Record<string, number>;
  averageRating: number;
}> => {
  try {
    const url = userId ? `/api/ratings/stats/${userId}` : `/api/ratings/stats`;
    return await apiClient.get(url);
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    throw new Error('Failed to fetch rating statistics');
  }
};

/**
 * Get rating activity data for charts/statistics
 */
export const getRatingActivity = async (params: {
  startDate?: string;
  endDate?: string;
}): Promise<any> => {
  try {
    return await apiClient.get(`/api/ratings/activity`, { params });
  } catch (error) {
    console.error('Error fetching rating activity:', error);
    throw new Error('Failed to fetch rating activity');
  }
};
