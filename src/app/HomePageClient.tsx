'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getPublicConfig } from '@/services/configService';
import { getClips } from '@/services/clipService';
import { useArchiveSeasons } from '@/hooks/useClips';
import { getCurrentSeason, getSeasonRemainingDays } from '@/lib/seasonHelpers';
import { Clip } from '@/types/adminTypes';
import HeroSection from './home/components/HeroSection';
import VideoSection from './home/components/VideoSection';
import LatestClipsSection from './home/components/LatestClipsSection';
import PipelineSection from './home/components/PipelineSection';
import JoinBanner from './home/components/JoinBanner';

interface HomeConfig {
  latestVideoLink?: string;
  clipAmount?: number;
}

export interface HomeClientProps {
  initialConfig?: HomeConfig | null;
  initialClips?: Clip[];
}

const EMPTY_CLIPS: Clip[] = [];

export default function HomePageClient({
  initialConfig,
  initialClips = EMPTY_CLIPS,
}: HomeClientProps = {}) {
  const { data: archiveData, isLoading: loadingArchive } = useArchiveSeasons();

  const [config, setConfig] = useState<HomeConfig>(
    initialConfig || {
      latestVideoLink: 'https://www.youtube.com/watch?v=WQy7hb_jlCs',
    }
  );
  const [showVideo, setShowVideo] = useState(false);
  const [latestClips, setLatestClips] = useState<Clip[]>(initialClips);
  const [loadingClips, setLoadingClips] = useState<boolean>(initialClips.length === 0);

  const hasFetchedConfigRef = useRef(false);
  const hasFetchedClipsRef = useRef(false);

  const currentSeason = getCurrentSeason();
  const seasonRemaining = getSeasonRemainingDays();

  const totalClips = useMemo(() => {
    if (typeof archiveData?.totalClips === 'number') {
      return archiveData.totalClips;
    }
    if (archiveData?.sections) {
      return archiveData.sections.reduce((acc, s) => acc + (s.clipCount || 0), 0);
    }
    return null;
  }, [archiveData]);

  useEffect(() => {
    if (initialConfig) return;
    if (hasFetchedConfigRef.current) return;
    hasFetchedConfigRef.current = true;

    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const configData = await getPublicConfig();
        if (isMounted && configData) {
          setConfig((prevConfig) => ({
            ...prevConfig,
            ...configData,
          }));
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [initialConfig]);

  useEffect(() => {
    if (initialClips && initialClips.length > 0) return;
    if (hasFetchedClipsRef.current) return;
    hasFetchedClipsRef.current = true;

    let isMounted = true;
    const fetchTrending = async () => {
      try {
        setLoadingClips(true);
        const data = await getClips({
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        if (isMounted && data && data.clips) {
          setLatestClips(data.clips.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching latest clips:', error);
      } finally {
        if (isMounted) {
          setLoadingClips(false);
        }
      }
    };

    fetchTrending();
    return () => {
      isMounted = false;
    };
  }, [initialClips]);

  const getYoutubeId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = config.latestVideoLink ? getYoutubeId(config.latestVideoLink) : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  const clipCountDisplay = useMemo(() => {
    if (totalClips !== null && totalClips > 0) {
      return totalClips.toLocaleString();
    }
    if (config.clipAmount && config.clipAmount > 0) {
      return config.clipAmount.toLocaleString();
    }
    return '1,000+';
  }, [totalClips, config.clipAmount]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">

      <section>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-4 pt-12 pb-20 sm:px-8 md:pt-20 md:pb-28 lg:grid-cols-12 lg:gap-12">
          <HeroSection
            currentSeason={currentSeason}
            seasonRemaining={seasonRemaining}
            clipCountDisplay={clipCountDisplay}
            loadingArchive={loadingArchive}
            totalClips={totalClips}
          />
          <VideoSection
            showVideo={showVideo}
            setShowVideo={setShowVideo}
            embedUrl={embedUrl}
            thumbnailUrl={thumbnailUrl}
          />
        </div>
      </section>

      <LatestClipsSection latestClips={latestClips} loadingClips={loadingClips} />
      <PipelineSection />
      <JoinBanner />
    </div>
  );
}
