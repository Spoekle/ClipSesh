import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaComments, 
  FaPaperPlane, 
  FaTimes
} from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { useUserReportMessages, useSendUserReportMessage } from '@/hooks/useReports';
import { Report } from '@/types/adminTypes';
import { UserReportMessageItem } from './UserReportMessageItem';
import { Button } from '@/components/common/Button';

interface UserReportMessagingModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    case 'reviewed':
      return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'dismissed':
      return 'bg-muted/30 text-muted-foreground border border-border';
    default:
      return 'bg-muted/30 text-muted-foreground border border-border';
  }
};

const UserReportMessagingModal: React.FC<UserReportMessagingModalProps> = ({ report, isOpen, onClose }) => {
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { showSuccess, showError } = useNotification();
  
  const { data: messages = [], isLoading } = useUserReportMessages(report?._id || '');
  const sendMessageMutation = useSendUserReportMessage();

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !report) return;

    try {
      await sendMessageMutation.mutateAsync({
        reportId: report._id,
        message: newMessage.trim()
      });
      
      setNewMessage('');
      showSuccess('Message sent successfully');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      showError(msg);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isMessagingDisabled = report && (report.status === 'resolved' || report.status === 'dismissed');

  if (!isOpen || !report) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-cc-card rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-border overflow-hidden text-foreground"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border flex justify-between items-center bg-cc-ground">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cc-red/15 text-cc-red border border-cc-red/25">
                <FaComments size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Report Discussion
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {report.clipTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors cursor-pointer"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-cc-red border-t-transparent"></div>
                <span className="ml-3 text-xs text-muted-foreground">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <FaComments className="mx-auto text-4xl text-muted-foreground/30 mb-3" />
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                  No messages yet
                </h4>
                <p className="text-xs text-muted-foreground/80">
                  Send a message below to communicate directly with the moderation team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <UserReportMessageItem
                    key={message._id}
                    message={message}
                    formatDate={formatDate}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 sm:p-5 border-t border-border bg-cc-ground">
            {isMessagingDisabled ? (
              <div className="text-center py-2">
                <div className="p-3 bg-secondary/30 border border-border rounded-xl text-xs text-muted-foreground">
                  <p className="font-medium">
                    This report has been {report.status} and no longer accepts new messages. The conversation is archived.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message to the moderation team..."
                  className="bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl flex-1 px-3.5 py-2.5 text-xs min-h-15 resize-none focus:outline-none focus:border-primary/50"
                  rows={2}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newMessage.trim()}
                  isLoading={sendMessageMutation.isPending}
                  leftIcon={<FaPaperPlane size={11} />}
                  className="self-end"
                >
                  Send
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserReportMessagingModal;
