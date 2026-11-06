'use client';

import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const handleConfirm = () => {
    if (loading) return;
    onConfirm(deleteZip);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden text-foreground">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-background flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Unarchive Season
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Restore clips back to the active pool (Undo Archive)
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target Season Banner */}
          <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Target Season
              </span>
              <span className="text-sm font-bold text-foreground capitalize">
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
          <div className="space-y-2 bg-background p-3.5 rounded-xl border border-border text-foreground/80">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0 size-3.5" />
              <span>
                All archived submissions for this season will have their <strong className="text-foreground">archived status cleared</strong> and be restored to the active reviewer list and main Clips page.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0 size-3.5" />
              <span>
                All existing clip team votes, star ratings, and discussion comments remain <strong className="text-foreground">completely preserved</strong>.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0 size-3.5" />
              <span>
                The total public active clip counter will automatically recalculate and update across all connected clients.
              </span>
            </div>
          </div>

          {/* Optional ZIP Archive Deletion Checkbox */}
          {zipName && (
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <Checkbox
                  checked={deleteZip}
                  onCheckedChange={(checked) => setDeleteZip(Boolean(checked))}
                  disabled={loading}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
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
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-black border-amber-500/40 gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <History className="size-3.5" />
            )}
            Confirm Unarchive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnarchiveSeasonModal;
