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
import { useNotification } from '../../context/AlertContext';
import { useReportMessages, useSendReportMessage, useDeleteReportMessage } from '../../hooks/useAdmin';
import { Report, ReportMessage } from '../../types/adminTypes';

interface ReportMessagingModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReportMessagingModal: React.FC<ReportMessagingModalProps> = ({ report, isOpen, onClose }) => {
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
          isInternal
        }
      });
      
      setNewMessage('');
      setIsInternal(false);
      showSuccess('Message sent successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!report) return;

    try {
      await deleteMessageMutation.mutateAsync({
        reportId: report._id,
        messageId
      });
      showSuccess('Message deleted successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to delete message');
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#181818] rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-[#262626] overflow-hidden text-[#f1f1f1]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#262626] flex justify-between items-center bg-[#141414]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cc-red/15 text-cc-red border border-cc-red/25">
                <FaComments size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#f1f1f1]">
                  Report Moderation
                </h3>
                <p className="text-xs text-[#717171]">
                  {report.clipTitle} • Reported by <span className="font-medium text-[#aaaaaa]">{report.reporterUsername}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#717171] hover:text-[#f1f1f1] rounded-xl hover:bg-[#222222] transition-colors cursor-pointer"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#262626] border-t-cc-red"></div>
                <span className="ml-3 text-xs text-[#aaaaaa]">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <FaComments className="mx-auto text-4xl text-[#333333] mb-3" />
                <h4 className="text-sm font-semibold text-[#aaaaaa] mb-1">
                  No messages yet
                </h4>
                <p className="text-xs text-[#717171]">
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
                        <div className="shrink-0 p-2 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/20">
                          <FaUser size={14} />
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] ${isStaff ? 'order-2' : ''}`}>
                        <div className={`rounded-2xl p-4 text-xs ${
                          message.isInternal
                            ? 'bg-[#1a1710] border border-[#eab308]/40 text-[#f1f1f1]'
                            : isStaff
                            ? 'bg-[#202020] border border-[#2e2e2e] text-[#f1f1f1] shadow-sm'
                            : 'bg-[#141414] border border-[#262626] text-[#f1f1f1]'
                        }`}>
                          {message.isInternal && (
                            <div className="flex items-center justify-center mb-2.5 text-[11px] font-semibold text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/20 px-2 py-1 rounded-lg">
                              <FaEyeSlash className="mr-1.5" size={12} />
                              Internal Staff Note
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                            <span className={`font-semibold ${isStaff ? 'text-cc-red' : 'text-[#38bdf8]'}`}>
                              {message.senderUsername} {isStaff && '(Staff)'}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteMessage(message._id)}
                                className="text-[#717171] hover:text-cc-red p-1 transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>
                          
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {message.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2 text-[10px] text-[#717171]">
                            <span>{formatDate(message.createdAt)}</span>
                            {message.readBy && message.readBy.length > 1 && (
                              <span className="flex items-center ml-2 text-[#aaaaaa]">
                                <FaEye className="mr-1" size={10} />
                                Read by {message.readBy.length - 1}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Avatar icon for staff (right side) */}
                      {isStaff && (
                        <div className="shrink-0 order-1 p-2 rounded-xl bg-cc-red/15 text-cc-red border border-cc-red/20">
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
          <div className="p-4 sm:p-5 border-t border-[#262626] bg-[#141414]">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type moderation message..."
                  className="bg-[#121212] border border-[#262626] text-[#f1f1f1] placeholder-[#717171] rounded-xl flex-1 px-3.5 py-2.5 text-xs min-h-15 resize-none focus:outline-none focus:border-[#444]"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-cc-red hover:bg-cc-red-hover text-white rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-end shadow-sm"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane size={11} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
              
              {isAdmin && (
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInternalToggle(!showInternalToggle)}
                    className="text-xs text-[#717171] hover:text-[#aaaaaa] transition-colors cursor-pointer"
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
                        className="rounded border-[#262626] bg-[#121212] text-cc-red focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-[#aaaaaa]">
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
