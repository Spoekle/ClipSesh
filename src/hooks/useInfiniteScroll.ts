import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';

interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollProps {
  queryKey: readonly (string | number | object)[];
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<{ data: any[], hasMore: boolean, nextPage?: number }>;
  options?: InfiniteScrollOptions;
  initialPageParam?: number;
  getNextPageParam?: (lastPage: any, allPages: any[]) => number | undefined;
  enabled?: boolean;
}

export const useInfiniteScroll = ({
  queryKey,
  queryFn,
  options = {},
  initialPageParam = 1,
  getNextPageParam = (lastPage, allPages) => lastPage.hasMore ? allPages.length + 1 : undefined,
  enabled = true
}: UseInfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam,
    getNextPageParam,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoize flattened data to avoid unnecessary re-renders
  const flatData = useMemo(() => {
    return data?.pages.reduce((acc: any[], page) => {
      return [...acc, ...page.data];
    }, []) || [];
  }, [data?.pages]);

  // Intersection Observer for infinite scrolling
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage && !isFetching) {
        setIsFetching(true);
        fetchNextPage().finally(() => setIsFetching(false));
      }
    },
    [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]
  );

  // Set up intersection observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const {
      threshold = 0.1,
      rootMargin = '100px',
      enabled: observerEnabled = true
    } = options;

    if (!observerEnabled) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetching) {
      setIsFetching(true);
      fetchNextPage().finally(() => setIsFetching(false));
    }
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

  return {
    data: flatData,
    error,
    isLoading,
    isError,
    isFetchingNextPage: isFetchingNextPage || isFetching,
    hasNextPage,
    loadMore,
    refetch,
    sentinelRef,
    status,
    totalPages: data?.pages.length || 0,
    totalItems: flatData.length,
  };
};

// Hook specifically for clips with infinite scrolling
export const useInfiniteClips = (params: Record<string, any> = {}) => {
  const queryFn = async ({ pageParam = 1 }: { pageParam: number }) => {
    const response = await fetch(`/api/clips?page=${pageParam}&limit=20&${new URLSearchParams(params).toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch clips');
    }
    const data = await response.json();
    return {
      data: data.clips || [],
      hasMore: data.hasMore || false,
      nextPage: data.hasMore ? pageParam + 1 : undefined,
      totalCount: data.totalCount || 0,
    };
  };

  return useInfiniteScroll({
    queryKey: queryKeys.clips.list(params),
    queryFn,
    options: {
      threshold: 0.1,
      rootMargin: '200px',
      enabled: true,
    },
  });
};

// Hook for infinite search results
export const useInfiniteSearch = (query: string, params: Record<string, any> = {}) => {
  const queryFn = async ({ pageParam = 1 }: { pageParam: number }) => {
    if (!query.trim()) {
      return {
        data: [],
        hasMore: false,
        nextPage: undefined,
      };
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${pageParam}&limit=20&${new URLSearchParams(params).toString()}`);
    if (!response.ok) {
      throw new Error('Failed to search clips');
    }
    const data = await response.json();
    return {
      data: data.results || [],
      hasMore: data.hasMore || false,
      nextPage: data.hasMore ? pageParam + 1 : undefined,
      totalCount: data.totalCount || 0,
    };
  };

  return useInfiniteScroll({
    queryKey: queryKeys.search.clips(query, params),
    queryFn,
    enabled: query.trim().length > 0,
    options: {
      threshold: 0.1,
      rootMargin: '200px',
    },
  });
};

// Hook for infinite notifications
export const useInfiniteNotifications = (params: Record<string, any> = {}) => {
  const queryFn = async ({ pageParam = 1 }: { pageParam: number }) => {
    const response = await fetch(`/api/notifications?page=${pageParam}&limit=20&${new URLSearchParams(params).toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const data = await response.json();
    return {
      data: data.notifications || [],
      hasMore: data.hasMore || false,
      nextPage: data.hasMore ? pageParam + 1 : undefined,
      totalCount: data.totalCount || 0,
    };
  };

  return useInfiniteScroll({
    queryKey: queryKeys.notifications.list(params),
    queryFn,
    options: {
      threshold: 0.1,
      rootMargin: '100px',
    },
  });
};
