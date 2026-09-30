import { safeLocalStorage } from '@/utils/storage';
import { apiClient, isAbortError } from '@/lib/apiClient';

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
    const data = await apiClient.get<PublicConfig>(`/api/config/public`);
    return data || {};
  } catch (error) {
    if (isAbortError(error)) {
      return {};
    }
    console.error('Error fetching public config:', error);
    throw new Error('Failed to fetch public configuration');
  }
};

/**
 * Get admin configuration (auth required)
 */
export const getAdminConfig = async (): Promise<Partial<AdminConfig>> => {
  try {
    const data = await apiClient.get<any>(`/api/admin/config`);
    if (Array.isArray(data)) return data[0] || {};
    if (data?.admin) return { ...data, ...data.admin };
    return data || {};
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
    const token = safeLocalStorage.getItem('token');
    if (
      token &&
      user &&
      (user.roles?.includes('admin') ||
        user.roles?.includes('clipteam') ||
        user.roles?.includes('editor'))
    ) {
      try {
        const adminConfig = await getAdminConfig();
        configData = {
          ...configData,
          ...adminConfig,
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
    return await apiClient.get<{ public: PublicConfig; admin?: AdminConfig }>(`/api/config`);
  } catch (error) {
    console.error('Error fetching config:', error);
    throw new Error('Failed to fetch configuration');
  }
};
