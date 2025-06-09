// User-related types
export interface Trophy {
  _id?: string;
  trophyName: string;
  description: string;
  dateEarned: string;
}

export interface User {
  _id: string;
  username: string;
  email?: string;
  password?: string;
  roles: string[];
  profilePicture?: string;
  discordId?: string;
  discordUsername?: string;
  status?: string;
  joinDate?: string;
  createdAt?: string;
  profile?: {
    bio?: string;
    website?: string;    socialLinks?: {
      youtube?: string;
      twitch?: string;
      twitter?: string;
      instagram?: string;
      github?: string;
    };
    vrheadset?: string;
    isPublic?: boolean;
    lastActive?: string;
    trophies?: Trophy[];
  };
  // Keep trophies at root level for backward compatibility
  trophies?: Trophy[];
}

export interface RatingDistributionProps {
  userRatings: UserRating[];
  sortBy: 'username' | 'rating' | 'percentage';
  setSortBy: React.Dispatch<React.SetStateAction<'username' | 'rating' | 'percentage'>>;
}

export interface CreateUserFormData {
  username: string;
  password: string;
  email: string;
  roles: string[];
  status?: string;
}

export interface FormErrors {
  username?: string;
  password?: string;
  email?: string;
  roles?: string;
}

// Clip-related types
export interface Clip {
  _id: string;
  title: string;
  url: string;
  thumbnail?: string;
  streamer: string;
  submitter: string;
  discordSubmitterId?: string;
  link?: string;
  status?: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Reply {
  _id: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  userId?: string;
  username: string;
  comment: string;
  createdAt: string;
  replies?: Reply[];
}

// Rating-related types
export interface RatingCount {
  rating: string;
  count: number;
  users: RatingUser[];
}

// Updated Rating interface to match actual structure
export interface RatingUser {
  userId: string;
  username: string;
}

export interface Rating {
  clipId: string;
  ratingCounts: RatingCount[];
  totalRatings: number;
  ratings?: {
    '1'?: RatingUser[];
    '2'?: RatingUser[];
    '3'?: RatingUser[];
    '4'?: RatingUser[];
    deny?: RatingUser[];
  };
}

export interface UserRating {
  username: string;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  deny: number;
  total: number;
  percentageRated: number;
}

// Other admin dashboard types
export interface SeasonInfo {
  season?: string;
  clipAmount: number;
}

export interface Zip {
  _id: string;
  name: string;
  url: string;
  season: string;
  year: number;
  clipAmount: number;
  size: number;
  createdAt: string;
}

// Chart data types for statistics
export interface PieData {
  name: string;
  value: number;
}
