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

const uploadChunk = multer({ 
    storage: chunksStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per chunk
}).single('chunk');

// Configure improved storage for direct uploads
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

// Simplified and renamed upload endpoint
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