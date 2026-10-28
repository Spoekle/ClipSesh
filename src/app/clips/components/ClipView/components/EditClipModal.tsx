'use client';

import React, { useState, useEffect } from 'react';
import { Video, Save } from 'lucide-react';
import { useNotification } from '@/context/AlertContext';
import { Clip } from '@/types/adminTypes';
import { updateClip } from '@/services/clipService';
import { EditClipFormFields, EditErrors } from './edit/EditClipFormFields';
import { Button } from '@/components/common/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating clip:', error);
      const msg = error instanceof Error ? error.message : 'Error updating clip';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="max-w-lg w-full bg-card border border-border p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center text-foreground text-base font-bold">
            <div className="p-2 bg-primary/15 border border-primary/30 text-primary rounded-xl mr-3">
              <Video className="size-4" />
            </div>
            Edit Clip Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div className="max-h-[60vh] overflow-y-auto pr-1">
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
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button
              type="button"
              variant="card"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Save className="size-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClipModal;
