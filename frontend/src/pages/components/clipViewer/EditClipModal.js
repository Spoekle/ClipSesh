import React, { useState, useEffect } from 'react';
import apiUrl from '../../../config/config';
import axios from 'axios';
import { FaClipboard } from "react-icons/fa";

const EditClipModal = ({ clip, setCurrentClip, setIsEditModalOpen, isEditModalOpen, token }) => {
  const [streamer, setStreamer] = useState(clip.streamer);
  const [title, setTitle] = useState(clip.title);
  const [submitter, setSubmitter] = useState(clip.submitter);

  useEffect(() => {
    setStreamer(clip.streamer);
    setTitle(clip.title);
  }, [clip]);

  const handleUpdate = async (id) => {
    try {
      const response = await axios.put(
        `${apiUrl}/api/clips/${id}`,
        { streamer, title, submitter },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data) {
        setCurrentClip(response.data.clip);
      } else {
        console.error('No data received from the update.');
      }
      handleClose();
    } catch (error) {
      console.error('Error updating clip:', error);
    }
  };

  const handleEditClickOutside = (event) => {
    if (event.target.classList.contains('edit-modal-overlay')) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      {isEditModalOpen && (
        <div
          className="edit-modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={handleEditClickOutside}
        >
          <div className="modal-content relative bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white backdrop-blur-lg p-8 rounded-md shadow-md">
            <h2 className="text-3xl font-bold mb-4">Edit Clip Info</h2>
            <div className="mb-4">
              <input
                type="text"
                value={streamer}
                onChange={(e) => setStreamer(e.target.value)}
                placeholder="Streamer"
                className="w-full px-2 py-1 mb-2 rounded bg-neutral-200 text-neutral-800"
              />
              <input
                type="text"
                value={submitter}
                onChange={(e) => setSubmitter(e.target.value)}
                placeholder="Submitter"
                className="w-full px-2 py-1 mb-2 rounded bg-neutral-200 text-neutral-800"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-2 py-1 rounded bg-neutral-200 text-neutral-800"
              />
            </div>
            <button
              className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4 font-bold"
              onClick={() => handleUpdate(clip._id)}
            >
              <FaClipboard className="mr-2" /> Save
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EditClipModal;
