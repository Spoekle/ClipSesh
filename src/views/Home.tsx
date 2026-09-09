'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/lib/routerCompat';
import { Helmet } from '@/lib/helmetCompat';
import {
  FaYoutube,
  FaPlay,
  FaArrowRight,
  FaDiscord,
  FaFilm,
  FaThumbsUp,
  FaGamepad,
  FaFire,
  FaEye,
} from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { format } from 'timeago.js';
import { getPublicConfig } from '../services/configService';
import { getClips } from '../services/clipService';
import { useArchiveSeasons } from '../hooks/useClips';
import { getCurrentSeason, getSeasonRemainingDays } from '../utils/seasonHelpers';
import { Clip } from '../types/adminTypes';

interface Config {
  latestVideoLink?: string;
  clipAmount?: number;
  [key: string]: any;
}

function HomePage() {
  const { data: archiveData, isLoading: loadingArchive } = useArchiveSeasons();

  const [config, setConfig] = useState<Config>({
    latestVideoLink: 'https://www.youtube.com/watch?v=WQy7hb_jlCs',
  });
  const [showVideo, setShowVideo] = useState(false);
  const [latestClips, setLatestClips] = useState<Clip[]>([]);
  const [loadingClips, setLoadingClips] = useState<boolean>(true);

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
    const fetchConfig = async () => {
      try {
        const configData = await getPublicConfig();
        if (configData) {
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
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoadingClips(true);
        const data = await getClips({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' });
        if (data && data.clips) {
          setLatestClips(data.clips.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching latest clips:', error);
      } finally {
        setLoadingClips(false);
      }
    };

    fetchTrending();
  }, []);

  const getYoutubeId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = config.latestVideoLink ? getYoutubeId(config.latestVideoLink) : null;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    : null;
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : '/media/banner1.png';

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
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] transition-colors duration-200">
      <Helmet>
        <title>ClipSesh • Beat Saber Highlights & Community Clips</title>
        <meta
          name="description"
          content="ClipSesh is the community platform for Beat Saber players to discover, rate, and submit clips. High-rated plays are featured in official Cube Community compilations."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-8 pb-14 md:pt-14 md:pb-20 px-4 sm:px-8 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Authentic Brand Headline & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Season Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#181818] border border-[#2a2a2a] text-xs text-[#aaaaaa] mb-5">
              <span className="w-2 h-2 rounded-full bg-[#f23030] animate-pulse shrink-0" />
              <span className="font-semibold text-[#f1f1f1] capitalize">
                {currentSeason.season} {currentSeason.year}
              </span>
              <span className="text-[#626262]">•</span>
              <span>Submissions Open</span>
              <span className="text-[#626262]">•</span>
              <span className="text-amber-400 font-semibold font-mono">
                {seasonRemaining.daysRemaining} {seasonRemaining.daysRemaining === 1 ? 'day' : 'days'} left
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#f1f1f1] leading-[1.12] mb-4">
              The hub for{' '}
              <span className="text-[#f23030]">Beat Saber clips.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#aaaaaa] leading-relaxed mb-7 max-w-xl mx-auto lg:mx-0">
              Watch Beat Saber clips submitted by players worldwide. Rate clips,
              comment on them and help decide what goes into the official Cube Community seasonal highlights.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
              <Link to="/clips">
                <button
                  type="button"
                  className="bg-[#f23030] hover:bg-[#d92222] text-white text-sm px-6 py-2.5 rounded-full font-semibold transition-colors shadow-sm flex items-center gap-2"
                >
                  <span>Browse Clips</span>
                  <FaArrowRight size={12} />
                </button>
              </Link>

              <a
                href="https://discord.gg/dwe8mbC"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#181818] hover:bg-[#222222] border border-[#2e2e2e] text-[#f1f1f1] text-sm px-5 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                <FaDiscord size={16} className="text-[#5865F2]" />
                <span>Join Discord</span>
              </a>

              <a
                href="https://www.youtube.com/@CubeCommunity"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#181818] hover:bg-[#222222] border border-[#2e2e2e] text-[#f1f1f1] text-sm px-5 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                <FaYoutube size={16} className="text-[#f23030]" />
                <span>YouTube</span>
              </a>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 border-t border-[#262626] grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left">
              <Link to="/archive" className="group block" title="Explore clip archives">
                <div className="text-xl sm:text-2xl font-bold text-[#f1f1f1] font-mono group-hover:text-cc-red transition-colors">
                  {loadingArchive && !totalClips ? (
                    <span className="inline-block w-16 h-7 bg-[#222222] rounded animate-pulse align-middle" />
                  ) : (
                    clipCountDisplay
                  )}
                </div>
                <div className="text-xs text-[#717171] mt-0.5 group-hover:text-[#aaaaaa] transition-colors">Total Clips</div>
              </Link>
              <Link
                to={`/archive?season=${currentSeason.season}&year=${currentSeason.year}`}
                className="group block"
                title={`Explore ${currentSeason.season} ${currentSeason.year} clips`}
              >
                <div className="text-xl sm:text-2xl font-bold text-[#f1f1f1] capitalize group-hover:text-cc-red transition-colors">
                  {currentSeason.season}
                </div>
                <div className="text-xs text-[#717171] mt-0.5 group-hover:text-[#aaaaaa] transition-colors">
                  <span className="text-amber-400 font-mono font-semibold">{seasonRemaining.daysRemaining}d</span> remaining
                </div>
              </Link>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-[#f1f1f1]">Cube Community</div>
                <div className="text-xs text-[#717171] mt-0.5">Official Highlight Videos</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Featured Seasonal Video / Video Player Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="bg-[#181818] rounded-xl border border-[#262626] shadow-xl p-2.5 overflow-hidden">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-[#121212] flex items-center justify-center">
                {showVideo && embedUrl ? (
                  <iframe
                    className="w-full h-full"
                    src={embedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Latest Highlight Video"
                  />
                ) : (
                  <div
                    className="w-full h-full bg-cover bg-center relative group cursor-pointer"
                    style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    onClick={() => setShowVideo(true)}
                  >
                    <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-13 h-13 rounded-full bg-[#f23030] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                        <FaPlay size={16} className="ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-[#f1f1f1] bg-black/80 backdrop-blur-xs px-3 py-1.5 rounded-md border border-white/10">
                      <span className="font-semibold flex items-center gap-1.5">
                        <FaFilm size={12} className="text-[#f23030]" /> Latest Highlights Video
                      </span>
                      <span className="text-neutral-300 text-[11px]">Click to play</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#f1f1f1]">
                    Official Season Highlights Video
                  </h3>
                  <p className="text-xs text-[#717171] mt-0.5">
                    Curated from the highest-rated community clips
                  </p>
                </div>
                <a
                  href="https://www.youtube.com/@CubeCommunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#222222] hover:bg-[#2a2a2a] text-[#f1f1f1] text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 shrink-0 border border-[#2e2e2e]"
                >
                  <FaYoutube size={13} className="text-[#f23030]" />
                  <span>Subscribe</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Community Highlights Grid */}
      <section className="py-12 border-t border-[#262626] bg-[#0f0f0f]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                  <FaFire size={13} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#f1f1f1]">
                  Latest Highlights
                </h2>
              </div>
              <p className="text-xs text-[#717171] mt-1">
                The latest Beat Saber clips submitted by the community
              </p>
            </div>

            <Link
              to="/clips"
              className="text-xs font-semibold text-[#aaaaaa] hover:text-[#f1f1f1] flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <span>View all clips</span>
              <FaArrowRight size={10} />
            </Link>
          </div>

          {loadingClips ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#181818] rounded-xl border border-[#262626] overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[#202020]" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-[#202020] rounded w-3/4" />
                    <div className="h-3 bg-[#202020] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : latestClips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestClips.map((clip) => {
                return (
                  <Link
                    key={clip._id}
                    to={`/clips/${clip._id}`}
                    className="flex flex-col h-full bg-[#181818] hover:bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#262626] hover:border-[#383838] transition-all duration-200 group cursor-pointer shadow-sm select-none"
                  >
                    <div className="relative aspect-video bg-[#121212] overflow-hidden">
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-[#f1f1f1] border border-white/10 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {clip.streamer}
                      </div>

                      {(clip.comments?.length ?? 0) > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-neutral-300 border border-white/10">
                          <IoChatbubbleEllipsesOutline size={11} />
                          <span>{clip.comments?.length}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-xs font-semibold text-[#f1f1f1] group-hover:text-white line-clamp-2 leading-tight transition-colors">
                          {clip.title}
                        </h3>
                        <div className="text-[11px] text-[#aaaaaa] mt-1 truncate">
                          {clip.streamer}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#717171] mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-neutral-300 font-medium">
                          <FaEye size={10} className="text-neutral-500" />
                          <span>{clip.views || 0}</span>
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span className="flex items-center gap-1 text-neutral-300 font-medium">
                          <FaThumbsUp size={9} className="text-neutral-500" />
                          <span>{clip.upvotes}</span>
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span>{format(new Date(clip.createdAt))}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#181818] rounded-xl border border-[#262626]">
              <p className="text-xs text-[#aaaaaa]">No clips available currently.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section: Realistic Community Highlight Pipeline */}
      <section className="py-14 border-t border-[#262626] bg-[#0f0f0f]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-[#f1f1f1] tracking-tight mb-2">
              From Submissions to Highlights
            </h2>
            <p className="text-xs sm:text-sm text-[#aaaaaa] leading-relaxed">
              How clips submitted on ClipSesh are reviewed, voted on, and edited into official Cube Community highlight videos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-[#181818] rounded-xl p-5 border border-[#262626] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#717171]">
                  Step 01
                </span>
                <FaGamepad className="text-[#aaaaaa]" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1.5">
                Community Submissions
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-relaxed">
                Players submit clips directly on ClipSesh or post them in the Cube Community Discord clip channel for automated indexing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#181818] rounded-xl p-5 border border-[#262626] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#717171]">
                  Step 02
                </span>
                <FaThumbsUp className="text-[#aaaaaa]" size={15} />
              </div>
              <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1.5">
                Voting & Review Queue
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-relaxed">
                Community members can upvote clips, while Clip Team reviews the quality and makes the final selection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#181818] rounded-xl p-5 border border-[#262626] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#717171]">
                  Step 03
                </span>
                <FaYoutube className="text-[#f23030]" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1.5">
                Official YouTube Higlight Video
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-relaxed">
                At the end of each season, the highest rated plays are edited into full compilation videos with player credits on YouTube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Banner */}
      <section className="py-12 border-t border-[#262626] bg-[#0f0f0f]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="bg-[#181818] rounded-xl border border-[#262626] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-[#f1f1f1] mb-1">
                Have a clip worth showing?
              </h3>
              <p className="text-xs text-[#aaaaaa] max-w-lg">
                Submit your clips, browse current seasonal entries, or join discussion with other Beat Saber players.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link to="/clips">
                <button
                  type="button"
                  className="bg-[#f23030] hover:bg-[#d92222] text-white text-xs px-5 py-2.5 rounded-full font-semibold transition-colors flex items-center gap-2"
                >
                  <span>Explore Clips</span>
                  <FaArrowRight size={11} />
                </button>
              </Link>
              <a
                href="https://discord.gg/dwe8mbC"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#222222] hover:bg-[#2a2a2a] border border-[#2e2e2e] text-[#f1f1f1] text-xs px-4 py-2.5 rounded-full font-medium transition-colors flex items-center gap-1.5"
              >
                <FaDiscord size={14} className="text-[#5865F2]" />
                <span>Discord</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
