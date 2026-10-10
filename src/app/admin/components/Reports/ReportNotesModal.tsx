'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { Report } from '@/types/adminTypes';
import { Button } from '@/components/Button';

interface ReportNotesModalProps {
  selectedReport: Report | null;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  isPending: boolean;
}

export const ReportNotesModal: React.FC<ReportNotesModalProps> = ({
  selectedReport,
  adminNotes,
  setAdminNotes,
  onClose,
  onSave,
  isPending,
}) => {
  return (
    <AnimatePresence>
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-cc-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl z-10"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-base font-bold text-white">
                Admin Notes: <span className="text-muted-foreground font-normal">{selectedReport.clipTitle}</span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this report, action taken, etc..."
              rows={4}
              className="w-full bg-cc-ground border border-border rounded-xl p-3 text-xs sm:text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-border/80 transition-colors resize-none"
            />

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Button
                variant="card"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={isPending}
                isLoading={isPending}
              >
                {isPending ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportNotesModal;
