import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as configService from '../services/configService';

// Hook for fetching public configuration
export const usePublicConfig = () => {
  return useQuery({
    queryKey: ['config', 'public'],
    queryFn: () => configService.getPublicConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching admin configuration
export const useAdminConfig = () => {
  return useQuery({
    queryKey: queryKeys.config.admin,
    queryFn: () => configService.getAdminConfig(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching combined configuration
export const useCombinedConfig = (user?: any) => {
  return useQuery({
    queryKey: queryKeys.config.combined(user),
    queryFn: () => configService.getCombinedConfig(user),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching unified config
export const useConfig = () => {
  return useQuery({
    queryKey: ['config', 'unified'],
    queryFn: () => configService.getConfig(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
