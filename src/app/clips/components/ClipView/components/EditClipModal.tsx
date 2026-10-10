'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSave, FaTimes, FaVideo } from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { Clip } from '@/types/adminTypes';
import { updateClip } from '@/services/clipService';
import { EditClipFormFields, EditErrors } from './edit/EditClipFormFields';
import { Button } from '@/components/common/Button';

interface EditClipModalProps {
  clip: Clip;
  setCurrentClip: (clip: Clip) => void;
  setIsEditModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
}

export const EditClipModal: React.FC<EditClipModalProps> = ({
  clip,
  setCurrentClip,
  setIsEditModalOpen,
  isEditModalOpen,
}) => {
  const [streamer, setStreamer] = useState(clip.streamer);
  const [title, setTitle] = useState(clip.title);
  const [submitter, setSubmitter] = useState(clip.submitter);
  const [submitterId, setSubmitterId] = useState(clip.discordSubmitterId || '');
  const [link, setLink] = useState(clip.link || '');
  const [archived, setArchived] = useState(clip.archived || false);
  const [season, setSeason] = useState(clip.season || '');
  const [year, setYear] = useState(clip.year?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<EditErrors>({});

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isEditModalOpen) {
      setStreamer(clip.streamer);
      setTitle(clip.title);
      setSubmitter(clip.submitter);
      setSubmitterId(clip.discordSubmitterId || '');
      setLink(clip.link || '');
      setArchived(clip.archived || false);
      setSeason(clip.season || '');
      setYear(clip.year?.toString() || '');
      setErrors({});
    }
  }, [clip, isEditModalOpen]);

  const isValidUrl = (urlStr: string) => {
    try {
      new URL(urlStr);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: EditErrors = {};

    if (!streamer.trim()) newErrors.streamer = 'Streamer name is required';
    if (!title.trim()) newErrors.title = 'Title is required';

    if (link && !isValidUrl(link)) {
      newErrors.link = 'Please enter a valid URL';
    }

    if (
      year &&
      (!Number.isInteger(Number(year)) ||
        Number(year) < 1900 ||
        Number(year) > new Date().getFullYear() + 10)
    ) {
      newErrors.year = 'Please enter a valid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const updatedClip = await updateClip(clip._id, {
        streamer,
        title,
        submitter,
        discordSubmitterId: submitterId || undefined,
        link: link || undefined,
        archived,
        season: season || undefined,
        year: year ? Number(year) : undefined,
      });

      if (updatedClip) {
        setCurrentClip(updatedClip);
        showSuccess('Clip updated successfully!');
      } else {
        showError('No data received from the update.');
      }

      handleClose();
    } catch (error) {
      console.error('Error updating clip:', error);
      const msg = error instanceof Error ? error.message : 'Error updating clip';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
  };

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isEditModalOpen]);

  return (
    <AnimatePresence>
      {isEditModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 select-none"
          onMouseDown={handleClickOutside}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="modal-content relative bg-cc-card text-foreground w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-base font-bold flex items-center text-white">
                <div className="p-2 bg-primary/15 border border-primary/30 text-primary rounded-xl mr-3">
                  <FaVideo className="text-primary" />
                </div>
                Edit Clip Details
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)]">
              <form onSubmit={handleUpdate} className="space-y-5">
                <EditClipFormFields
                  streamer={streamer}
                  setStreamer={setStreamer}
                  submitter={submitter}
                  setSubmitter={setSubmitter}
                  title={title}
                  setTitle={setTitle}
                  link={link}
                  setLink={setLink}
                  submitterId={submitterId}
                  setSubmitterId={setSubmitterId}
                  season={season}
                  setSeason={setSeason}
                  year={year}
                  setYear={setYear}
                  archived={archived}
                  setArchived={setArchived}
                  isLoading={isLoading}
                  errors={errors}
                />

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
                  <Button
                    type="button"
                    variant="card"
                    size="sm"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isLoading}
                    leftIcon={<FaSave size={12} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditClipModal;
