import { apiClient } from '@/lib/apiClient';
import { 
  User, 
  Clip, 
  Rating, 
  Zip, 
  CreateUserFormData, 
  AdminConfig, 
  AdminStats, 
  ConfigResponse, 
  ProcessClipsRequest, 
  ProcessJobStatus, 
  Report, 
  ReportResponse, 
  ReportUpdateRequest, 
  ReportMessage, 
  SendMessageRequest 
} from '../types/adminTypes';

/**
 * User Management
 */

// Fetch all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await apiClient.get<User[]>(`/api/users`);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
};

// Create a new user
export const createUser = async (userData: CreateUserFormData & { status: string }): Promise<void> => {
  try {
    await apiClient.post(`/api/admin/create-user`, userData);
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message || 'Failed to create user');
  }
};

// Update user information
export const updateUser = async (userId: string, updateData: Partial<User>): Promise<void> => {
  try {
    await apiClient.put(`/api/admin/users/${userId}`, updateData);
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};

// Delete a user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/users/${userId}`);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
};

// Approve a user
export const approveUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.post(`/api/users/approve`, { userId });
  } catch (error: any) {
    console.error('Error approving user:', error);
    throw new Error(error.message || 'Failed to approve user');
  }
};

// Disable a user
export const disableUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.post(`/api/users/disable`, { userId });
  } catch (error: any) {
    console.error('Error disabling user:', error);
    throw new Error(error.message || 'Failed to disable user');
  }
};

// Change user password
export const changeUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    await apiClient.put(`/api/users/${userId}/password`, { password: newPassword });
  } catch (error: any) {
    console.error('Error changing user password:', error);
    throw new Error(error.message || 'Failed to change password');
  }
};

/**
 * Configuration Management
 */

// Fetch configuration
export const getConfig = async (): Promise<ConfigResponse> => {
  try {
    return await apiClient.get<ConfigResponse>(`/api/config`);
  } catch (error: any) {
    console.error('Error fetching config:', error);
    throw new Error(error.message || 'Failed to fetch configuration');
  }
};

// Update configuration
export const updateConfig = async (config: AdminConfig): Promise<void> => {
  try {
    await apiClient.put(`/api/admin/config`, config);
  } catch (error: any) {
    console.error('Error updating config:', error);
    throw new Error(error.message || 'Failed to update configuration');
  }
};

// Update admin configuration specifically
export const updateAdminConfig = async (adminConfig: { 
  denyThreshold: number; 
  clipChannelIds: string[];
  blacklistedSubmitters?: Array<{username: string; userId: string}>;
  blacklistedStreamers?: string[];
}): Promise<void> => {
  try {
    await apiClient.put(`/api/config/admin`, adminConfig);
  } catch (error: any) {
    console.error('Error updating admin config:', error);
    throw new Error(error.message || 'Failed to update admin configuration');
  }
};

// Update public configuration specifically
export const updatePublicConfig = async (publicConfig: { latestVideoLink: string }): Promise<void> => {
  try {
    await apiClient.put(`/api/config/public`, publicConfig);
  } catch (error: any) {
    console.error('Error updating public config:', error);
    throw new Error(error.message || 'Failed to update public configuration');
  }
};

/**
 * Blacklist Management
 */

// Fetch blacklisted users with Discord info
export const getBlacklistedUsers = async (): Promise<{
  blacklistedSubmitters: Array<{
    id: string;
    username: string;
    discriminator?: string;
    global_name?: string;
    avatar?: string;
  }>;
  blacklistedStreamers: string[];
}> => {
  try {
    return await apiClient.get(`/api/admin/blacklisted-users`);
  } catch (error: any) {
    console.error('Error fetching blacklisted users:', error);
    throw new Error(error.message || 'Failed to fetch blacklisted users');
  }
};

/**
 * Statistics
 */

// Fetch admin statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    return await apiClient.get<AdminStats>(`/api/admin/stats`);
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    throw new Error(error.message || 'Failed to fetch statistics');
  }
};

/**
 * Clips Management
 */

// Fetch clips with ratings
export const getClipsWithRatings = async (params?: {
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  includeRatings?: boolean;
}): Promise<{ clips: Clip[]; ratings: Record<string, Rating> }> => {
  try {
    const data = await apiClient.get<any>(`/api/clips`, {
      params: {
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeRatings: true,
        ...params,
      },
    });

    let clipsData: Clip[] = [];
    let ratingsData: Record<string, Rating> = {};
    
    if (data) {
      if (Array.isArray(data)) {
        clipsData = data;
      } else if (data.clips && Array.isArray(data.clips)) {
        clipsData = data.clips;
      } else if (data.data && Array.isArray(data.data)) {
        clipsData = data.data;
      }
      
      if (data.ratings && typeof data.ratings === 'object') {
        ratingsData = data.ratings;
      }
    }

    if (Object.keys(ratingsData).length === 0 && clipsData.length > 0) {
      const ratingPromises = clipsData.map((clip) =>
        apiClient.get<Rating>(`/api/ratings/${clip._id}`)
      );
      const ratingResponses = await Promise.all(ratingPromises);
      ratingsData = ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
        acc[clipsData[index]._id] = res;
        return acc;
      }, {});
    }

    return {
      clips: clipsData,
      ratings: ratingsData,
    };
  } catch (error: any) {
    console.error('Error fetching clips and ratings:', error);
    throw new Error(error.message || 'Failed to fetch clips and ratings');
  }
};

/**
 * Zip Management
 */

// Fetch all zips
export const getZips = async (): Promise<Zip[]> => {
  try {
    return await apiClient.get<Zip[]>(`/api/zips`);
  } catch (error: any) {
    console.error('Error fetching zips:', error);
    throw new Error(error.message || 'Failed to fetch zips');
  }
};

// Upload zip file
export const uploadZip = async (
  zipFile: File, 
  clipAmount: number, 
  season: string
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('clipsZip', zipFile);
    formData.append('clipAmount', clipAmount.toString());
    formData.append('season', season);

    await apiClient.post(`/api/zips/upload`, formData, {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    });
  } catch (error: any) {
    console.error('Error uploading zip:', error);
    throw new Error(error.message || 'Failed to upload zip file');
  }
};

// Delete a zip
export const deleteZip = async (zipId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/zips/${zipId}`);
  } catch (error: any) {
    console.error('Error deleting zip:', error);
    throw new Error(error.message || 'Failed to delete zip');
  }
};

// Process clips
export const processClips = async (processData: ProcessClipsRequest): Promise<{ jobId: string }> => {
  try {
    return await apiClient.post<{ jobId: string }>(`/api/zips/process`, processData);
  } catch (error: any) {
    console.error('Error processing clips:', error);
    throw new Error(error.message || 'Failed to process clips');
  }
};

// Get process job status
export const getProcessStatus = async (jobId: string): Promise<ProcessJobStatus> => {
  try {
    return await apiClient.get<ProcessJobStatus>(`/api/zips/process-status/${jobId}`);
  } catch (error: any) {
    console.error('Error getting process status:', error);
    throw new Error(error.message || 'Failed to get process status');
  }
};

// Force complete a stuck processing job
export const forceCompleteProcessJob = async (jobId: string): Promise<void> => {
  try {
    await apiClient.post(`/api/zips/force-complete/${jobId}`, {});
  } catch (error: any) {
    console.error('Error force completing job:', error);
    throw new Error(error.message || 'Failed to force complete job');
  }
};

// Get all clip processing jobs (recent and active)
export const getAllProcessingJobs = async (): Promise<{ success: boolean; jobs: ProcessJobStatus[] }> => {
  try {
    return await apiClient.get<{ success: boolean; jobs: ProcessJobStatus[] }>(`/api/zips/process`);
  } catch (error: any) {
    console.error('Error getting all processing jobs:', error);
    throw new Error(error.message || 'Failed to get processing jobs');
  }
};

export const cancelProcessingJob = async (jobId: string): Promise<{ success: boolean; cancelled: boolean }> => {
  try {
    return await apiClient.delete<{ success: boolean; cancelled: boolean }>(`/api/zips/process`, {
      params: { jobId },
    });
  } catch (error: any) {
    console.error('Error cancelling processing job:', error);
    throw new Error(error.message || 'Failed to cancel job');
  }
};

export const dismissProcessJob = async (jobId: string): Promise<{ success: boolean; dismissed?: boolean }> => {
  try {
    return await apiClient.delete<{ success: boolean; dismissed?: boolean }>(`/api/zips/process`, {
      params: { jobId, action: 'dismiss' },
    });
  } catch (error: any) {
    console.error('Error dismissing processing job:', error);
    throw new Error(error.message || 'Failed to dismiss processing job');
  }
};


/**
 * Utility Functions
 */

// Transform ratings data to ensure consistent format
export const transformRatings = (ratings: Record<string, any>): Record<string, any> => {
  const transformed: Record<string, any> = {};
  
  Object.entries(ratings).forEach(([clipId, ratingData]) => {
    if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
      const ratingCounts = [
        { 
          rating: '1', 
          count: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'].length : 0,
          users: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'] : []
        },
        { 
          rating: '2', 
          count: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'].length : 0,
          users: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'] : []
        },
        { 
          rating: '3', 
          count: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'].length : 0,
          users: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'] : [] 
        },
        { 
          rating: '4', 
          count: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'].length : 0,
          users: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'] : []
        },
        { 
          rating: 'deny', 
          count: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'].length : 0,
          users: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'] : []
        }
      ];
      
      transformed[clipId] = {
        ...ratingData,
        ratingCounts: ratingCounts
      };
    } else {
      transformed[clipId] = ratingData;
    }
  });
  
  return transformed;
};

/**
 * Report Management
 */

// Get all reports
export const getReports = async (status?: string, page: number = 1, limit: number = 20): Promise<ReportResponse> => {
  try {
    return await apiClient.get<ReportResponse>(`/api/admin/reports`, {
      params: {
        status: status && status !== 'all' ? status : undefined,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    throw new Error(error.message || 'Failed to fetch reports');
  }
};

// Update report status
export const updateReport = async (reportId: string, updateData: ReportUpdateRequest): Promise<Report> => {
  try {
    return await apiClient.patch<Report>(`/api/admin/reports/${reportId}`, updateData);
  } catch (error: any) {
    console.error('Error updating report:', error);
    throw new Error(error.message || 'Failed to update report');
  }
};

// Delete report
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/admin/reports/${reportId}`);
  } catch (error: any) {
    console.error('Error deleting report:', error);
    throw new Error(error.message || 'Failed to delete report');
  }
};

/**
 * Report Messaging
 */

// Get messages for a report
export const getReportMessages = async (reportId: string): Promise<ReportMessage[]> => {
  try {
    return await apiClient.get<ReportMessage[]>(`/api/admin/reports/${reportId}/messages`);
  } catch (error: any) {
    console.error('Error fetching report messages:', error);
    throw new Error(error.message || 'Failed to fetch report messages');
  }
};

// Send message to a report
export const sendReportMessage = async (reportId: string, messageData: SendMessageRequest): Promise<ReportMessage> => {
  try {
    return await apiClient.post<ReportMessage>(`/api/admin/reports/${reportId}/messages`, messageData);
  } catch (error: any) {
    console.error('Error sending report message:', error);
    throw new Error(error.message || 'Failed to send message');
  }
};

// Delete a report message (admin only)
export const deleteReportMessage = async (reportId: string, messageId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/admin/reports/${reportId}/messages/${messageId}`);
  } catch (error: any) {
    console.error('Error deleting report message:', error);
    throw new Error(error.message || 'Failed to delete message');
  }
};

/**
 * Discord Channel Scraper
 */

export interface ScrapedClipItem {
  id: string;
  link: string;
  origin: 'youtube' | 'twitch' | 'medal' | 'direct_video';
  author: string;
  authorId?: string;
  timestamp: string;
  messageId: string;
  content?: string;
  title: string;
  streamer: string;
  season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  year: number;
  destinationFolder: string;
  alreadyExists: boolean;
}

export interface ChannelScanStatusResponse {
  success: boolean;
  jobId: string;
  channelId: string;
  status: 'scanning' | 'ready' | 'error';
  scannedMessages: number;
  foundClipsCount: number;
  error?: string;
  stats?: {
    totalMessages: number;
    totalClips: number;
    newClips: number;
    existingClips: number;
    origins: {
      youtube: number;
      twitch: number;
      medal: number;
      direct_video: number;
    };
    seasons: Record<string, number>;
  };
  clips?: ScrapedClipItem[];
  startTime: number;
  endTime?: number;
}

export interface ScraperDownloadStatusResponse {
  success: boolean;
  jobId: string;
  status: 'downloading' | 'completed' | 'error' | 'stopped';
  total: number;
  processed: number;
  currentClip?: string;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  startTime: number;
  endTime?: number;
  error?: string;
  logs: Array<{
    time: number;
    message: string;
    level: 'info' | 'success' | 'warn' | 'error';
  }>;
  results: Array<{
    link: string;
    title: string;
    season: string;
    year: number;
    status: 'saved' | 'skipped' | 'failed';
    error?: string;
  }>;
}

export const startChannelScan = async (channelId: string): Promise<{ success: boolean; jobId: string }> => {
  try {
    return await apiClient.post<{ success: boolean; jobId: string }>(`/api/admin/scraper/scan`, { channelId });
  } catch (error: any) {
    console.error('Error starting channel scan:', error);
    throw new Error(error.message || 'Failed to start channel scan');
  }
};

export const getChannelScanStatus = async (jobId: string): Promise<ChannelScanStatusResponse> => {
  try {
    return await apiClient.get<ChannelScanStatusResponse>(`/api/admin/scraper/scan/${jobId}`);
  } catch (error: any) {
    console.error('Error getting channel scan status:', error);
    throw new Error(error.message || 'Failed to get scan status');
  }
};

export const stopChannelScan = async (jobId: string): Promise<{ success: boolean; stopped: boolean }> => {
  try {
    return await apiClient.post<{ success: boolean; stopped: boolean }>(`/api/admin/scraper/scan/${jobId}`, {});
  } catch (error: any) {
    console.error('Error stopping channel scan:', error);
    throw new Error(error.message || 'Failed to stop channel scan');
  }
};

export const startScraperDownload = async (clips: ScrapedClipItem[]): Promise<{ success: boolean; jobId: string; total: number }> => {
  try {
    return await apiClient.post<{ success: boolean; jobId: string; total: number }>(`/api/admin/scraper/download`, { clips });
  } catch (error: any) {
    console.error('Error starting scraper download:', error);
    throw new Error(error.message || 'Failed to start download');
  }
};

export const getScraperDownloadStatus = async (jobId: string): Promise<ScraperDownloadStatusResponse> => {
  try {
    return await apiClient.get<ScraperDownloadStatusResponse>(`/api/admin/scraper/download/${jobId}`);
  } catch (error: any) {
    console.error('Error getting scraper download status:', error);
    throw new Error(error.message || 'Failed to get download status');
  }
};

export const stopScraperDownload = async (jobId: string): Promise<{ success: boolean; stopped: boolean }> => {
  try {
    return await apiClient.post<{ success: boolean; stopped: boolean }>(`/api/admin/scraper/download/${jobId}`, {});
  } catch (error: any) {
    console.error('Error stopping scraper download:', error);
    throw new Error(error.message || 'Failed to stop download');
  }
};

export const getAllScraperDownloads = async (): Promise<{ success: boolean; jobs: ScraperDownloadStatusResponse[] }> => {
  try {
    return await apiClient.get<{ success: boolean; jobs: ScraperDownloadStatusResponse[] }>(`/api/admin/scraper/download`);
  } catch (error: any) {
    console.error('Error getting all scraper downloads:', error);
    throw new Error(error.message || 'Failed to get downloads');
  }
};

export const dismissScraperDownload = async (jobId: string): Promise<{ success: boolean; dismissed?: boolean }> => {
  try {
    return await apiClient.delete<{ success: boolean; dismissed?: boolean }>(`/api/admin/scraper/download/${jobId}`);
  } catch (error: any) {
    console.error('Error dismissing scraper download:', error);
    throw new Error(error.message || 'Failed to dismiss download');
  }
};


/**
 * Seasonal Automation & Lifecycle
 */
export const getSeasonStatus = async (): Promise<{
  success: boolean;
  lifecycle: any;
  seasons?: any[];
  seasonAutomation: any;
}> => {
  try {
    return await apiClient.get(`/api/admin/seasons`);
  } catch (error: any) {
    console.error('Error fetching season status:', error);
    throw new Error(error.message || 'Failed to fetch season status');
  }
};

export const triggerSeasonAction = async (payload: {
  action: 'dry-run' | 'force-archive' | 'trigger-check' | 'unarchive';
  season?: string;
  year?: number;
  denyThreshold?: number;
  deleteZip?: boolean;
}): Promise<any> => {
  try {
    return await apiClient.post(`/api/admin/seasons`, payload);
  } catch (error: any) {
    console.error('Error triggering season action:', error);
    throw new Error(error.message || 'Failed to trigger season action');
  }
};

export const unarchiveSeason = async (
  season: string,
  year: number,
  deleteZip: boolean = false
): Promise<{
  success: boolean;
  season: string;
  year: number;
  unarchivedClipsCount: number;
  zipDeleted: boolean;
  message: string;
}> => {
  return await triggerSeasonAction({
    action: 'unarchive',
    season,
    year,
    deleteZip,
  });
};
