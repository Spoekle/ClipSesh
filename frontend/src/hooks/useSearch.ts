import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as searchService from '../services/searchService';
import { SearchParams } from '../types/searchTypes';

// Hook for unified search
export const useUnifiedSearch = (params: SearchParams) => {
  return useQuery({
    queryKey: queryKeys.search.clips(params.q || '', params),
    queryFn: () => searchService.unifiedSearch(params),
    enabled: Boolean(params.q && params.q.trim().length > 0),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for searching clips specifically
export const useSearchClips = (params: Omit<SearchParams, 'type'>) => {
  return useQuery({
    queryKey: queryKeys.search.clips(params.q || '', { ...params, type: 'clips' }),
    queryFn: () => searchService.searchClips(params),
    enabled: Boolean(params.q && params.q.trim().length > 0),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for searching profiles specifically
export const useSearchProfiles = (params: Omit<SearchParams, 'type'>) => {
  return useQuery({
    queryKey: queryKeys.search.clips(params.q || '', { ...params, type: 'profiles' }),
    queryFn: () => searchService.searchProfiles(params),
    enabled: Boolean(params.q && params.q.trim().length > 0),
    staleTime: 30 * 1000, // 30 seconds
  });
};
