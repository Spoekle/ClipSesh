import React from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash, FaUpload, FaFile, FaSpinner } from 'react-icons/fa';
import { saveAs } from 'file-saver';

const ZipManager = ({ zips, zipsLoading, deleteZip, zipFile, handleZipChange, clipAmount, handleClipAmountChange, handleZipSubmit, seasonInfo }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <form onSubmit={handleZipSubmit} className="space-y-5">
          <div className="bg-neutral-200 dark:bg-neutral-700 p-5 rounded-lg">
            <label htmlFor="zip" className="flex flex-col items-center justify-center w-full h-32 px-4 transition border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaUpload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ZIP file containing clips (MAX 500MB)
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
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Current Season: <span className="font-medium">{seasonInfo.season}</span>
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!zipFile}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition duration-200 ${
              !zipFile 
                ? 'bg-neutral-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FaUpload className="mr-2" /> Upload Zip
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
                        <span className="capitalize">{zip.season}</span>
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
