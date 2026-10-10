import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaUserShield, FaEye } from 'react-icons/fa';
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
        <div className="shrink-0 p-2 rounded-xl bg-cc-red/15 text-cc-red border border-cc-red/20">
          <FaUserShield size={14} />
        </div>
      )}

      <div className={`max-w-[75%] ${isStaff ? '' : 'order-1'}`}>
        <div
          className={`rounded-2xl p-4 text-xs ${
            isStaff
              ? 'bg-secondary/40 border border-border text-foreground shadow-sm'
              : 'bg-cc-ground border border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
            <span
              className={`font-semibold ${
                isStaff ? 'text-cc-red' : 'text-sky-400'
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
                <FaEye className="mr-1" size={10} />
                Read
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Avatar icon for user (right side) */}
      {!isStaff && (
        <div className="shrink-0 order-2 p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
          <FaUser size={14} />
        </div>
      )}
    </motion.div>
  );
};
