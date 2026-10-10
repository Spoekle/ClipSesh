import { safeLocalStorage } from '@/utils/storage';
import { useAuthToken } from './useAuthToken';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as adminService from '../services/adminService';
import { User, AdminConfig, ProcessClipsRequest, CreateUserFormData, SendMessageRequest } from '../types/adminTypes';

// Hook for fetching all users
export const useAllUsers = () => {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.admin.users({}),
    queryFn: () => adminService.getAllUsers(),
    enabled: Boolean(token),
  });
};

// Hook for fetching admin configuration
export const useAdminConfig = () => {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.config.admin,
    queryFn: () => adminService.getConfig(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching admin statistics
export const useAdminStats = () => {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => adminService.getAdminStats(),
    enabled: Boolean(token),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching clips with ratings
export const useClipsWithRatings = (params?: any) => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'clips-with-ratings', params],
    queryFn: () => adminService.getClipsWithRatings(params),
    enabled: Boolean(token),
  });
};

// Hook for fetching zips
export const useZips = () => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'zips'],
    queryFn: () => adminService.getZips(),
    enabled: Boolean(token),
  });
};

// Hook for fetching process job status
export const useProcessStatus = (jobId: string) => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'process-status', jobId],
    queryFn: () => adminService.getProcessStatus(jobId),
    enabled: Boolean(jobId && token),
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
    mutationFn: (adminConfig: { 
      denyThreshold: number; 
      clipChannelIds: string[];
      blacklistedSubmitters?: Array<{username: string; userId: string}>;
      blacklistedStreamers?: string[];
    }) =>
      adminService.updateAdminConfig(adminConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blacklisted-users'] });
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

// Hook for fetching blacklisted users
export const useBlacklistedUsers = () => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'blacklisted-users'],
    queryFn: () => adminService.getBlacklistedUsers(),
    enabled: Boolean(token),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching reports
export const useReports = (status?: string, page: number = 1, limit: number = 20) => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'reports', { status, page, limit }],
    queryFn: () => adminService.getReports(status, page, limit),
    enabled: Boolean(token),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Mutation for updating report status
export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reportId, updateData }: { reportId: string; updateData: any }) =>
      adminService.updateReport(reportId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
};

// Mutation for deleting report
export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reportId: string) => adminService.deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
};

// Hook for fetching report messages
export const useReportMessages = (reportId: string) => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'reports', reportId, 'messages'],
    queryFn: () => adminService.getReportMessages(reportId),
    enabled: Boolean(token && reportId),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutation for sending report message
export const useSendReportMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reportId, messageData }: { reportId: string; messageData: SendMessageRequest }) =>
      adminService.sendReportMessage(reportId, messageData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports', variables.reportId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
};

// Mutation for deleting report message
export const useDeleteReportMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reportId, messageId }: { reportId: string; messageId: string }) =>
      adminService.deleteReportMessage(reportId, messageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports', variables.reportId, 'messages'] });
    },
  });
};

// Hook for fetching seasonal automation lifecycle and status
export const useSeasonStatus = () => {
  const token = useAuthToken();
  return useQuery({
    queryKey: ['admin', 'seasons', 'status'],
    queryFn: () => adminService.getSeasonStatus(),
    enabled: Boolean(token),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

// Mutation for triggering season actions (dry-run, force-archive, trigger-check, unarchive)
export const useSeasonAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      action: 'dry-run' | 'force-archive' | 'trigger-check' | 'unarchive';
      season?: string;
      year?: number;
      denyThreshold?: number;
      deleteZip?: boolean;
    }) => adminService.triggerSeasonAction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'seasons'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'seasons'] });
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.config.admin });
      queryClient.invalidateQueries({ queryKey: ['admin', 'zips'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
};

export const useUnarchiveSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      season,
      year,
      deleteZip,
    }: {
      season: string;
      year: number;
      deleteZip?: boolean;
    }) => adminService.unarchiveSeason(season, year, deleteZip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'seasons'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'seasons'] });
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.config.admin });
      queryClient.invalidateQueries({ queryKey: ['admin', 'zips'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
};

// Helper functions
export const transformRatings = adminService.transformRatings;

