import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as userService from '../services/userService';
import { ProfileUpdateData, BasicUserInfo } from '../types/profileTypes';

// Hook for fetching current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user.current,
    queryFn: userService.getCurrentUser,
    enabled: Boolean(localStorage.getItem('token')),
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (unauthorized)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 401) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
};

// Hook for fetching user profile by ID
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => userService.getCurrentUser(), // Adjust this if you have a getUserById function
    enabled: Boolean(userId),
  });
};

// Mutation for updating user profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updateData }: { userId: string; updateData: any }) =>
      userService.updateUserProfile(userId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};

// Mutation for updating current user info
export const useUpdateMyUserInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updateData: ProfileUpdateData) =>
      userService.updateMyUserInfo(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for updating basic user info
export const useUpdateMyBasicInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updateData: BasicUserInfo) =>
      userService.updateMyBasicInfo(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for updating basic user info with password
export const useUpdateMyBasicInfoWithPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updateData: BasicUserInfo & { password?: string }) =>
      userService.updateMyBasicInfoWithPassword(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for uploading profile picture
export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profilePicture: File) =>
      userService.uploadProfilePicture(profilePicture),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for unlinking Discord account
export const useUnlinkDiscordAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) =>
      userService.unlinkDiscordAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for user login
export const useLoginUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      userService.loginUser({ username, password }),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for user registration
export const useRegisterUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      userService.registerUser({ username, password }),
    onSuccess: () => {
      // You might want to automatically log in the user after registration
      // or just invalidate the user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};

// Mutation for password reset request
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) =>
      userService.requestPasswordReset(email),
  });
};

// Mutation for password reset confirmation
export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      userService.confirmPasswordReset(token, password),
  });
};

// Helper hook for logout
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return () => {
    localStorage.removeItem('token');
    queryClient.clear(); // Clear all cached data
  };
};

// Helper function to get Discord auth URL
export const getDiscordAuthUrl = userService.getDiscordAuthUrl;
