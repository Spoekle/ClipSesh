import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash, FaUpload, FaFile, FaSpinner, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import axios from 'axios';

const ZipManager = ({ zips, zipsLoading, deleteZip, zipFile, handleZipChange, clipAmount, handleClipAmountChange, handleZipSubmit, seasonInfo, apiUrl }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [yearInput, setYearInput] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState(seasonInfo.season || "Spring");
  const [uploadError, setUploadError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadId, setUploadId] = useState('');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Split file into chunks and upload each chunk with retry logic
  const uploadFileInChunks = async (file) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`Starting chunked upload of file: ${file.name} (${formatFileSize(file.size)})`);
      
      // Create a unique ID for this upload
      const newUploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      setUploadId(newUploadId);
      
      // Configure chunk size - 5MB is a good balance
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const chunks = Math.ceil(file.size / chunkSize);
      setTotalChunks(chunks);
      console.log(`File will be split into ${chunks} chunks of ${formatFileSize(chunkSize)} each`);
      
      // Initialize the upload by telling the server we're starting
      try {
        await axios.post(`${apiUrl}/api/zips/init-chunked-upload`, {
          filename: file.name,
          totalChunks: chunks,
          fileSize: file.size,
          uploadId: newUploadId,
          clipAmount,
          season: selectedSeason,
          year: yearInput.toString()
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log("Upload session initialized successfully");
      } catch (initError) {
        console.error("Failed to initialize upload:", initError);
        throw new Error(`Failed to initialize upload: ${initError.message}`);
      }
      
      // Track failed chunks for retry
      const failedChunks = [];
      
      // Upload each chunk with retry capability
      for (let i = 0; i < chunks; i++) {
        setCurrentChunk(i + 1);
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk, `chunk-${i}`); // Add a name to the file
        formData.append('uploadId', newUploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', chunks.toString());
        
        console.log(`Uploading chunk ${i+1}/${chunks} (${formatFileSize(chunk.size)})`);
        
        // Try up to 3 times for each chunk
        let chunkUploaded = false;
        let attemptCount = 0;
        
        while (!chunkUploaded && attemptCount < 3) {
          attemptCount++;
          try {
            const response = await axios.post(`${apiUrl}/api/zips/upload-chunk`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              },
              onUploadProgress: (progressEvent) => {
                // Calculate progress across all chunks
                const chunkProgress = progressEvent.loaded / progressEvent.total;
                const overallProgress = ((i + chunkProgress) / chunks) * 100;
                setUploadProgress(Math.min(Math.round(overallProgress), 99)); // Cap at 99% until complete
              }
            });
            
            chunkUploaded = true;
            console.log(`Chunk ${i+1}/${chunks} uploaded successfully:`, response.data);
          } catch (chunkError) {
            console.error(`Error uploading chunk ${i+1}/${chunks} (attempt ${attemptCount}/3):`, chunkError);
            
            if (attemptCount === 3) {
              failedChunks.push(i);
              console.error(`Failed to upload chunk ${i+1} after 3 attempts`);
            } else {
              // Wait before retry (exponential backoff)
              const delay = attemptCount * 2000;
              console.log(`Retrying chunk ${i+1} in ${delay/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // Update overall progress after chunk is complete
        const overallProgress = ((i + 1) / chunks) * 100;
        setUploadProgress(Math.min(Math.round(overallProgress), 99));
      }
      
      // Check if any chunks failed
      if (failedChunks.length > 0) {
        console.error(`${failedChunks.length} chunks failed to upload:`, failedChunks);
        throw new Error(`Failed to upload ${failedChunks.length} chunks. Please retry the upload.`);
      }
      
      // Tell the server we're done uploading chunks and it should reassemble the file
      console.log("All chunks uploaded, finalizing...");
      try {
        const finalizeResponse = await axios.post(`${apiUrl}/api/zips/finalize-upload`, {
          uploadId: newUploadId,
          filename: file.name,
          clipAmount,
          season: selectedSeason,
          year: yearInput.toString()
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minute timeout for finalization which may take time for large files
        });
        
        console.log('Upload completed and finalized successfully:', finalizeResponse.data);
        setUploadProgress(100);
        
        // Refresh the UI
        handleZipSubmit(null, true);
        setUploadError("");
        setRetryAttempt(0);
        return true;
      } catch (finalizeError) {
        console.error("Failed to finalize upload:", finalizeError);
        throw new Error(`Failed to finalize upload: ${finalizeError.message}`);
      }
    } catch (error) {
      console.error('Chunked upload failed:', error);
      
      let errorMessage = "Upload failed";
      if (error.response) {
        // Server responded with a non-2xx status
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
          // If there's additional path information, include it
          if (error.response.data.path) {
            errorMessage += ` (Path: ${error.response.data.path})`;
          }
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request made but no response received
        errorMessage = "No response from server. The upload may still be processing in the background.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(`${errorMessage} (Attempt: ${retryAttempt + 1}, Chunk: ${currentChunk}/${totalChunks})`);
      throw new Error(errorMessage);
    }
  };

  // Enhanced submit handler using chunked upload
  const submitWithProgress = async (e) => {
    e.preventDefault();
    if (!zipFile || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setCurrentChunk(0);
    setTotalChunks(0);
    
    try {
      // Use the chunked upload method instead of the old one
      await uploadFileInChunks(zipFile);
    } catch (error) {
      console.error('Upload process failed:', error);
      setRetryAttempt(prev => prev + 1);
    } finally {
      setIsUploading(false);
    }
  };
  
  const retryUpload = () => {
    if (zipFile && !isUploading) {
      submitWithProgress({ preventDefault: () => {} });
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Upload Zip Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
          <FaUpload className="mr-3 text-green-500" /> 
          Upload Clips
        </h2>
        <form onSubmit={submitWithProgress} className="space-y-5">
          <div className="bg-neutral-200 dark:bg-neutral-700 p-5 rounded-lg">
            <label htmlFor="zip" className="flex flex-col items-center justify-center w-full h-32 px-4 transition border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaUpload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ZIP file containing clips (MAX 3GB)
                </p>
              </div>
              <input
                type="file"
                id="zip"
                name="zip"
                onChange={handleZipChange}
                accept=".zip"
                className="hidden"
              />
            </label>
            {zipFile && (
              <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-600 rounded flex items-center">
                <FaFile className="mr-2 text-blue-500" />
                <span className="text-sm">{zipFile.name}</span>
                <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(zipFile.size)}
                </span>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
                {uploadProgress}% uploaded
                {totalChunks > 0 && (
                  <span className="ml-2">
                    (Chunk {currentChunk}/{totalChunks})
                  </span>
                )}
                <span className="block text-xs mt-1 italic">Please keep the page open...</span>
              </p>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{uploadError}</p>
                  <p className="text-xs mt-1">The server may still be processing your file. You can try refreshing the page in a few minutes.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={retryUpload}
                className="mt-2 px-3 py-1.5 bg-red-200 dark:bg-red-800 rounded flex items-center text-xs font-medium"
              >
                <FaRedo className="mr-1" /> Retry Upload
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="clipAmount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Number of Clips:
              </label>
              <input
                type="number"
                id="clipAmount"
                name="clipAmount"
                value={clipAmount}
                onChange={handleClipAmountChange}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the number of clips"
                min="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="year" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Year:
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={yearInput}
                onChange={(e) => setYearInput(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter year"
                min="2000"
                max="2100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="season" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Season:
            </label>
            <select
              id="season"
              name="season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Current Season: <span className="font-medium">{seasonInfo.season}</span>
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!zipFile || isUploading}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition duration-200 ${
              !zipFile || isUploading
                ? 'bg-neutral-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUploading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Uploading...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" /> Upload Zip
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Available Zips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
          <FaDownload className="mr-3 text-blue-500" /> 
          Available Packages
        </h2>
        
        {zipsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400">Loading zip archives...</p>
          </div>
        ) : zips.length === 0 ? (
          <div className="text-center py-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <FaFile className="mx-auto text-4xl text-neutral-500 mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400 text-lg font-medium">No packages available</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Processed zip files will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {zips.map((zip, index) => (
              <motion.div 
                key={zip._id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1 flex items-center">
                        <span className="capitalize">{zip.season} {zip.year}</span>
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                          {zip.clipAmount} clips
                        </span>
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {zip.name}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="mr-3">{formatFileSize(zip.size)}</span>
                        <span>{formatDate(zip.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => saveAs(zip.url, zip.name)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition duration-200"
                        title="Download"
                      >
                        <FaDownload />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteZip(zip._id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition duration-200"
                        title="Delete"
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ZipManager;
