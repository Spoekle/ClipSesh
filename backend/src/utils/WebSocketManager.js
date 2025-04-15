/**
 * WebSocket Manager - Handles real-time clip processing updates
 */
class WebSocketManager {
  constructor(io) {
    this.io = io;
  }

  // Emit job started event with initial information
  emitJobStarted(jobId, totalClips, season, year) {
    this.io.emit(`job:started:${jobId}`, {
      jobId,
      totalClips,
      season,
      year,
      status: 'started',
      timestamp: Date.now()
    });
  }

  // Emit progress updates for a specific clip
  emitClipProcessing(jobId, clipIndex, clipData, progressPercent) {
    this.io.emit(`job:clip:processing:${jobId}`, {
      jobId,
      clipIndex,
      clipData,
      progressPercent,
      status: 'processing',
      timestamp: Date.now()
    });
  }

  // Emit when a clip is successfully processed
  emitClipProcessed(jobId, clipIndex, clipData, processingTime) {
    this.io.emit(`job:clip:processed:${jobId}`, {
      jobId,
      clipIndex,
      clipData,
      processingTime,
      status: 'processed',
      timestamp: Date.now()
    });
  }

  // Emit when a clip fails to process
  emitClipError(jobId, clipIndex, clipData, error) {
    this.io.emit(`job:clip:error:${jobId}`, {
      jobId,
      clipIndex,
      clipData,
      error,
      status: 'error',
      timestamp: Date.now()
    });
  }

  // Emit overall job progress
  emitJobProgress(jobId, processed, total, estimatedTimeRemaining) {
    const progress = Math.round((processed / total) * 100);
    
    this.io.emit(`job:progress:${jobId}`, {
      jobId,
      processed,
      total,
      progress,
      estimatedTimeRemaining,
      status: 'in-progress',
      timestamp: Date.now()
    });
  }

  // Emit job phase change (e.g., downloading -> archiving -> finalizing)
  emitJobPhaseChange(jobId, phase, message) {
    this.io.emit(`job:phase:${jobId}`, {
      jobId,
      phase,
      message,
      timestamp: Date.now()
    });
  }

  // Emit job completion
  emitJobCompleted(jobId, zipInfo, totalProcessingTime) {
    this.io.emit(`job:completed:${jobId}`, {
      jobId,
      zipInfo,
      totalProcessingTime,
      status: 'completed',
      timestamp: Date.now()
    });
  }

  // Emit job error
  emitJobError(jobId, error) {
    this.io.emit(`job:error:${jobId}`, {
      jobId,
      error,
      status: 'error',
      timestamp: Date.now()
    });
  }
}

module.exports = WebSocketManager;
