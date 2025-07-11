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
