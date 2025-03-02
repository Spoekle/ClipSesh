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
