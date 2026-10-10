'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUpload, FaCheck, FaSpinner } from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { getVideoInfo, uploadClipFile, uploadClipLink } from '@/services/clipService';
import UploadMethodSelector from './upload/UploadMethodSelector';
import VideoLinkInput from './upload/VideoLinkInput';
import VideoFileInput from './upload/VideoFileInput';
import { Button } from '@/components/common/Button';

interface UploadClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VideoInfo {
  title: string;
  author: string;
  platform: string;
}

export const UploadClipModal: React.FC<UploadClipModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [streamer, setStreamer] = useState('');
  const [link, setLink] = useState('');
  const [submitter, setSubmitter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showSuccess, showError } = useNotification();
  const [file, setFile] = useState<File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const [urlDebounceTimer, setUrlDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.type.includes('video/')) {
        showError('Please select a valid video file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showError('File size exceeds 100MB limit. Please select a smaller file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setFile(selectedFile);
      setUploadMethod('file');
    }
  };

  const fetchVideoInfo = async (url: string) => {
    setFetchingInfo(true);
    try {
      const info = await getVideoInfo(url);
      setVideoInfo(info);
      if (info.title && !title) {
        setTitle(info.title);
      }
      if (info.author && !streamer) {
        setStreamer(info.author);
      }
    } catch {
      // Gracefully handle info fetch failure
      setVideoInfo(null);
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setLink(newLink);

    if (newLink) {
      setUploadMethod('link');

      if (urlDebounceTimer) {
        clearTimeout(urlDebounceTimer);
      }

      if (
        newLink.includes('youtube.com') ||
        newLink.includes('youtu.be') ||
        newLink.includes('twitch.tv') ||
        newLink.includes('medal.tv') ||
        newLink.includes('kick.com') ||
        newLink.includes('tiktok.com') ||
        /\.(mp4|webm|mov)$/i.test(newLink)
      ) {
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

  const resetForm = () => {
    setTitle('');
    setStreamer('');
    setLink('');
    setSubmitter('');
    setFile(null);
    setFileUploadProgress(0);
    setVideoInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !streamer.trim()) {
      showError('Please fill in all required fields.');
      return;
    }

    if (uploadMethod === 'file' && !file) {
      showError('Please select a video file to upload.');
      return;
    }

    if (uploadMethod === 'link' && !link.trim()) {
      showError('Please enter a video link.');
      return;
    }

    setUploading(true);

    try {
      if (uploadMethod === 'file' && file) {
        await uploadClipFile(
          file,
          title.trim(),
          streamer.trim(),
          submitter.trim(),
          (progress) => {
            setFileUploadProgress(progress);
          }
        );
      } else {
        await uploadClipLink(
          title.trim(),
          streamer.trim(),
          submitter.trim(),
          link.trim()
        );
      }

      showSuccess('Clip uploaded successfully!');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload clip. Please try again.';
      showError(message);
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            onClick={handleModalClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-cc-card rounded-2xl shadow-2xl w-full max-w-lg z-10 border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-border bg-cc-ground">
              <h2 className="text-lg font-bold text-white flex items-center">
                <div className="p-2 bg-primary/15 text-primary rounded-xl mr-3 border border-primary/30">
                  <FaUpload size={14} />
                </div>
                Upload Clip
              </h2>
              {!uploading && (
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="p-1.5 text-muted-foreground hover:text-white hover:bg-border/60 rounded-lg transition-colors cursor-pointer"
                >
                  <FaTimes size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 text-white max-h-[70vh] overflow-y-auto custom-scrollbar">
              <UploadMethodSelector
                uploadMethod={uploadMethod}
                setUploadMethod={setUploadMethod}
                disabled={uploading}
              />

              <form onSubmit={handleSubmit} className="space-y-4">
                {uploadMethod === 'link' && (
                  <VideoLinkInput
                    link={link}
                    onLinkChange={handleLinkChange}
                    fetchingInfo={fetchingInfo}
                    uploading={uploading}
                    videoInfo={videoInfo}
                  />
                )}

                {uploadMethod === 'file' && (
                  <VideoFileInput
                    fileInputRef={fileInputRef}
                    onFileChange={handleFileChange}
                    uploading={uploading}
                    fileUploadProgress={fileUploadProgress}
                  />
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium text-white/90">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cc-ground border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-white placeholder-muted-foreground focus:outline-none transition-colors"
                    placeholder="Enter clip title"
                    disabled={uploading}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-white/90">Streamer *</label>
                  <input
                    type="text"
                    value={streamer}
                    onChange={(e) => setStreamer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cc-ground border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-white placeholder-muted-foreground focus:outline-none transition-colors"
                    placeholder="Who was streaming?"
                    disabled={uploading}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-white/90">
                    Submitter <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={submitter}
                    onChange={(e) => setSubmitter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cc-ground border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-white placeholder-muted-foreground focus:outline-none transition-colors"
                    placeholder="Your name or handle"
                    disabled={uploading}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="card"
                    size="sm"
                    onClick={handleModalClose}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={uploading}
                    leftIcon={<FaCheck />}
                  >
                    Submit Clip
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default UploadClipModal;