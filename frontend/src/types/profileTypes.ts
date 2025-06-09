// Profile-related types to extend adminTypes.ts

// VR Headsets options - matches backend enum
export const VR_HEADSETS = [
  'Oculus Quest',
  'Oculus Quest 2',
  'Oculus Quest Pro',
  'Oculus Quest 3',
  'Oculus Quest 3S',
  'Oculus Rift CV1',
  'Oculus Rift S', 
  'HTC Vive',
  'HTC Vive Pro',
  'HTC Vive Cosmos', 
  'Valve Index', 
  'Bigscreen Beyond',
  'Pico Neo 2',
  'Pico Neo 3',
  'Pico Neo 4', 
  'Other'
] as const;

export type VRHeadset = typeof VR_HEADSETS[number];

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  password?: string;
  discordId?: string;
  discordUsername?: string;
}

// Basic user info for profile editing (without Discord fields - handled via OAuth)
export interface BasicUserInfo {
  username: string;
  email: string;
}

export interface ProfilePictureResponse {
  success: boolean;
  profilePictureUrl: string;
  message: string;
}

export interface PasswordResetResponse {
  message: string;
}

// Social Links Interface - matches backend socialLinksSchema
export interface SocialLinks {
  website?: string;
  youtube?: string;
  twitch?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
}

// Trophy Interface - matches backend trophiesSchema
export interface Trophy {
  trophyName: string;
  dateEarned: string;
  description: string;
}

// PublicProfile Interface - matches the full user API response from backend
export interface PublicProfile {
  _id: string;
  username: string;
  email?: string;
  profilePicture: string;
  roles: string[];
  discordId?: string;
  discordUsername?: string;
  joinDate: string;
  createdAt?: string;
  updatedAt?: string;
  status: string;  profile: {
    bio: string;
    website: string;
    socialLinks: SocialLinks;
    vrheadset: string;
    isPublic: boolean;
    lastActive?: string;
    trophies: Trophy[];
  };
  stats: {
    clipsSubmitted: number;
    joinDate: string;
  };
}

// Profile Form Data for editing - matches backend PUT /api/profiles/me expected fields
export interface ProfileFormData {
  bio: string;
  website: string;
  socialLinks: SocialLinks;
  vrheadset: string;
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
