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

  // Check if user is admin (in a real app, this would come from context)
  const isAdmin = true; // Placeholder - replace with actual admin check

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
    if (!report || !confirm('Are you sure you want to delete this message?')) return;

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

  const getMessageIcon = (message: ReportMessage) => {
    if (message.senderRole === 'admin') {
      return <FaUserShield className="text-blue-500" />;
    }
    return <FaUser className="text-green-500" />;
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FaComments className="text-blue-500 text-xl" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Report Messages
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {report.clipTitle} - reported by {report.reporterUsername}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <FaComments className="mx-auto text-4xl text-neutral-400 mb-4" />
                <h4 className="text-lg font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                  No messages yet
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Start the conversation by sending a message below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start space-x-3 ${
                      message.senderRole === 'admin' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.senderRole === 'reporter' && (
                      <div className="flex-shrink-0">
                        {getMessageIcon(message)}
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] ${
                      message.senderRole === 'admin' ? 'order-2' : ''
                    }`}>
                      <div className={`rounded-lg p-4 ${
                        message.senderRole === 'admin'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-right'
                          : 'bg-neutral-100 dark:bg-neutral-700'
                      } ${
                        message.isInternal ? 'border-2 border-dashed border-orange-400' : ''
                      }`}>
                        {message.isInternal && (
                          <div className="flex items-center justify-center mb-2 text-xs text-orange-600 dark:text-orange-400">
                            <FaEyeSlash className="mr-1" />
                            Internal Message
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-neutral-600 dark:text-neutral-300">
                            {message.senderUsername}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 p-1"
                              title="Delete message"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                        
                        <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                          {message.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{formatDate(message.createdAt)}</span>
                          {message.readBy.length > 1 && (
                            <span className="flex items-center">
                              <FaEye className="mr-1" />
                              Read by {message.readBy.length - 1} others
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {message.senderRole === 'admin' && (
                      <div className="flex-shrink-0 order-1">
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
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex items-center space-x-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white min-h-[80px] resize-vertical"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition flex items-center space-x-2 self-end"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
              
              {isAdmin && (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInternalToggle(!showInternalToggle)}
                    className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    Advanced options
                  </button>
                  
                  {showInternalToggle && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isInternal"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-neutral-300 dark:border-neutral-600"
                      />
                      <label htmlFor="isInternal" className="text-sm text-neutral-600 dark:text-neutral-400">
                        Internal message (admin-only)
                      </label>
                    </div>
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
