import { safeLocalStorage } from '@/utils/storage';
import { apiClient, isAbortError } from '@/lib/apiClient';
import { Clip, Rating, RatingCount } from '../types/adminTypes';
import { ClipQueryParams, ClipResponse, ArchiveSeasonSection } from '../types/clipTypes';

/**
 * Fetch clips with optional parameters for sorting, filtering, and pagination
 */
export const getClips = async (params: ClipQueryParams = {}): Promise<ClipResponse> => {
  try {
    const data = await apiClient.get<any>(`/api/clips`, { params });

    return {
      clips: data.clips,
      ratings: data.ratings,
      total: data.totalClips || data.total,
      page: data.currentPage || data.page,
      pages: data.totalPages || data.pages,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return { clips: [], total: 0, page: 1, pages: 1 };
    }
    console.error('Error fetching clips:', error);
    throw new Error('Failed to fetch clips');
  }
};

/**
 * Fetch clips with ratings for the Stats page
 */
export const getClipsWithRatings = async (): Promise<{ clips: Clip[]; ratings: Record<string, Rating> }> => {
  try {
    const data = await apiClient.get<any>(`/api/clips`, {
      params: {
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeRatings: true,
      },
    });

    let clipsData: Clip[] = [];
    let ratingsData: Record<string, Rating> = {};

    if (data) {
      if (Array.isArray(data)) {
        clipsData = data;
      } else if (data.clips && Array.isArray(data.clips)) {
        clipsData = data.clips;
      } else if (data.data && Array.isArray(data.data)) {
        clipsData = data.data;
      }

      if (data.ratings && typeof data.ratings === 'object') {
        ratingsData = data.ratings;
      }
    }

    if (Object.keys(ratingsData).length === 0 && clipsData.length > 0) {
      const ratingPromises = clipsData.map((clip) =>
        apiClient.get<Rating>(`/api/ratings/${clip._id}`)
      );

      const ratingResponses = await Promise.all(ratingPromises);
      ratingsData = ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
        acc[clipsData[index]._id] = res;
        return acc;
      }, {});
    }

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
export const searchClips = async (
  query: string,
  params: Omit<ClipQueryParams, 'search'> = {}
): Promise<ClipResponse> => {
  try {
    return await apiClient.get<ClipResponse>(`/api/clips/search`, {
      params: {
        ...params,
        q: query,
      },
    });
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
    return await apiClient.get<Clip>(`/api/clips/${clipId}`);
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
): Promise<{ previous?: Clip; next?: Clip }> => {
  try {
    const params: Record<string, any> = {
      currentClipId: clipId,
      getAdjacent: 'true',
    };

    if (options?.sort) params.sort = options.sort;
    if (options?.streamer) params.streamer = options.streamer;
    if (options?.excludeRatedByUser) params.excludeRatedByUser = options.excludeRatedByUser;

    return await apiClient.get(`/api/clips/clip-navigation/adjacent`, { params });
  } catch (error) {
    console.error('Error fetching adjacent clips:', error);
    throw new Error('Failed to fetch adjacent clips');
  }
};

/**
 * Get filter options for clips (streamers, submitters, etc.)
 */
export const getClipFilterOptions = async (): Promise<{ streamers: string[]; submitters: string[] }> => {
  try {
    return await apiClient.get(`/api/clips/filter-options`);
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
    await apiClient.delete(`/api/clips/${clipId}`);
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
    return await apiClient.put<Clip>(`/api/clips/${clipId}`, updateData);
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
    return await apiClient.post<Clip>(`/api/clips/${clipId}/comment`, { comment });
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
    return await apiClient.post<Clip>(`/api/clips/${clipId}/vote/${voteType}`, {});
  } catch (error) {
    console.error('Error voting on clip:', error);
    throw new Error('Failed to vote on clip');
  }
};

/**
 * Transform ratings data to ensure consistent structure
 */
export const transformRatings = (ratings: Record<string, any>): Record<string, Rating> => {
  const transformed: Record<string, Rating> = {};

  Object.entries(ratings).forEach(([clipId, ratingData]) => {
    if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
      const ratingCounts: RatingCount[] = [
        {
          rating: '1',
          count: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'].length : 0,
          users: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'] : [],
        },
        {
          rating: '2',
          count: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'].length : 0,
          users: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'] : [],
        },
        {
          rating: '3',
          count: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'].length : 0,
          users: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'] : [],
        },
        {
          rating: '4',
          count: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'].length : 0,
          users: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'] : [],
        },
        {
          rating: 'deny',
          count: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'].length : 0,
          users: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'] : [],
        },
      ];

      transformed[clipId] = {
        ...ratingData,
        ratingCounts,
      };
    } else {
      transformed[clipId] = ratingData;
    }
  });

  return transformed;
};

/**
 * Get video info from URL for clip upload
 */
export const getVideoInfo = async (url: string): Promise<{ title: string; author: string; platform: string }> => {
  try {
    return await apiClient.get(`/api/clips/info`, { params: { url } });
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

    if (onUploadProgress && typeof XMLHttpRequest !== 'undefined') {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/clips');
        const token = safeLocalStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
    } else {
      await apiClient.post(`/api/clips`, formData);
      onUploadProgress?.(100);
    }
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
    const clipData = { title, streamer, submitter, link };
    await apiClient.post(`/api/clips`, clipData);
  } catch (error) {
    console.error('Error uploading clip link:', error);
    throw new Error('Failed to upload clip link');
  }
};

/**
 * Get vote status for a clip
 */
export const getClipVoteStatus = async (
  clipId: string
): Promise<{ hasVoted: boolean; voteType?: 'upvote' | 'downvote' }> => {
  try {
    return await apiClient.get(`/api/clips/${clipId}/vote/status`);
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
    await apiClient.delete(`/api/clips/${clipId}/comment/${commentId}`);
    return await apiClient.get(`/api/clips/${clipId}`);
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
    return await apiClient.post<Clip>(
      `/api/clips/${clipId}/comment/${commentId}/reply`,
      { replyText: content }
    );
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
    return await apiClient.delete<Clip>(
      `/api/clips/${clipId}/comment/${commentId}/reply/${replyId}`
    );
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw new Error('Failed to delete reply');
  }
};

/**
 * Record a view for a clip (debounced on server per IP)
 */
export const recordClipView = async (
  clipId: string
): Promise<{ success: boolean; views: number; counted: boolean }> => {
  try {
    return await apiClient.post(`/api/clips/${clipId}/view`, {});
  } catch (error) {
    console.warn('Failed to record clip view:', error);
    return { success: false, views: 0, counted: false };
  }
};

/**
 * Fetch all available seasons and years with clip counts, zips, and thumbnails
 */
export const getArchiveSeasons = async (): Promise<{
  currentSeason: { season: string; year: number };
  sections: ArchiveSeasonSection[];
  totalClips: number;
}> => {
  try {
    const data = await apiClient.get<any>(`/api/archive/seasons`);
    const sections = data.sections || [];
    const calculatedTotal = sections.reduce(
      (acc: number, s: ArchiveSeasonSection) => acc + (s.clipCount || 0),
      0
    );
    return {
      currentSeason: data.currentSeason || { season: 'Summer', year: 2026 },
      sections,
      totalClips: typeof data.totalClips === 'number' ? data.totalClips : calculatedTotal,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        currentSeason: { season: 'Summer', year: 2026 },
        sections: [],
        totalClips: 0,
      };
    }
    console.error('Error fetching archive seasons:', error);
    throw new Error('Failed to fetch archive seasons');
  }
};