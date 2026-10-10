'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArchive, FaUpload, FaTimes, FaExclamationTriangle, FaRedo, FaSpinner } from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { formatFileSize } from '@/utils/fileHelpers';
import { uploadFileInChunks } from '@/utils/zipHelpers';
import { safeLocalStorage } from '@/utils/storage';
import { Button } from '@/components/common/Button';

interface UploadZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultYear?: number;
  defaultSeason?: string;
}

export const UploadZipModal: React.FC<UploadZipModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultYear = new Date().getFullYear(),
  defaultSeason = 'Spring',
}) => {
  const { showSuccess } = useNotification();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadClipAmount, setUploadClipAmount] = useState<number>(0);
  const [uploadYear, setUploadYear] = useState<number>(defaultYear);
  const [uploadSeason, setUploadSeason] = useState<string>(defaultSeason);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);

  const resetState = () => {
    setUploadFile(null);
    setUploadClipAmount(0);
    setUploadError('');
    setRetryAttempt(0);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setCurrentChunk(0);
    setTotalChunks(0);

    try {
      const token = safeLocalStorage.getItem('token') ?? '';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';

      const success = await uploadFileInChunks({
        file: uploadFile,
        apiUrl: backendUrl,
        token,
        clipAmount: uploadClipAmount,
        season: uploadSeason,
        year: uploadYear,
        onProgressUpdate: (progress) => {
          setCurrentChunk(progress.currentChunk);
          setTotalChunks(progress.totalChunks);
          setUploadProgress(progress.uploadProgress);
        },
        onError: (error) => {
          setUploadError(`${error.message} (Attempt: ${retryAttempt + 1})`);
          setRetryAttempt((prev) => prev + 1);
        },
      });

      if (success) {
        showSuccess('Manual archive uploaded and registered successfully!');
        resetState();
        onSuccess();
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload archive';
      console.error('Upload failed:', error);
      setUploadError(message);
      setRetryAttempt((prev) => prev + 1);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg bg-cc-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-cc-ground">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FaUpload size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manual Archive Ingestion</h3>
                  <p className="text-xs text-muted-foreground">Upload raw submissions packaged into a single ZIP</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-cc-ground p-3 rounded-xl border border-border">
                <label
                  htmlFor="zip-upload-input"
                  className="flex flex-col items-center justify-center w-full h-28 px-4 transition border-2 border-border border-dashed rounded-xl cursor-pointer hover:bg-white/5 hover:border-primary/50"
                >
                  <div className="flex flex-col items-center justify-center">
                    <FaUpload className="w-5 h-5 mb-1.5 text-muted-foreground" />
                    <p className="text-xs text-foreground">
                      <span className="font-semibold text-primary">Click to choose file</span> or drag & drop
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">ZIP package containing clips (up to 3GB)</p>
                  </div>
                  <input
                    type="file"
                    id="zip-upload-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadFile(file);
                      }
                    }}
                    accept=".zip"
                    className="hidden"
                  />
                </label>

                {uploadFile && (
                  <div className="mt-3 p-2.5 bg-cc-card border border-border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaArchive className="text-primary text-sm shrink-0" />
                      <span className="text-xs font-medium text-white truncate">{uploadFile.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground pl-2 shrink-0 font-mono">
                      {formatFileSize(uploadFile.size)}
                    </span>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="space-y-1.5 bg-cc-ground p-3 rounded-xl border border-border">
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>Chunk {currentChunk} of {totalChunks}</span>
                    <span className="font-bold text-white">{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="mt-0.5 shrink-0" size={13} />
                    <p>{uploadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <FaRedo size={10} /> Retry
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Clip Count:
                  </label>
                  <input
                    type="number"
                    value={uploadClipAmount}
                    onChange={(e) => setUploadClipAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="bg-cc-ground border border-border text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-primary/50"
                    placeholder="e.g. 50"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Season Year:
                  </label>
                  <input
                    type="number"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                    className="bg-cc-ground border border-border text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-primary/50"
                    min="2020"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Season Cycle:
                </label>
                <select
                  value={uploadSeason}
                  onChange={(e) => setUploadSeason(e.target.value)}
                  className="bg-cc-ground border border-border text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-primary/50 cursor-pointer"
                  required
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="card"
                  size="sm"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!uploadFile}
                  isLoading={isUploading}
                  leftIcon={<FaUpload size={11} />}
                >
                  Ingest ZIP Archive
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadZipModal;
