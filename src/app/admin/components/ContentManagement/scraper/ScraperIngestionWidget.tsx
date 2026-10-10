'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDownload,
  FaTimes,
  FaStop,
  FaChevronDown,
  FaChevronUp,
  FaSyncAlt,
  FaCheck,
  FaForward,
} from 'react-icons/fa';
import { ScraperDownloadStatusResponse } from '@/services/adminService';

interface ScraperIngestionWidgetProps {
  visibleJobs: ScraperDownloadStatusResponse[];
  currentJob: ScraperDownloadStatusResponse | null;
  selectedJobId: string | null;
  setSelectedJobId: (id: string) => void;
  isWidgetExpanded: boolean;
  setIsWidgetExpanded: (expanded: boolean) => void;
  onRefreshJobs: () => void;
  onStopDownload: (jobId?: string) => void;
  onDismissJob: (jobId: string) => void;
  onDismissAll: () => void;
}

export const ScraperIngestionWidget: React.FC<ScraperIngestionWidgetProps> = ({
  visibleJobs,
  currentJob,
  selectedJobId,
  setSelectedJobId,
  isWidgetExpanded,
  setIsWidgetExpanded,
  onRefreshJobs,
  onStopDownload,
  onDismissJob,
  onDismissAll,
}) => {
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isWidgetExpanded && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [currentJob?.logs, isWidgetExpanded]);

  if (visibleJobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <AnimatePresence mode="wait">
        {!isWidgetExpanded ? (
          /* Compact Overview Pill */
          <motion.div
            key="compact-widget"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsWidgetExpanded(true)}
            className="w-80 sm:w-96 bg-cc-card/95 backdrop-blur-md border border-border hover:border-border/80 rounded-2xl p-3.5 shadow-2xl shadow-black/70 cursor-pointer transition-all duration-200 group select-none"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {currentJob?.status === 'downloading' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                ) : currentJob?.status === 'completed' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                )}
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  Clip Ingestion
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cc-ground text-muted-foreground border border-border shrink-0">
                  {visibleJobs.filter((j) => j.status === 'downloading').length > 0
                    ? `${visibleJobs.filter((j) => j.status === 'downloading').length} running`
                    : `${visibleJobs.length} tasks`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-white transition-colors">
                  <span className="text-[11px] font-medium hidden sm:inline">Details</span>
                  <FaChevronUp size={11} />
                </div>
                {visibleJobs.every((j) => j.status !== 'downloading') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissAll();
                    }}
                    title="Dismiss finished tasks"
                    className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/15 rounded-md transition-colors cursor-pointer"
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
            </div>

            {currentJob && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-foreground truncate max-w-[170px]">
                    Job #{currentJob.jobId.slice(-6)}
                  </span>
                  <span className="text-white font-semibold">
                    {currentJob.processed} / {currentJob.total} (
                    {currentJob.total > 0 ? Math.round((currentJob.processed / currentJob.total) * 100) : 0}%)
                  </span>
                </div>

                <div className="w-full bg-cc-ground h-1.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        currentJob.total > 0 ? (currentJob.processed / currentJob.total) * 100 : 0
                      }%`,
                    }}
                  />
                </div>

                {currentJob.status === 'downloading' ? (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <p className="text-[11px] text-muted-foreground font-mono truncate flex-1">
                      {currentJob.activeClips && currentJob.activeClips.length > 1
                        ? `Active (${currentJob.activeClips.length}): `
                        : 'Current: '}
                      <span className="text-white">{currentJob.currentClip || 'Ingesting...'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStopDownload(currentJob.jobId);
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Cancel ingestion"
                    >
                      <FaStop size={8} />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <FaCheck size={9} />
                        <span>{currentJob.successCount} saved</span>
                      </span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <FaForward size={8} />
                        <span>{currentJob.skippedCount} skipped</span>
                      </span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <FaTimes size={9} />
                        <span>{currentJob.errorCount} failed</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissJob(currentJob.jobId);
                      }}
                      className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-border rounded-md transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* Expanded Detailed Window */
          <motion.div
            key="expanded-widget"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-88 sm:w-[440px] max-h-[85vh] bg-cc-card border border-border rounded-2xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-border bg-cc-ground flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <FaDownload size={13} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    Ingestion Tasks
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {visibleJobs.filter((j) => j.status === 'downloading').length} active • {visibleJobs.length} total
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onRefreshJobs}
                  title="Refresh tasks"
                  className="p-1.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <FaSyncAlt size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsWidgetExpanded(false)}
                  title="Collapse to corner"
                  className="p-1.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <FaChevronDown size={12} />
                </button>
                {visibleJobs.every((j) => j.status !== 'downloading') && (
                  <button
                    type="button"
                    onClick={onDismissAll}
                    title="Dismiss all finished"
                    className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Multi-task Selector Tabs (if >1 job) */}
            {visibleJobs.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-cc-ground overflow-x-auto no-scrollbar">
                {visibleJobs.map((job) => (
                  <button
                    key={job.jobId}
                    type="button"
                    onClick={() => setSelectedJobId(job.jobId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      job.jobId === currentJob?.jobId
                        ? 'bg-white/10 text-white border border-border/80 font-semibold'
                        : 'bg-cc-card text-muted-foreground hover:text-white border border-border'
                    }`}
                  >
                    {job.status === 'downloading' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    ) : job.status === 'completed' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                    )}
                    <span>#{job.jobId.slice(-5)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({job.processed}/{job.total})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Job Body */}
            {currentJob ? (
              <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1 max-h-[60vh]">
                {/* Status & Actions Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentJob.status === 'downloading' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                        Downloading & Compressing{currentJob.concurrency ? ` (${currentJob.concurrency}x)` : ''}
                      </span>
                    )}
                    {currentJob.status === 'completed' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Completed
                      </span>
                    )}
                    {currentJob.status === 'stopped' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                        Stopped
                      </span>
                    )}
                    {currentJob.status === 'error' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                        Error
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground font-mono">
                      #{currentJob.jobId.slice(-8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {currentJob.status === 'downloading' ? (
                      <button
                        type="button"
                        onClick={() => onStopDownload(currentJob.jobId)}
                        className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Cancel download and ingestion"
                      >
                        <FaStop size={10} />
                        <span>Cancel Download</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDismissJob(currentJob.jobId)}
                        className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-border rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                {/* Current Clip Name / Active Downloads */}
                {currentJob.status === 'downloading' && (currentJob.currentClip || (currentJob.activeClips && currentJob.activeClips.length > 0)) && (
                  <div className="p-2 rounded-lg bg-cc-ground border border-border space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      <span>{currentJob.activeClips && currentJob.activeClips.length > 1 ? 'Active Downloads:' : 'Current Clip:'}</span>
                      {currentJob.concurrency && (
                        <span className="text-primary font-mono lowercase">
                          {currentJob.concurrency} concurrent
                        </span>
                      )}
                    </div>
                    {currentJob.activeClips && currentJob.activeClips.length > 1 ? (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {currentJob.activeClips.map((title, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-white font-mono truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span className="truncate">{title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white font-mono truncate mt-0.5">
                        {currentJob.currentClip}
                      </p>
                    )}
                  </div>
                )}

                {/* Progress Bar & Percent */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 font-mono">
                    <span>
                      Processed {currentJob.processed} of {currentJob.total}
                    </span>
                    <span className="text-white font-semibold">
                      {currentJob.total > 0
                        ? Math.round((currentJob.processed / currentJob.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-cc-ground h-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          currentJob.total > 0
                            ? (currentJob.processed / currentJob.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats Tiles */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-cc-ground border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Ingested</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {currentJob.successCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-cc-ground border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Skipped</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {currentJob.skippedCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-cc-ground border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Errors</span>
                    <span className="text-sm font-bold text-rose-400 font-mono">
                      {currentJob.errorCount}
                    </span>
                  </div>
                </div>

                {/* Live Terminal Log Stream */}
                {currentJob.logs && currentJob.logs.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                      Terminal Logs:
                    </span>
                    <div
                      ref={logsContainerRef}
                      className="bg-black/60 border border-border rounded-xl p-2.5 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1"
                    >
                      {currentJob.logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-1.5 ${
                            log.level === 'success'
                              ? 'text-emerald-400'
                              : log.level === 'warn'
                              ? 'text-amber-400'
                              : log.level === 'error'
                              ? 'text-rose-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span className="text-muted-foreground/60 shrink-0">
                            [{new Date(log.time).toLocaleTimeString()}]
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active tasks selected
              </div>
            )}

            {/* Footer */}
            <div className="p-2.5 border-t border-border bg-cc-ground">
              <button
                type="button"
                onClick={() => setIsWidgetExpanded(false)}
                className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-medium rounded-xl border border-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaChevronDown size={10} />
                <span>Collapse to Corner</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScraperIngestionWidget;
