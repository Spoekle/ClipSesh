import axios from 'axios';
import apiUrl from '../config/config';
import { ProfileFormData, PublicProfile } from '../types/profileTypes';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get public profile by user ID
 */
export const getPublicProfile = async (userId: string): Promise<PublicProfile> => {
  try {
    const response = await axios.get(`${apiUrl}/api/profiles/public/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public profile:', error);
    throw new Error('Failed to fetch profile');
  }
};

/**
 * Get current user's profile (private)
 */
export const getMyProfile = async (): Promise<PublicProfile> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${apiUrl}/api/profiles/me`, { headers });
    return response.data.profile;
  } catch (error) {
    console.error('Error fetching my profile:', error);
    throw new Error('Failed to fetch profile');
  }
};

/**
 * Update current user's profile
 */
export const updateProfile = async (profileData: ProfileFormData): Promise<PublicProfile> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.put(`${apiUrl}/api/profiles/me`, profileData, { headers });
    return response.data.profile;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};
