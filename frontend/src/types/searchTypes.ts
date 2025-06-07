// Types for unified search functionality
import { Clip } from './adminTypes';
import { PublicProfile } from './profileTypes';

// SearchProfile now extends PublicProfile for consistency
export interface SearchProfile extends PublicProfile {
  stats: {
    clipsSubmitted: number;
    joinDate: string;
  };
}

export interface UnifiedSearchResponse {
  clips: Clip[];
  profiles: SearchProfile[];
  total: number;
  totalPages: number;
  currentPage: number;
  searchType: 'all' | 'clips' | 'profiles';
}

export interface SearchParams {
  q: string;
  type?: 'all' | 'clips' | 'profiles';
  page?: number;
  limit?: number;
  // Clip-specific filters
  streamer?: string;
  submitter?: string;
  sort?: string;
}

export interface SearchResult {
  type: 'clip' | 'profile';
  data: Clip | SearchProfile;
}
