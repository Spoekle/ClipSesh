import { Server as SocketIOServer } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var socketIoInstance: SocketIOServer | undefined;
}

export class WebSocketManager {
  private io: SocketIOServer | null;

  constructor(io?: SocketIOServer) {
    this.io = io || global.socketIoInstance || null;
  }

  private getIo(): SocketIOServer | null {
    if (!this.io && global.socketIoInstance) {
      this.io = global.socketIoInstance;
    }
    return this.io;
  }

  emitJobStarted(jobId: string, totalClips: number, season: string, year: number) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:started:${jobId}`, {
      jobId,
      totalClips,
      season,
      year,
      status: 'started',
      timestamp: Date.now()
    });
  }

  emitClipProcessing(jobId: string, clipIndex: number, clipData: any, progressPercent: number) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:clip:processing:${jobId}`, {
      jobId,
      clipIndex,
      clipData,
      progressPercent,
      status: 'processing',
      timestamp: Date.now()
    });
  }

  emitClipProcessed(jobId: string, clipIndex: number, clipData: any, processingTime: number) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:clip:processed:${jobId}`, {
      jobId,
      clipIndex,
      clipData,
      processingTime,
      status: 'processed',
      timestamp: Date.now()
    });
  }

  emitClipError(jobId: string, clipIndex: number, clipData: any, error: any) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:clip:error:${jobId}`, {
      jobId,
      clipIndex,
      clipData,
      error: typeof error === 'string' ? error : error?.message || 'Unknown error',
      status: 'error',
      timestamp: Date.now()
    });
  }

  emitJobProgress(jobId: string, processed: number, total: number, estimatedTimeRemaining?: number) {
    const io = this.getIo();
    if (!io) return;
    const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
    io.emit(`job:progress:${jobId}`, {
      jobId,
      processed,
      total,
      progress,
      estimatedTimeRemaining,
      status: 'in-progress',
      timestamp: Date.now()
    });
  }

  emitJobPhaseChange(jobId: string, phase: string, message: string) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:phase:${jobId}`, {
      jobId,
      phase,
      message,
      timestamp: Date.now()
    });
  }

  emitJobCompleted(jobId: string, zipInfo: any, totalProcessingTime: number) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:completed:${jobId}`, {
      jobId,
      zipInfo,
      totalProcessingTime,
      status: 'completed',
      timestamp: Date.now()
    });
  }

  emitJobError(jobId: string, error: any) {
    const io = this.getIo();
    if (!io) return;
    io.emit(`job:error:${jobId}`, {
      jobId,
      error: typeof error === 'string' ? error : error?.message || 'Unknown error',
      status: 'error',
      timestamp: Date.now()
    });
  }
}

export const wsManager = new WebSocketManager();
export default WebSocketManager;
