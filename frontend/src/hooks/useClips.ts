import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as clipService from '../services/clipService';
import { ClipQueryParams } from '../types/clipTypes';
import { Clip } from '../types/adminTypes';

// Hook for fetching clips with pagination and filters
export const useClips = (params: ClipQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.clips.list(params),
    queryFn: () => clipService.getClips(params),
    enabled: true,
  });
};

// Hook for fetching clips with infinite scrolling
export const useInfiniteClips = (params: Omit<ClipQueryParams, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.clips.list(params),
    queryFn: ({ pageParam = 1 }) => clipService.getClips({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages
      if (lastPage.clips && lastPage.clips.length > 0 && lastPage.total) {
        const currentPage = allPages.length;
        const totalPages = Math.ceil(lastPage.total / (params.limit || 12));
        return currentPage < totalPages ? currentPage + 1 : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching clips with ratings
export const useClipsWithRatings = () => {
  return useQuery({
    queryKey: queryKeys.clips.list({ includeRatings: true }),
    queryFn: () => clipService.getClipsWithRatings(),
    enabled: true,
  });
};

// Hook for searching clips
export const useSearchClips = (query: string, params: Omit<ClipQueryParams, 'search'> = {}) => {
  return useQuery({
    queryKey: queryKeys.clips.search(query, params),
    queryFn: () => clipService.searchClips(query, params),
    enabled: Boolean(query),
  });
};

// Hook for fetching a single clip
export const useClip = (clipId: string) => {
  return useQuery({
    queryKey: queryKeys.clips.detail(clipId),
    queryFn: () => clipService.getClipById(clipId),
    enabled: Boolean(clipId),
  });
};

// Hook for getting adjacent clips from cached data
export const useAdjacentClipsFromCache = (
  clipId: string,
  params: ClipQueryParams = {}
) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.clips.adjacent(clipId, params),
    queryFn: () => {
      console.log('🔍 Finding adjacent clips for:', clipId);
      console.log('🔍 With params:', params);
      
      // Try to get cached clips data that matches the current filters
      const cacheKey = queryKeys.clips.list(params);
      let cachedData = queryClient.getQueryData(cacheKey) as any;
      
      console.log('🔍 Exact cache key:', cacheKey);
      console.log('🔍 Exact cached data found:', !!cachedData);
      
      // If no exact match, try to find the best matching cached clips data
      if (!cachedData) {
        const allCachedQueries = queryClient.getQueryCache().getAll();
        const clipsQueries = allCachedQueries.filter(query => 
          query.queryKey[0] === 'clips' && 
          query.queryKey[1] === 'list' && 
          query.state.data
        );
        
        console.log('🔍 Found', clipsQueries.length, 'cached clips queries');
        
        // Find the best matching query based on parameters
        let bestMatch = null;
        let bestScore = -1;
        
        for (const query of clipsQueries) {
          const queryParams = (query.queryKey[2] || {}) as any;
          let score = 0;
          
          // Score based on matching parameters
          if (queryParams.sort === (params as any).sort) score += 10;
          if (queryParams.streamer === (params as any).streamer) score += 5;
          if (queryParams.excludeRatedByUser === (params as any).excludeRatedByUser) score += 5;
          if (queryParams.search === (params as any).search) score += 3;
          if (queryParams.includeRatings === (params as any).includeRatings) score += 2;
          
          console.log(`🔍 Query score ${score}:`, query.queryKey);
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = query;
          }
        }
        
        if (bestMatch) {
          cachedData = bestMatch.state.data;
          console.log('🔍 Using best match (score:', bestScore, '):', bestMatch.queryKey);
        } else if (clipsQueries.length > 0) {
          // Fallback to most recent
          cachedData = clipsQueries[clipsQueries.length - 1].state.data;
          console.log('🔍 Using fallback (most recent):', clipsQueries[clipsQueries.length - 1].queryKey);
        }
      }
      
      if (!cachedData) {
        console.log('❌ No cached clips data found for adjacent clips');
        return { previous: null, next: null };
      }
      
      // For infinite query data, flatten all pages
      let allClips: Clip[] = [];
      if (cachedData.pages) {
        // Handle infinite query data structure
        allClips = cachedData.pages.flatMap((page: any) => page.clips || []);
        console.log('🔍 Using infinite query data, found', allClips.length, 'clips across', cachedData.pages.length, 'pages');
      } else if (cachedData.clips) {
        // Handle regular query data structure
        allClips = cachedData.clips;
        console.log('🔍 Using regular query data, found', allClips.length, 'clips');
      } else if (Array.isArray(cachedData)) {
        // Handle direct array
        allClips = cachedData;
        console.log('🔍 Using direct array data, found', allClips.length, 'clips');
      }
      
      if (allClips.length === 0) {
        console.log('❌ No clips found in cached data');
        return { previous: null, next: null };
      }
      
      console.log('🔍 First 5 clip IDs:', allClips.slice(0, 5).map(c => c._id));
      console.log('🔍 Last 5 clip IDs:', allClips.slice(-5).map(c => c._id));
      
      // Find current clip index
      const currentIndex = allClips.findIndex(clip => clip._id === clipId);
      
      console.log('🔍 Current clip index:', currentIndex, 'out of', allClips.length);
      
      if (currentIndex === -1) {
        console.log(`❌ Current clip ${clipId} not found in cached data`);
        console.log('🔍 Searching for clip in all cached data...');
        
        // Check if the clip exists in any other cached queries
        const allQueries = queryClient.getQueryCache().getAll();
        for (const query of allQueries) {
          if (query.queryKey[0] === 'clips' && query.state.data) {
            const data = query.state.data as any;
            let clips: Clip[] = [];
            
            if (data.pages) {
              clips = data.pages.flatMap((page: any) => page.clips || []);
            } else if (data.clips) {
              clips = data.clips;
            } else if (Array.isArray(data)) {
              clips = data;
            }
            
            const foundIndex = clips.findIndex(c => c._id === clipId);
            if (foundIndex !== -1) {
              console.log(`🔍 Found clip in query:`, query.queryKey, 'at index:', foundIndex);
            }
          }
        }
        
        return { previous: null, next: null };
      }
      
      // Get adjacent clips based on current position in the list
      // The cached data should already be in the correct sort order
      const previous = currentIndex > 0 ? allClips[currentIndex - 1] : null;
      const next = currentIndex < allClips.length - 1 ? allClips[currentIndex + 1] : null;
      
      console.log('✅ Adjacent clips found:');
      console.log('   Previous:', previous?._id || 'none', previous ? `(index ${currentIndex - 1})` : '');
      console.log('   Current:', allClips[currentIndex]._id, `(index ${currentIndex})`);
      console.log('   Next:', next?._id || 'none', next ? `(index ${currentIndex + 1})` : '');
      
      return { previous, next };
    },
    enabled: Boolean(clipId),
    staleTime: 30 * 1000, // Cache for 30 seconds (shorter to help with debugging)
    gcTime: 2 * 60 * 1000, // Keep in memory for 2 minutes
  });
};

// Legacy hook for fetching adjacent clips via API (kept for fallback)
export const useAdjacentClips = (
  clipId: string,
  options?: {
    sort?: string;
    streamer?: string;
    excludeRatedByUser?: string;
  }
) => {
  return useQuery({
    queryKey: queryKeys.clips.adjacent(clipId, options || {}),
    queryFn: () => clipService.getAdjacentClips(clipId, options),
    enabled: Boolean(clipId),
  });
};

// Hook for fetching clip filter options
export const useClipFilterOptions = () => {
  return useQuery({
    queryKey: queryKeys.clips.filterOptions,
    queryFn: () => clipService.getClipFilterOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching clips by user
export const useClipsByUser = (discordId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.clips.userClips(discordId, page, limit),
    queryFn: () => clipService.getClipsByUser(discordId, page, limit),
    enabled: Boolean(discordId),
  });
};

// Hook for fetching video info
export const useVideoInfo = (url: string) => {
  return useQuery({
    queryKey: queryKeys.clips.videoInfo(url),
    queryFn: () => clipService.getVideoInfo(url),
    enabled: Boolean(url),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook for fetching clip vote status
export const useClipVoteStatus = (clipId: string) => {
  return useQuery({
    queryKey: queryKeys.clips.voteStatus(clipId),
    queryFn: () => clipService.getClipVoteStatus(clipId),
    enabled: Boolean(clipId),
  });
};

// Mutation for deleting a clip
export const useDeleteClip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clipId: string) => clipService.deleteClip(clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for updating a clip
export const useUpdateClip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, updateData }: { clipId: string; updateData: Partial<Clip> }) =>
      clipService.updateClip(clipId, updateData),
    onSuccess: (updatedClip, { clipId }) => {
      // Update the specific clip in the cache
      queryClient.setQueryData(queryKeys.clips.detail(clipId), updatedClip);
      
      // Update the clip in all cached lists
      queryClient.getQueryCache().getAll().forEach((query) => {
        if (query.queryKey[0] === 'clips' && query.queryKey[1] === 'list' && query.state.data) {
          const data = query.state.data as any;
          
          if (data.pages) {
            // Handle infinite query structure
            let updated = false;
            const newPages = data.pages.map((page: any) => {
              if (page.clips) {
                const newClips = page.clips.map((clip: any) => {
                  if (clip._id === clipId) {
                    updated = true;
                    return updatedClip;
                  }
                  return clip;
                });
                return { ...page, clips: newClips };
              }
              return page;
            });
            
            if (updated) {
              queryClient.setQueryData(query.queryKey, { ...data, pages: newPages });
            }
          } else if (data.clips) {
            // Handle regular query structure
            const clipIndex = data.clips.findIndex((clip: any) => clip._id === clipId);
            if (clipIndex !== -1) {
              const newClips = [...data.clips];
              newClips[clipIndex] = updatedClip;
              queryClient.setQueryData(query.queryKey, { ...data, clips: newClips });
            }
          }
        }
      });
      
      // Invalidate adjacent clips since clip data changed
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.adjacent(clipId, {}) });
    },
  });
};

// Mutation for adding a comment to a clip
export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, comment }: { clipId: string; comment: string }) =>
      clipService.addCommentToClip(clipId, comment),
    onSuccess: (updatedClip, { clipId }) => {
      // Update the specific clip in the cache
      queryClient.setQueryData(queryKeys.clips.detail(clipId), updatedClip);
      
      // Update the clip in all cached lists
      queryClient.getQueryCache().getAll().forEach((query) => {
        if (query.queryKey[0] === 'clips' && query.queryKey[1] === 'list' && query.state.data) {
          const data = query.state.data as any;
          
          if (data.pages) {
            // Handle infinite query structure
            let updated = false;
            const newPages = data.pages.map((page: any) => {
              if (page.clips) {
                const newClips = page.clips.map((clip: any) => {
                  if (clip._id === clipId) {
                    updated = true;
                    return updatedClip;
                  }
                  return clip;
                });
                return { ...page, clips: newClips };
              }
              return page;
            });
            
            if (updated) {
              queryClient.setQueryData(query.queryKey, { ...data, pages: newPages });
            }
          } else if (data.clips) {
            // Handle regular query structure
            const clipIndex = data.clips.findIndex((clip: any) => clip._id === clipId);
            if (clipIndex !== -1) {
              const newClips = [...data.clips];
              newClips[clipIndex] = updatedClip;
              queryClient.setQueryData(query.queryKey, { ...data, clips: newClips });
            }
          }
        }
      });
    },
  });
};

// Mutation for voting on a clip
export const useVoteOnClip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, voteType }: { clipId: string; voteType: 'upvote' | 'downvote' }) =>
      clipService.voteOnClip(clipId, voteType),
    onSuccess: (updatedClip, { clipId }) => {
      // Update the specific clip in the cache
      queryClient.setQueryData(queryKeys.clips.detail(clipId), updatedClip);
      
      // Update the clip in all cached lists that might contain it
      queryClient.getQueryCache().getAll().forEach((query) => {
        if (query.queryKey[0] === 'clips' && query.queryKey[1] === 'list' && query.state.data) {
          const data = query.state.data as any;
          
          // Handle infinite query structure
          if (data.pages) {
            let updated = false;
            const newPages = data.pages.map((page: any) => {
              if (page.clips) {
                const newClips = page.clips.map((clip: any) => {
                  if (clip._id === clipId) {
                    updated = true;
                    return updatedClip;
                  }
                  return clip;
                });
                return { ...page, clips: newClips };
              }
              return page;
            });
            
            if (updated) {
              queryClient.setQueryData(query.queryKey, { ...data, pages: newPages });
            }
          }
          
          // Handle regular query structure
          else if (data.clips) {
            const clipIndex = data.clips.findIndex((clip: any) => clip._id === clipId);
            if (clipIndex !== -1) {
              const newClips = [...data.clips];
              newClips[clipIndex] = updatedClip;
              queryClient.setQueryData(query.queryKey, { ...data, clips: newClips });
            }
          }
        }
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.voteStatus(clipId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.adjacent(clipId, {}) });
    },
  });
};

// Mutation for uploading a clip via file
export const useUploadClipFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      file, 
      title, 
      streamer, 
      submitter, 
      onUploadProgress 
    }: { 
      file: File; 
      title: string; 
      streamer: string; 
      submitter: string; 
      onUploadProgress?: (percentCompleted: number) => void 
    }) => clipService.uploadClipFile(file, title, streamer, submitter, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for uploading a clip via link
export const useUploadClipLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      title, 
      streamer, 
      submitter, 
      link 
    }: { 
      title: string; 
      streamer: string; 
      submitter: string; 
      link: string 
    }) => clipService.uploadClipLink(title, streamer, submitter, link),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for deleting a comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, commentId }: { clipId: string; commentId: string }) =>
      clipService.deleteCommentFromClip(clipId, commentId),
    onSuccess: (updatedClip, { clipId }) => {
      queryClient.setQueryData(queryKeys.clips.detail(clipId), updatedClip);
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for adding a reply to a comment
export const useAddReply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, commentId, content }: { clipId: string; commentId: string; content: string }) =>
      clipService.addReplyToComment(clipId, commentId, content),
    onSuccess: (updatedClip, { clipId }) => {
      queryClient.setQueryData(queryKeys.clips.detail(clipId), updatedClip);
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for deleting a reply
export const useDeleteReply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, commentId, replyId }: { clipId: string; commentId: string; replyId: string }) =>
      clipService.deleteReplyFromComment(clipId, commentId, replyId),
    onSuccess: (updatedClip, { clipId }) => {
      queryClient.setQueryData(queryKeys.clips.detail(clipId), updatedClip);
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};
