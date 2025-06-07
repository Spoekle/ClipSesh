import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUpload, FaCheck, FaSpinner, FaLink, FaFileVideo, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import apiUrl from '../../../../config/config';
import { useNotification } from '../../../../context/NotificationContext';

interface UploadClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

interface VideoInfo {
  title: string;
  author: string;
  platform: string;
}

const UploadClipModal: React.FC<UploadClipModalProps> = ({ isOpen, onClose, onSuccess, token }) => {
  const [title, setTitle] = useState('');
  const [streamer, setStreamer] = useState('');
  const [link, setLink] = useState(''); 
  const [submitter, setSubmitter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotification();
  const [file, setFile] = useState<File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  // Debounce timer for URL fetching
  const [urlDebounceTimer, setUrlDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      const fileType = selectedFile.type;
      if (!fileType.includes('video/')) {
        showError('Please select a valid video file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Check file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (selectedFile.size > maxSize) {
        showError('File size exceeds 100MB limit. Please select a smaller file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setFile(selectedFile);
      
      // Switch to file upload method if a file is selected
      setUploadMethod('file');
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setLink(newLink);
    
    // Switch to link upload method if user enters a URL
    if (newLink) {
      setUploadMethod('link');
      
      // Clear any existing debounce timer
      if (urlDebounceTimer) {
        clearTimeout(urlDebounceTimer);
      }
      
      // Fetch info for supported video URLs
      if (newLink.includes('youtube.com') || newLink.includes('youtu.be') || 
          newLink.includes('twitch.tv') || newLink.includes('medal.tv') ||
          newLink.includes('kick.com') || newLink.includes('tiktok.com') ||
          /\.(mp4|webm|mov)$/i.test(newLink)) {
        
        // Set a new debounce timer to fetch video info after 800ms of no typing
        const timer = setTimeout(() => {
          fetchVideoInfo(newLink);
        }, 800);
        
        setUrlDebounceTimer(timer);
      } else {
        setVideoInfo(null);
      }
    } else {
      setVideoInfo(null);
    }
  };

  const fetchVideoInfo = async (url: string) => {
    try {
      setFetchingInfo(true);
      const response = await axios.get(`${apiUrl}/api/clips/info`, {
        params: { url },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const info = response.data;
      setVideoInfo(info);
      
      // Auto-fill title and streamer if they're empty
      if (!title && info.title) {
        setTitle(info.title);
      }
      
      if (!streamer && info.author) {
        setStreamer(info.author);
      }
      
    } catch (error) {
      console.error('Error fetching video info:', error);
      setVideoInfo(null);
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !streamer || !submitter) {
      showError('Please fill in all required fields: Title, Streamer, and Submitter.');
      return;
    }

    if (uploadMethod === 'file' && !file) {
      showError('Please select a video file to upload.');
      return;
    }

    if (uploadMethod === 'link' && !link) {
      showError('Please enter a video link from YouTube, Twitch, or another platform.');
      return;
    }
    
    try {
      setUploading(true);
      
      if (uploadMethod === 'file' && file) {
        // File upload
        const formData = new FormData();
        formData.append('clip', file);
        formData.append('title', title);
        formData.append('streamer', streamer);
        formData.append('submitter', submitter);
        
        await axios.post(
          `${apiUrl}/api/clips`, 
          formData, 
          {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
              setFileUploadProgress(percentCompleted);
            }
          }
        );
      } else {
        // Link-based upload
        const clipData = {
          title,
          streamer,
          submitter,
          link,
        };
        
        await axios.post(
          `${apiUrl}/api/clips`, 
          clipData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      showSuccess('Clip uploaded successfully!');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading clip:', error);
      showError('Failed to upload clip. Please try again.');
    } finally {
      setUploading(false);
      setFileUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle('');
    setStreamer('');
    setLink('');
    setSubmitter('');
    setFile(null);
    setFileUploadProgress(0);
    setUploadMethod('file');
    setVideoInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer);
    }
  };

  // Cleanup effect to clear the debounce timer when component unmounts
  useEffect(() => {
    return () => {
      if (urlDebounceTimer) {
        clearTimeout(urlDebounceTimer);
      }
    };
  }, [urlDebounceTimer]);

  const renderUploadMethodButtons = () => {
    return (
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setUploadMethod('file')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              uploadMethod === 'file' 
                ? 'bg-blue-500 text-white' 
                : 'bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
            } flex items-center`}
            disabled={uploading}
          >
            <FaFileVideo className="mr-2" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('link')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              uploadMethod === 'link' 
                ? 'bg-blue-500 text-white' 
                : 'bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
            } flex items-center`}
            disabled={uploading}
          >
            <FaLink className="mr-2" /> Use Link
          </button>
        </div>
      </div>
    );
  };

  // Render video info preview when available
  const renderVideoInfoPreview = () => {
    if (!videoInfo) return null;
    
    return (
      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
        <div className="flex items-start mb-2">
          <FaInfoCircle className="text-blue-500 mr-2 mt-1" />
          <div>
            <p className="font-medium">Video Information Retrieved:</p>
            <p className="mt-1"><span className="font-medium">Title:</span> {videoInfo.title}</p>
            <p><span className="font-medium">Creator:</span> {videoInfo.author}</p>
            <p><span className="font-medium">Platform:</span> {videoInfo.platform}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={!uploading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-neutral-200 dark:bg-neutral-800 rounded-xl p-6 shadow-xl w-full max-w-lg mx-4 z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
                <FaUpload className="mr-2 text-blue-500" /> Upload Clip
              </h2>
              {!uploading && (
                <button
                  onClick={onClose}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <FaTimes size={20} />
                </button>
              )}
            </div>

            <div className="text-neutral-800 dark:text-neutral-200">
              {renderUploadMethodButtons()}

              <form onSubmit={handleSubmit} className="space-y-4">
                {uploadMethod === 'link' && (
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      Video Link *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={link}
                        onChange={handleLinkChange}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="YouTube, Twitch, or other video platform URL"
                        disabled={uploading}
                        required={uploadMethod === 'link'}
                      />
                      {fetchingInfo && (
                        <div className="absolute right-3 top-2">
                          <FaSpinner className="animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Supported: YouTube videos, basic info for Twitch/Medal.tv/Kick/TikTok, and direct video links (.mp4, .webm, .mov). Note: Only YouTube and direct video files can be downloaded automatically.
                    </p>
                    {renderVideoInfoPreview()}
                  </div>
                )}

                {uploadMethod === 'file' && (
                  <div>
                    <label className="block mb-2 text-sm font-medium">Video File *</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-3 file:py-2 file:px-4
                      file:rounded-md file:border-0 file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-600 dark:file:bg-neutral-700 dark:file:text-blue-400
                      hover:file:bg-blue-100 dark:hover:file:bg-neutral-600"
                      accept="video/*"
                      disabled={uploading}
                      required={uploadMethod === 'file'}
                    />
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Max size: 100MB. Supported formats: MP4, WebM, MOV
                    </p>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter clip title"
                    required
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Streamer *</label>
                  <input
                    type="text"
                    value={streamer}
                    onChange={(e) => setStreamer(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter streamer name"
                    required
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Submitter *</label>
                  <input
                    type="text"
                    value={submitter}
                    onChange={(e) => setSubmitter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter submitter name"
                    required
                    disabled={uploading}
                  />
                </div>

                {uploading && fileUploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{fileUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-300 dark:bg-neutral-700 rounded-full h-2.5">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${fileUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="px-4 py-2 bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="mr-2 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" /> Upload Clip
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadClipModal;