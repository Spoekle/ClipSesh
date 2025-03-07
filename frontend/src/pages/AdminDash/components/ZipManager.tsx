import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaExclamationTriangle, FaFileArchive } from 'react-icons/fa';
import axios from 'axios';
import apiUrl from '../../../config/config';
import { useNotification } from '../../../context/NotificationContext';

// New constants for file size limit (2GB)
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes
const MAX_FILE_SIZE_DISPLAY = '2GB';

interface ZipManagerProps {
  fetchZips: () => void;
}

const ZipManager: React.FC<ZipManagerProps> = ({ fetchZips }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    // New state for season selection
    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showSuccess, showError, showWarning } = useNotification();

    // Determine current season for default value
    const getCurrentSeason = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 20)) {
            return 'Spring';
        } else if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 20)) {
            return 'Summer';
        } else if ((month === 9 && day >= 21) || (month > 9 && month < 12) || (month === 12 && day <= 20)) {
            return 'Fall';
        } else {
            return 'Winter';
        }
    };

    // Set default season when component mounts
    useEffect(() => {
        setSelectedSeason(getCurrentSeason());
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        
        if (!selectedFile) return;
        
        // Validate file size (2GB limit)
        if (selectedFile.size > MAX_FILE_SIZE) {
            showError(`File is too large. Maximum size is ${MAX_FILE_SIZE_DISPLAY}.`);
            e.target.value = '';
            return;
        }
        
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            showWarning('Please select a file to upload.');
            return;
        }

        if (!selectedSeason) {
            showWarning('Please select a season.');
            return;
        }

        // Double-check file size before uploading
        if (file.size > MAX_FILE_SIZE) {
            showError(`File is too large. Maximum size is ${MAX_FILE_SIZE_DISPLAY}.`);
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('zipFile', file);
        // Add the season to the form data
        formData.append('season', selectedSeason);

        try {
            await axios.post(`${apiUrl}/api/zips/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            showSuccess('Zip file uploaded successfully!');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            fetchZips();
        } catch (error: any) {
            console.error('Error uploading zip:', error);
            showError(error.response?.data?.message || 'Failed to upload zip file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl mt-6"
        >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
                <FaFileArchive className="mr-3 text-blue-500" />
                Upload Zip Archive
            </h2>

            <div className="space-y-6">
                {/* Season selection dropdown */}
                <div>
                    <label className="block text-sm font-medium mb-2">Select Season:</label>
                    <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="w-full p-3 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    >
                        <option value="">-- Select Season --</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Fall">Fall</option>
                        <option value="Winter">Winter</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-2">
                        Upload Zip File <span className="text-gray-500 dark:text-gray-400">(Max {MAX_FILE_SIZE_DISPLAY})</span>:
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".zip"
                        className="hidden"
                        id="zip-file-input"
                        disabled={loading}
                    />
                    <label
                        htmlFor="zip-file-input"
                        className={`cursor-pointer p-4 border-2 border-dashed border-neutral-400 dark:border-neutral-600 rounded-lg flex flex-col items-center justify-center transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 dark:hover:border-blue-400'}`}
                    >
                        <FaUpload size={32} className="mb-2 text-neutral-500 dark:text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-300">
                            {file ? file.name : 'Click to select a zip file'}
                        </span>
                        {file && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                        )}
                    </label>
                </div>

                {/* File size warning */}
                <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                    <FaExclamationTriangle className="flex-shrink-0 mt-1" />
                    <p>
                        Maximum upload size is {MAX_FILE_SIZE_DISPLAY}. Larger files will be rejected.
                        Make sure your zip file contains only clip files that have been processed.
                    </p>
                </div>

                {loading && (
                    <div className="mt-4">
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-center mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            Uploading: {uploadProgress}%
                        </p>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || loading || !selectedSeason}
                    className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${!file || !selectedSeason ? 'bg-neutral-400 dark:bg-neutral-600 text-neutral-100 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <FaUpload className="mr-2" /> Upload Zip Archive
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default ZipManager;
