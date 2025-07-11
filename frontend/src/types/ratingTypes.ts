// Rating service specific types

// Interface for user rating data from API
export interface UserRatingData {
  _id: string;
  clipId: string;
  userId: string;
  rating: '1' | '2' | '3' | '4' | 'deny';
  timestamp: string;
}

// Interface for rating query parameters
export interface RatingQueryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

// Interface for my ratings response
export interface MyRatingsResponse {
  ratings: UserRatingData[];
  total?: number;
  page?: number;
  pages?: number;
}
