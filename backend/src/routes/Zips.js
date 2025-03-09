const express = require('express');
const router = express.Router();
const axios = require('axios');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const authorizeRoles = require('./middleware/AuthorizeRoles');
const Zip = require('../models/zipModel');

// In-memory storage for tracking chunk uploads
const uploadSessions = {};

// Configure storage for chunks
const chunksStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadId = req.body.uploadId || 'default';
        // Create a dedicated directory for each upload session
        const uploadsDir = path.join(__dirname, '..', 'upload-chunks', uploadId);
        
        if (!fs.existsSync(path.join(__dirname, '..', 'upload-chunks'))) {
            fs.mkdirSync(path.join(__dirname, '..', 'upload-chunks'), { recursive: true });
            console.log(`Created main upload-chunks directory`);
        }
        
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`Created upload session directory: ${uploadsDir}`);
        }
        
        // Ensure directory exists and has proper permissions
        fs.access(uploadsDir, fs.constants.W_OK, (err) => {
            if (err) {
                console.error(`Directory ${uploadsDir} is not writable:`, err);
                // Try to fix permissions
                try {
                    fs.chmodSync(uploadsDir, 0o777);
                } catch (chmodErr) {
                    console.error('Failed to change directory permissions:', chmodErr);
                }
            }
        });
        
        cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
        const chunkIndex = req.body.chunkIndex;
        cb(null, `${chunkIndex}`);
    }
});

// Updated chunk configuration
const uploadChunk = multer({ 
    storage: chunksStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per chunk
}).single('chunk');

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
        
        // Create directory for chunks
        const uploadsDir = path.join(__dirname, '..', 'upload-chunks', uploadId);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
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

// Handle individual chunk uploads
router.post('/upload-chunk', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    uploadChunk(req, res, async function(err) {
        if (err) {
            console.error("Chunk upload error:", err);
            return res.status(400).json({ error: 'Chunk upload error: ' + err.message });
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
            
            console.log(`Received chunk ${index + 1}/${totalChunks} for upload ${uploadId}`);
            
            // Mark chunk as received
            session.chunkStatus[index] = true;
            session.receivedChunks++;
            
            res.json({
                success: true,
                message: `Chunk ${index + 1}/${totalChunks} received`,
                receivedChunks: session.receivedChunks,
                remaining: session.totalChunks - session.receivedChunks
            });
        } catch (error) {
            console.error('Error processing chunk:', error);
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    });
});

// Finalize the upload by assembling all chunks
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
        
        // Create the destination file
        const finalFilename = `${Date.now()}-${session.originalFilename}`;
        const outputPath = path.join(__dirname, '..', 'download', finalFilename);
        const outputStream = fs.createWriteStream(outputPath);
        console.log(`Assembling chunks into final file: ${outputPath}`);
        
        // Combine all chunks
        for (let i = 0; i < session.totalChunks; i++) {
            const chunkPath = path.join(__dirname, '..', 'upload-chunks', uploadId, i.toString());
            
            // Append this chunk to the output file
            await new Promise((resolve, reject) => {
                const chunkStream = fs.createReadStream(chunkPath);
                chunkStream.pipe(outputStream, { end: false });
                chunkStream.on('end', resolve);
                chunkStream.on('error', reject);
            });
            
            console.log(`Appended chunk ${i}/${session.totalChunks - 1}`);
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
            fs.rmSync(path.join(__dirname, '..', 'upload-chunks', uploadId), { recursive: true, force: true });
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

// Configure improved storage for direct uploads (keeping this for backward compatibility)
const directStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const downloadDir = path.join(__dirname, '..', 'download');
        // Create directory if it doesn't exist
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
            console.log(`Created download directory: ${downloadDir}`);
            
            // Set directory permissions to ensure writeability
            try {
                fs.chmodSync(downloadDir, 0o777);
                console.log(`Set permissions on download directory`);
            } catch (err) {
                console.warn(`Could not set permissions: ${err.message}`);
            }
        }
        cb(null, downloadDir);
    },
    filename: function(req, file, cb) {
        const uniquePrefix = Date.now();
        cb(null, `${uniquePrefix}-${file.originalname}`);
    }
});

// Improved upload configuration for handling large files properly
const uploadLargeFile = multer({
    storage: directStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 5GB max size
    },
}).single('clipsZip');

// Keep the regular upload endpoint
router.post('/upload', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    console.log("=== Starting file upload process ===");
    
    // Disable request timeout
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Log memory usage at start
    const memUsage = process.memoryUsage();
    console.log(`Memory usage before upload: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    
    // Using multer with improved error handling
    uploadLargeFile(req, res, async function(err) {
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
                console.log(`File verification: ${zip.path, size: ${formatBytes(stats.size)}`);
                
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
        const zipPath = path.join(__dirname, '..', 'download', zipFilename);
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
            const filePath = path.join(__dirname, '..', 'download', filename);
            
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