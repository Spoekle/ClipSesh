import { QueryClient } from '@tanstack/react-query';

// Performance-optimized query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Extended cache times for better performance
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory longer
      
      // Optimized retry strategy
      retry: (failureCount, error) => {
        // Don't retry on client errors
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          if (axiosError.response?.status === 401 || 
              axiosError.response?.status === 403 || 
              axiosError.response?.status === 404) {
            return false;
          }
        }
        return failureCount < 2; // Reduced retry attempts
      },
      
      // Performance optimizations
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network optimizations - allow offline usage with cached data
      networkMode: 'offlineFirst',
      
      // Retry delays for better UX
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      // Allow mutations to be queued when offline
      networkMode: 'offlineFirst',
    },
  },
});

// Performance-optimized query keys with better serialization
export const queryKeys = {
  // User queries with optimized keys
  user: {
    all: ['user'] as const,
    current: ['user', 'current'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
  },
  
  // Clip queries with optimized parameter handling
  clips: {
    all: ['clips'] as const,
    list: (params: Record<string, any>) => {
      // Create a stable key by sorting parameters
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = params[key];
          return acc;
        }, {} as Record<string, any>);
      return ['clips', 'list', sortedParams] as const;
    },
    detail: (clipId: string) => ['clips', 'detail', clipId] as const,
    search: (query: string, params: Record<string, any>) => {
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = params[key];
          return acc;
        }, {} as Record<string, any>);
      return ['clips', 'search', query, sortedParams] as const;
    },
    adjacent: (clipId: string, options: Record<string, any>) => ['clips', 'adjacent', clipId, options] as const,
    filterOptions: ['clips', 'filterOptions'] as const,
    userClips: (discordId: string, page: number, limit: number) => ['clips', 'user', discordId, page, limit] as const,
    videoInfo: (url: string) => ['clips', 'videoInfo', url] as const,
    voteStatus: (clipId: string) => ['clips', 'voteStatus', clipId] as const,
  },
  
  // Rating queries with bulk optimizations
  ratings: {
    all: ['ratings'] as const,
    bulk: (clipIds: string[]) => {
      // Sort clip IDs for consistent caching
      const sortedIds = [...clipIds].sort();
      return ['ratings', 'bulk', sortedIds] as const;
    },
    detail: (clipId: string) => ['ratings', 'detail', clipId] as const,
  },
  
  // Config queries with user-specific caching
  config: {
    all: ['config'] as const,
    combined: (user: any) => ['config', 'combined', user?._id || 'anonymous'] as const,
    admin: ['config', 'admin'] as const,
  },
  
  // Notification queries
  notifications: {
    all: ['notifications'] as const,
    list: (params: Record<string, any>) => ['notifications', 'list', params] as const,
    unread: ['notifications', 'unread'] as const,
  },
  
  // Admin queries
  admin: {
    all: ['admin'] as const,
    users: (params: Record<string, any>) => ['admin', 'users', params] as const,
    stats: ['admin', 'stats'] as const,
    trophies: ['admin', 'trophies'] as const,
  },
  
  // Discord queries
  discord: {
    all: ['discord'] as const,
    authUrl: (userId: string) => ['discord', 'authUrl', userId] as const,
  },
  
  // Search queries
  search: {
    all: ['search'] as const,
    clips: (query: string, params: Record<string, any>) => ['search', 'clips', query, params] as const,
  },
  
  // Message queries
  messages: {
    all: ['messages'] as const,
    list: (params: Record<string, any>) => ['messages', 'list', params] as const,
  },
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  clips: () => queryClient.invalidateQueries({ queryKey: queryKeys.clips.all }),
  ratings: () => queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all }),
  config: () => queryClient.invalidateQueries({ queryKey: queryKeys.config.all }),
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  admin: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  all: () => queryClient.invalidateQueries(),
};
