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
    try {
        const { clips, season } = req.body;
        const zip = req.file;

        if (!clips || !zip || !season) {
            return res.status(400).json({ error: 'Missing clips, zip file, or season' });
        }

        const zipPath = path.join(__dirname, 'download', zip.filename);
        const clipsZip = fs.createReadStream(zip.path);
        const clipsZipWriteStream = fs.createWriteStream(zipPath);

        clipsZip.pipe(clipsZipWriteStream);

        clipsZip.on('close', async () => {
            const stats = fs.statSync(zipPath);
            const size = stats.size;
            const clipsCount = clips.length;

            const seasonZip = new SeasonZip({
                url: zipPath,
                season: season,
                name: zip.filename,
                size: size,
                clips: clipsCount,
            });

            await seasonZip.save();

            res.json({ success: true, message: 'Zip file uploaded successfully' });
        });

        clipsZip.on('error', (error) => {
            console.error('Error uploading zip file:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/download', async (req, res) => {
    const { clips } = req.body;

    try {
        const zip = archiver('zip', {
            zlib: { level: 6 }
        });
        res.attachment('clips.zip');

        zip.on('error', (err) => {
            throw err;
        });

        zip.pipe(res);

        const allowedClips = clips.filter(clip => clip.rating !== 'denied');

        const fetchPromises = allowedClips.map(async (clip) => {
            try {
                const { url, streamer, rating, title } = clip;
                const clipContentResponse = await axios.get(url, {
                    responseType: 'arraybuffer',
                });
                zip.append(clipContentResponse.data, { name: `${rating}-${streamer}-${title}.mp4` });
            } catch (clipError) {
                console.error(`Error fetching clip ${clip._id}:`, clipError.message);
            }
        });

        await Promise.all(fetchPromises);

        zip.finalize();
    } catch (error) {
        console.error('Error zipping clips:', error.message);
        res.status(500).send('Error zipping clips');
    }
});

router.post('/process', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const { clips, season } = req.body;
        const zipFilename = `processed-${Date.now()}.zip`;
        const zipPath = path.join(__dirname, 'download', zipFilename);
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
                url: zipPath,
                season: season,
                name: zipFilename,
                size: size,
                clips: allowedClips.length,
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

        fs.unlink(zip.url, async (err) => {
            if (err) {
                console.error('Error deleting zip file:', err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            await SeasonZip.findByIdAndDelete(id);
            res.json({ success: true, message: 'Zip deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting zip:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;