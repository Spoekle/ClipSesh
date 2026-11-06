'use client';

import React, { useState } from 'react';
import { Archive, Upload, AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';
import { useNotification } from '@/context/AlertContext';
import { formatFileSize } from '@/utils/fileHelpers';
import { uploadFileInChunks } from '@/utils/zipHelpers';
import { safeLocalStorage } from '@/utils/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-cc-ground flex flex-row items-center gap-3 space-y-0">
          <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Upload className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-bold text-white">Manual Archive Ingestion</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Upload raw submissions packaged into a single ZIP
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-cc-ground p-3 rounded-xl border border-border">
            <label
              htmlFor="zip-upload-input"
              className="flex flex-col items-center justify-center w-full h-28 px-4 transition border-2 border-border border-dashed rounded-xl cursor-pointer hover:bg-white/5 hover:border-primary/50"
            >
              <div className="flex flex-col items-center justify-center">
                <Upload className="size-5 mb-1.5 text-muted-foreground" />
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
                  <Archive className="size-4 text-primary shrink-0" />
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
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                <p>{uploadError}</p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={handleUploadSubmit}
                className="cursor-pointer gap-1"
              >
                <RotateCcw className="size-3" /> Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Clip Count:
              </Label>
              <Input
                type="number"
                value={uploadClipAmount}
                onChange={(e) => setUploadClipAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="bg-cc-ground border-border text-white text-xs"
                placeholder="e.g. 50"
                min="0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Season Year:
              </Label>
              <Input
                type="number"
                value={uploadYear}
                onChange={(e) => setUploadYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="bg-cc-ground border-border text-white text-xs"
                min="2020"
                max="2100"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Season Cycle:
            </Label>
            <select
              value={uploadSeason}
              onChange={(e) => setUploadSeason(e.target.value)}
              className="bg-cc-ground border border-border text-white w-full h-8 px-2.5 rounded-lg text-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 cursor-pointer"
              required
            >
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!uploadFile || isUploading}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              <span>Ingest ZIP Archive</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadZipModal;
