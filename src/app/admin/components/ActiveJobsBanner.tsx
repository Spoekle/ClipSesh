'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArchive,
  FaChevronUp,
  FaChevronDown,
  FaSyncAlt,
  FaTimes,
  FaStop,
} from 'react-icons/fa';
import { ProcessJobStatus } from '@/types/adminTypes';

interface ActiveJobsBannerProps {
  visibleProcessJobs: ProcessJobStatus[];
  currentProcessJob: ProcessJobStatus | null;
  selectedProcessJobId: string | null;
  setSelectedProcessJobId: (id: string | null) => void;
  isProcessWidgetExpanded: boolean;
  setIsProcessWidgetExpanded: (expanded: boolean) => void;
  onRefreshJobs: () => void;
  onDismissJob: (jobId: string) => void;
  onDismissAllJobs: () => void;
  onForceComplete: (jobId: string) => void;
  onCancelJob: (jobId: string) => void;
  processLogsContainerRef: React.RefObject<HTMLDivElement | null>;
  isScraperTab: boolean;
}

export const ActiveJobsBanner: React.FC<ActiveJobsBannerProps> = ({
  visibleProcessJobs,
  currentProcessJob,
  setSelectedProcessJobId,
  isProcessWidgetExpanded,
  setIsProcessWidgetExpanded,
  onRefreshJobs,
  onDismissJob,
  onDismissAllJobs,
  onForceComplete,
  onCancelJob,
  processLogsContainerRef,
  isScraperTab,
}) => {
  if (visibleProcessJobs.length === 0) return null;

  return (
    <div
      className={
        isScraperTab
          ? 'fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-40'
          : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50'
      }
    >
      <AnimatePresence mode="wait">
        {!isProcessWidgetExpanded ? (
          /* Compact Overview Pill / Card */
          <motion.div
            key="compact-process-widget"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsProcessWidgetExpanded(true)}
            className="w-80 sm:w-96 bg-cc-card/95 backdrop-blur-md border border-border hover:border-muted-foreground/40 rounded-2xl p-3.5 shadow-2xl shadow-black/70 cursor-pointer transition-all duration-200 group select-none"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {currentProcessJob?.status === 'processing' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                ) : currentProcessJob?.status === 'completed' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                )}
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  ZIP Pipeline
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cc-ground text-muted-foreground border border-border shrink-0">
                  {visibleProcessJobs.filter((j) => j.status === 'processing').length > 0
                    ? `${visibleProcessJobs.filter((j) => j.status === 'processing').length} running`
                    : `${visibleProcessJobs.length} tasks`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-white transition-colors">
                  <span className="text-[11px] font-medium hidden sm:inline">Details</span>
                  <FaChevronUp size={11} />
                </div>
                {visibleProcessJobs.every((j) => j.status !== 'processing') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissAllJobs();
                    }}
                    title="Dismiss finished tasks"
                    className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/15 rounded-md transition-colors cursor-pointer"
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
            </div>

            {currentProcessJob && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-white font-semibold truncate max-w-[170px]">
                    {currentProcessJob.season} {currentProcessJob.year}
                  </span>
                  <span className="text-muted-foreground">
                    {currentProcessJob.processed || 0} / {currentProcessJob.total || 0} (
                    {currentProcessJob.progress || 0}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-cc-ground h-1.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${currentProcessJob.progress || 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
                  <span className="truncate max-w-[170px]">
                    {currentProcessJob.status === 'processing'
                      ? `Phase: ${currentProcessJob.phase || 'compiling...'}`
                      : currentProcessJob.status === 'completed'
                      ? '✓ Archive ready in Download manager'
                      : currentProcessJob.status === 'cancelled'
                      ? '⊘ Compilation cancelled'
                      : '✕ Process failed'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {currentProcessJob.status === 'processing' && currentProcessJob.jobId ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelJob(currentProcessJob.jobId!);
                        }}
                        className="px-2 py-0.5 text-[10px] font-semibold text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title="Cancel compilation"
                      >
                        <FaStop size={8} />
                        <span>Cancel</span>
                      </button>
                    ) : (
                      currentProcessJob.jobId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissJob(currentProcessJob.jobId!);
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-white bg-cc-ground hover:bg-border/60 border border-border rounded-md transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      )
                    )}
                    <span className="text-muted-foreground">Click to expand ↗</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Expanded Detailed Window */
          <motion.div
            key="expanded-process-widget"
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
                  <FaArchive size={13} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    Compilation Pipeline
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {visibleProcessJobs.filter((j) => j.status === 'processing').length} active •{' '}
                    {visibleProcessJobs.length} total
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onRefreshJobs}
                  title="Refresh tasks"
                  className="p-1.5 text-muted-foreground hover:text-white hover:bg-border/60 rounded-lg transition-colors cursor-pointer"
                >
                  <FaSyncAlt size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsProcessWidgetExpanded(false)}
                  title="Collapse to corner"
                  className="p-1.5 text-muted-foreground hover:text-white hover:bg-border/60 rounded-lg transition-colors cursor-pointer"
                >
                  <FaChevronDown size={12} />
                </button>
                {visibleProcessJobs.every((j) => j.status !== 'processing') && (
                  <button
                    type="button"
                    onClick={onDismissAllJobs}
                    title="Dismiss all finished"
                    className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Multi-task Selector Tabs */}
            {visibleProcessJobs.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-cc-ground overflow-x-auto no-scrollbar">
                {visibleProcessJobs.map((job) => (
                  <button
                    key={job.jobId}
                    type="button"
                    onClick={() => setSelectedProcessJobId(job.jobId || null)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      job.jobId === currentProcessJob?.jobId
                        ? 'bg-border text-white border border-muted-foreground/40 font-semibold'
                        : 'bg-cc-card text-muted-foreground hover:text-white border border-border'
                    }`}
                  >
                    {job.status === 'processing' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    ) : job.status === 'completed' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    )}
                    <span>
                      {job.season} {job.year}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ({job.progress || 0}%)
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Current Job Details */}
            {currentProcessJob && (
              <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1 max-h-[60vh]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentProcessJob.status === 'processing' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                        Compiling ZIP
                      </span>
                    )}
                    {currentProcessJob.status === 'completed' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Completed
                      </span>
                    )}
                    {currentProcessJob.status === 'cancelled' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                        Cancelled
                      </span>
                    )}
                    {currentProcessJob.status === 'error' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                        Error
                      </span>
                    )}
                    <span className="text-xs font-semibold text-white">
                      {currentProcessJob.season} {currentProcessJob.year}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {currentProcessJob.status === 'processing' && currentProcessJob.jobId && (
                      <>
                        <button
                          type="button"
                          onClick={() => onCancelJob(currentProcessJob.jobId!)}
                          className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Cancel compilation and discard partial archive"
                        >
                          <FaStop size={10} />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onForceComplete(currentProcessJob.jobId!)}
                          className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          title="Force complete with available clips"
                        >
                          Force Complete
                        </button>
                      </>
                    )}
                    {currentProcessJob.status !== 'processing' && currentProcessJob.jobId && (
                      <button
                        type="button"
                        onClick={() => onDismissJob(currentProcessJob.jobId!)}
                        className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-white bg-cc-ground hover:bg-border/60 border border-border rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>Overall Progress</span>
                    <span className="text-white font-semibold">{currentProcessJob.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-cc-ground h-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${currentProcessJob.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Logs container */}
                {currentProcessJob.logs && currentProcessJob.logs.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                      Process Log Output:
                    </span>
                    <div
                      ref={processLogsContainerRef}
                      className="p-3 rounded-xl bg-cc-ground border border-border text-[11px] font-mono text-muted-foreground max-h-48 overflow-y-auto space-y-1 custom-scrollbar"
                    >
                      {currentProcessJob.logs.map((log, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-1.5 leading-snug break-all ${
                            log.level === 'warning' || log.level === 'warn'
                              ? 'text-amber-400'
                              : log.level === 'error'
                              ? 'text-rose-400'
                              : log.level === 'completed' || log.level === 'success'
                              ? 'text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span className="opacity-60 shrink-0">
                            [{new Date(log.time).toLocaleTimeString()}]
                          </span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveJobsBanner;
