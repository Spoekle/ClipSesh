import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as messageService from '../services/messageService';
import { SendMessageData } from '../services/messageService';

// Hook for fetching messages for a clip
export const useMessagesForClip = (clipId: string) => {
  return useQuery({
    queryKey: queryKeys.messages.list({ clipId }),
    queryFn: () => messageService.getMessagesForClip(clipId),
    enabled: Boolean(clipId && localStorage.getItem('token')),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutation for sending a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageData: SendMessageData) => messageService.sendMessage(messageData),
    onSuccess: (_, { clipId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list({ clipId }) });
    },
  });
};

// Mutation for deleting a message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, userId, roles }: { 
      messageId: string; 
      userId: string; 
      roles: string | string[];
    }) => messageService.deleteMessage(messageId, userId, roles),
    onSuccess: () => {
      // Invalidate all message queries since we don't have clipId here
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
};
