import axios from 'axios';
import { Clip, Rating, RatingCount } from '../types/adminTypes';
import { ClipQueryParams, ClipResponse } from '../types/clipTypes';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch clips with optional parameters for sorting, filtering, and pagination
 */
export const getClips = async (params: ClipQueryParams = {}): Promise<ClipResponse> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/clips`, {
      params,
      headers
    });
    
    // Transform the response to ensure consistent field names
    const data = response.data;
    return {
      clips: data.clips,
      ratings: data.ratings,
      total: data.totalClips || data.total,
      page: data.currentPage || data.page,
      pages: data.totalPages || data.pages,
    };
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
    const response = await axios.get(`${backendUrl}/api/clips`, {
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
        axios.get<Rating>(`${backendUrl}/api/ratings/${clip._id}`, { headers })
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
    const response = await axios.get(`${backendUrl}/api/clips/search`, {
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
    const response = await axios.get(`${backendUrl}/api/clips/${clipId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching clip:', error);
    throw new Error('Failed to fetch clip');
  }
};

/**
 * Get adjacent clips for navigation (next/previous)
 */
export const getAdjacentClips = async (
  clipId: string, 
  options?: {
    sort?: string;
    streamer?: string;
    excludeRatedByUser?: string;
  }
): Promise<{ previous?: Clip, next?: Clip }> => {
  try {
    const headers = getAuthHeaders();
    const params: any = { 
      currentClipId: clipId,
      getAdjacent: 'true'
    };
    
    if (options?.sort) {
      params.sort = options.sort;
    }
    
    if (options?.streamer) {
      params.streamer = options.streamer;
    }
    
    if (options?.excludeRatedByUser) {
      params.excludeRatedByUser = options.excludeRatedByUser;
    }
    
    const response = await axios.get(`${backendUrl}/api/clips/clip-navigation/adjacent`, {
      params,
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
    const response = await axios.get(`${backendUrl}/api/clips/filter-options`, { headers });
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
    await axios.delete(`${backendUrl}/api/clips/${clipId}`, { headers });
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
    const response = await axios.put(`${backendUrl}/api/clips/${clipId}`, updateData, { headers });
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
    const response = await axios.post(`${backendUrl}/api/clips/${clipId}/comments`, { comment }, { headers });
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
    const response = await axios.post(`${backendUrl}/api/clips/${clipId}/vote/${voteType}`, {}, { headers });
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
    const response = await axios.get(`${backendUrl}/api/clips/user/${discordId}`, {
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

/**
 * Get video info from URL for clip upload
 */
export const getVideoInfo = async (url: string): Promise<{ title: string; author: string; platform: string }> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/clips/info`, {
      params: { url },
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw new Error('Failed to fetch video info');
  }
};

/**
 * Upload clip via file
 */
export const uploadClipFile = async (
  file: File, 
  title: string, 
  streamer: string, 
  submitter: string,
  onUploadProgress?: (percentCompleted: number) => void
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('clip', file);
    formData.append('title', title);
    formData.append('streamer', streamer);
    formData.append('submitter', submitter);
      const authHeaders = getAuthHeaders();
    const headers = {
      ...authHeaders,
      'Content-Type': 'multipart/form-data'
    };
    
    await axios.post(`${backendUrl}/api/clips`, formData, {
      headers,
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      }
    });
  } catch (error) {
    console.error('Error uploading clip file:', error);
    throw new Error('Failed to upload clip file');
  }
};

/**
 * Upload clip via link
 */
export const uploadClipLink = async (
  title: string, 
  streamer: string, 
  submitter: string, 
  link: string
): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    const clipData = { title, streamer, submitter, link };
    
    await axios.post(`${backendUrl}/api/clips`, clipData, { headers });
  } catch (error) {
    console.error('Error uploading clip link:', error);
    throw new Error('Failed to upload clip link');
  }
};

/**
 * Get vote status for a clip
 */
export const getClipVoteStatus = async (clipId: string): Promise<{ hasVoted: boolean; voteType?: 'upvote' | 'downvote' }> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/clips/${clipId}/vote/status`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching vote status:', error);
    return { hasVoted: false };
  }
};

/**
 * Delete a comment from a clip
 */
export const deleteCommentFromClip = async (clipId: string, commentId: string): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    await axios.delete(`${backendUrl}/api/clips/${clipId}/comments/${commentId}`, { headers });
    
    // Fetch updated clip data
    const response = await axios.get(`${backendUrl}/api/clips/${clipId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Failed to delete comment');
  }
};

/**
 * Add a reply to a comment
 */
export const addReplyToComment = async (
  clipId: string, 
  commentId: string, 
  content: string
): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(
      `${backendUrl}/api/clips/${clipId}/comments/${commentId}/replies`,
      { content },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding reply:', error);
    throw new Error('Failed to add reply');
  }
};

/**
 * Delete a reply from a comment
 */
export const deleteReplyFromComment = async (
  clipId: string, 
  commentId: string, 
  replyId: string
): Promise<Clip> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.delete(
      `${backendUrl}/api/clips/${clipId}/comments/${commentId}/replies/${replyId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw new Error('Failed to delete reply');
  }
};