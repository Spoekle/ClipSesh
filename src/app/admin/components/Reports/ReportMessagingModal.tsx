'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaComments,
  FaPaperPlane,
  FaTimes,
  FaUser,
  FaUserShield,
  FaTrash,
  FaEyeSlash,
  FaEye,
} from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { useReportMessages, useSendReportMessage, useDeleteReportMessage } from '@/hooks/useAdmin';
import { Report } from '@/types/adminTypes';
import { Button } from '@/components/common/Button';

interface ReportMessagingModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportMessagingModal: React.FC<ReportMessagingModalProps> = ({ report, isOpen, onClose }) => {
  const [newMessage, setNewMessage] = useState<string>('');
  const [isInternal, setIsInternal] = useState<boolean>(false);
  const [showInternalToggle, setShowInternalToggle] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { showSuccess, showError } = useNotification();

  const { data: messages = [], isLoading } = useReportMessages(report?._id || '');
  const sendMessageMutation = useSendReportMessage();
  const deleteMessageMutation = useDeleteReportMessage();

  const isAdmin = true;

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
        messageData: {
          message: newMessage.trim(),
          isInternal,
        },
      });

      setNewMessage('');
      setIsInternal(false);
      showSuccess('Message sent successfully');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      showError(msg);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!report) return;

    try {
      await deleteMessageMutation.mutateAsync({
        reportId: report._id,
        messageId,
      });
      showSuccess('Message deleted successfully');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete message';
      showError(msg);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !report) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-center items-center z-50 p-4 select-none"
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
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/25">
                <FaComments size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Report Moderation
                </h3>
                <p className="text-xs text-muted-foreground">
                  {report.clipTitle} • Reported by <span className="font-medium text-foreground/80">{report.reporterUsername}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
                <span className="ml-3 text-xs text-muted-foreground">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <FaComments className="mx-auto text-4xl text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                  No messages yet
                </h4>
                <p className="text-xs text-muted-foreground/70">
                  Start the conversation by sending a response below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isStaff = message.senderRole === 'admin';
                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-3 ${
                        isStaff ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar icon for user (left side) */}
                      {!isStaff && (
                        <div className="shrink-0 p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
                          <FaUser size={14} />
                        </div>
                      )}

                      <div className={`max-w-[75%] ${isStaff ? 'order-2' : ''}`}>
                        <div
                          className={`rounded-2xl p-4 text-xs ${
                            message.isInternal
                              ? 'bg-amber-950/20 border border-amber-500/40 text-foreground'
                              : isStaff
                              ? 'bg-cc-ground border border-border text-foreground shadow-xs'
                              : 'bg-cc-ground/60 border border-border text-foreground'
                          }`}
                        >
                          {message.isInternal && (
                            <div className="flex items-center justify-center mb-2.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                              <FaEyeSlash className="mr-1.5" size={12} />
                              Internal Staff Note
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                            <span className={`font-semibold ${isStaff ? 'text-primary' : 'text-sky-400'}`}>
                              {message.senderUsername} {isStaff && '(Staff)'}
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(message._id)}
                                className="text-muted-foreground hover:text-primary p-1 transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>

                          <p className="whitespace-pre-wrap leading-relaxed">
                            {message.message}
                          </p>

                          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                            <span>{formatDate(message.createdAt)}</span>
                            {message.readBy && message.readBy.length > 1 && (
                              <span className="flex items-center ml-2 text-muted-foreground">
                                <FaEye className="mr-1" size={10} />
                                Read by {message.readBy.length - 1}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Avatar icon for staff (right side) */}
                      {isStaff && (
                        <div className="shrink-0 order-1 p-2 rounded-xl bg-primary/15 text-primary border border-primary/20">
                          <FaUserShield size={14} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 sm:p-5 border-t border-border bg-cc-ground">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type moderation message..."
                  className="bg-cc-card border border-border text-foreground placeholder-muted-foreground/60 rounded-xl flex-1 px-3.5 py-2.5 text-xs min-h-15 resize-none focus:outline-none focus:border-border/80"
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
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInternalToggle(!showInternalToggle)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showInternalToggle ? 'Hide options' : 'Advanced options'}
                  </button>

                  {showInternalToggle && (
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="isInternal"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-border bg-cc-card text-primary focus:ring-0 cursor-pointer accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">
                        Internal message (admin-only)
                      </span>
                    </label>
                  )}
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportMessagingModal;
