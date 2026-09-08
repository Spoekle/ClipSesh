import { safeLocalStorage } from '@/utils/storage';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash, FaUpload, FaFileArchive, FaSpinner, FaExclamationTriangle, FaRedo, FaBoxOpen } from 'react-icons/fa';

import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { formatFileSize, formatDate } from '../../../utils/fileHelpers';
import { uploadFileInChunks } from '../../../utils/zipHelpers';
import { downloadWithProgress } from '../../../utils/downloadHelpers';
import { Zip, SeasonInfo } from '../../../types/adminTypes';

interface ZipManagerProps {
  zips: Zip[];
  zipsLoading: boolean;
  deleteZip: (id: string) => Promise<void>;
  zipFile: File | null;
  handleZipChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clipAmount: number;
  handleClipAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleZipSubmit: (e: React.FormEvent | null, refresh?: boolean) => Promise<void>;
  seasonInfo: SeasonInfo;
}

const ZipManager: React.FC<ZipManagerProps> = ({
  zips,
  zipsLoading,
  deleteZip,
  zipFile,
  handleZipChange,
  clipAmount,
  handleClipAmountChange,
  handleZipSubmit,
  seasonInfo
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [yearInput, setYearInput] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState(seasonInfo.season || "Spring");
  const [uploadError, setUploadError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [downloadStates, setDownloadStates] = useState<{
    [key: string]: {
      isDownloading: boolean;
      progress: number;
    };
  }>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zipToDelete, setZipToDelete] = useState<string | null>(null);
  const [selectedZipName, setSelectedZipName] = useState<string>("");

  const submitWithProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setCurrentChunk(0);
    setTotalChunks(0);
    try {
      const token = safeLocalStorage.getItem('token') || '';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

      const success = await uploadFileInChunks({
        file: zipFile,
        apiUrl: backendUrl,
        token,
        clipAmount,
        season: selectedSeason,
        year: yearInput,
        onProgressUpdate: (progress) => {
          setCurrentChunk(progress.currentChunk);
          setTotalChunks(progress.totalChunks);
          setUploadProgress(progress.uploadProgress);
        },
        onError: (error) => {
          setUploadError(`${error.message} (Attempt: ${retryAttempt + 1})`);
          setRetryAttempt((prev) => prev + 1);
        }
      });

      if (success) {
        await handleZipSubmit(null, true);
        setUploadError("");
        setRetryAttempt(0);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      setRetryAttempt((prev) => prev + 1);
    } finally {
      setIsUploading(false);
    }
  };

  const retryUpload = () => {
    if (zipFile && !isUploading) {
      submitWithProgress({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const handleDeleteClick = (zipId: string, zipName: string) => {
    setZipToDelete(zipId);
    setSelectedZipName(zipName);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (zipToDelete) {
      try {
        await deleteZip(zipToDelete);
        setShowDeleteConfirm(false);
        setZipToDelete(null);
        setSelectedZipName("");
      } catch (error) {
        console.error('Error deleting zip:', error);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setZipToDelete(null);
    setSelectedZipName("");
  };

  const handleDownload = async (zipId: string, url: string, filename: string) => {
    try {
      setDownloadStates((prev) => ({
        ...prev,
        [zipId]: { isDownloading: true, progress: 0 }
      }));

      await downloadWithProgress({
        url,
        filename,
        onProgress: (progressValue) => {
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: true, progress: progressValue }
          }));
        },
        onComplete: () => {
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 100 }
          }));

          setTimeout(() => {
            setDownloadStates((prev) => {
              const newState = { ...prev };
              delete newState[zipId];
              return newState;
            });
          }, 2000);
        },
        onError: (error) => {
          console.error('Download failed:', error);
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 0 }
          }));

          setTimeout(() => {
            setDownloadStates((prev) => {
              const newState = { ...prev };
              delete newState[zipId];
              return newState;
            });
          }, 2000);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete ZIP Archive"
        message={`Are you sure you want to delete "${selectedZipName}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Zip Form */}
        <div className="bg-[#181818] p-5 sm:p-6 rounded-xl border border-[#262626] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#262626]">
              <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-emerald-400">
                <FaUpload size={14} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Manual Archive Ingestion</h3>
                <p className="text-xs text-[#aaaaaa]">Upload raw submissions packaged into a single ZIP</p>
              </div>
            </div>

            <form onSubmit={submitWithProgress} className="space-y-4">
              <div className="bg-[#141414] p-3 rounded-xl border border-[#262626]">
                <label
                  htmlFor="zip"
                  className="flex flex-col items-center justify-center w-full h-28 px-4 transition border-2 border-[#262626] border-dashed rounded-xl cursor-pointer hover:bg-[#1a1a1a] hover:border-[#f23030]/50"
                >
                  <div className="flex flex-col items-center justify-center">
                    <FaUpload className="w-5 h-5 mb-1.5 text-[#aaaaaa]" />
                    <p className="text-xs text-[#f1f1f1]">
                      <span className="font-semibold text-[#f23030]">Click to choose file</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-[#717171] mt-0.5">
                      ZIP file containing clips (up to 3GB)
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
                  <div className="mt-3 p-2.5 bg-[#181818] border border-[#262626] rounded-lg flex items-center">
                    <FaFileArchive className="mr-2 text-[#f23030] text-sm shrink-0" />
                    <span className="text-xs font-medium text-white truncate">{zipFile.name}</span>
                    <span className="ml-auto text-[11px] text-[#aaaaaa] pl-2 shrink-0">
                      {formatFileSize(zipFile.size)}
                    </span>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="space-y-1.5 bg-[#141414] p-3 rounded-xl border border-[#262626]">
                  <div className="h-1.5 w-full bg-[#222222] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f23030] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#aaaaaa]">
                    <span>Uploading chunks ({currentChunk}/{totalChunks})...</span>
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
                    onClick={retryUpload}
                    className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-full flex items-center gap-1 font-semibold"
                  >
                    <FaRedo size={10} /> Retry
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="clipAmount" className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                    Clip Count:
                  </label>
                  <input
                    type="number"
                    id="clipAmount"
                    name="clipAmount"
                    value={clipAmount}
                    onChange={handleClipAmountChange}
                    className="bg-[#121212] border border-[#262626] text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-[#f23030]"
                    placeholder="Count"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="year" className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                    Season Year:
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={yearInput}
                    onChange={(e) => setYearInput(parseInt(e.target.value))}
                    className="bg-[#121212] border border-[#262626] text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-[#f23030]"
                    placeholder="Year"
                    min="2020"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="season" className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                  Season Cycle:
                </label>
                <select
                  id="season"
                  name="season"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-[#121212] border border-[#262626] text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-[#f23030]"
                  required
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!zipFile || isUploading}
                className="w-full py-2.5 px-4 bg-[#f23030] hover:bg-[#d92222] disabled:opacity-50 text-white font-semibold text-xs rounded-full flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isUploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Uploading File...</span>
                  </>
                ) : (
                  <>
                    <FaUpload />
                    <span>Upload ZIP Archive</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Available Zips */}
        <div className="bg-[#181818] p-5 sm:p-6 rounded-xl border border-[#262626] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#262626]">
              <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-sky-400">
                <FaDownload size={14} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Processed Packages</h3>
                <p className="text-xs text-[#aaaaaa]">Compiled ZIP files ready for editor download</p>
              </div>
            </div>

            {zipsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#aaaaaa]">
                <FaSpinner className="animate-spin text-2xl text-[#f23030] mb-2" />
                <p className="text-xs">Loading packages...</p>
              </div>
            ) : zips.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-[#262626] bg-[#141414] flex flex-col items-center justify-center">
                <FaBoxOpen className="text-3xl text-[#717171] mb-2" />
                <p className="text-sm font-bold text-white">No Packages Found</p>
                <p className="text-xs text-[#aaaaaa] mt-0.5">
                  Process approved submissions to generate an archive.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {zips.map((zip) => {
                  const isDownloading = downloadStates[zip._id]?.isDownloading;
                  const progress = downloadStates[zip._id]?.progress || 0;

                  return (
                    <div
                      key={zip._id}
                      className="bg-[#141414] rounded-xl p-3.5 border border-[#262626] hover:border-[#383838] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-white capitalize">
                            {zip.season} {zip.year}
                          </span>
                          <span className="px-2 py-0.5 bg-[#222222] text-[#f1f1f1] border border-[#333333] text-[10px] font-semibold rounded-full">
                            {zip.clipAmount} clips
                          </span>
                        </div>
                        <p className="text-xs text-[#aaaaaa] truncate">{zip.name}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-[#717171]">
                          <span>{formatFileSize(zip.size)}</span>
                          <span>{formatDate(zip.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDownload(zip._id, zip.url, zip.name)}
                          disabled={isDownloading}
                          className={`p-2.5 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                            isDownloading
                              ? 'bg-amber-500 text-white cursor-not-allowed'
                              : 'bg-[#222222] hover:bg-[#f23030] text-white border border-[#2e2e2e]'
                          }`}
                          title="Download Package"
                        >
                          {isDownloading ? (
                            <span className="text-[10px] flex items-center gap-1">
                              <FaSpinner className="animate-spin" size={10} />
                              {progress}%
                            </span>
                          ) : (
                            <FaDownload size={12} />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteClick(zip._id, zip.name)}
                          className="p-2.5 rounded-full text-xs bg-[#222222] hover:bg-rose-900/60 hover:text-rose-300 text-[#aaaaaa] border border-[#2e2e2e] transition-all"
                          title="Delete Package"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ZipManager;
