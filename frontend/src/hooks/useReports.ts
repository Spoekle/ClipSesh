import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reportService from '../services/reportService';

// Hook for fetching user's own reports
export const useUserReports = () => {
  return useQuery({
    queryKey: ['user', 'reports'],
    queryFn: () => reportService.getUserReports(),
    enabled: Boolean(localStorage.getItem('token')),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching messages for user's own report
export const useUserReportMessages = (reportId: string) => {
  return useQuery({
    queryKey: ['user', 'reports', reportId, 'messages'],
    queryFn: () => reportService.getUserReportMessages(reportId),
    enabled: Boolean(localStorage.getItem('token') && reportId),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutation for sending message to user's own report
export const useSendUserReportMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reportId, message }: { reportId: string; message: string }) =>
      reportService.sendUserReportMessage(reportId, message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'reports', variables.reportId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'reports'] });
    },
  });
};
