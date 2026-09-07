import { saveAs } from 'file-saver';

export interface DownloadProgressCallback {
  (progress: number): void;
}

export interface DownloadOptions {
  url: string;
  filename?: string;
  onProgress?: DownloadProgressCallback;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Downloads a file with progress tracking
 * @param options Download options including URL, filename, and progress callbacks
 * @returns Promise that resolves when download is complete
 */
export const downloadWithProgress = async (options: DownloadOptions): Promise<void> => {
  const { url, filename, onProgress, onStart, onComplete, onError } = options;

  try {
    // Notify that download is starting
    onStart?.();

    // Start the fetch request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    // Get the total size from headers
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Read the response as a stream
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    // Read chunks and track progress
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;

      // Calculate and report progress
      if (totalSize > 0 && onProgress) {
        const progress = Math.round((receivedLength / totalSize) * 100);
        onProgress(progress);
      }
    }

    // If we don't know the total size, set progress to 100% when done
    if (totalSize === 0 && onProgress) {
      onProgress(100);
    }

    // Combine all chunks into a single array
    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    // Create blob and trigger download
    const blob = new Blob([allChunks]);
    
    // Extract filename from URL if not provided
    let downloadFilename = filename;
    if (!downloadFilename) {
      const urlParts = url.split('/');
      downloadFilename = urlParts[urlParts.length - 1] || 'download';
    }

    // Use file-saver to trigger the download
    saveAs(blob, downloadFilename);

    // Notify completion
    onComplete?.();

  } catch (error) {
    const downloadError = error instanceof Error ? error : new Error('Unknown download error');
    onError?.(downloadError);
    throw downloadError;
  }
};

/**
 * Formats bytes to human readable format
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};