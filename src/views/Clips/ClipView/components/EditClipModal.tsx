import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSave, FaTimes, FaUser, FaVideo, FaLink, FaIdCard, FaArchive, FaCalendarAlt, FaSnowflake } from 'react-icons/fa';
import { useNotification } from '../../../../context/AlertContext';
import { Clip } from '../../../../types/adminTypes';
import { updateClip } from '../../../../services/clipService';

interface EditClipModalProps {
  clip: Clip;
  setCurrentClip: (clip: Clip) => void;
  setIsEditModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
}

interface EditErrors {
  streamer?: string;
  title?: string;
  link?: string;
  submitterId?: string;
  year?: string;
}

const EditClipModal: React.FC<EditClipModalProps> = ({
  clip,
  setCurrentClip,
  setIsEditModalOpen,
  isEditModalOpen
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
      // Reset form state when modal opens
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

  const validateForm = () => {
    const newErrors: EditErrors = {};

    if (!streamer.trim()) newErrors.streamer = 'Streamer name is required';
    if (!title.trim()) newErrors.title = 'Title is required';

    if (link && !isValidUrl(link)) {
      newErrors.link = 'Please enter a valid URL';
    }

    if (year && (!Number.isInteger(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 10)) {
      newErrors.year = 'Please enter a valid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
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
        year: year ? Number(year) : undefined
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
      if (error instanceof Error) {
        showError(error.message || 'Error updating clip');
      } else {
        showError('Error updating clip');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
  };
  // Handle clicks outside the modal
  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      handleClose();
    }
  };

  // Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scrolling when modal is open
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
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onMouseDown={handleClickOutside}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="modal-content relative bg-[#181818] text-[#f1f1f1] w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden border border-[#262626]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#262626]">
              <h2 className="text-lg font-bold flex items-center text-[#f1f1f1]">
                <div className="p-2 bg-[#f23030]/15 border border-[#f23030]/30 text-[#f23030] rounded-xl mr-3">
                  <FaVideo className="text-[#f23030]" />
                </div>
                Edit Clip Details
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#202020] rounded-lg transition-colors"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)]">
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaUser className="inline mr-2" />
                    Streamer
                  </label>
                  <input
                    type="text"
                    value={streamer}
                    onChange={(e) => setStreamer(e.target.value)}
                    placeholder="Streamer name"
                    className={`input w-full rounded-xl ${errors.streamer ? '!border-rose-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.streamer && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.streamer}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaUser className="inline mr-2 text-neutral-400" />
                    Submitter
                  </label>
                  <input
                    type="text"
                    value={submitter}
                    onChange={(e) => setSubmitter(e.target.value)}
                    placeholder="Submitted by"
                    className="input w-full rounded-xl"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaVideo className="inline mr-2 text-neutral-400" />
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Clip title"
                    className={`input w-full rounded-xl ${errors.title ? '!border-rose-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaLink className="inline mr-2 text-neutral-400" />
                    Source URL
                  </label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Original clip URL (optional)"
                    className={`input w-full rounded-xl ${errors.link ? '!border-rose-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.link && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.link}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaIdCard className="inline mr-2 text-neutral-400" />
                    Submitter Discord ID
                  </label>
                  <input
                    type="text"
                    value={submitterId}
                    onChange={(e) => setSubmitterId(e.target.value)}
                    placeholder="Discord user ID (optional)"
                    className={`input w-full rounded-xl ${errors.submitterId ? '!border-rose-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.submitterId && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.submitterId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaSnowflake className="inline mr-2 text-neutral-400" />
                    Season
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="input w-full rounded-xl"
                    disabled={isLoading}
                  >
                    <option value="">Select Season (optional)</option>
                    <option value="Winter">Winter</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaCalendarAlt className="inline mr-2 text-neutral-400" />
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year (optional)"
                    min="1900"
                    max={new Date().getFullYear() + 10}
                    className={`input w-full rounded-xl ${errors.year ? '!border-rose-500' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.year && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.year}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaArchive className="inline mr-2 text-neutral-400" />
                    Archived Status
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={archived}
                      onChange={(e) => setArchived(e.target.checked)}
                      className="mr-2.5 h-4 w-4 text-[#f23030] focus:ring-[#f23030] border-[#263238] rounded"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                      Mark as archived
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#262626] mt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#202020] hover:bg-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#f23030] hover:bg-[#d92626] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : <FaSave size={12} />}
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
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
