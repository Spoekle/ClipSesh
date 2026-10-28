'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Trash2,
  EyeOff,
  Eye,
  Loader2,
} from 'lucide-react';
import { useNotification } from '@/context/AlertContext';
import { useReportMessages, useSendReportMessage, useDeleteReportMessage } from '@/hooks/useAdmin';
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
import { Checkbox } from '@/components/ui/checkbox';

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

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl p-0 h-[80vh] flex flex-col bg-card border-border overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border flex flex-row items-center gap-3 bg-cc-ground space-y-0">
          <div className="size-9 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
            <MessageSquare className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-white">
              Report Moderation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              {report.clipTitle} • Reported by <span className="font-medium text-foreground/80">{report.reporterUsername}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="mx-auto size-10 text-muted-foreground/40 mb-3" />
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
                      <div className="shrink-0 size-8 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                        <User className="size-4" />
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
                            <EyeOff className="mr-1.5 size-3" />
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
                              <Trash2 className="size-2.5" />
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
                              <Eye className="mr-1 size-2.5" />
                              Read by {message.readBy.length - 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Avatar icon for staff (right side) */}
                    {isStaff && (
                      <div className="shrink-0 order-1 size-8 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center">
                        <ShieldCheck className="size-4" />
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
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type moderation message..."
                className="bg-cc-card border-border text-foreground placeholder-muted-foreground/60 rounded-xl flex-1 px-3.5 py-2.5 text-xs min-h-16 resize-none"
                rows={2}
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="self-end gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Send className="size-3" />
                )}
                <span>Send</span>
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
                    <Checkbox
                      checked={isInternal}
                      onCheckedChange={(checked) => setIsInternal(Boolean(checked))}
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
      </DialogContent>
    </Dialog>
  );
};

export default ReportMessagingModal;
