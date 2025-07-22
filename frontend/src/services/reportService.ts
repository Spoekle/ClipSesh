import axios from 'axios';
import { Report, ReportMessage } from '../types/adminTypes';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return { Authorization: `Bearer ${token}` };
};

/**
 * User Report Services (for users to access their own reports)
 */

// Get user's own reports
export const getUserReports = async (): Promise<Report[]> => {
  try {
    const response = await axios.get<Report[]>(`${backendUrl}/api/clips/reports/my`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user reports:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch reports');
  }
};

// Get messages for user's own report
export const getUserReportMessages = async (reportId: string): Promise<ReportMessage[]> => {
  try {
    const response = await axios.get<ReportMessage[]>(`${backendUrl}/api/clips/reports/${reportId}/messages`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching report messages:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch messages');
  }
};

// Send message to user's own report
export const sendUserReportMessage = async (reportId: string, message: string): Promise<ReportMessage> => {
  try {
    const response = await axios.post<ReportMessage>(`${backendUrl}/api/clips/reports/${reportId}/messages`, 
      { message }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error sending report message:', error);
    throw new Error(error.response?.data?.message || 'Failed to send message');
  }
};
