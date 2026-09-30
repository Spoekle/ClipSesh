'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaTimes, FaSpinner, FaFileArchive, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

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

const UnarchiveSeasonModal: React.FC<UnarchiveSeasonModalProps> = ({
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
            className="w-full max-w-lg bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#141414]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FaHistory size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#f1f1f1]">
                    Unarchive Season
                  </h3>
                  <p className="text-xs text-[#888888]">
                    Restore clips back to the active pool (Undo Archive)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-[#717171] hover:text-white p-2 rounded-lg hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-50"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Target Season Banner */}
              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#262626] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#717171] tracking-wider block">
                    Target Season
                  </span>
                  <span className="text-sm font-bold text-white capitalize">
                    {season} {year}
                  </span>
                </div>
                {archivedClipsCount !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#717171] tracking-wider block">
                      Archived Clips
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {archivedClipsCount.toLocaleString()} clips
                    </span>
                  </div>
                )}
              </div>

              {/* Informational bullet points */}
              <div className="space-y-2 bg-[#141414] p-3.5 rounded-xl border border-[#262626] text-[#b3b3b3]">
                <div className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={13} />
                  <span>
                    All archived submissions for this season will have their <strong className="text-white">archived status cleared</strong> and be restored to the active reviewer list and main Clips page.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={13} />
                  <span>
                    All existing reviewer votes, star ratings, and discussion comments remain <strong className="text-white">completely preserved</strong>.
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
              {zipName ? (
                <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteZip}
                      onChange={(e) => setDeleteZip(e.target.checked)}
                      disabled={loading}
                      className="mt-0.5 w-4 h-4 rounded-sm bg-[#1e1e1e] border-[#3a3a3a] text-[#f23030] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#f23030]"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-white block">
                        Delete associated compilation ZIP archive
                      </span>
                      <p className="text-[11px] text-[#888888] font-mono break-all">
                        {zipName}
                      </p>
                      <p className="text-[11px] text-[#717171]">
                        Check this if you want to completely purge the built ZIP file from disk and database records. Leave unchecked to keep the download available.
                      </p>
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#262626] bg-[#141414] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-[#202020] hover:bg-[#282828] text-[#aaaaaa] hover:text-white border border-[#333] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={12} />
                    <span>Unarchiving...</span>
                  </>
                ) : (
                  <>
                    <FaHistory size={12} />
                    <span>Confirm Unarchive</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UnarchiveSeasonModal;
