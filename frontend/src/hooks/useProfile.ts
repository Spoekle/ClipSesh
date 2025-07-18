import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as profileService from '../services/profileService';
import { ProfileFormData } from '../types/profileTypes';

// Hook for fetching public profile by user ID
export const usePublicProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => profileService.getPublicProfile(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching current user's profile
export const useMyProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getMyProfile(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation for updating profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileData: ProfileFormData) => profileService.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};
