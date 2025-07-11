import axios from 'axios';
import { UnifiedSearchResponse, SearchParams } from '../types/searchTypes';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Unified search service for clips and profiles
 */
export const unifiedSearch = async (params: SearchParams): Promise<UnifiedSearchResponse> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/search`, {
      params,
      headers
    });
    
    return response.data;
  } catch (error) {
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
