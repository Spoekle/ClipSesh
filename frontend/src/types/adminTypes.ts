// User-related types
export interface Trophy {
  _id: string;
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
  season?: string;
  year?: number;
  archived?: boolean;
  archivedAt?: string;
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

// Admin configuration interfaces
export interface AdminConfig {
  denyThreshold: number;
  latestVideoLink: string;
  clipChannelIds?: string[];
  blacklistedSubmitters?: Array<{username: string; userId: string}>;
  blacklistedStreamers?: string[];
}

// Admin statistics interface
export interface AdminStats {
  userCount: number;
  activeUserCount: number;
  clipCount: number;
  ratedClipsCount: number;
  deniedClipsCount: number;
}

// Config response interface
export interface ConfigResponse {
  public?: {
    latestVideoLink?: string;
    clipAmount?: number;
  };
  admin?: {
    denyThreshold?: number;
    clipChannelIds?: string[];
    blacklistedSubmitters?: Array<{username: string; userId: string}>;
    blacklistedStreamers?: string[];
  };
}

// Process clips request interface
export interface ProcessClipsRequest {
  clips: Array<Clip & { rating: string; index: number }>;
  season: string;
  year: number;
  assignTrophies?: boolean;
}

// Process job status interface
export interface ProcessJobStatus {
  progress: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

// Trophy criteria types
export interface TrophyCriteria {
  _id?: string;
  name: string;
  description: string;
  criteriaType: string;
  customCriteria?: CustomCriteriaConfig;
  isActive: boolean;
  season?: string;
  year?: number;
  awardLimit?: number;
  minValue?: number;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomCriteriaConfig {
  type: string;
  [key: string]: any;
}

export interface CustomCriteriaTemplate {
  id: string;
  name: string;
  description: string;
  fields: CustomCriteriaField[];
  example: CustomCriteriaConfig;
}

export interface CustomCriteriaField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'json' | 'object';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  description?: string;
  placeholder?: string;
  fields?: CustomCriteriaField[]; // For nested object types
}

export interface CustomCriteriaValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
  previewResults?: Array<{
    userId: string;
    value: number;
    details?: any;
  }>;
  resultCount?: number;
  details?: string;
}

export interface CriteriaType {
  value: string;
  label: string;
  description: string;
}

// Trophy assignment result
export interface TrophyAssignmentResult {
  success: boolean;
  message: string;
  trophiesAwarded: number;
  details: Array<{
    userId: string;
    username: string;
    criteriaName: string;
    value?: number;
  }>;
}

// Trophy preview results
export interface TrophyPreviewResult {
  criteriaId?: string;
  criteriaName: string;
  criteriaType: string;
  winners: Array<{
    userId: string;
    value: number;
    details?: any;
    user?: {
      username: string;
      profilePicture?: string;
      discordUsername?: string;
    };
  }>;
  totalWinners: number;
  season?: string;
  year?: number;
  error?: string;
}

export interface AllTrophyPreviewResult {
  season: string;
  year: number;
  criteria: TrophyPreviewResult[];
  totalCriteria: number;
  totalTrophies: number;
}

// Blacklisted user interfaces
export interface BlacklistedDiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
  avatar?: string;
}

export interface BlacklistData {
  blacklistedSubmitters: BlacklistedDiscordUser[];
  blacklistedStreamers: string[];
}

// Report-related types
export interface Report {
  _id: string;
  clipId: string;
  clipTitle: string;
  clipStreamer: string;
  clipSubmitter: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportResponse {
  reports: Report[];
  total: number;
  page: number;
  pages: number;
  pendingCount: number;
}

export interface ReportUpdateRequest {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
}

// Report message types
export interface ReportMessageReadBy {
  userId: string;
  username: string;
  readAt: string;
}

export interface ReportMessage {
  _id: string;
  reportId: string;
  senderId: string;
  senderUsername: string;
  senderRole: 'reporter' | 'admin';
  message: string;
  isInternal: boolean;
  readBy: ReportMessageReadBy[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  message: string;
  isInternal?: boolean;
}

export interface ReportWithMessages extends Report {
  messages?: ReportMessage[];
  unreadCount?: number;
}
