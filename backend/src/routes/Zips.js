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
                // Skip the failed clip instead of throwing
            }
        });

        await Promise.all(fetchPromises);

        zip.finalize();
    } catch (error) {
        console.error('Error zipping clips:', error.message);
        res.status(500).send('Error zipping clips');
    }
});

module.exports = router;