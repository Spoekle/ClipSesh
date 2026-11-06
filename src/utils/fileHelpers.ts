/**
 * Format file size from bytes to human-readable format
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places to show
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a date string to a human-readable format
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Create a unique ID for use in uploads or temporary storage
 * 
 * @returns A unique string ID
 */
export const generateUniqueId = (): string => {
  return `uid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};
