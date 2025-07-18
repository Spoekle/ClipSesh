import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as adminService from '../services/adminService';
import { User, AdminConfig, ProcessClipsRequest, CreateUserFormData } from '../types/adminTypes';

// Hook for fetching all users
export const useAllUsers = () => {
  return useQuery({
    queryKey: queryKeys.admin.users({}),
    queryFn: () => adminService.getAllUsers(),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching admin configuration
export const useAdminConfig = () => {
  return useQuery({
    queryKey: queryKeys.config.admin,
    queryFn: () => adminService.getConfig(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching admin statistics
export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => adminService.getAdminStats(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching clips with ratings
export const useClipsWithRatings = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'clips-with-ratings', params],
    queryFn: () => adminService.getClipsWithRatings(params),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching zips
export const useZips = () => {
  return useQuery({
    queryKey: ['admin', 'zips'],
    queryFn: () => adminService.getZips(),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching trophy criteria
export const useTrophyCriteria = () => {
  return useQuery({
    queryKey: queryKeys.admin.trophies,
    queryFn: () => adminService.getTrophyCriteria(),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching criteria types
export const useCriteriaTypes = () => {
  return useQuery({
    queryKey: ['admin', 'criteria-types'],
    queryFn: () => adminService.getCriteriaTypes(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching custom criteria templates
export const useCustomCriteriaTemplates = () => {
  return useQuery({
    queryKey: ['admin', 'custom-criteria-templates'],
    queryFn: () => adminService.getCustomCriteriaTemplates(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching process job status
export const useProcessStatus = (jobId: string) => {
  return useQuery({
    queryKey: ['admin', 'process-status', jobId],
    queryFn: () => adminService.getProcessStatus(jobId),
    enabled: Boolean(jobId && localStorage.getItem('token')),
    refetchInterval: 2000, // Poll every 2 seconds
  });
};

// Mutation for creating a user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserFormData & { status: string }) =>
      adminService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for updating a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updateData }: { userId: string; updateData: Partial<User> }) =>
      adminService.updateUser(userId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for deleting a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for approving a user
export const useApproveUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => adminService.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for disabling a user
export const useDisableUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => adminService.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for changing user password
export const useChangeUserPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminService.changeUserPassword(userId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for updating configuration
export const useUpdateConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: AdminConfig) => adminService.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
};

// Mutation for updating admin configuration
export const useUpdateAdminConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (adminConfig: { denyThreshold: number; clipChannelIds: string[] }) =>
      adminService.updateAdminConfig(adminConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
};

// Mutation for updating public configuration
export const useUpdatePublicConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (publicConfig: { latestVideoLink: string }) =>
      adminService.updatePublicConfig(publicConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
};

// Mutation for deleting all clips
export const useDeleteAllClips = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => adminService.deleteAllClips(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

// Mutation for uploading zip
export const useUploadZip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ zipFile, clipAmount, season }: { zipFile: File; clipAmount: number; season: string }) =>
      adminService.uploadZip(zipFile, clipAmount, season),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'zips'] });
    },
  });
};

// Mutation for deleting zip
export const useDeleteZip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (zipId: string) => adminService.deleteZip(zipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'zips'] });
    },
  });
};

// Mutation for processing clips
export const useProcessClips = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (processData: ProcessClipsRequest) => adminService.processClips(processData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

// Mutation for force completing process job
export const useForceCompleteProcessJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => adminService.forceCompleteProcessJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

// Mutation for updating user trophies
export const useUpdateUserTrophies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, trophies }: { userId: string; trophies: Array<{ season: string; position: number }> }) =>
      adminService.updateUserTrophies(userId, trophies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for clearing season trophies
export const useClearSeasonTrophies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ season, year }: { season: string; year: number }) =>
      adminService.clearSeasonTrophies(season, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for adding/updating trophy
export const useAddOrUpdateTrophy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      trophyData, 
      trophyId 
    }: { 
      userId: string; 
      trophyData: { trophyName: string; description: string; season: string; year: number };
      trophyId?: string 
    }) => adminService.addOrUpdateTrophy(userId, trophyData, trophyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for deleting trophy
export const useDeleteTrophy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, trophyId }: { userId: string; trophyId: string }) =>
      adminService.deleteTrophy(userId, trophyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for creating trophy criteria
export const useCreateTrophyCriteria = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (criteriaData: any) => adminService.createTrophyCriteria(criteriaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trophies });
    },
  });
};

// Mutation for updating trophy criteria
export const useUpdateTrophyCriteria = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, criteriaData }: { id: string; criteriaData: any }) =>
      adminService.updateTrophyCriteria(id, criteriaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trophies });
    },
  });
};

// Mutation for deleting trophy criteria
export const useDeleteTrophyCriteria = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminService.deleteTrophyCriteria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trophies });
    },
  });
};

// Mutation for assigning trophies
export const useAssignTrophies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ season, year }: { season: string; year: number }) =>
      adminService.assignTrophies(season, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
    },
  });
};

// Mutation for previewing trophy winners
export const usePreviewTrophyWinners = () => {
  return useMutation({
    mutationFn: ({ criteriaId, season, year }: { criteriaId: string; season: string; year: number }) =>
      adminService.previewTrophyWinners(criteriaId, season, year),
  });
};

// Mutation for previewing all trophy winners
export const usePreviewAllTrophyWinners = () => {
  return useMutation({
    mutationFn: ({ season, year }: { season: string; year: number }) =>
      adminService.previewAllTrophyWinners(season, year),
  });
};

// Mutation for validating custom criteria
export const useValidateCustomCriteria = () => {
  return useMutation({
    mutationFn: ({ customCriteria, season, year }: { customCriteria: any; season: string; year: number }) =>
      adminService.validateCustomCriteria(customCriteria, season, year),
  });
};

// Helper functions
export const transformRatings = adminService.transformRatings;
