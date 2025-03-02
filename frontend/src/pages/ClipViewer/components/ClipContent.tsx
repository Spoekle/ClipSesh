import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../../../config/config';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaThumbsUp, FaThumbsDown, FaShare, FaRegCalendarAlt, FaUser, FaLink } from 'react-icons/fa';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import MessageComponent from './MessageComponent';
import RatingsComponent from './RatingsComponent';
import EditModal from './EditClipModal';
import CustomPlayer from './CustomPlayer';
import { format } from 'timeago.js';
import { useNotification } from '../../../context/NotificationContext';
import { Clip, User, Rating } from '../../../types/adminTypes';
import CommentReply from './CommentReply';

interface ClipContentProps {
  clip: Clip;
  setExpandedClip: React.Dispatch<React.SetStateAction<Clip | null>>;
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  ratings: Record<string, Rating>;
}

interface LocationState {
  from: {
    pathname: string;
    search: string;
  };
}

const ClipContent: React.FC<ClipContentProps> = ({ 
  clip, 
  setExpandedClip, 
  isLoggedIn, 
  user, 
  token, 
  fetchClipsAndRatings, 
  ratings 
}) => {
  const [currentClip, setCurrentClip] = useState<Clip>(clip);
  const [newComment, setNewComment] = useState<string>('');
  const [popout, setPopout] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  
  // Use our custom notification hook instead of toast
  const { showSuccess, showError, showInfo } = useNotification();

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState)?.from || { pathname: '/clips', search: '' };
  const highlightCommentId = location.state?.highlightComment;

  useEffect(() => {
    setShareUrl(`${window.location.origin}/clips/${clip._id}`);
  }, [clip._id]);

  if (!currentClip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  const closeExpandedClip = (): void => {
    setExpandedClip(null);
    navigate({
      pathname: from.pathname,
      search: from.search
    });
  };

  const toggleEditModal = (): void => {
    setIsEditModalOpen(!isEditModalOpen);
  };

  const rateOrDenyClip = async (id: string, rating: number | null = null, deny: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      const data = rating !== null ? { rating } : { deny };
      await axios.post(`${apiUrl}/api/ratings/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchClipsAndRatings(user);
      
      showSuccess(rating !== null 
        ? `Clip rated ${rating}/4 successfully!` 
        : 'Clip has been denied');
    } catch (error: any) {
      showError('Error rating clip: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote'): Promise<void> => {
    if (!isLoggedIn) {
      showInfo('You must be logged in to vote');
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post<Clip>(
        `${apiUrl}/api/clips/${currentClip._id}/vote/${voteType}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentClip(response.data);
      showSuccess(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully!`);
    } catch (error: any) {
      showError(`Error ${voteType}ing clip: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleUpvote = (): Promise<void> => handleVote('upvote');
  const handleDownvote = (): Promise<void> => handleVote('downvote');

  const handleAddComment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const response = await axios.post<Clip>(
        `${apiUrl}/api/clips/${currentClip._id}/comment`,
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentClip(response.data);
      setNewComment('');
      showSuccess('Comment added successfully!');
    } catch (error: any) {
      showError('Failed to add comment: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(
        `${apiUrl}/api/clips/${currentClip._id}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const response = await axios.get<Clip>(`${apiUrl}/api/clips/${currentClip._id}`);
      setCurrentClip(response.data);
      
      showSuccess('Comment deleted successfully!');
    } catch (error: any) {
      showError('Error deleting comment: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleDeleteClip = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
      const token = localStorage.getItem('token');
      try {
        setIsLoading(true);
        await axios.delete(`${apiUrl}/api/clips/${currentClip._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showSuccess('Clip deleted successfully!');
        closeExpandedClip();
      } catch (error: any) {
        showError('Error deleting clip: ' + (error.response?.data?.message || 'Unknown error'));
        setIsLoading(false);
      }
    }
  };

  const handleCopyShareLink = (): void => {
    showSuccess('Share link copied to clipboard!');
  };

  const userRatingData = ratings[clip._id]?.ratingCounts.find(
    (rateData) => rateData.users.some((u) => u.userId === user?._id)
  );
  
  const userCurrentRating = userRatingData?.rating;
  const isDenied = ratings[clip._id]?.ratingCounts.some(
    rateData => rateData.rating === 'deny' && rateData.users.some(u => u.userId === user?._id)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900"
    >
      
      {clip && (
        <Helmet>
          <title>{currentClip && `${currentClip.streamer} | ${currentClip.title}`}</title>
          <meta
            name="description"
            content={`${currentClip.title} by ${currentClip.streamer} on ${new Date(currentClip.createdAt).toLocaleString()}. Watch the clip and rate it on ClipSesh! ${currentClip.upvotes} upvotes and ${currentClip.downvotes}. ${currentClip.comments.length} comments. ${currentClip.link}`}
          />
        </Helmet>
      )}
      
      {/* Header */}
      <div className="sticky top-14 z-10 flex justify-between items-center bg-white dark:bg-neutral-800 p-4 shadow-md rounded-b-xl">
        <Link
          className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
          to={from}
          onClick={closeExpandedClip}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        
        <div className="flex space-x-2">
          <button 
            className="flex items-center gap-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
                .then(() => handleCopyShareLink())
                .catch(err => console.error('Failed to copy text: ', err));
            }}
          >
            <FaShare className="text-sm" />
            <span className="hidden sm:inline">Share</span>
          </button>
          
          {user && user.roles.includes('admin') && (
            <>
              <button
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
                onClick={toggleEditModal}
                disabled={isLoading}
              >
                <AiOutlineEdit />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                onClick={handleDeleteClip}
                disabled={isLoading}
              >
                <AiOutlineDelete />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main content area */}
        <div className="flex-grow lg:w-2/3">
          {/* Video player */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden"
          >
            <CustomPlayer currentClip={currentClip} />
            
            <div className="p-6">
              <h1 className="text-2xl text-neutral-900 dark:text-white font-bold mb-2">
                {currentClip.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex space-x-2 items-center">
                    <button
                      className={`flex items-center px-4 py-2 rounded-full shadow transition transform hover:scale-105 ${
                        currentClip.upvotes > currentClip.downvotes 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-green-500 dark:hover:bg-green-500 text-neutral-700 dark:text-white hover:text-white'
                      }`}
                      onClick={handleUpvote}
                      disabled={isLoading}
                    >
                      <FaThumbsUp className="mr-2" /> {currentClip.upvotes}
                    </button>
                    <button
                      className={`flex items-center px-4 py-2 rounded-full shadow transition transform hover:scale-105 ${
                        currentClip.downvotes > currentClip.upvotes 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-red-500 dark:hover:bg-red-500 text-neutral-700 dark:text-white hover:text-white'
                      }`}
                      onClick={handleDownvote}
                      disabled={isLoading}
                    >
                      <FaThumbsDown className="mr-2" /> {currentClip.downvotes}
                    </button>
                  </div>
                </div>
                
                <div>
                  <a
                    href={currentClip.link}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaLink className="text-sm" />
                    <span>Original clip</span>
                  </a>
                </div>
              </div>
              
              <div className="border-t border-b dark:border-neutral-700 py-4 my-4">
                <div className="flex flex-wrap gap-y-3">
                  <div className="w-full sm:w-1/2">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-neutral-500 dark:text-neutral-400" />
                      <span className="text-lg text-neutral-900 dark:text-white font-semibold">
                        {currentClip.streamer}
                      </span>
                    </div>
                  </div>
                  
                  {currentClip.submitter !== 'Legacy(no data)' && (
                    <div className="w-full sm:w-1/2">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-neutral-500 dark:text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-300">
                          Submitted by: <span className="font-medium">{currentClip.submitter}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="w-full sm:w-1/2">
                    <div className="flex items-center gap-2">
                      <FaRegCalendarAlt className="text-neutral-500 dark:text-neutral-400" />
                      <span className="text-neutral-600 dark:text-neutral-300">
                        {new Date(currentClip.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team rating buttons */}
              {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <IoMdInformationCircleOutline className="mr-2" />
                    Team Rating Controls
                  </h3>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    {[1, 2, 3, 4].map((rate) => (
                      <button
                        key={rate}
                        className={`px-4 py-2 rounded-full font-semibold transition transform hover:scale-105 ${
                          userCurrentRating === rate.toString()
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-blue-400 hover:text-white'
                        }`}
                        onClick={() => rateOrDenyClip(clip._id, rate)}
                        disabled={isLoading}
                      >
                        {rate}
                      </button>
                    ))}
                    <button
                      className={`px-4 py-2 rounded-full font-semibold transition transform hover:scale-105 ${
                        isDenied
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-red-500 hover:text-white'
                      }`}
                      onClick={() => rateOrDenyClip(clip._id, null, true)}
                      disabled={isLoading}
                    >
                      Deny
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Comments section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center">
              Comments 
              {currentClip.comments.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm rounded-full">
                  {currentClip.comments.length}
                </span>
              )}
            </h3>
            
            {/* Add comment form for logged in users */}
            {isLoggedIn ? (
              <form className="mb-8" onSubmit={handleAddComment}>
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <textarea
                    placeholder="Write your comment here..."
                    className="w-full p-3 bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    maxLength={300}
                    disabled={isLoading}
                  ></textarea>
                  <div className="flex justify-between items-center mt-3">
                    <p className={`text-sm ${newComment.length === 300 ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
                      {newComment.length}/300
                    </p>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!newComment.trim() || isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : null}
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-center">
                <p className="text-neutral-700 dark:text-neutral-300">
                  You must be logged in to add a comment.
                </p>
              </div>
            )}
            
            {/* Comments display */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {currentClip.comments.length > 0 ? (
                <AnimatePresence>
                  {currentClip.comments.slice().reverse().map((comment, index) => (
                    <motion.div
                      key={comment._id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border ${
                        comment._id === highlightCommentId 
                          ? 'border-yellow-500 dark:border-yellow-500 animate-pulse' 
                          : 'border-neutral-200 dark:border-neutral-600'
                      }`}
                      id={comment._id}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                            {comment.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">
                              {comment.username}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(comment.createdAt))}
                            </span>
                          </div>
                        </div>
                        {user && (user.username === comment.username || user.roles.includes('admin')) && (
                          <button
                            className="text-neutral-400 hover:text-red-500 transition"
                            onClick={() => handleDeleteComment(comment._id)}
                            title="Delete comment"
                          >
                            <AiOutlineDelete size={20} />
                          </button>
                        )}
                      </div>
                      <div className="mt-3 pl-12">
                        <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                        
                        {/* Add the CommentReply component here */}
                        {user && (
                          <CommentReply 
                            clipId={currentClip._id}
                            commentId={comment._id}
                            user={user}
                            onReplyAdded={(updatedClip) => setCurrentClip(updatedClip)}
                            replies={comment.replies || []}
                            highlightReplyId={location.state?.highlightReply}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating buttons for team members */}
      {user && (user.roles.includes('admin') || user.roles.includes('clipteam') || user.roles.includes('editor') || user.roles.includes('uploader')) && popout === '' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed flex space-x-3 bottom-6 right-6 z-20"
        >
          <button
            className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-700/90 backdrop-blur text-white px-4 py-3 rounded-full shadow-lg transition transform hover:scale-105"
            onClick={() => setPopout('chat')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Team Chat
          </button>
          <button
            className="flex items-center gap-2 bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur text-white px-4 py-3 rounded-full shadow-lg transition transform hover:scale-105"
            onClick={() => setPopout('ratings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            View Ratings
          </button>
        </motion.div>
      )}
      
      {/* Popouts */}
      {popout === 'chat' ? (
        <MessageComponent clipId={clip._id} setPopout={setPopout} user={user} />
      ) : popout === 'ratings' ? (
        <RatingsComponent clip={clip} ratings={ratings} setPopout={setPopout} />
      ) : null}
      
      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditModal
          isEditModalOpen={isEditModalOpen}
          setIsEditModalOpen={toggleEditModal}
          clip={currentClip}
          setCurrentClip={setCurrentClip}
          token={token}
        />
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(107, 114, 128, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
        }
      `}</style>
    </motion.div>
  );
};

export default ClipContent;
