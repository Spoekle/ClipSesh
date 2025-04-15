import axios from 'axios';
import { generateUniqueId } from './fileHelpers';

/**
 * Type for chunk upload progress tracking
 */
interface ChunkUploadProgress {
  currentChunk: number;
  totalChunks: number;
  uploadProgress: number;
}

/**
 * Options for the chunked upload function
 */
interface ChunkedUploadOptions {
  file: File;
  apiUrl: string;
  token: string;
  clipAmount: number;
  season: string;
  year: string | number;
  onProgressUpdate?: (progress: ChunkUploadProgress) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
}

/**
 * Upload a file in chunks to prevent timeouts and memory issues
 * 
 * @param options - Upload options including file and callbacks
 * @returns Promise resolving to success status
 */
export const uploadFileInChunks = async (options: ChunkedUploadOptions): Promise<boolean> => {
  const { 
    file, 
    apiUrl, 
    token,
    clipAmount,
    season, 
    year,
    onProgressUpdate,
    onError,
    chunkSize = 50 * 1024 * 1024 // Default to 50MB chunks
  } = options;
  
  const uploadId = generateUniqueId();
  const chunks = Math.ceil(file.size / chunkSize);
  
  try {
    // Initialize upload on the server
    await axios.post(`${apiUrl}/api/zips/init-chunked-upload`, {
      filename: file.name,
      totalChunks: chunks,
      fileSize: file.size,
      uploadId,
      clipAmount,
      season,
      year: year.toString()
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Track failed chunks for retry logic
    const failedChunks: number[] = [];
    
    // Upload each chunk with retry capability
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);
      
      // Update progress
      onProgressUpdate?.({
        currentChunk: i + 1,
        totalChunks: chunks,
        uploadProgress: Math.floor((i / chunks) * 100)
      });
      
      // Create FormData with fields first, then the file
      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', chunks.toString());
      formData.append('chunk', chunk, `chunk-${i}`);
      
      // Try up to 3 times for each chunk
      let chunkUploaded = false;
      let attemptCount = 0;
      
      while (!chunkUploaded && attemptCount < 3) {
        attemptCount++;
        try {
          await axios.post(`${apiUrl}/api/zips/upload-chunk`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const chunkProgress = progressEvent.loaded / (progressEvent.total || chunk.size);
              const overallProgress = Math.min(
                Math.round(((i + chunkProgress) / chunks) * 100),
                99 // Cap at 99% until fully complete
              );
              
              onProgressUpdate?.({
                currentChunk: i + 1,
                totalChunks: chunks,
                uploadProgress: overallProgress
              });
            }
          });
          
          chunkUploaded = true;
        } catch (error) {
          if (attemptCount >= 3) {
            failedChunks.push(i);
          } else {
            // Wait before retry with exponential backoff
            const delay = attemptCount * 2000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    
    // If any chunks failed, throw an error
    if (failedChunks.length > 0) {
      throw new Error(`Failed to upload ${failedChunks.length} chunks. Please retry.`);
    }
    
    // Finalize the upload
    await axios.post(`${apiUrl}/api/zips/finalize-upload`, {
      uploadId,
      filename: file.name,
      clipAmount,
      season,
      year: year.toString()
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minute timeout for finalization
    });
    
    // Signal 100% completion
    onProgressUpdate?.({
      currentChunk: chunks,
      totalChunks: chunks,
      uploadProgress: 100
    });
    
    return true;
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Unknown error during upload'));
    return false;
  }
};
