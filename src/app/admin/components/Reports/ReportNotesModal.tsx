'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Report } from '@/types/adminTypes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    <Dialog open={Boolean(selectedReport)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-6 bg-card border-border">
        <DialogHeader className="pb-3 border-b border-border space-y-1">
          <DialogTitle className="text-base font-bold text-white">
            Admin Notes
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            {selectedReport?.clipTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal notes about this report, action taken, etc..."
            rows={4}
            className="bg-cc-ground border-border text-xs sm:text-sm text-white placeholder-muted-foreground resize-none min-h-28"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSave}
              disabled={isPending}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              {isPending && <Loader2 className="size-3 animate-spin" />}
              <span>{isPending ? 'Saving...' : 'Save Notes'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportNotesModal;
