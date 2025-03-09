const express = require('express');
const router = express.Router();
const axios = require('axios');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const authorizeRoles = require('./middleware/AuthorizeRoles');
const Zip = require('../models/zipModel');
// Import the shared upload configuration
const { clipsZipUpload, chunkUpload, clipsZipDir, chunksDir } = require('./storage/ClipsZipUpload');

// In-memory storage for tracking chunk uploads
const uploadSessions = {};

// Start a new chunked upload session
router.post('/init-chunked-upload', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    try {
        const { filename, totalChunks, fileSize, uploadId, clipAmount, season, year } = req.body;
        
        if (!filename || !totalChunks || !fileSize || !uploadId) {
            return res.status(400).json({ error: 'Missing required fields for chunked upload' });
        }
        
        console.log(`=== Initializing chunked upload: ${filename} (${formatBytes(fileSize)}) ===`);
        console.log(`Upload ID: ${uploadId}, Total chunks: ${totalChunks}, Metadata: ${season} ${year}, ${clipAmount} clips`);
        
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
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true, mode: 0o777 });
        }
        
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

// Handle individual chunk uploads with improved error handling
router.post('/upload-chunk', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    console.log("Receiving chunk:", req.body.chunkIndex, "for upload:", req.body.uploadId);
    
    // Using the shared chunkUpload configuration
    chunkUpload.single('chunk')(req, res, async function(err) {
        if (err) {
            console.error("Chunk upload error:", err);
            return res.status(400).json({ 
                error: 'Chunk upload error: ' + err.message,
                details: err.stack,
                code: err.code || 'UNKNOWN' 
            });
        }
        
        try {
            const { uploadId, chunkIndex, totalChunks } = req.body;
            
            if (!uploadId || chunkIndex === undefined) {
                return res.status(400).json({ error: 'Missing uploadId or chunkIndex' });
            }
            
            const session = uploadSessions[uploadId];
            if (!session) {
                return res.status(404).json({ error: 'Upload session not found' });
            }
            
            const index = parseInt(chunkIndex);
            
            // Verify the chunk file exists
            const chunkPath = path.join(chunksDir, uploadId, chunkIndex.toString());
            
            let chunkExists = false;
            let actualChunkPath = '';
            
            try {
                if (fs.existsSync(chunkPath)) {
                    chunkExists = true;
                    actualChunkPath = chunkPath;
                }
                
                console.log(`Chunk path check [${chunkIndex}]: ${actualChunkPath} - Exists: ${chunkExists}`);
                
                if (!chunkExists) {
                    return res.status(500).json({ 
                        error: `Chunk file missing after upload: ${chunkPath}`,
                        paths: {
                            checked1: chunkPath
                        }
                    });
                }
                
                // Get the chunk stats for verification
                const stats = fs.statSync(actualChunkPath);
                console.log(`Received chunk ${index + 1}/${totalChunks} for upload ${uploadId} - Size: ${formatBytes(stats.size)}`);
                
                // Mark chunk as received
                session.chunkStatus[index] = true;
                session.receivedChunks++;
                
                return res.json({
                    success: true,
                    message: `Chunk ${index + 1}/${totalChunks} received`,
                    receivedChunks: session.receivedChunks,
                    remaining: session.totalChunks - session.receivedChunks,
                    path: actualChunkPath
                });
            } catch (fsError) {
                console.error(`Error verifying chunk file:`, fsError);
                return res.status(500).json({ 
                    error: `Error verifying chunk: ${fsError.message}`,
                    code: fsError.code
                });
            }
        } catch (error) {
            console.error('Error processing chunk:', error);
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    });
});

// Finalize the upload with more robust directory handling
router.post('/finalize-upload', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { uploadId, filename, clipAmount, season, year } = req.body;
        
        if (!uploadId) {
            return res.status(400).json({ error: 'Missing uploadId' });
        }
        
        const session = uploadSessions[uploadId];
        if (!session) {
            return res.status(404).json({ error: 'Upload session not found' });
        }
        
        console.log(`Finalizing upload ${uploadId}. Received ${session.receivedChunks}/${session.totalChunks} chunks`);
        
        // Check if all chunks were received
        const allChunksReceived = session.chunkStatus.every(status => status === true);
        if (!allChunksReceived) {
            const missingChunks = session.chunkStatus
                .map((status, idx) => status ? null : idx)
                .filter(idx => idx !== null);
            
            console.error(`Missing chunks for ${uploadId}:`, missingChunks);
            return res.status(400).json({ 
                error: 'Some chunks are missing', 
                missingChunks 
            });
        }
        
        const chunksDir = path.join(chunksDir, uploadId);
        console.log(`Looking for chunks in: ${chunksDir}`);
        
        // Check if directory exists
        if (!fs.existsSync(chunksDir)) {
            console.error(`Chunks directory not found: ${chunksDir}`);
            return res.status(404).json({
                error: 'Chunks directory not found',
                path: chunksDir
            });
        }
        
        // Create the destination file
        const finalFilename = `${Date.now()}-${session.originalFilename}`;
        const outputPath = path.join(clipsZipDir, finalFilename);
        
        // Ensure download directory exists
        if (!fs.existsSync(clipsZipDir)) {
            fs.mkdirSync(clipsZipDir, { recursive: true, mode: 0o777 });
        }
        
        const outputStream = fs.createWriteStream(outputPath);
        console.log(`Assembling chunks into final file: ${outputPath}`);
        
        // List actual files in the directory to verify
        const actualFiles = fs.readdirSync(chunksDir);
        console.log(`Found ${actualFiles.length} files in chunks directory:`, actualFiles);
        
        // Combine all chunks with better error handling
        for (let i = 0; i < session.totalChunks; i++) {
            const chunkPath = path.join(chunksDir, i.toString());
            
            // Check if this chunk exists
            if (!fs.existsSync(chunkPath)) {
                console.error(`Missing chunk file at: ${chunkPath}`);
                return res.status(400).json({
                    error: `Missing chunk file: ${i}`,
                    path: chunkPath
                });
            }
            
            // Append this chunk to the output file
            try {
                await new Promise((resolve, reject) => {
                    const chunkStream = fs.createReadStream(chunkPath);
                    chunkStream.pipe(outputStream, { end: false });
                    chunkStream.on('end', resolve);
                    chunkStream.on('error', reject);
                });
                
                console.log(`Appended chunk ${i}/${session.totalChunks - 1}`);
            } catch (streamErr) {
                console.error(`Error streaming chunk ${i}:`, streamErr);
                return res.status(500).json({
                    error: `Failed to process chunk ${i}: ${streamErr.message}`,
                    code: streamErr.code
                });
            }
        }
        
        // Close the output stream
        outputStream.end();
        
        // Wait for write to complete
        await new Promise(resolve => outputStream.on('close', resolve));
        
        console.log(`File assembly complete for ${uploadId}`);
        
        // Verify the file size matches the expected total
        const stats = fs.statSync(outputPath);
        if (stats.size !== session.fileSize) {
            console.error(`Size mismatch: Expected ${session.fileSize}, got ${stats.size}`);
        }
        
        // Calculate elapsed time
        const elapsedSeconds = Math.round((Date.now() - session.startTime) / 1000);
        console.log(`Upload completed in ${elapsedSeconds} seconds`);
        
        // Save to database
        const seasonZip = new Zip({
            url: `https://api.spoekle.com/download/${finalFilename}`,
            season: session.season,
            year: parseInt(session.year),
            name: finalFilename,
            size: stats.size,
            clipAmount: session.clipAmount,
        });
        
        await seasonZip.save();
        console.log("Database record created successfully for chunked upload.");
        
        // Clean up temp files
        try {
            console.log(`Cleaning up temporary chunks for ${uploadId}`);
            fs.rmSync(path.join(chunksDir, uploadId), { recursive: true, force: true });
            delete uploadSessions[uploadId];
        } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
        }
        
        return res.json({ 
            success: true, 
            message: 'Upload finalized successfully',
            fileSize: stats.size,
            id: seasonZip._id,
            elapsedSeconds
        });
    } catch (error) {
        console.error('Error finalizing upload:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Use the shared clipsZipUpload configuration
router.post('/upload', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    console.log("=== Starting file upload process ===");
    
    // Disable request timeout
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Log memory usage at start
    const memUsage = process.memoryUsage();
    console.log(`Memory usage before upload: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    
    clipsZipUpload.single('clipsZip')(req, res, async function(err) {
        if (err) {
            console.error("Upload error:", err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File too large. Maximum file size is 5GB.' });
            }
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        
        try {
            console.log("Upload complete, starting processing...");
            const { clipAmount, season, year } = req.body;
            const zip = req.file;
            
            if (!clipAmount || !zip || !season || !year) {
                console.error("Missing required fields:", { clipAmount, season, year, file: !!zip });
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            console.log("Processing upload with:", { 
                clipAmount, 
                season, 
                year, 
                filename: zip.filename,
                size: formatBytes(zip.size)
            });
            
            // Verify the file exists and has content
            try {
                const stats = fs.statSync(zip.path);
                console.log(`File verification: ${zip.path}, size: ${formatBytes(stats.size)}`);
                
                if (stats.size === 0) {
                    console.error("Uploaded file has zero bytes");
                    return res.status(400).json({ error: 'Uploaded file is empty' });
                }
                
                // Save to database
                const seasonZip = new Zip({
                    url: `https://api.spoekle.com/download/${zip.filename}`,
                    season,
                    year: parseInt(year),
                    name: zip.filename,
                    size: stats.size,
                    clipAmount,
                });
                
                await seasonZip.save();
                console.log("Database record created successfully.");
                
                // Log memory usage after processing
                const endMemUsage = process.memoryUsage();
                console.log(`Memory usage after upload: ${Math.round(endMemUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(endMemUsage.heapTotal / 1024 / 1024)}MB`);
                
                return res.json({ 
                    success: true, 
                    message: 'Upload successful', 
                    fileSize: stats.size,
                    id: seasonZip._id
                });
            } catch (verifyError) {
                console.error("Error verifying file:", verifyError);
                return res.status(500).json({ error: 'Failed to verify uploaded file: ' + verifyError.message });
            }
        } catch (error) {
            console.error('Error processing upload:', error);
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    });
});

// Helper function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Maintain backward compatibility for now, but mark as deprecated
router.post('/upload-simple', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    console.log("WARNING: Using deprecated endpoint /upload-simple. Please use /upload instead.");
    // Route to the new endpoint
    router.handle(req, res);
});

router.post('/process', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { clips, season, year } = req.body;
        const zipFilename = `processed-${Date.now()}.zip`;
        const zipPath = path.join(clipsZipDir, zipFilename);
        const zipStream = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 6 } });

        archive.pipe(zipStream);

        const allowedClips = clips.filter(clip => clip.rating !== 'denied');

        for (const clip of allowedClips) {
            try {
                const { url, streamer, rating, title } = clip;
                const response = await axios.get(url, { responseType: 'stream' });
                archive.append(response.data, { name: `${rating}-${streamer}-${title}.mp4` });
            } catch (clipError) {
                console.error(`Error fetching clip ${clip._id}:`, clipError.message);
            }
        }

        await archive.finalize();

        zipStream.on('close', async () => {
            const stats = fs.statSync(zipPath);
            const size = stats.size;

            const seasonZip = new Zip({
                url: `https://api.spoekle.com/download/${zipFilename}`, 
                season: season,
                year: parseInt(year),
                name: zipFilename,
                size: size,
                clipAmount: allowedClips.length,
            });

            await seasonZip.save();

            res.json({ success: true, message: 'Zip file processed and stored successfully' });
        });

        zipStream.on('error', (err) => {
            console.error('Error writing zip file:', err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    } catch (error) {
        console.error('Error processing zip:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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

        try {
            // Extract filename from URL for deletion
            const urlParts = zip.url.split('/');
            const filename = urlParts[urlParts.length - 1];
            const filePath = path.join(clipsZipDir, filename);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            } else {
                console.warn(`File not found for deletion: ${filePath}`);
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