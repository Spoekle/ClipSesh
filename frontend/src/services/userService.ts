import axios from 'axios';
import apiUrl from '../config/config';
import { ProfileUpdateData, BasicUserInfo } from '../types/profileTypes';

// Interface for update user data
interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  discordId?: string;
  discordUsername?: string;
}

// Interface for API responses
interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  profilePictureUrl?: string;
}

/**
 * Get authorization headers with token
 */
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

/**
 * Update user profile information
 */
export const updateUserProfile = async (userId: string, updateData: UpdateUserData): Promise<ApiResponse> => {
  try {
    const response = await axios.put(`${apiUrl}/api/users/${userId}`, updateData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error updating profile');
  }
};

/**
 * Update current user's basic information (username, email, discord, etc.)
 */
export const updateMyUserInfo = async (updateData: ProfileUpdateData): Promise<ApiResponse> => {
  try {
    // Get current user ID from token or make a request to /me endpoint
    const meResponse = await axios.get(`${apiUrl}/api/users/me`, {
      headers: getAuthHeaders(),
    });
    const userId = meResponse.data._id;
    
    const response = await axios.put(`${apiUrl}/api/users/${userId}`, updateData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error updating user information');
  }
};

/**
 * Update current user's basic info (username, email only - Discord handled via OAuth)
 */
export const updateMyBasicInfo = async (updateData: BasicUserInfo): Promise<ApiResponse> => {
  try {
    // Get current user ID from token or make a request to /me endpoint
    const meResponse = await axios.get(`${apiUrl}/api/users/me`, {
      headers: getAuthHeaders(),
    });
    const userId = meResponse.data._id;
    
    const response = await axios.put(`${apiUrl}/api/users/${userId}`, updateData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error updating user information');
  }
};

/**
 * Upload user profile picture
 */
export const uploadProfilePicture = async (profilePicture: File): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    const response = await axios.post(`${apiUrl}/api/users/uploadProfilePicture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error uploading profile picture');
  }
};

/**
 * Get Discord authentication URL
 */
export const getDiscordAuthUrl = (userId: string): string => {
  return `${apiUrl}/api/discord/auth?siteUserId=${userId}`;
};

/**
 * Unlink Discord account from user profile
 */
export const unlinkDiscordAccount = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.put(`${apiUrl}/api/users/${userId}`, { 
      discordId: "", 
      discordUsername: "" 
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error unlinking Discord account');
  }
};