'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Loader2,
} from 'lucide-react';
import { useNotification } from '@/context/AlertContext';
import { useUserReportMessages, useSendUserReportMessage } from '@/hooks/useReports';
import { Report } from '@/types/adminTypes';
import { UserReportMessageItem } from './UserReportMessageItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface UserReportMessagingModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadgeStyle = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'reviewed':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'dismissed':
      return 'bg-muted/30 text-muted-foreground border-border';
    default:
      return 'bg-muted/30 text-muted-foreground border-border';
  }
};

const UserReportMessagingModal: React.FC<UserReportMessagingModalProps> = ({ report, isOpen, onClose }) => {
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { showSuccess, showError } = useNotification();
  
  const { data: messages = [], isLoading } = useUserReportMessages(report?._id || '');
  const sendMessageMutation = useSendUserReportMessage();

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

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl sm:max-w-4xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-background/50 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/25">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Report Discussion
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeStyle(report.status)}`}
                >
                  {report.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {report.clipTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-3 text-xs text-muted-foreground">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="mx-auto size-10 text-muted-foreground/30 mb-3" />
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
        <div className="p-4 sm:p-5 border-t border-border bg-background/50">
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
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to the moderation team..."
                className="flex-1 min-h-[60px] max-h-32 resize-none text-xs"
                rows={2}
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="self-end gap-1.5"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserReportMessagingModal;
