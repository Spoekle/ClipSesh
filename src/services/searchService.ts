import { safeLocalStorage } from '@/utils/storage';
import axios from 'axios';
import { UnifiedSearchResponse, SearchParams } from '../types/searchTypes';

const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '') || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = safeLocalStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Unified search service for clips and profiles
 */
export const unifiedSearch = async (params: SearchParams): Promise<UnifiedSearchResponse> => {
  const headers = getAuthHeaders();
  const requestParams = {
    ...params,
    q: params.q,
    query: params.q,
  };

  const url = backendUrl ? `${backendUrl}/api/search` : '/api/search';
  try {
    const response = await axios.get(url, {
      params: requestParams,
      headers,
    });
    return response.data;
  } catch (error) {
    // If external backendUrl failed, fallback to local Next.js /api/search endpoint
    if (backendUrl) {
      try {
        const localResponse = await axios.get('/api/search', {
          params: requestParams,
          headers,
        });
        return localResponse.data;
      } catch (localError) {
        console.error('Fallback /api/search also failed:', localError);
      }
    }
    console.error('Error performing unified search:', error);
    throw new Error('Failed to perform search');
  }
};

/**
 * Search specifically for clips (legacy compatibility)
 */
export const searchClips = async (params: Omit<SearchParams, 'type'>): Promise<UnifiedSearchResponse> => {
  return unifiedSearch({ ...params, type: 'clips' });
};

/**
 * Search specifically for profiles (legacy compatibility)
 */
export const searchProfiles = async (params: Omit<SearchParams, 'type'>): Promise<UnifiedSearchResponse> => {
  return unifiedSearch({ ...params, type: 'profiles' });
};
