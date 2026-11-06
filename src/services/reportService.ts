import { apiClient } from '@/lib/apiClient';
import { Report, ReportMessage } from '../types/adminTypes';

/**
 * User Report Services (for users to access their own reports)
 */

// Get user's own reports
export const getUserReports = async (): Promise<Report[]> => {
  try {
    return await apiClient.get<Report[]>(`/api/clips/reports/my`);
  } catch (error: any) {
    console.error('Error fetching user reports:', error);
    throw new Error(error.message || 'Failed to fetch reports');
  }
};

// Get messages for user's own report
export const getUserReportMessages = async (reportId: string): Promise<ReportMessage[]> => {
  try {
    return await apiClient.get<ReportMessage[]>(`/api/clips/reports/${reportId}/messages`);
  } catch (error: any) {
    console.error('Error fetching report messages:', error);
    throw new Error(error.message || 'Failed to fetch messages');
  }
};

// Send message to user's own report
export const sendUserReportMessage = async (reportId: string, message: string): Promise<ReportMessage> => {
  try {
    return await apiClient.post<ReportMessage>(`/api/clips/reports/${reportId}/messages`, { message });
  } catch (error: any) {
    console.error('Error sending report message:', error);
    throw new Error(error.message || 'Failed to send message');
  }
};
