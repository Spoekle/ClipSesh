import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaComments, 
  FaPaperPlane, 
  FaTimes, 
  FaUser, 
  FaUserShield,
  FaEye
} from 'react-icons/fa';
import { useNotification } from '../../context/AlertContext';
import { useUserReportMessages, useSendUserReportMessage } from '../../hooks/useReports';
import { Report, ReportMessage } from '../../types/adminTypes';

interface UserReportMessagingModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

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
    } catch (error: any) {
      showError(error.message || 'Failed to send message');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMessageIcon = (message: ReportMessage) => {
    if (message.senderRole === 'admin') {
      return <FaUserShield className="text-blue-500" />;
    }
    return <FaUser className="text-green-500" />;
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 flex justify-between items-center bg-white/40 dark:bg-neutral-900/40">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FaComments size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                  Report Discussion
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {report.clipTitle} • <span className="capitalize font-medium">{report.status}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-3 text-sm text-neutral-500 dark:text-neutral-400">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <FaComments className="mx-auto text-4xl text-neutral-300 dark:text-neutral-600 mb-3 opacity-60" />
                <h4 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  No messages yet
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Send a message below to communicate with the moderation team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${
                      message.senderRole === 'admin' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.senderRole === 'reporter' && (
                      <div className="shrink-0 p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                        {getMessageIcon(message)}
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${
                      message.senderRole === 'admin' ? 'order-2' : ''
                    }`}>
                      <div className={`rounded-2xl p-4 text-sm ${
                        message.senderRole === 'admin'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'glass-subtle border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white'
                      }`}>
                        <div className="flex items-center justify-between gap-4 mb-1 text-xs">
                          <span className={`font-semibold ${message.senderRole === 'admin' ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {message.senderRole === 'admin' ? 'ClipSesh Moderator' : 'You'}
                          </span>
                        </div>
                        
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.message}
                        </p>
                        
                        <div className={`flex items-center justify-between mt-2 text-[11px] ${
                          message.senderRole === 'admin' ? 'text-blue-200' : 'text-neutral-400 dark:text-neutral-500'
                        }`}>
                          <span>{formatDate(message.createdAt)}</span>
                          {message.readBy.length > 1 && (
                            <span className="flex items-center ml-2">
                              <FaEye className="mr-1" size={10} />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {message.senderRole === 'admin' && (
                      <div className="shrink-0 order-1 p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {getMessageIcon(message)}
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 sm:p-5 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-white/40 dark:bg-neutral-900/40">
            {isMessagingDisabled ? (
              <div className="text-center py-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">
                    This report has been {report.status} and no longer accepts new messages.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="input rounded-xl flex-1 px-3.5 py-2.5 text-sm min-h-[72px] resize-none"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="btn btn-primary rounded-xl px-5 py-2.5 text-sm font-medium flex items-center gap-2 shrink-0 shadow-md shadow-blue-500/20"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane size={12} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserReportMessagingModal;
