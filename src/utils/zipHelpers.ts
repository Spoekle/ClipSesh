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
 * Upload a file in chunks to prevent timeouts and memory issues using native fetch
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
    const initRes = await fetch(`${apiUrl}/api/zips/init-chunked-upload`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        totalChunks: chunks,
        fileSize: file.size,
        uploadId,
        clipAmount,
        season,
        year: year.toString()
      })
    });

    if (!initRes.ok) {
      throw new Error(`Failed to initialize upload: ${initRes.statusText}`);
    }
    
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
          const chunkRes = await fetch(`${apiUrl}/api/zips/upload-chunk`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!chunkRes.ok) {
            throw new Error(`Failed chunk response: ${chunkRes.statusText}`);
          }
          
          chunkUploaded = true;
        } catch {
          if (attemptCount >= 3) {
            failedChunks.push(i);
          } else {
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
    const finalizeRes = await fetch(`${apiUrl}/api/zips/finalize-upload`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId,
        filename: file.name,
        clipAmount,
        season,
        year: year.toString()
      }),
      signal: AbortSignal.timeout(300000) // 5 minute timeout for finalization
    });

    if (!finalizeRes.ok) {
      throw new Error(`Failed to finalize upload: ${finalizeRes.statusText}`);
    }
    
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
