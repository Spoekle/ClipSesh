const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Zip = require('../models/zipModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/zips');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Set file size limit to 2GB
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

// Function to check file type
const checkFileType = (file, cb) => {
    // Allowed extensions
    const filetypes = /zip/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only zip files are allowed!'));
    }
};

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('zipFile');

// GET all zips
router.get('/', authorizeRoles(['admin', 'clipteam', 'editor']), async (req, res) => {
    try {
        const zips = await Zip.find().sort({ createdAt: -1 });
        res.json(zips);
    } catch (error) {
        console.error('Error fetching zips:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST upload a zip
router.post('/upload', authorizeRoles(['admin']), (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File size too large. Maximum is 2GB.' });
                }
                return res.status(400).json({ message: err.message });
            }
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file selected' });
        }

        // Check that season is provided
        if (!req.body.season) {
            // Remove uploaded file if season is missing
            fs.unlink(req.file.path, () => {});
            return res.status(400).json({ message: 'Season is required' });
        }

        try {
            const newZip = new Zip({
                name: req.file.originalname,
                url: `/uploads/zips/${req.file.filename}`,
                size: req.file.size,
                season: req.body.season, // Save the selected season
                clipAmount: 0, // You may want to determine this dynamically if possible
            });

            await newZip.save();
            res.status(201).json(newZip);
        } catch (error) {
            console.error('Error saving zip info:', error);
            // Clean up file on error
            fs.unlink(req.file.path, () => {});
            res.status(500).json({ message: 'Error saving zip info' });
        }
    });
});

// DELETE a zip
router.delete('/:id', authorizeRoles(['admin']), async (req, res) => {
    try {
        const zip = await Zip.findById(req.params.id);
        if (!zip) {
            return res.status(404).json({ message: 'Zip not found' });
        }

        const filePath = path.join(__dirname, '../..', zip.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await zip.deleteOne();
        res.json({ message: 'Zip deleted successfully' });
    } catch (error) {
        console.error('Error deleting zip:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;