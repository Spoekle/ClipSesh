import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldAlert, Eye } from 'lucide-react';
import { ReportMessage } from '@/types/adminTypes';

interface UserReportMessageItemProps {
  message: ReportMessage;
  formatDate: (dateString: string) => string;
}

export const UserReportMessageItem: React.FC<UserReportMessageItemProps> = ({
  message,
  formatDate,
}) => {
  const isStaff = message.senderRole === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${
        isStaff ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Avatar icon for staff (left side) */}
      {isStaff && (
        <div className="shrink-0 p-2 rounded-xl bg-primary/15 text-primary border border-primary/20">
          <ShieldAlert className="size-3.5" />
        </div>
      )}

      <div className={`max-w-[75%] ${isStaff ? '' : 'order-1'}`}>
        <div
          className={`rounded-2xl p-4 text-xs ${
            isStaff
              ? 'bg-secondary/40 border border-border text-foreground shadow-sm'
              : 'bg-background border border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
            <span
              className={`font-semibold ${
                isStaff ? 'text-primary' : 'text-sky-400'
              }`}
            >
              {isStaff ? 'ClipSesh Moderator' : 'You'}
            </span>
          </div>

          <p className="whitespace-pre-wrap leading-relaxed">
            {message.message}
          </p>

          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{formatDate(message.createdAt)}</span>
            {Boolean(message.readBy && message.readBy.length > 1) && (
              <span className="flex items-center ml-2 text-muted-foreground/80">
                <Eye className="mr-1 size-2.5" />
                Read
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Avatar icon for user (right side) */}
      {!isStaff && (
        <div className="shrink-0 order-2 p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
          <User className="size-3.5" />
        </div>
      )}
    </motion.div>
  );
};
