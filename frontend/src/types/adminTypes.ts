// User-related types
export interface User {
  _id: string;
  username: string;
  email?: string;
  roles: string[];
  profilePicture?: string;
  discordId?: string;
  discordUsername?: string;
  status: string;
  password?: string;
}

export interface CreateUserFormData {
  username: string;
  password: string;
  email: string;
  roles: string[];
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
  link?: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  createdAt: string;
}

export interface Reply {
  _id: string;
  userId: string;
  username: string;
  replyText: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  userId?: string;
  username: string;
  comment: string;
  createdAt: string;
  replies: Reply[];
}

// Rating-related types
export interface RatingCount {
  rating: string;
  count: number;
  users: { userId: string; username: string }[];
}

export interface Rating {
  ratingCounts: RatingCount[];
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
  season: string;
  clipAmount: number;
}

export interface Zip {
  _id: string;
  name: string;
  url: string;
  season: string;
  clipAmount: number;
  size: number;
  createdAt: string;
}

// Chart data types for statistics
export interface PieData {
  name: string;
  value: number;
}
