import axios from 'axios';
import apiUrl from '../config/config';
import { Rating } from '../types/adminTypes';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Interface for user rating data from API
export interface UserRatingData {
  _id: string;
  clipId: string;
  userId: string;
  rating: '1' | '2' | '3' | '4' | 'deny';
  timestamp: string;
}

// Interface for rating query parameters
export interface RatingQueryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

// Interface for my ratings response
export interface MyRatingsResponse {
  ratings: UserRatingData[];
  total?: number;
  page?: number;
  pages?: number;
}

/**
 * Get user's own ratings with optional date filtering
 */
export const getMyRatings = async (params: RatingQueryParams = {}): Promise<MyRatingsResponse> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/ratings/my-ratings`, {
      headers,
      params
    });
    
    return {
      ratings: response.data.ratings || [],
      total: response.data.total,
      page: response.data.page,
      pages: response.data.pages
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
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/ratings/${clipId}`, { headers });
    return response.data;
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
    const headers = getAuthHeaders();
    const response = await axios.post(`${apiUrl}/api/ratings/${clipId}`, { rating }, { headers });
    return response.data;
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
    const headers = getAuthHeaders();
    const response = await axios.put(`${apiUrl}/api/ratings/${clipId}`, { rating }, { headers });
    return response.data;
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
    const headers = getAuthHeaders();
    await axios.delete(`${apiUrl}/api/ratings/${clipId}`, { headers });
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
    const headers = getAuthHeaders();
    const ratingPromises = clipIds.map(clipId =>
      axios.get<Rating>(`${apiUrl}/api/ratings/${clipId}`, { headers })
    );
    
    const ratingResponses = await Promise.all(ratingPromises);
    return ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
      acc[clipIds[index]] = res.data;
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
export const getUserRatingStats = async (userId?: string): Promise<{
  totalRatings: number;
  ratingBreakdown: Record<string, number>;
  averageRating: number;
}> => {
  try {
    const headers = getAuthHeaders();
    const url = userId 
      ? `${apiUrl}/api/ratings/stats/${userId}`
      : `${apiUrl}/api/ratings/stats`;
    
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    throw new Error('Failed to fetch rating statistics');
  }
};
