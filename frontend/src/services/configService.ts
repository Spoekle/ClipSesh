import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface PublicConfig {
  clipAmount?: number;
  [key: string]: any;
}

export interface AdminConfig {
  denyThreshold: number;
  allowedFileTypes: string[];
  clipAmount: number;
  itemsPerPage?: number;
  [key: string]: any;
}

/**
 * Get public configuration (no auth required)
 */
export const getPublicConfig = async (): Promise<PublicConfig> => {
  try {
    const response = await axios.get(`${backendUrl}/api/config/public`);
    return response.data || {};
  } catch (error) {
    console.error('Error fetching public config:', error);
    throw new Error('Failed to fetch public configuration');
  }
};

/**
 * Get admin configuration (auth required)
 */
export const getAdminConfig = async (): Promise<Partial<AdminConfig>> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/admin/config`, { headers });
    return response.data && response.data[0] ? response.data[0] : {};
  } catch (error) {
    console.error('Error fetching admin config:', error);
    throw new Error('Failed to fetch admin configuration');
  }
};

/**
 * Get combined configuration (public + admin if authorized)
 * This combines both public and admin configurations safely
 */
export const getCombinedConfig = async (user?: any): Promise<PublicConfig & Partial<AdminConfig>> => {
  const defaultConfig: PublicConfig = {};
  
  try {
    // Always fetch public config first
    let configData = await getPublicConfig();
    
    // Fetch admin config if user has appropriate roles
    const token = localStorage.getItem('token');
    if (token && user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      try {
        const adminConfig = await getAdminConfig();
        configData = {
          ...configData,
          ...adminConfig
        };
      } catch (error) {
        console.warn('Could not fetch admin config, using public config only');
      }
    }

    return configData;
  } catch {
    console.error('Error fetching combined config');
    return defaultConfig;
  }
};

/**
 * Get config (unified endpoint) - matches the EditorDash usage
 */
export const getConfig = async (): Promise<{ public: PublicConfig; admin?: AdminConfig }> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/config`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw new Error('Failed to fetch configuration');
  }
};
