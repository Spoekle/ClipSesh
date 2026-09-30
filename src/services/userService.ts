import { apiClient } from '@/lib/apiClient';
import { ProfileUpdateData, BasicUserInfo } from '../types/profileTypes';
import { User } from '../types/adminTypes';

// Interface for update user data
interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  discordId?: string;
  discordUsername?: string;
}

// Interface for login/register data
interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  username: string;
}

// Interface for API responses
interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  profilePictureUrl?: string;
}

/**
 * Update user profile information
 */
export const updateUserProfile = async (userId: string, updateData: UpdateUserData): Promise<ApiResponse> => {
  return apiClient.put<ApiResponse>(`/api/users/${userId}`, updateData);
};

/**
 * Update current user's basic information (username, email, discord, etc.)
 */
export const updateMyUserInfo = async (updateData: ProfileUpdateData): Promise<ApiResponse> => {
  const me = await apiClient.get<User>('/api/users/me');
  return apiClient.put<ApiResponse>(`/api/users/${me._id}`, updateData);
};

/**
 * Update current user's basic info (username, email only - Discord handled via OAuth)
 */
export const updateMyBasicInfo = async (updateData: BasicUserInfo): Promise<ApiResponse> => {
  const me = await apiClient.get<User>('/api/users/me');
  return apiClient.put<ApiResponse>(`/api/users/${me._id}`, updateData);
};

/**
 * Update current user's basic info with password change
 */
export const updateMyBasicInfoWithPassword = async (
  updateData: BasicUserInfo & { password?: string }
): Promise<ApiResponse> => {
  const me = await apiClient.get<User>('/api/users/me');
  return apiClient.put<ApiResponse>(`/api/users/${me._id}`, updateData);
};

/**
 * Upload user profile picture
 */
export const uploadProfilePicture = async (profilePicture: File): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('profilePicture', profilePicture);
  return apiClient.post<ApiResponse>('/api/users/uploadProfilePicture', formData);
};

/**
 * Get Discord authentication URL
 */
export const getDiscordAuthUrl = (userId: string): string => {
  return `/api/discord/auth?siteUserId=${userId}`;
};

/**
 * Start Discord OAuth linking process
 */
export const linkDiscordAccount = (userId: string): void => {
  const discordAuthUrl = `/api/discord/auth?siteUserId=${encodeURIComponent(userId)}`;
  if (typeof window !== 'undefined') {
    window.location.href = discordAuthUrl;
  }
};

/**
 * Unlink Discord account from user profile
 */
export const unlinkDiscordAccount = async (userId: string): Promise<ApiResponse> => {
  return apiClient.put<ApiResponse>(`/api/users/${userId}`, {
    discordId: '',
    discordUsername: '',
  });
};

/**
 * Fetch current user information
 */
export const getCurrentUser = async (): Promise<User> => {
  return apiClient.get<User>('/api/users/me');
};

/**
 * Login user
 */
export const loginUser = async (formData: LoginData): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/users/login', formData);
};

/**
 * Register user
 */
export const registerUser = async (formData: RegisterData): Promise<ApiResponse> => {
  return apiClient.post<ApiResponse>('/api/users/register', formData);
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiClient.post('/api/users/resetPassword', { email });
};

/**
 * Confirm password reset with token
 */
export const confirmPasswordReset = async (token: string, password: string): Promise<ApiResponse> => {
  return apiClient.post<ApiResponse>('/api/users/resetPassword/confirm', { token, password });
};