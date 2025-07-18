import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as discordService from '../services/discordService';

// Hook for linking Discord account (this doesn't need to be a mutation since it's a redirect)
export const useLinkDiscordAccount = () => {
  return (userId: string) => {
    discordService.linkDiscordAccount(userId);
  };
};

// Mutation for unlinking Discord account
export const useUnlinkDiscordAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => discordService.unlinkDiscordAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
    },
  });
};
