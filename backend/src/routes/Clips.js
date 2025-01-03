const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const bcrypt = require('bcrypt');

const Clip = require('../models/clipModel');
const IpVote = require('../models/ipVoteModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');
const searchLimiter = require('./middleware/SearchLimiter');
const clipUpload = require('./storage/ClipUpload');


router.get('/', async (req, res) => {
    try {
        const clips = await Clip.find();
        res.json(clips);
    } catch (error) {
        console.error('Error fetching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/search', searchLimiter, async (req, res) => {
    let { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Missing search query parameter `q`.' });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    try {
        const allClips = await Clip.find().sort({ createdAt: -1 });

        const options = {
            keys: ['title', 'streamer', 'submitter'],
            threshold: 0.3,
        };
        const fuse = new Fuse(allClips, options);

        const results = fuse.search(q);
        const clips = results.slice(skip, skip + limit).map(result => result.item);

        if (clips.length === 0) {
            return res.status(404).json({ message: `No clips found matching "${q}".` });
        }

        const totalClips = results.length;

        res.json({
            clips,
            currentPage: page,
            totalPages: Math.ceil(totalClips / limit),
            totalClips,
        });
    } catch (error) {
        console.error('Error searching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }
        res.json(clip);
    } catch (error) {
        console.error('Error fetching clip:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/upload', authorizeRoles(['uploader', 'admin']), clipUpload.single('clip'), async (req, res) => {
    try {
        const { streamer, submitter, title, url, link } = req.body;

        let fileUrl;
        if (url) {
            fileUrl = url;
        } else if (req.file) {
            fileUrl = `https://api.spoekle.com/uploads/${req.file.filename}`;
        } else {
            return res.status(400).json({ error: 'No file or link provided' });
        }

        const newClip = new Clip({ url: fileUrl, streamer, submitter, title, link });
        await newClip.save();
        res.json({ success: true, clip: newClip });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', authorizeRoles(['uploader', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { streamer, submitter, title } = req.body;

    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        if (streamer !== undefined) {
            clip.streamer = streamer;
        }

        if (submitter !== undefined) {
            clip.submitter = submitter;
        }

        if (title !== undefined) {
            clip.title = title;
        }

        await clip.save();

        res.json({ message: 'Clip updated successfully', clip });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const clip = await Clip.findById(id);
        if (clip) {
            try {
                fs.unlinkSync(path.join(__dirname, 'uploads', path.basename(clip.url)));
            } catch (error) {
                console.error("Error removing file:", error.message);
            }
            await clip.remove();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Clip not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/', authorizeRoles(['admin']), async (req, res) => {
    try {
        await Clip.deleteMany({});
        const files = fs.readdirSync(path.join(__dirname, 'uploads'));
        for (const file of files) {
            fs.unlinkSync(path.join(__dirname, 'uploads', file));
        }
        res.json({ success: true, message: 'All clips deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:id/upvote', async (req, res) => {
    const clientIp = req.ip;
    const clipId = req.params.id;

    try {
        const clip = await Clip.findById(clipId);
        if (!clip) {
            return res.status(404).send('Clip not found');
        }

        const existingVotes = await IpVote.find({ clipId });

        for (let vote of existingVotes) {
            if (await bcrypt.compare(clientIp, vote.ip)) {
                if (vote.vote === 'upvote') {
                    clip.upvotes -= 1;
                    await vote.remove();
                    await clip.save();
                    return res.send(clip);
                } else {
                    clip.downvotes -= 1;
                    clip.upvotes += 1;
                    vote.vote = 'upvote';
                    await vote.save();
                    await clip.save();
                    return res.send(clip);
                }
            }
        }

        const hashedIp = await bcrypt.hash(clientIp, 10);
        clip.upvotes += 1;
        const newVote = new IpVote({ clipId, ip: hashedIp, vote: 'upvote' });
        await newVote.save();
        await clip.save();
        res.send(clip);
    } catch (error) {
        console.error('Error upvoting clip:', error.message);
        res.status(500).send('Internal server error');
    }
});

router.post('/:id/downvote', async (req, res) => {
    const clientIp = req.ip;
    const clipId = req.params.id;

    try {
        const clip = await Clip.findById(clipId);
        if (!clip) {
            return res.status(404).send('Clip not found');
        }

        const existingVotes = await IpVote.find({ clipId });

        for (let vote of existingVotes) {
            if (await bcrypt.compare(clientIp, vote.ip)) {
                if (vote.vote === 'downvote') {
                    clip.downvotes -= 1;
                    await vote.remove();
                    await clip.save();
                    return res.send(clip);
                } else {
                    clip.upvotes -= 1;
                    clip.downvotes += 1;
                    vote.vote = 'downvote';
                    await vote.save();
                    await clip.save();
                    return res.send(clip);
                }
            }
        }

        const hashedIp = await bcrypt.hash(clientIp, 10);
        clip.downvotes += 1;
        const newVote = new IpVote({ clipId, ip: hashedIp, vote: 'downvote' });
        await newVote.save();
        await clip.save();
        res.send(clip);
    } catch (error) {
        console.error('Error downvoting clip:', error.message);
        res.status(500).send('Internal server error');
    }
});

//Comment on post
router.post('/:id/comment', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const username = req.user.username;

    if (!comment) {
        return res.status(400).json({ error: 'Comment is required' });
    }

    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Post not found' });
        }

        clip.comments.push({ username, comment });
        await clip.save();

        res.json(clip);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a comment from a post
router.delete('/:clipId/comment/:commentId', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
    const { clipId, commentId } = req.params;
    const username = req.user.username;

    try {
        const clip = await Clip.findById(clipId);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        const comment = clip.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.username == username || req.user.roles.includes('admin')) {
            comment.remove();
            await clip.save();
            return res.json(clip);
        } else {
            return res.status(403).json({ error: 'Forbidden: You do not have the required permissions' });
        }

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;