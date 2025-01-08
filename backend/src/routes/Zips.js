const express = require('express');
const router = express.Router();
const axios = require('axios');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const authorizeRoles = require('./middleware/AuthorizeRoles');
const clipsZipUpload = require('./storage/ClipsZipUpload');
const SeasonZip = require('../models/seasonZipModel');

router.post('/upload', clipsZipUpload.single('clipsZip'), authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    console.log("=== Handling new zip upload ===");
    try {
        const { clipAmount, season } = req.body;
        const zip = req.file;

        if (!clipAmount || !zip || !season) {
            return res.status(400).json({ error: 'Missing clips, zip file, or season' });
        }

        console.log("Request body:", { clipAmount, season });
        console.log("File uploaded with filename:", zip.filename);

        const stats = fs.statSync(zip.path); // Use zip.path to get the file path

        // Only store the path and metadata in the database
        const seasonZip = new SeasonZip({
            url: `https://api.spoekle.com/download/${zip.filename}`,
            season,
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

router.post('/process', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { clips, season } = req.body;
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

            const seasonZip = new SeasonZip({
                url: `https://api.spoekle.com/download/${zipFilename}`, 
                season: season,
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
        const zips = await SeasonZip.find();
        res.json(zips);
    } catch (error) {
        console.error('Error fetching zips:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const zip = await SeasonZip.findById(id);

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