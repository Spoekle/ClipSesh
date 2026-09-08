// Main hooks exports for easy importing
// This file exports all the React Query hooks for the ClipSesh application

// User hooks
export * from './useUser';

// Profile hooks
export * from './useProfile';

// Clip hooks
export * from './useClips';

// Rating hooks
export * from './useRatings';

// Config hooks
export * from './useConfig';

// Notification hooks
export * from './useNotifications';

// Message hooks
export * from './useMessages';

// Discord hooks - explicit exports to avoid conflicts
export {
  useLinkDiscordAccount,
} from './useDiscord';

// Admin hooks - explicit exports to avoid conflicts
export {
  useAllUsers,
  useAdminStats,
  useZips,
  useProcessStatus,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useApproveUser,
  useDisableUser,
  useChangeUserPassword,
  useUpdateConfig,
  useUpdateAdminConfig,
  useUpdatePublicConfig,
  useDeleteAllClips,
  useUploadZip,
  useDeleteZip,
  useProcessClips,
  useForceCompleteProcessJob,
  transformRatings,
} from './useAdmin';

// Re-export React Query utilities
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
export { queryKeys, queryClient, invalidateQueries } from '../lib/react-query';

// Utility hooks
export { useOnlineStatus } from './useOnlineStatus';
