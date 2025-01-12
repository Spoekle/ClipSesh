import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../../../config/config';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaThumbsUp, FaThumbsDown, FaAngleDown } from 'react-icons/fa';
import MessageComponent from './MessageComponent';
import EditModal from './EditClipModal';
import CustomPlayer from './CustomPlayer';

const ClipContent = ({ clip, setExpandedClip, isLoggedIn, user, token, fetchClipsAndRatings, ratings }) => {
  const [currentClip, setCurrentClip] = useState(clip);
  const [newComment, setNewComment] = useState('');
  const [popout, setPopout] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || { pathname: '/clips', search: '' };

  if (!currentClip) {
    return <div>Loading...</div>;
  }

  const closeExpandedClip = () => {
    setExpandedClip(null);
    navigate({
      pathname: from.pathname,
      search: from.search
    });
  };

  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
  };

  const rateOrDenyClip = async (id, rating = null, deny = false) => {
    try {
      const data = rating !== null ? { rating } : { deny };
      await axios.post(`${apiUrl}/api/ratings/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchClipsAndRatings(user);
    } catch (error) {
      alert('Error rating/denying clip:', error);
    }
  };

  const handleVote = async (voteType) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${apiUrl}/api/clips/${currentClip._id}/vote/${voteType}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentClip(response.data);
    } catch (error) {
      console.error(`Error ${voteType}ing clip:`, error);
    }
  };

  const handleUpvote = () => handleVote('upvote');
  const handleDownvote = () => handleVote('downvote');

  const handleAddComment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${apiUrl}/api/clips/${currentClip._id}/comment`,
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentClip(response.data);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.delete(
          `${apiUrl}/api/clips/${currentClip._id}/comment/${commentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCurrentClip(response.data);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleDeleteClip = async () => {
    if (window.confirm('Are you sure you want to delete this clip?')) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`${apiUrl}/api/clips/${currentClip._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        closeExpandedClip();
      } catch (error) {
        console.error('Error deleting clip:', error);
      }
    }
  };

  return (
    <div className="animate-fade flex flex-col min-h-screen">
      {clip && (
        <Helmet>
          <title>{currentClip && `${currentClip.streamer} | ${currentClip.title}`}</title>
          <meta
            name="description"
            content={`${currentClip.title} by ${currentClip.streamer} on ${new Date(currentClip.createdAt).toLocaleString()}. Watch the clip and rate it on ClipSesh! ${currentClip.upvotes} upvotes and ${currentClip.downvotes} downvotes. ${currentClip.comments.length} comments. ${currentClip.link}`}
          />
        </Helmet>
      )}
      <div className="flex justify-between items-center bg-neutral-100 dark:bg-neutral-800 p-4 rounded-t-xl">
        <Link
          className="bg-neutral-300 dark:bg-neutral-900 hover:bg-neutral-400 dark:hover:bg-neutral-950 text-neutral-950 dark:text-white px-4 py-2 rounded-lg transition"
          to={from}
          onClick={closeExpandedClip}
        >
          Back
        </Link>
        {user && user.roles.includes('admin') && (
          <div className="flex space-x-2">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
              onClick={toggleEditModal}
            >
              Edit
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              onClick={handleDeleteClip}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <div className="bg-neutral-100 dark:bg-neutral-800 flex-grow p-6 overflow-auto">
        <CustomPlayer currentClip={currentClip} />

        <div className="my-4">
          <h1 className="text-2xl text-neutral-950 dark:text-white font-bold mb-2">Clip Info:</h1>
          <a
            href={currentClip.link}
            className="text-xl text-neutral-950 dark:text-white font-bold underline hover:text-blue-600"
            target="_blank"
            rel="noreferrer"
          >
            {currentClip.title}
          </a>
          <h2 className="text-xl text-neutral-950 dark:text-white font-semibold">{currentClip.streamer}</h2>
          {currentClip.submitter !== 'Legacy(no data)' && (
            <h2 className="text-xl text-neutral-950 dark:text-white font-semibold">Submitted by: {currentClip.submitter}</h2>
          )}
          <p className="text-sm text-neutral-950 dark:text-white">Uploaded on: {new Date(currentClip.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-b-xl">
        <div className="flex space-x-4 justify-center md:justify-start">
          <button
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105"
            onClick={handleUpvote}
          >
            <FaThumbsUp className="mr-2" /> {currentClip.upvotes}
          </button>
          <button
            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105"
            onClick={handleDownvote}
          >
            <FaThumbsDown className="mr-2" /> {currentClip.downvotes}
          </button>
        </div>
        {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
          <div className="flex justify-center md:justify-end">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((rate) => {
                const userRatingData = ratings[clip._id]?.ratingCounts.find(
                  (rateData) => rateData.users.some((u) => u.userId === user._id)
                );

                const userCurrentRating = userRatingData?.rating;

                return (
                  <button
                    key={rate}
                    className={`px-4 py-2 rounded-full font-semibold transition ${
                      userCurrentRating === rate
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-blue-300'
                    }`}
                    onClick={() => rateOrDenyClip(clip._id, rate)}
                  >
                    {rate}
                  </button>
                );
              })}
              {ratings[clip._id]?.ratingCounts.some(rateData => rateData.rating === 'deny' && rateData.users.some(u => u.userId === user._id)) ? (
                <button
                  className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                  onClick={() => rateOrDenyClip(clip._id, null, true)}
                >
                  Denied
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                  onClick={() => rateOrDenyClip(clip._id, null, true)}
                >
                  Deny
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-xl mt-6">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
          Comments {currentClip.comments.length > 0 && `(${currentClip.comments.length})`}
        </h3>
        <div className="max-h-[50vh] overflow-y-auto mb-4 space-y-4">
          {currentClip.comments.length > 0 ? (
            currentClip.comments.slice().reverse().map((comment, index) => (
              <div key={index} className="p-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{comment.username}</p>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      on {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {user && (user.username === comment.username || user.roles.includes('admin')) && (
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-neutral-800 dark:text-gray-200">{comment.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-neutral-700 dark:text-gray-300">No comments yet. Be the first!</p>
          )}
        </div>
        {isLoggedIn ? (
          <form className="flex flex-col" onSubmit={handleAddComment}>
            <textarea
              placeholder="Write your comment here..."
              className="p-3 mb-2 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              maxLength={300}
            ></textarea>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${newComment.length === 300 ? 'text-red-500 animate-jump' : 'text-gray-500 dark:text-gray-400'}`}>
                {newComment.length}/300
              </p>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
              >
                Post Comment
              </button>
            </div>
          </form>
        ) : (
          <p className="text-neutral-700 dark:text-gray-300">
            You must be logged in to add a comment.
          </p>
        )}
      </div>

      {popout === 'chat' ? (
        <MessageComponent clipId={clip._id} setPopout={setPopout} />
      ) : popout === 'ratings' ? (
        <div className="fixed z-30 bottom-0 right-4 w-80">
          <div className="bg-neutral-950 text-white p-4 rounded-t-xl shadow-lg">
            <button
              className="w-full text-center font-bold text-2xl mb-4 bg-white/30 p-2 rounded-md"
              onClick={() => setPopout('')}
            >
              Ratings:
            </button>
            <div>
              {ratings[clip._id]?.ratingCounts ? (
                ratings[clip._id].ratingCounts.map((rateData) => (
                  <details key={rateData.rating} className="mb-4">
                    <summary className={`flex justify-between items-center cursor-pointer p-2 rounded-md ${rateData.rating === 'deny' ? 'bg-red-500' : 'bg-neutral-700'}`}>
                      <span className="font-bold">
                        {rateData.rating === 'deny' ? 'Denied' : rateData.rating}
                      </span>
                      <span>Total: {rateData.count}</span>
                      <FaAngleDown />
                    </summary>
                    <div className="mt-2 p-2 bg-neutral-800 rounded-md">
                      {rateData.users.length > 0 ? (
                        <div>
                          <p className="font-semibold">Users:</p>
                          <ul className="list-disc list-inside">
                            {rateData.users.map((user) => (
                              <li key={user.userId}>{user.username}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p>{rateData.rating === 'deny' ? 'No denies' : 'No users'}</p>
                      )}
                    </div>
                  </details>
                ))
              ) : (
                <p>Loading...</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        user && (user.roles.includes('admin') || user.roles.includes('clipteam') || user.roles.includes('editor') || user.roles.includes('uploader')) && (
          <div className="fixed flex space-x-2 bottom-4 right-4">
            <button
              className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
              onClick={() => setPopout('chat')}
            >
              Open Chat
            </button>
            <button
              className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
              onClick={() => setPopout('ratings')}
            >
              Open Ratings
            </button>
          </div>
        )
      )}
      {isEditModalOpen && (
        <EditModal
          isEditModalOpen={isEditModalOpen}
          setIsEditModalOpen={toggleEditModal}
          clip={currentClip}
          setCurrentClip={setCurrentClip}
          token={token}
        />
      )}
    </div>
  );
};

export default ClipContent;
