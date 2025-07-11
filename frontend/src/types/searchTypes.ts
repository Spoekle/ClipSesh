// Types for unified search functionality with seasonal organization
import { Clip } from './adminTypes';
import { PublicProfile } from './profileTypes';

// SearchProfile now extends PublicProfile for consistency
export interface SearchProfile extends PublicProfile {
  createdAt?: string;
  stats: {
    clipsSubmitted: number;
    joinDate: string;
  };
}

export interface SeasonGroup {
  season: string;
  year: number;
  clips: Clip[];
}

export interface UnifiedSearchResponse {
  clips: Clip[]; // For backward compatibility
  profiles: SearchProfile[];
  currentSeasonClips: Clip[];
  otherSeasonsClips: Record<string, SeasonGroup>;
  availableSeasons: string[];
  currentSeason: {
    season: string;
    year: number;
  };
  total: number;
  totalPages: number;
  currentPage: number;
  searchType: 'all' | 'clips' | 'profiles';
}

export interface SearchParams {
  q: string;
  type?: 'all' | 'clips' | 'profiles';
  season?: string;
  year?: number;
  page?: number;
  limit?: number;
  // Clip-specific filters
  streamer?: string;
  submitter?: string;
  sort?: 'newest' | 'oldest' | 'upvotes' | 'downvotes' | 'ratio';
}

export interface SearchResult {
  type: 'clip' | 'profile';
  data: Clip | SearchProfile;
}
