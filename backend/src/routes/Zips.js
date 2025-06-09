const express = require('express');
const router = express.Router();
const axios = require('axios');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const authorizeRoles = require('./middleware/AuthorizeRoles');
const Zip = require('../models/zipModel');
const { clipsZipUpload, chunkUpload, downloadDir, chunksDir, ensureDirectoryExists } = require('./storage/ClipsZipUpload');
const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

// In-memory storage for tracking chunk uploads
const uploadSessions = {};

// Helper function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Start a new chunked upload session
router.post('/init-chunked-upload', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    try {
        const { filename, totalChunks, fileSize, uploadId, clipAmount, season, year } = req.body;
        
        if (!filename || !totalChunks || !fileSize || !uploadId) {
            return res.status(400).json({ error: 'Missing required fields for chunked upload' });
        }
        
        // Store upload session details
        uploadSessions[uploadId] = {
            filename,
            originalFilename: filename,
            totalChunks: parseInt(totalChunks),
            receivedChunks: 0,
            fileSize: parseInt(fileSize),
            clipAmount,
            season,
            year,
            chunkStatus: new Array(parseInt(totalChunks)).fill(false),
            startTime: Date.now()
        };
        
        // Ensure session directory exists
        const sessionDir = path.join(chunksDir, uploadId);
        ensureDirectoryExists(sessionDir);
        
        res.json({ 
            success: true, 
            message: 'Chunked upload initialized', 
            uploadId 
        });
    } catch (error) {
        console.error('Error initializing chunked upload:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Handle individual chunk uploads
router.post('/upload-chunk', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    // Extract query parameters before multer processes the request
    const queryUploadId = req.query.uploadId;
    const queryChunkIndex = req.query.chunkIndex;
    
    chunkUpload.single('chunk')(req, res, async function(err) {
        if (err) {
            console.error("Chunk upload error:", err);
            return res.status(400).json({ error: 'Chunk upload error: ' + err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No chunk file received' });
            }
            
            // Try to get upload info from multiple sources
            const uploadId = req.body.uploadId || queryUploadId;
            const chunkIndex = req.body.chunkIndex !== undefined ? req.body.chunkIndex : queryChunkIndex;
            
            if (!uploadId || chunkIndex === undefined) {
                return res.status(400).json({ error: 'Missing uploadId or chunkIndex' });
            }
            
            const session = uploadSessions[uploadId];
            if (!session) {
                return res.status(404).json({ error: 'Upload session not found' });
            }
            
            const index = parseInt(chunkIndex);
            
            // Handle case where chunk file was saved to orphaned directory
            if (req.file.path.includes('orphaned_')) {
                try {
                    const targetDir = path.join(chunksDir, uploadId);
                    const targetPath = path.join(targetDir, chunkIndex.toString());
                    
                    // Make sure target directory exists
                    ensureDirectoryExists(targetDir);
                    
                    // Move the file from orphaned directory to proper session directory
                    fs.renameSync(req.file.path, targetPath);
                    
                    // Try to remove orphaned directory if empty
                    const orphanedDir = path.dirname(req.file.path);
                    if (fs.readdirSync(orphanedDir).length === 0) {
                        fs.rmdirSync(orphanedDir);
                    }
                } catch (moveError) {
                    console.error("Error moving orphaned chunk:", moveError);
                }
            }
            
            // Mark chunk as received
            session.chunkStatus[index] = true;
            session.receivedChunks++;
            
            return res.json({
                success: true,
                message: `Chunk ${index + 1}/${session.totalChunks} received`,
                receivedChunks: session.receivedChunks,
                remaining: session.totalChunks - session.receivedChunks
            });
        } catch (error) {
            console.error('Error processing chunk:', error);
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    });
});

// Finalize the upload
router.post('/finalize-upload', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { uploadId, filename } = req.body;
        
        if (!uploadId) {
            return res.status(400).json({ error: 'Missing uploadId' });
        }
        
        const session = uploadSessions[uploadId];
        if (!session) {
            return res.status(404).json({ error: 'Upload session not found' });
        }
        
        // Check if all chunks were received
        const allChunksReceived = session.chunkStatus.every(status => status === true);
        if (!allChunksReceived) {
            const missingChunks = session.chunkStatus
                .map((status, idx) => status ? null : idx)
                .filter(idx => idx !== null);
            
            return res.status(400).json({ 
                error: 'Some chunks are missing', 
                missingChunks 
            });
        }
        
        // Verify chunk files exist
        const chunksPath = path.join(chunksDir, uploadId);
        
        if (!fs.existsSync(chunksPath)) {
            return res.status(500).json({ 
                error: 'Chunks directory not found', 
                path: chunksPath 
            });
        }
        
        // Create the destination file
        const finalFilename = `${Date.now()}-${session.originalFilename}`;
        const outputPath = path.join(downloadDir, finalFilename);
        
        const outputStream = fs.createWriteStream(outputPath);
        
        // Combine all chunks with improved error handling
        try {
            for (let i = 0; i < session.totalChunks; i++) {
                const chunkPath = path.join(chunksPath, i.toString());
                
                if (!fs.existsSync(chunkPath)) {
                    throw new Error(`Missing chunk file: ${chunkPath}`);
                }
                
                await new Promise((resolve, reject) => {
                    const chunkStream = fs.createReadStream(chunkPath);
                    
                    chunkStream.on('error', (err) => {
                        reject(err);
                    });
                    
                    chunkStream.pipe(outputStream, { end: false });
                    
                    chunkStream.on('end', () => {
                        resolve();
                    });
                });
            }
            
            // Close the output stream
            outputStream.end();
            
            // Wait for write to complete
            await new Promise((resolve, reject) => {
                outputStream.on('close', resolve);
                outputStream.on('error', reject);
            });
            
            // Save to database
            const stats = fs.statSync(outputPath);
            const seasonZip = new Zip({
                url: `${backendUrl}/download/${finalFilename}`,
                season: session.season,
                year: parseInt(session.year),
                name: finalFilename,
                size: stats.size,
                clipAmount: session.clipAmount,
            });
            
            await seasonZip.save();
            
            // Clean up temp files
            try {
                fs.rmSync(chunksPath, { recursive: true, force: true });
                delete uploadSessions[uploadId];
            } catch (cleanupError) {
                console.error('Error cleaning up temp files:', cleanupError);
            }
            
            return res.json({ 
                success: true, 
                message: 'Upload finalized successfully',
                fileSize: stats.size,
                id: seasonZip._id
            });
        } catch (processingError) {
            console.error('Error processing chunks:', processingError);
            
            // Clean up the incomplete output file
            try {
                outputStream.end();
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up incomplete file:', cleanupError);
            }
            
            throw processingError;
        }
    } catch (error) {
        console.error('Error finalizing upload:', error);
        res.status(500).json({ 
            error: 'Server error: ' + error.message 
        });
    }
});

// Use the shared clipsZipUpload configuration
router.post('/upload', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    // Disable request timeout
    req.setTimeout(0);
    res.setTimeout(0);
    
    clipsZipUpload.single('clipsZip')(req, res, async function(err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File too large. Maximum file size is 5GB.' });
            }
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        
        try {
            const { clipAmount, season, year } = req.body;
            const zip = req.file;
            
            if (!clipAmount || !zip || !season || !year) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Verify the file exists and has content
            try {
                const stats = fs.statSync(zip.path);
                
                if (stats.size === 0) {
                    return res.status(400).json({ error: 'Uploaded file is empty' });
                }
                
                // Save to database
                const seasonZip = new Zip({
                    url: `${backendUrl}/download/${zip.filename}`,
                    season,
                    year: parseInt(year),
                    name: zip.filename,
                    size: stats.size,
                    clipAmount,
                });
                
                await seasonZip.save();
                
                return res.json({ 
                    success: true, 
                    message: 'Upload successful', 
                    fileSize: stats.size,
                    id: seasonZip._id
                });
            } catch (verifyError) {
                return res.status(500).json({ error: 'Failed to verify uploaded file: ' + verifyError.message });
            }
        } catch (error) {
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    });
});

// Maintain backward compatibility
router.post('/upload-simple', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    router.handle(req, res);
});

// In-memory storage for tracking processing jobs
const processingJobs = {};

// Add WebSocket Manager
const WebSocketManager = require('../utils/WebSocketManager');
let wsManager = null;

// Process clips with WebSockets support
router.post('/process', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const io = req.app.get('io');
        if (!wsManager && io) {
            wsManager = new WebSocketManager(io);
        }

        const { clips, season, year } = req.body;
        
        if (!clips || !season || !year) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const jobId = `job-${Date.now()}`;
        const allowedClips = clips.filter(clip => clip.rating !== 'denied');
        const totalClips = allowedClips.length;

        // Initialize the processing job status with more detailed information
        processingJobs[jobId] = {
            total: totalClips,
            processed: 0,
            status: 'processing',
            phase: 'initializing',
            zipFilename: '',
            season,
            year,
            startTime: Date.now(),
            clips: allowedClips.map((clip, index) => ({
                ...clip,
                index,
                status: 'pending',
                startTime: null,
                endTime: null,
                error: null
            })),
            logs: [{
                time: Date.now(),
                message: 'Job initialization started',
                level: 'info'
            }]
        };

        // Respond immediately with the job ID for status tracking
        res.json({ 
            success: true, 
            message: 'Processing started', 
            jobId,
            total: totalClips,
            supportedEvents: [
                `job:started:${jobId}`, 
                `job:clip:processing:${jobId}`,
                `job:clip:processed:${jobId}`, 
                `job:clip:error:${jobId}`,
                `job:progress:${jobId}`, 
                `job:phase:${jobId}`,
                `job:completed:${jobId}`, 
                `job:error:${jobId}`
            ]
        });

        if (wsManager) {
            wsManager.emitJobStarted(jobId, totalClips, season, year);
        }

        // Start processing in the background
        processClipsAsync(jobId, allowedClips, season, year);

    } catch (error) {
        console.error('Error processing zip:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Process clips asynchronously with WebSocket updates
async function processClipsAsync(jobId, clips, season, year) {
    const job = processingJobs[jobId];
    if (!job) return;
    
    // Track time for each operation for better estimates
    const clipProcessingTimes = [];
    let estimatedTimeRemaining = null;
    
    const logAndEmit = (message, level = 'info', phase = null) => {
        const logEntry = { time: Date.now(), message, level };
        job.logs.push(logEntry);
        
        if (phase && phase !== job.phase) {
            job.phase = phase;
            if (wsManager) {
                wsManager.emitJobPhaseChange(jobId, phase, message);
            }
        }
        
        console.log(`Job ${jobId}: ${message}`);
    };

    // Calculate and emit estimated time remaining
    const updateEstimatedTime = () => {
        if (clipProcessingTimes.length > 0 && job.processed > 0 && job.total > job.processed) {
            const avgTimePerClip = clipProcessingTimes.reduce((a, b) => a + b, 0) / clipProcessingTimes.length;
            const remainingClips = job.total - job.processed;
            const estimatedMs = avgTimePerClip * remainingClips;
            
            let timeString = '';
            if (estimatedMs < 60000) {
                timeString = `${Math.ceil(estimatedMs / 1000)} seconds`;
            } else if (estimatedMs < 3600000) {
                timeString = `${Math.ceil(estimatedMs / 60000)} minutes`;
            } else {
                const hours = Math.floor(estimatedMs / 3600000);
                const minutes = Math.ceil((estimatedMs % 3600000) / 60000);
                timeString = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
            
            estimatedTimeRemaining = timeString;
            
            if (wsManager) {
                wsManager.emitJobProgress(jobId, job.processed, job.total, timeString);
            }
            
            return timeString;
        }
        return null;
    };

    try {
        logAndEmit('Starting clip processing task', 'info', 'starting');

        const zipFilename = `processed-${Date.now()}.zip`;
        const zipPath = path.join(downloadDir, zipFilename);
        logAndEmit(`Creating zip at ${zipPath}`, 'info', 'setup');
        
        // Improve writeStream with higher highWaterMark to reduce drain events
        const zipStream = fs.createWriteStream(zipPath, { 
            highWaterMark: 16 * 1024 * 1024 // 16MB buffer instead of default 16KB
        });
        
        // Set better archiver options to handle large files
        const archive = archiver('zip', { 
            zlib: { level: 3 }, // Lower compression level for better performance
            forceLocalTime: true,
            highWaterMark: 16 * 1024 * 1024 // 16MB buffer for archiver
        });
        
        let finalizationStartTime = null;
        
        // Add drain counter to detect infinite drain loops
        let drainCounter = 0;
        let lastDrainTime = Date.now();
        let consecutiveDrainEvents = 0;
        let circuitBroken = false;

        // Create a promise that resolves when the zip is finalized
        const zipFinalized = new Promise((resolve, reject) => {
            // Stream open event
            zipStream.on('open', () => {
                logAndEmit('Zip stream opened', 'debug');
            });

            // Archive piped to stream
            zipStream.on('pipe', () => {
                logAndEmit('Archive piped to zip stream', 'debug');
            });
            
            // Enhanced drain handling with circuit breaker pattern
            zipStream.on('drain', () => {
                const now = Date.now();
                drainCounter++;
                
                // Check for rapid consecutive drains (potential issue)
                if (now - lastDrainTime < 50) { // less than 50ms between drains
                    consecutiveDrainEvents++;
                } else {
                    consecutiveDrainEvents = 0;
                }
                
                lastDrainTime = now;
                
                // Only log occasional drains to reduce spam
                if (drainCounter <= 5 || drainCounter % 50 === 0) {
                    logAndEmit(`Zip stream drained (count: ${drainCounter})`, 'debug');
                }
                
                // Circuit breaker pattern - if too many rapid drains, something is wrong
                if (consecutiveDrainEvents > 100 && !circuitBroken) {
                    circuitBroken = true;
                    logAndEmit(`Circuit breaker triggered: ${consecutiveDrainEvents} rapid consecutive drain events detected`, 'error');
                    
                    // Force finalization to prevent infinite loop
                    try {
                        archive.finalize();
                    } catch (err) {
                        logAndEmit(`Error forcing archive finalization: ${err.message}`, 'error');
                    }
                }
                
                // Check for excessive drains (different from consecutive)
                if (drainCounter > 1000 && drainCounter % 100 === 0) {
                    logAndEmit(`Excessive drain events (${drainCounter}), possible stalled stream`, 'warning');
                }
                
                // If it's truly stuck, abort after extreme number of drain events
                if (drainCounter > 10000) {
                    logAndEmit(`Fatal error: Stream appears permanently stalled after ${drainCounter} drain events`, 'error');
                    zipStream.destroy(new Error('Stream stalled - too many drain events'));
                    reject(new Error('Stream stalled - too many drain events'));
                }
            });

            // Stream close (finalization completion)
            zipStream.on('close', async () => {
                try {
                    logAndEmit('Zip stream closed. Finalizing...', 'info', 'finalizing');
                    
                    const finalizeDuration = finalizationStartTime ? 
                        ((Date.now() - finalizationStartTime) / 1000).toFixed(2) + ' seconds' : 'unknown';
                    
                    logAndEmit(`Finalization took ${finalizeDuration}`, 'info');
                    
                    // Read the file stats
                    logAndEmit('Reading file stats...', 'info');
                    const stats = fs.statSync(zipPath);
                    const size = stats.size;
                    logAndEmit(`Archive completed: ${zipFilename}, size: ${formatBytes(size)}`, 'info');

                    // Create database entry
                    logAndEmit('Creating database entry...', 'info', 'database');
                    const seasonZip = new Zip({
                        url: `${backendUrl}/download/${zipFilename}`,
                        season: season,
                        year: parseInt(year),
                        name: zipFilename,
                        size: size,
                        clipAmount: clips.length,
                    });

                    // Save to database
                    logAndEmit('Saving to database...', 'info');
                    await seasonZip.save();
                    logAndEmit(`Saved to database with ID ${seasonZip._id}`, 'info');
                    
                    // Update job status
                    job.zipFilename = zipFilename;
                    job.zipId = seasonZip._id;
                    job.status = 'completed';
                    job.phase = 'completed';
                    job.endTime = Date.now();
                    job.processed = job.total;
                    
                    // Calculate total processing time
                    const totalProcessingTime = job.endTime - job.startTime;
                    logAndEmit(`Job completed in ${(totalProcessingTime / 1000).toFixed(2)} seconds`, 'info');
                    
                    // Emit job completion via WebSocket
                    if (wsManager) {
                        wsManager.emitJobCompleted(jobId, {
                            zipFilename,
                            zipId: seasonZip._id,
                            size: formatBytes(size),
                            url: `${backendUrl}/download/${zipFilename}`
                        }, totalProcessingTime);
                    }
                    
                    resolve();
                } catch (error) {
                    logAndEmit(`Error finalizing job: ${error.message}`, 'error');
                    job.status = 'error';
                    job.error = error.message;
                    
                    if (wsManager) {
                        wsManager.emitJobError(jobId, error.message);
                    }
                    
                    reject(error);
                }
            });

            // Handle stream errors
            zipStream.on('error', (err) => {
                logAndEmit(`Zip stream error: ${err.message}`, 'error');
                job.status = 'error';
                job.error = err.message;
                
                if (wsManager) {
                    wsManager.emitJobError(jobId, err.message);
                }
                
                reject(err);
            });
        });

        // Track archiver progress
        archive.on('progress', (progress) => {
            if (job.status === 'processing' && progress.entries.processed > job.processed) {
                job.processed = progress.entries.processed;
                
                // Emit progress update
                if (wsManager) {
                    updateEstimatedTime();
                }
                
                logAndEmit(`Processed ${job.processed}/${job.total} clips (${Math.round((job.processed / job.total) * 100)}%)`, 'info');
            }
        });

        // Fix the entry event handler to prevent NaN errors
        archive.on('entry', (entry) => {
            try {
                const size = entry.size || 0;
                const formattedSize = isNaN(size) ? "Unknown size" : formatBytes(size);
                logAndEmit(`Added ${entry.name} to archive (${formattedSize})`, 'debug');
            } catch (err) {
                logAndEmit(`Added ${entry.name || 'unnamed file'} to archive (error logging size)`, 'debug');
            }
        });

        archive.on('warning', (err) => {
            logAndEmit(`Archive warning: ${err.message}`, 'warning');
        });

        archive.on('error', (err) => {
            logAndEmit(`Archive error: ${err.message}`, 'error');
            job.status = 'error';
            job.error = err.message;
            
            if (wsManager) {
                wsManager.emitJobError(jobId, err.message);
            }
        });

        logAndEmit('Piping archive to zip stream', 'info');
        archive.pipe(zipStream);

        // Process clips in batches to avoid memory issues - use smaller batches
        const batchSize = 5; // Reduced from 10 to 5 for better stability
        const batches = Math.ceil(clips.length / batchSize);

        logAndEmit(`Starting processing of ${clips.length} clips in ${batches} batches`, 'info', 'processing');

        for (let i = 0; i < batches; i++) {
            logAndEmit(`Processing batch ${i+1}/${batches}`, 'info');
            const batchClips = clips.slice(i * batchSize, (i + 1) * batchSize);
            
            // Process clips in batch with better error handling and stream management
            for (const clip of batchClips) {
                try {
                    const { url, streamer, rating, title, _id, index } = clip;
                    const clipData = { url, streamer, rating, title, _id };
                    
                    // Emit clip processing started
                    if (wsManager) {
                        wsManager.emitClipProcessing(jobId, index, clipData, 0);
                    }
                    
                    const startTime = Date.now();
                    logAndEmit(`Fetching clip: ${streamer} - ${title}`, 'debug');
                    
                    // Add download timeout and better stream handling
                    const response = await axios.get(url, { 
                        responseType: 'arraybuffer', // Use arraybuffer instead of stream for more reliable handling
                        timeout: 30000 // 30 second timeout for each clip
                    });
                    
                    // Generate a safe filename
                    const safeTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    const fileName = `${rating}-${streamer}-${safeTitle}.mp4`;
                    
                    // Use Buffer for more reliable stream handling
                    archive.append(Buffer.from(response.data), { name: fileName });
                    
                    // Calculate processing time
                    const processingTime = Date.now() - startTime;
                    clipProcessingTimes.push(processingTime);
                    
                    // Update progress - important to do this immediately after each clip
                    job.processed++;
                    
                    // Emit clip processed
                    if (wsManager) {
                        wsManager.emitClipProcessed(jobId, index, clipData, processingTime);
                        
                        // Update overall progress with time estimate
                        if (job.processed % 5 === 0 || job.processed === job.total) {
                            updateEstimatedTime();
                        }
                    }
                    
                    // Add a short delay between clips to allow event loop to process events
                    if (job.processed % 20 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                } catch (clipError) {
                    logAndEmit(`Error fetching clip ${clip._id}: ${clipError.message}`, 'error');
                    
                    // Emit clip error
                    if (wsManager) {
                        wsManager.emitClipError(jobId, clip.index, {
                            url: clip.url, 
                            streamer: clip.streamer, 
                            title: clip.title,
                            _id: clip._id
                        }, clipError.message);
                    }
                    
                    // Count error as processed to maintain progress
                    job.processed++;
                }
            }
            
            // Add pause between batches to prevent memory buildup and allow drain events to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        logAndEmit('All clips processed. Starting archive finalization...', 'info', 'archiving');
        finalizationStartTime = Date.now();
        
        // Add a timeout safety to ensure finalization eventually completes
        const maxFinalizationTime = 30 * 60 * 1000; // 30 minutes
        const finalizationTimeout = setTimeout(() => {
            if (job.status === 'processing') {
                logAndEmit('Finalization timed out after 30 minutes. Force completing.', 'error');
                job.status = 'completed';
                job.endTime = Date.now();
                job.error = 'Finalization timed out';
                
                // Create an empty placeholder file if needed
                try {
                    const placeholderFilename = `timeout-${zipFilename}`;
                    const placeholderPath = path.join(downloadDir, placeholderFilename);
                    fs.writeFileSync(placeholderPath, 'This is a placeholder file because the actual zip generation timed out');
                    
                    const seasonZip = new Zip({
                        url: `${backendUrl}/download/${placeholderFilename}`,
                        season: season,
                        year: parseInt(year),
                        name: placeholderFilename,
                        size: 0,
                        clipAmount: clips.length,
                        notes: 'Auto-generated due to timeout during processing'
                    });
                    
                    seasonZip.save().catch(err => logAndEmit(`Failed to save placeholder entry: ${err.message}`, 'error'));
                    
                    job.zipFilename = placeholderFilename;
                    
                    if (wsManager) {
                        wsManager.emitJobError(jobId, 'Finalization timed out. Created placeholder file.');
                    }
                } catch (err) {
                    logAndEmit(`Error creating placeholder file: ${err.message}`, 'error');
                    if (wsManager) {
                        wsManager.emitJobError(jobId, 'Finalization timed out and failed to create placeholder.');
                    }
                }
            }
        }, maxFinalizationTime);
        
        logAndEmit('Calling archive.finalize()', 'info');
        await archive.finalize();
        
        logAndEmit('Archive.finalize() returned, waiting for zip stream close event...', 'info');
        
        // Wait for the zip to be fully finalized and the database updated
        await zipFinalized;
        clearTimeout(finalizationTimeout);
        logAndEmit('Job fully completed', 'info', 'completed');

    } catch (error) {
        logAndEmit(`Error processing clips: ${error.message}`, 'error');
        job.status = 'error';
        job.error = error.message;
        
        if (wsManager) {
            wsManager.emitJobError(jobId, error.message);
        }
    }
}

// Get job status - improve the endpoint to provide more details
router.get('/process-status/:jobId', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    try {
        const { jobId } = req.params;
        const job = processingJobs[jobId];

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Calculate progress percentage
        const progress = Math.round((job.processed / job.total) * 100);

        // Auto-fix "stuck" jobs that are actually complete
        if (progress === 100 && job.status === 'processing') {
            const elapsedTime = Date.now() - job.startTime;
            // If the job has been at 100% for more than 2 minutes, assume it's complete
            if (elapsedTime > 120000) {
                console.log(`Job ${jobId} appears to be stuck at 100%. Auto-marking as completed.`);
                job.status = 'completed';
                job.endTime = Date.now();
            }
        }

        res.json({
            jobId,
            total: job.total,
            processed: job.processed,
            status: job.status,
            progress,
            season: job.season,
            year: job.year,
            startTime: job.startTime,
            endTime: job.endTime || null,
            zipFilename: job.zipFilename || null,
            zipId: job.zipId || null,
            error: job.error || null,
            elapsedTime: Date.now() - job.startTime
        });

        // Clean up completed jobs after 1 hour
        if (job.status === 'completed' && Date.now() - job.startTime > 60 * 60 * 1000) {
            delete processingJobs[jobId];
        }
    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Enhance the force-complete endpoint to handle stalled jobs more robustly
router.post('/force-complete/:jobId', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = processingJobs[jobId];
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        // Allow force completion even if job appears to be in error state
        if (job.status === 'processing' || (job.status === 'error' && job.processed >= job.total * 0.9)) {
            const zipFilename = `manual-processed-${Date.now()}.zip`;
            
            console.log(`Manually completing job ${jobId} with filename ${zipFilename}`);
            
            // Save empty zip entry to database to complete the job
            const seasonZip = new Zip({
                url: `${backendUrl}/download/${zipFilename}`,
                season: job.season,
                year: parseInt(job.year),
                name: zipFilename,
                size: 0,
                clipAmount: job.total,
                notes: `Manually completed. Process status: ${job.status}. ${job.error ? `Error: ${job.error}` : ''}`
            });
            
            await seasonZip.save();
            
            job.zipFilename = zipFilename;
            job.zipId = seasonZip._id;
            job.status = 'completed';
            job.endTime = Date.now();
            
            return res.json({ 
                success: true, 
                message: 'Job manually completed', 
                job 
            });
        } else {
            return res.status(400).json({ 
                error: `Job is not in a state that can be force-completed (status: ${job.status}, progress: ${(job.processed / job.total * 100).toFixed(1)}%)`,
            });
        }
    } catch (error) {
        console.error('Error force-completing job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all zips
router.get('/', authorizeRoles(['clipteam', 'editor', 'admin']), async (req, res) => {
    try {
        const zips = await Zip.find();
        res.json(zips);
    } catch (error) {
        console.error('Error fetching zips:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update the delete route to properly handle file paths
router.delete('/:id', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const zip = await Zip.findById(id);
        
        if (!zip) {
            return res.status(404).json({ error: 'Zip not found' });
        }
        
        // Extract filename from URL for deletion
        const urlParts = zip.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(downloadDir, filename);

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.error('Error deleting zip file:', fileError.message);
        }

        await zip.deleteOne();
        res.json({ success: true, message: 'Zip file deleted successfully' });
    } catch (error) {
        console.error('Error deleting zip:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;