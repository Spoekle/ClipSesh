'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaTimes, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { Button } from '@/components/common/Button';

interface UnarchiveSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteZip: boolean) => Promise<void> | void;
  season: string;
  year: number;
  archivedClipsCount?: number;
  zipName?: string | null;
  loading?: boolean;
}

export const UnarchiveSeasonModal: React.FC<UnarchiveSeasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  season,
  year,
  archivedClipsCount,
  zipName,
  loading = false,
}) => {
  const [deleteZip, setDeleteZip] = useState<boolean>(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setDeleteZip(false);
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    },
    [loading, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleConfirm = () => {
    if (loading) return;
    onConfirm(deleteZip);
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
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-cc-ground">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FaHistory size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Unarchive Season
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Restore clips back to the active pool (Undo Archive)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Target Season Banner */}
              <div className="p-3.5 rounded-xl bg-cc-ground border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Target Season
                  </span>
                  <span className="text-sm font-bold text-white capitalize">
                    {season} {year}
                  </span>
                </div>
                {archivedClipsCount !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Archived Clips
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {archivedClipsCount.toLocaleString()} clips
                    </span>
                  </div>
                )}
              </div>

              {/* Informational bullet points */}
              <div className="space-y-2 bg-cc-ground p-3.5 rounded-xl border border-border text-foreground/80">
                <div className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={13} />
                  <span>
                    All archived submissions for this season will have their <strong className="text-white">archived status cleared</strong> and be restored to the active reviewer list and main Clips page.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={13} />
                  <span>
                    All existing clip team votes, star ratings, and discussion comments remain <strong className="text-white">completely preserved</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={13} />
                  <span>
                    The total public active clip counter will automatically recalculate and update across all connected clients.
                  </span>
                </div>
              </div>

              {/* Optional ZIP Archive Deletion Checkbox */}
              {zipName && (
                <div className="p-3.5 rounded-xl bg-cc-ground border border-border space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteZip}
                      onChange={(e) => setDeleteZip(e.target.checked)}
                      disabled={loading}
                      className="mt-0.5 w-4 h-4 rounded-sm border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-white block">
                        Delete associated compilation ZIP archive
                      </span>
                      <p className="text-[11px] text-muted-foreground font-mono break-all">
                        {zipName}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80">
                        Check this if you want to completely purge the built ZIP file from disk and database records. Leave unchecked to keep the download available.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-cc-ground flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="card"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                isLoading={loading}
                leftIcon={<FaHistory size={12} />}
                className="bg-amber-500 hover:bg-amber-600 text-black border-amber-500/40"
              >
                Confirm Unarchive
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UnarchiveSeasonModal;
