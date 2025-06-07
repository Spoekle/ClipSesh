// Profile-related types to extend adminTypes.ts
export interface ProfileUpdateData {
  username: string;
  email: string;
  password?: string;
  discordId?: string;
  discordUsername?: string;
}

export interface ProfilePictureResponse {
  success: boolean;
  profilePictureUrl: string;
  message: string;
}

export interface PasswordResetResponse {
  message: string;
}

// Social Links Interface
export interface SocialLinks {
  youtube?: string;
  twitch?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
}

// Trophy Interface
export interface Trophy {
  trophyName: string;
  dateEarned: string;
  description: string;
}

// Enhanced Profile System Types - merged into User
export interface PublicProfile {
  _id: string;
  username: string;
  email?: string;
  profilePicture?: string;
  roles: string[];
  discordId?: string;
  discordUsername?: string;
  joinDate: string;
  bio?: string;
  website?: string;
  socialLinks: SocialLinks;
  isPublic: boolean;
  lastActive: string;
  trophies: Trophy[];
  stats: {
    clipsSubmitted: number;
    joinDate: string;
  };
}

// Profile Form Data for editing
export interface ProfileFormData {
  bio?: string;
  website?: string;
  socialLinks: SocialLinks;
  isPublic: boolean;
}

// API Response Types
export interface ProfileApiResponse<T = any> {
  success: boolean;
  message?: string;
  profile?: T;
}

export interface ProfileMeResponse {
  success: boolean;
  profile: PublicProfile;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  profile: PublicProfile;
}
