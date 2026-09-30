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
      <div className="min-h-[calc(100vh-80px)] bg-[#0b0b0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#263238] border-t-[#f23030]" />
          <p className="text-sm font-medium text-[#8b98a5]">Loading clip...</p>
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#0b0b0b] text-[#e6e6e6] flex flex-col">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-16 flex flex-col items-center justify-center">
          <div className="bg-[#161d21] border border-[#263238] rounded-[12px] p-8 max-w-lg w-full text-center flex flex-col items-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#222222] border border-[#2f2f2f] flex items-center justify-center text-xl text-[#f23030] mb-4">
              <FaTimes />
            </div>
            <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Clip Not Found</h1>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              The clip you are looking for may have been deleted, unapproved, or the link is invalid.
            </p>
            <button
              onClick={() => router.push('/clips')}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <FaArrowLeft size={11} />
              <span>Back to Clips</span>
            </button>
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
