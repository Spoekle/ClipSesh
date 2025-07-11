import axios from 'axios';
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
  TrophyCriteria,
  TrophyAssignmentResult,
  TrophyPreviewResult,
  AllTrophyPreviewResult,
  CustomCriteriaValidationResult
} from '../types/adminTypes';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * User Management
 */

// Fetch all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get<User[]>(`${backendUrl}/api/users`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
};

// Create a new user
export const createUser = async (userData: CreateUserFormData & { status: string }): Promise<void> => {
  try {
    await axios.post(`${backendUrl}/api/admin/create-user`, userData, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.response?.data?.message || 'Failed to create user');
  }
};

// Update user information
export const updateUser = async (userId: string, updateData: Partial<User>): Promise<void> => {
  try {
    await axios.put(`${backendUrl}/api/users/${userId}`, updateData, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

// Delete a user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await axios.delete(`${backendUrl}/api/users/${userId}`, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};

// Approve a user
export const approveUser = async (userId: string): Promise<void> => {
  try {
    await axios.post(`${backendUrl}/api/users/approve`, { userId }, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error approving user:', error);
    throw new Error(error.response?.data?.message || 'Failed to approve user');
  }
};

// Disable a user
export const disableUser = async (userId: string): Promise<void> => {
  try {
    await axios.post(`${backendUrl}/api/users/disable`, { userId }, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error disabling user:', error);
    throw new Error(error.response?.data?.message || 'Failed to disable user');
  }
};

// Change user password
export const changeUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    await axios.put(`${backendUrl}/api/users/${userId}/password`, { password: newPassword }, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error changing user password:', error);
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

/**
 * Configuration Management
 */

// Fetch configuration
export const getConfig = async (): Promise<ConfigResponse> => {
  try {
    const response = await axios.get<ConfigResponse>(`${backendUrl}/api/config`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching config:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch configuration');
  }
};

// Update configuration
export const updateConfig = async (config: AdminConfig): Promise<void> => {
  try {
    await axios.put(`${backendUrl}/api/admin/config`, config, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error updating config:', error);
    throw new Error(error.response?.data?.message || 'Failed to update configuration');
  }
};

// Update admin configuration specifically
export const updateAdminConfig = async (adminConfig: { denyThreshold: number; clipChannelIds: string[] }): Promise<void> => {
  try {
    await axios.put(`${backendUrl}/api/config/admin`, adminConfig, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error updating admin config:', error);
    throw new Error(error.response?.data?.message || 'Failed to update admin configuration');
  }
};

// Update public configuration specifically
export const updatePublicConfig = async (publicConfig: { latestVideoLink: string }): Promise<void> => {
  try {
    await axios.put(`${backendUrl}/api/config/public`, publicConfig, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error updating public config:', error);
    throw new Error(error.response?.data?.message || 'Failed to update public configuration');
  }
};

/**
 * Statistics
 */

// Fetch admin statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await axios.get<AdminStats>(`${backendUrl}/api/admin/stats`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
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
    const response = await axios.get(`${backendUrl}/api/clips`, {
      params: {
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeRatings: true,
        ...params
      },
      headers: getAuthHeaders()
    });

    // Process the response data
    let clipsData: Clip[] = [];
    let ratingsData: Record<string, Rating> = {};
    
    if (response.data) {
      // Check for clips in various response formats
      if (Array.isArray(response.data)) {
        clipsData = response.data;
      } else if (response.data.clips && Array.isArray(response.data.clips)) {
        clipsData = response.data.clips;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        clipsData = response.data.data;
      }
      
      // Check for included ratings in the response
      if (response.data.ratings && typeof response.data.ratings === 'object') {
        ratingsData = response.data.ratings;
      }
    }

    // If ratings weren't included, fetch them separately
    if (Object.keys(ratingsData).length === 0 && clipsData.length > 0) {
      const ratingPromises = clipsData.map(clip =>
        axios.get<Rating>(`${backendUrl}/api/ratings/${clip._id}`, { 
          headers: getAuthHeaders() 
        })
      );
      
      const ratingResponses = await Promise.all(ratingPromises);
      ratingsData = ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
        acc[clipsData[index]._id] = res.data;
        return acc;
      }, {});
    }

    return {
      clips: clipsData,
      ratings: ratingsData
    };
  } catch (error: any) {
    console.error('Error fetching clips and ratings:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch clips and ratings');
  }
};

// Delete all clips
export const deleteAllClips = async (): Promise<void> => {
  try {
    await axios.delete(`${backendUrl}/api/clips`, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error deleting all clips:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete all clips');
  }
};

/**
 * Zip Management
 */

// Fetch all zips
export const getZips = async (): Promise<Zip[]> => {
  try {
    const response = await axios.get<Zip[]>(`${backendUrl}/api/zips`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching zips:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch zips');
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

    await axios.post(`${backendUrl}/api/zips/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    });
  } catch (error: any) {
    console.error('Error uploading zip:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload zip file');
  }
};

// Delete a zip
export const deleteZip = async (zipId: string): Promise<void> => {
  try {
    await axios.delete(`${backendUrl}/api/zips/${zipId}`, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error deleting zip:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete zip');
  }
};

// Process clips
export const processClips = async (processData: ProcessClipsRequest): Promise<{ jobId: string }> => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/zips/process`,
      processData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error processing clips:', error);
    throw new Error(error.response?.data?.message || 'Failed to process clips');
  }
};

// Get process job status
export const getProcessStatus = async (jobId: string): Promise<ProcessJobStatus> => {
  try {
    const response = await axios.get<ProcessJobStatus>(
      `${backendUrl}/api/zips/process-status/${jobId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error getting process status:', error);
    throw new Error(error.response?.data?.message || 'Failed to get process status');
  }
};

// Force complete a stuck processing job
export const forceCompleteProcessJob = async (jobId: string): Promise<void> => {
  try {
    await axios.post(
      `${backendUrl}/api/zips/force-complete/${jobId}`,
      {},
      { headers: getAuthHeaders() }
    );
  } catch (error: any) {
    console.error('Error force completing job:', error);
    throw new Error(error.response?.data?.message || 'Failed to force complete job');
  }
};

/**
 * Trophy Management
 */

// Update user trophies
export const updateUserTrophies = async (
  userId: string, 
  trophies: Array<{ season: string; position: number }>
): Promise<void> => {
  try {
    await axios.put(`${backendUrl}/api/admin/users/${userId}/trophies`, { trophies }, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error updating user trophies:', error);
    throw new Error(error.response?.data?.message || 'Failed to update user trophies');
  }
};

// Clear all trophies for a season
export const clearSeasonTrophies = async (season: string, year: number): Promise<void> => {
  try {
    await axios.delete(`${backendUrl}/api/admin/trophies/${season}/${year}`, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error clearing season trophies:', error);
    throw new Error(error.response?.data?.message || 'Failed to clear season trophies');
  }
};

// Add or update trophy for a user
export const addOrUpdateTrophy = async (
  userId: string, 
  trophyData: { trophyName: string; description: string; season: string; year: number },
  trophyId?: string
): Promise<void> => {
  try {
    const url = trophyId 
      ? `${backendUrl}/api/admin/users/${userId}/trophies/${trophyId}`
      : `${backendUrl}/api/admin/users/${userId}/trophies`;
    
    const method = trophyId ? 'put' : 'post';
    
    await axios[method](url, trophyData, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error saving trophy:', error);
    throw new Error(error.response?.data?.message || 'Failed to save trophy');
  }
};

// Delete a trophy from a user
export const deleteTrophy = async (userId: string, trophyId: string): Promise<void> => {
  try {
    await axios.delete(`${backendUrl}/api/admin/users/${userId}/trophies/${trophyId}`, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error deleting trophy:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete trophy');
  }
};

// Fetch all trophy criteria
export const getTrophyCriteria = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/trophies/criteria`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching trophy criteria:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch trophy criteria');
  }
};

// Create trophy criteria
export const createTrophyCriteria = async (criteriaData: any) => {
  try {
    const response = await axios.post(`${backendUrl}/api/trophies/criteria`, criteriaData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating trophy criteria:', error);
    throw new Error(error.response?.data?.message || 'Failed to create trophy criteria');
  }
};

// Update trophy criteria
export const updateTrophyCriteria = async (id: string, criteriaData: any) => {
  try {
    const response = await axios.put(`${backendUrl}/api/trophies/criteria/${id}`, criteriaData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating trophy criteria:', error);
    throw new Error(error.response?.data?.message || 'Failed to update trophy criteria');
  }
};

// Delete trophy criteria
export const deleteTrophyCriteria = async (id: string) => {
  try {
    await axios.delete(`${backendUrl}/api/trophies/criteria/${id}`, {
      headers: getAuthHeaders()
    });
  } catch (error: any) {
    console.error('Error deleting trophy criteria:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete trophy criteria');
  }
};

// Get criteria types
export const getCriteriaTypes = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/trophies/criteria/types`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching criteria types:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch criteria types');
  }
};

// Assign trophies
export const assignTrophies = async (season: string, year: number) => {
  try {
    const response = await axios.post(`${backendUrl}/api/trophies/assign`, {
      season,
      year
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error assigning trophies:', error);
    throw new Error(error.response?.data?.message || 'Failed to assign trophies');
  }
};

// Preview trophy winners for specific criteria
export const previewTrophyWinners = async (criteriaId: string, season: string, year: number) => {
  try {
    const response = await axios.post(`${backendUrl}/api/trophies/preview-winners`, {
      criteriaId,
      season,
      year
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error previewing trophy winners:', error);
    throw new Error(error.response?.data?.message || 'Failed to preview trophy winners');
  }
};

// Preview winners for all active trophy criteria
export const previewAllTrophyWinners = async (season: string, year: number) => {
  try {
    const response = await axios.post(`${backendUrl}/api/trophies/preview-all`, {
      season,
      year
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error previewing all trophy winners:', error);
    throw new Error(error.response?.data?.message || 'Failed to preview all trophy winners');
  }
};

// Validate custom criteria
export const validateCustomCriteria = async (customCriteria: any, season: string, year: number) => {
  try {
    const response = await axios.post(`${backendUrl}/api/trophies/validate-criteria`, {
      customCriteria,
      season,
      year
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error validating custom criteria:', error);
    throw new Error(error.response?.data?.message || 'Failed to validate custom criteria');
  }
};

// Get custom criteria templates
export const getCustomCriteriaTemplates = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/trophies/custom-templates`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching custom criteria templates:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch custom criteria templates');
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
      // Transform from raw ratings format to structured format
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
      // Already in the correct format
      transformed[clipId] = ratingData;
    }
  });
  
  return transformed;
};
