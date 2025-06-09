import axios from 'axios';
import apiUrl from '../config/config';
import { Clip, Rating, RatingCount } from '../types/adminTypes';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Interface for clip query parameters
export interface ClipQueryParams {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRatings?: boolean;
  streamer?: string;
  submitter?: string;
  status?: string;
  search?: string;
}

// Interface for clip response
export interface ClipResponse {
  clips?: Clip[];
  data?: Clip[];
  ratings?: Record<string, Rating>;
  total?: number;
  page?: number;
  pages?: number;
}

/**
 * Fetch clips with optional parameters for sorting, filtering, and pagination
 */
export const getClips = async (params: ClipQueryParams = {}): Promise<ClipResponse> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/clips`, {
      params,
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching clips:', error);
    throw new Error('Failed to fetch clips');
  }
};

/**
 * Fetch clips with ratings for the Stats page
 */
export const getClipsWithRatings = async (): Promise<{ clips: Clip[], ratings: Record<string, Rating> }> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/clips`, {
      params: {
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeRatings: true
      },
      headers
    });
    
    let clipsData: Clip[] = [];
    let ratingsData: Record<string, Rating> = {};
    
    if (response.data) {
      // Handle different response structures
      if (Array.isArray(response.data)) {
        clipsData = response.data;
      } else if (response.data.clips && Array.isArray(response.data.clips)) {
        clipsData = response.data.clips;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        clipsData = response.data.data;
      }
      
      if (response.data.ratings && typeof response.data.ratings === 'object') {
        ratingsData = response.data.ratings;
      }
    }
    
    // If ratings weren't included in the response, fetch them separately
    if (Object.keys(ratingsData).length === 0 && clipsData.length > 0) {
      const ratingPromises = clipsData.map(clip =>
        axios.get<Rating>(`${apiUrl}/api/ratings/${clip._id}`, { headers })
      );
      
      const ratingResponses = await Promise.all(ratingPromises);
      ratingsData = ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
        acc[clipsData[index]._id] = res.data;
        return acc;
      }, {});
    }
    
    // Transform ratings to ensure consistent structure
    const transformedRatings = transformRatings(ratingsData);
    
    return { clips: clipsData, ratings: transformedRatings };
  } catch (error) {
    console.error('Error fetching clips with ratings:', error);
    throw new Error('Failed to fetch clips with ratings');
  }
};

/**
 * Search for clips by text query
 */
export const searchClips = async (query: string, params: Omit<ClipQueryParams, 'search'> = {}): Promise<ClipResponse> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/clips/search`, {
      params: {
        ...params,
        q: query
      },
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching clips:', error);
    throw new Error('Failed to search clips');
  }
};

/**
 * Fetch a single clip by ID
 */
export const getClipById = async (clipId: string): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/clips/${clipId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching clip:', error);
    throw new Error('Failed to fetch clip');
  }
};

/**
 * Get adjacent clips for navigation (next/previous)
 */
export const getAdjacentClips = async (clipId: string): Promise<{ previous?: Clip, next?: Clip }> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/clips/clip-navigation/adjacent`, {
      params: { clipId },
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching adjacent clips:', error);
    throw new Error('Failed to fetch adjacent clips');
  }
};

/**
 * Get filter options for clips (streamers, submitters, etc.)
 */
export const getClipFilterOptions = async (): Promise<{ streamers: string[], submitters: string[] }> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/clips/filters`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching clip filter options:', error);
    throw new Error('Failed to fetch clip filter options');
  }
};

/**
 * Delete a clip (admin only)
 */
export const deleteClip = async (clipId: string): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    await axios.delete(`${apiUrl}/api/clips/${clipId}`, { headers });
  } catch (error) {
    console.error('Error deleting clip:', error);
    throw new Error('Failed to delete clip');
  }
};

/**
 * Update a clip (admin only)
 */
export const updateClip = async (clipId: string, updateData: Partial<Clip>): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.put(`${apiUrl}/api/clips/${clipId}`, updateData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating clip:', error);
    throw new Error('Failed to update clip');
  }
};

/**
 * Add a comment to a clip
 */
export const addCommentToClip = async (clipId: string, comment: string): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(`${apiUrl}/api/clips/${clipId}/comments`, { comment }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }
};

/**
 * Vote on a clip (upvote/downvote)
 */
export const voteOnClip = async (clipId: string, voteType: 'upvote' | 'downvote'): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(`${apiUrl}/api/clips/${clipId}/vote`, { voteType }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error voting on clip:', error);
    throw new Error('Failed to vote on clip');
  }
};

/**
 * Transform ratings data to ensure consistent structure
 * This handles cases where ratings come in different formats from the API
 */
export const transformRatings = (ratings: Record<string, any>): Record<string, Rating> => {
  const transformed: Record<string, Rating> = {};
  
  Object.entries(ratings).forEach(([clipId, ratingData]) => {
    if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
      // Transform from raw ratings format to structured format
      const ratingCounts: RatingCount[] = [
        { 
          rating: '1', 
          count: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'].length : 0,
          users: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'] : []
        },
        { 
          rating: '2', 
          count: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'].length : 0,
          users: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'] : []
        },
        { 
          rating: '3', 
          count: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'].length : 0,
          users: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'] : [] 
        },
        { 
          rating: '4', 
          count: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'].length : 0,
          users: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'] : []
        },
        { 
          rating: 'deny', 
          count: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'].length : 0,
          users: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'] : []
        }
      ];
      
      transformed[clipId] = {
        ...ratingData,
        ratingCounts: ratingCounts
      };
    } else {
      // Already in the correct format
      transformed[clipId] = ratingData;
    }
  });
  
  return transformed;
};

/**
 * Get clips submitted by a specific user (by Discord ID)
 */
export const getClipsByUser = async (discordId: string, page: number = 1, limit: number = 10): Promise<ClipResponse> => {
  try {
    const response = await axios.get(`${apiUrl}/api/clips/user/${discordId}`, {
      params: { page, limit }
    });
    
    return {
      clips: response.data.clips,
      total: response.data.pagination.totalClips,
      page: response.data.pagination.currentPage,
      pages: response.data.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching user clips:', error);
    throw new Error('Failed to fetch user clips');
  }
};