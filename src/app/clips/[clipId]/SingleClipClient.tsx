'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useClip } from '@/hooks/useClips';
import { useBulkRatings } from '@/hooks/useRatings';
import { useCurrentUser } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { Clip } from '@/types/adminTypes';
import ClipContent from '@/app/clips/components/ClipView/Index';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { Button } from '@/components/common/Button';

interface SingleClipClientProps {
  initialClip: Clip;
  clipId: string;
}

export default function SingleClipClient({ initialClip, clipId }: SingleClipClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user } = useCurrentUser();
  const { data: clip = initialClip, isLoading, error } = useClip(clipId, initialClip);
  const { data: ratings } = useBulkRatings(clipId ? [clipId] : []);

  const fetchClipsAndRatings = React.useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  if (isLoading && !clip) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading clip...</p>
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-background text-foreground flex flex-col">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-16 flex flex-col items-center justify-center">
          <div className="bg-cc-card border border-border rounded-xl p-8 max-w-lg w-full text-center flex flex-col items-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-xl text-cc-red mb-4">
              <FaTimes />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2 tracking-tight">Clip Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              The clip you are looking for may have been deleted, unapproved, or the link is invalid.
            </p>
            <Button
              href="/clips"
              variant="primary"
              size="sm"
              leftIcon={<FaArrowLeft size={11} />}
            >
              Back to Clips
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClipContent
      clip={clip}
      user={user || null}
      fetchClipsAndRatings={fetchClipsAndRatings}
      ratings={ratings || {}}
    />
  );
}
