import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import { toast } from 'react-hot-toast';

// Types for optimistic updates
interface OptimisticUpdateConfig<TData, TVariables> {
  queryKey: readonly unknown[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  onOptimisticUpdate?: (oldData: any, variables: TVariables) => any;
  onSuccessUpdate?: (data: TData, variables: TVariables, oldData: any) => any;
  onErrorUpdate?: (error: Error, variables: TVariables, oldData: any) => any;
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: readonly (readonly unknown[])[];
}

// Generic optimistic update hook
export const useOptimisticUpdate = <TData, TVariables>({
  queryKey,
  mutationFn,
  onOptimisticUpdate,
  onSuccessUpdate,
  onErrorUpdate,
  successMessage,
  errorMessage,
  invalidateQueries = [],
}: OptimisticUpdateConfig<TData, TVariables>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      if (onOptimisticUpdate && previousData) {
        const optimisticData = onOptimisticUpdate(previousData, variables);
        queryClient.setQueryData(queryKey, optimisticData);
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onSuccess: (data, variables, context) => {
      // Apply success update if provided
      if (onSuccessUpdate && context?.previousData) {
        const updatedData = onSuccessUpdate(data, variables, context.previousData);
        queryClient.setQueryData(queryKey, updatedData);
      }

      // Invalidate and refetch queries
      invalidateQueries.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Show success message
      if (successMessage) {
        toast.success(successMessage);
      }
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Apply error update if provided
      if (onErrorUpdate && context?.previousData) {
        const errorData = onErrorUpdate(error as Error, variables, context.previousData);
        queryClient.setQueryData(queryKey, errorData);
      }

      // Show error message
      const message = errorMessage || (error as Error).message || 'An error occurred';
      toast.error(message);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

// Optimistic rating update
export const useOptimisticRating = () => {
  return useOptimisticUpdate({
    queryKey: queryKeys.ratings.all,
    mutationFn: async ({ clipId, rating }: { clipId: string; rating: number }) => {
      const response = await fetch(`/api/clips/${clipId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error('Failed to update rating');
      return response.json();
    },
    onOptimisticUpdate: (oldData: any, variables) => {
      // Update the specific clip's rating optimistically
      if (Array.isArray(oldData)) {
        return oldData.map(item => 
          item.clipId === variables.clipId 
            ? { ...item, userRating: variables.rating, optimistic: true }
            : item
        );
      }
      return oldData;
    },
    onSuccessUpdate: (data, variables, oldData) => {
      // Replace optimistic data with real data
      if (Array.isArray(oldData)) {
        return oldData.map(item => 
          item.clipId === variables.clipId 
            ? { ...data, optimistic: false }
            : item
        );
      }
      return data;
    },
    successMessage: 'Rating updated successfully!',
    errorMessage: 'Failed to update rating',
    invalidateQueries: [
      queryKeys.clips.all,
      queryKeys.ratings.all,
    ],
  });
};

// Optimistic clip voting
export const useOptimisticVoting = () => {
  return useOptimisticUpdate({
    queryKey: queryKeys.clips.all,
    mutationFn: async ({ clipId, voteType }: { clipId: string; voteType: 'up' | 'down' | 'remove' }) => {
      const response = await fetch(`/api/clips/${clipId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });
      if (!response.ok) throw new Error('Failed to vote');
      return response.json();
    },
    onOptimisticUpdate: (oldData: any, variables) => {
      if (Array.isArray(oldData)) {
        return oldData.map(clip => 
          clip.id === variables.clipId 
            ? { 
                ...clip, 
                userVote: variables.voteType === 'remove' ? null : variables.voteType,
                upvotes: variables.voteType === 'up' ? (clip.upvotes || 0) + 1 : 
                         variables.voteType === 'remove' && clip.userVote === 'up' ? (clip.upvotes || 0) - 1 : 
                         clip.upvotes || 0,
                downvotes: variables.voteType === 'down' ? (clip.downvotes || 0) + 1 : 
                          variables.voteType === 'remove' && clip.userVote === 'down' ? (clip.downvotes || 0) - 1 : 
                          clip.downvotes || 0,
                optimistic: true
              }
            : clip
        );
      }
      return oldData;
    },
    onSuccessUpdate: (data, variables, oldData) => {
      if (Array.isArray(oldData)) {
        return oldData.map(clip => 
          clip.id === variables.clipId 
            ? { ...data, optimistic: false }
            : clip
        );
      }
      return data;
    },
    invalidateQueries: [
      queryKeys.clips.all,
    ],
  });
};

// Optimistic notification mark as read
export const useOptimisticNotificationRead = () => {
  return useOptimisticUpdate({
    queryKey: queryKeys.notifications.all,
    mutationFn: async ({ notificationId }: { notificationId: string }) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onOptimisticUpdate: (oldData: any, variables) => {
      if (Array.isArray(oldData)) {
        return oldData.map(notification => 
          notification.id === variables.notificationId 
            ? { ...notification, read: true, optimistic: true }
            : notification
        );
      }
      return oldData;
    },
    onSuccessUpdate: (data, variables, oldData) => {
      if (Array.isArray(oldData)) {
        return oldData.map(notification => 
          notification.id === variables.notificationId 
            ? { ...data, optimistic: false }
            : notification
        );
      }
      return data;
    },
    invalidateQueries: [
      queryKeys.notifications.unread,
    ],
  });
};

// Optimistic clip deletion
export const useOptimisticClipDelete = () => {
  return useOptimisticUpdate({
    queryKey: queryKeys.clips.all,
    mutationFn: async ({ clipId }: { clipId: string }) => {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete clip');
      return { clipId };
    },
    onOptimisticUpdate: (oldData: any, variables) => {
      if (Array.isArray(oldData)) {
        return oldData.filter(clip => clip.id !== variables.clipId);
      }
      return oldData;
    },
    onErrorUpdate: (_error, _variables, oldData) => {
      // On error, we want to restore the deleted clip
      return oldData;
    },
    successMessage: 'Clip deleted successfully!',
    errorMessage: 'Failed to delete clip',
    invalidateQueries: [
      queryKeys.clips.all,
      queryKeys.ratings.all,
    ],
  });
};

// Optimistic user profile update
export const useOptimisticProfileUpdate = () => {
  return useOptimisticUpdate({
    queryKey: queryKeys.user.current,
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onOptimisticUpdate: (oldData: any, variables) => {
      return { ...oldData, ...variables, optimistic: true };
    },
    onSuccessUpdate: (data, _variables, _oldData) => {
      return { ...data, optimistic: false };
    },
    successMessage: 'Profile updated successfully!',
    errorMessage: 'Failed to update profile',
    invalidateQueries: [
      queryKeys.user.all,
    ],
  });
};

// Bulk optimistic updates utility
export const useBulkOptimisticUpdate = <TData, TVariables>(
  operations: Array<OptimisticUpdateConfig<TData, TVariables>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables[]) => {
      const results = await Promise.all(
        operations.map((op, index) => op.mutationFn(variables[index]))
      );
      return results;
    },
    onMutate: async (variables: TVariables[]) => {
      const contexts = await Promise.all(
        operations.map(async (op, index) => {
          await queryClient.cancelQueries({ queryKey: op.queryKey });
          const previousData = queryClient.getQueryData(op.queryKey);
          
          if (op.onOptimisticUpdate && previousData) {
            const optimisticData = op.onOptimisticUpdate(previousData, variables[index]);
            queryClient.setQueryData(op.queryKey, optimisticData);
          }
          
          return { previousData, operation: op };
        })
      );
      
      return { contexts };
    },
    onSuccess: (data, variables, context) => {
      context?.contexts.forEach(({ operation, previousData }, index) => {
        if (operation.onSuccessUpdate && previousData) {
          const updatedData = operation.onSuccessUpdate(data[index], variables[index], previousData);
          queryClient.setQueryData(operation.queryKey, updatedData);
        }
        
        operation.invalidateQueries?.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      });
      
      toast.success('Bulk operation completed successfully!');
    },
    onError: (_error, _variables, context) => {
      context?.contexts.forEach(({ operation, previousData }) => {
        if (previousData) {
          queryClient.setQueryData(operation.queryKey, previousData);
        }
      });
      
      toast.error('Bulk operation failed');
    },
    onSettled: (_data, _error, _variables, context) => {
      context?.contexts.forEach(({ operation }) => {
        queryClient.invalidateQueries({ queryKey: operation.queryKey });
      });
    },
  });
};
