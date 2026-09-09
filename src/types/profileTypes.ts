export interface ProfileUpdateData {
  username?: string;
  email?: string;
  password?: string;
  discordId?: string;
  discordUsername?: string;
}

// Basic user info for profile/account updating
export interface BasicUserInfo {
  username: string;
  email: string;
}

// Extended user info for account editing including password change
export interface UserInfoWithPassword extends BasicUserInfo {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ProfilePictureResponse {
  success: boolean;
  profilePictureUrl: string;
  message: string;
}

export interface PasswordResetResponse {
  message: string;
}

