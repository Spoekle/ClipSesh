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
        const uploadsDir = path.join(__dirname, '..', 'upload-chunks');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
        const uploadId = req.body.uploadId;
        const chunkIndex = req.body.chunkIndex;
        cb(null, `${uploadId}-${chunkIndex}`);
    }
});

const uploadChunk = multer({ 
    storage: chunksStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per chunk
}).single('chunk');

// Initialize a new upload session
router.post('/upload-init', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { filename, totalChunks, uploadId, season, year, clipAmount, fileSize } = req.body;
        
        console.log(`Initializing upload session: ${uploadId}, filename: ${filename}, chunks: ${totalChunks}`);
        
        // Create a temp directory for this upload if it doesn't exist
        const uploadDir = path.join(__dirname, '..', 'upload-chunks', uploadId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Store session info
        uploadSessions[uploadId] = {
            filename,
            totalChunks: parseInt(totalChunks),
            receivedChunks: 0,
            season,
            year: parseInt(year),
            clipAmount: parseInt(clipAmount),
            fileSize: parseInt(fileSize),
            completed: false
        };
        
        res.json({ success: true, message: 'Upload session initialized' });
    } catch (error) {
        console.error('Error initializing upload:', error);
        res.status(500).json({ error: 'Failed to initialize upload' });
    }
});

// Upload a chunk
router.post('/upload-chunk', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    uploadChunk(req, res, async (err) => {
        if (err) {
            console.error('Chunk upload error:', err);
            return res.status(400).json({ error: `Chunk upload failed: ${err.message}` });
        }
        
        try {
            const { uploadId, chunkIndex } = req.body;
            
            if (!uploadSessions[uploadId]) {
                return res.status(404).json({ error: 'Upload session not found' });
            }
            
            // Update session info
            uploadSessions[uploadId].receivedChunks++;
            console.log(`Received chunk ${chunkIndex} for upload ${uploadId}. Progress: ${uploadSessions[uploadId].receivedChunks}/${uploadSessions[uploadId].totalChunks}`);
            
            res.json({ 
                success: true, 
                message: 'Chunk uploaded',
                progress: {
                    current: uploadSessions[uploadId].receivedChunks,
                    total: uploadSessions[uploadId].totalChunks
                }
            });
        } catch (error) {
            console.error('Error processing chunk:', error);
            res.status(500).json({ error: 'Failed to process chunk' });
        }
    });
});

// Complete the upload
router.post('/upload-complete', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { uploadId } = req.body;
        
        if (!uploadSessions[uploadId]) {
            return res.status(404).json({ error: 'Upload session not found' });
        }
        
        const session = uploadSessions[uploadId];
        
        if (session.receivedChunks !== session.totalChunks) {
            return res.status(400).json({ 
                error: `Upload incomplete. Received ${session.receivedChunks} of ${session.totalChunks} chunks`
            });
        }
        
        // Merge chunks into final file
        console.log(`Finalizing upload ${uploadId}, merging ${session.totalChunks} chunks...`);
        
        const finalFilename = `${Date.now()}-${session.filename}`;
        const finalFilePath = path.join(__dirname, '..', 'download', finalFilename);
        const writeStream = fs.createWriteStream(finalFilePath);
        
        // Read all chunks in order and append to the final file
        for (let i = 0; i < session.totalChunks; i++) {
            const chunkPath = path.join(__dirname, '..', 'upload-chunks', `${uploadId}-${i}`);
            const chunkData = fs.readFileSync(chunkPath);
            writeStream.write(chunkData);
            
            // Clean up the chunk file
            fs.unlinkSync(chunkPath);
        }
        
        writeStream.end();
        
        // Wait for the write to finish
        await new Promise(resolve => {
            writeStream.on('finish', resolve);
        });
        
        console.log(`Upload ${uploadId} completed. File saved as ${finalFilename}`);
        
        // Save to database
        const stats = fs.statSync(finalFilePath);
        
        const zip = new Zip({
            url: `https://api.spoekle.com/download/${finalFilename}`,
            season: session.season,
            year: session.year,
            name: finalFilename,
            size: stats.size,
            clipAmount: session.clipAmount,
        });
        
        await zip.save();
        
        // Clean up session
        delete uploadSessions[uploadId];
        
        res.json({ 
            success: true, 
            message: 'Upload completed successfully',
            filename: finalFilename
        });
        
    } catch (error) {
        console.error('Error completing upload:', error);
        res.status(500).json({ error: 'Failed to complete upload' });
    }
});

// Get upload status
router.get('/upload-status/:uploadId', authorizeRoles(['clipteam', 'admin']), (req, res) => {
    const { uploadId } = req.params;
    
    if (!uploadSessions[uploadId]) {
        return res.status(404).json({ error: 'Upload session not found' });
    }
    
    const session = uploadSessions[uploadId];
    
    res.json({
        uploadId,
        progress: {
            current: session.receivedChunks,
            total: session.totalChunks,
            percentage: Math.round((session.receivedChunks / session.totalChunks) * 100)
        },
        completed: session.completed
    });
});

router.post('/upload', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    console.log("=== Handling new zip upload ===");
    
    // Use a custom upload handler to track progress
    upload(req, res, async function (err) {
        if (err) {
            console.error("Upload error:", err);
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        
        try {
            const { clipAmount, season, year } = req.body;
            const zip = req.file;

            if (!clipAmount || !zip || !season || !year) {
                return res.status(400).json({ error: 'Missing clips, zip file, season, or year' });
            }

            console.log("Request body:", { clipAmount, season, year });
            console.log("File uploaded with filename:", zip.filename);

            const stats = fs.statSync(zip.path);

            // Save using the zipModel schema that includes year
            const seasonZip = new Zip({
                url: `https://api.spoekle.com/download/${zip.filename}`,
                season,
                year: parseInt(year),
                name: zip.filename,
                size: stats.size,
                clipAmount,
            });

            await seasonZip.save();
            console.log("Zip file saved to database:", seasonZip);
            return res.json({ success: true, message: 'Zip file uploaded successfully' });

        } catch (error) {
            console.error('Error in /zips/upload:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

// Create a route to check upload progress
router.get('/upload-progress/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const uploadPath = path.join(__dirname, '..', 'download', filename);
        
        // Check if file exists
        if (fs.existsSync(uploadPath)) {
            const stats = fs.statSync(uploadPath);
            res.json({ 
                exists: true, 
                size: stats.size,
                lastModified: stats.mtime
            });
        } else {
            res.json({ exists: false, size: 0 });
        }
    } catch (error) {
        console.error('Error checking upload progress:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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

router.delete('/:id', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const zip = await Zip.findById(id);

        if (!zip) {
            return res.status(404).json({ error: 'Zip not found' });
        }

        try {
            fs.unlinkSync(zip.url);
        } catch (error) {
            console.error('Error deleting zip file:', error.message);
        }

        await zip.remove();
        res.json({ success: true, message: 'Zip file deleted successfully' });
    } catch (error) {
        console.error('Error deleting zip:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;