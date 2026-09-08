// Clip service specific types
// Note: Clip and Rating types are imported from adminTypes.ts to avoid circular dependencies
import { Clip, Rating } from './adminTypes';

// Interface for clip query parameters
export interface ClipQueryParams {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRatings?: boolean;
  streamer?: string;
  submitter?: string;
  status?: string;
  search?: string;
  season?: string;
  year?: number;
  archived?: string;
  excludeRatedByUser?: string;
  excludeDeniedClips?: boolean;
}

// Interface for clip response
export interface ClipResponse {
  clips?: Clip[];
  data?: Clip[];
  ratings?: Record<string, Rating>;
  total?: number;
  page?: number;
  pages?: number;
}

export interface ArchiveSeasonZip {
  name: string;
  url: string;
  size: number;
  clipAmount: number;
}

export interface ArchiveSeasonSection {
  season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  year: number;
  clipCount: number;
  totalViews: number;
  totalUpvotes: number;
  previewThumbnails: string[];
  topStreamers: string[];
  zip?: ArchiveSeasonZip | null;
  isCurrent: boolean;
}
