const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const bcrypt = require('bcrypt');
const ffmpeg = require('fluent-ffmpeg');

const Clip = require('../models/clipModel');
const IpVote = require('../models/ipVoteModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');
const searchLimiter = require('./middleware/SearchLimiter');
const clipUpload = require('./storage/ClipUpload');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

/**
 * @swagger
 * tags:
 *   name: clips
 *   description: API for managing clips
 */

/**
 * @swagger
 * /api/clips:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get all clips
 *     responses:
 *       200:
 *         description: OK
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
    try {
        const clips = await Clip.find();
        res.json(clips);
    } catch (error) {
        console.error('Error fetching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/filter-options:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get unique streamers and submitters for filtering
 *     responses:
 *       200:
 *         description: OK
 *       500:
 *         description: Internal Server Error
 */
router.get('/filter-options', async (req, res) => {
    try {
        const clips = await Clip.find({}, 'streamer submitter');
        
        // Extract unique streamers and submitters
        const streamers = [...new Set(clips.map(clip => clip.streamer).filter(Boolean))].sort();
        const submitters = [...new Set(clips.map(clip => clip.submitter).filter(Boolean))].sort();
        
        res.json({
            streamers,
            submitters
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/search:
 *   get:
 *     tags:
 *       - clips
 *     summary: Search clips
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting option (newest, oldest, upvotes, downvotes)
 *       - in: query
 *         name: streamer
 *         schema:
 *           type: string
 *       - in: query
 *         name: submitter
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Missing parameter
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/search', searchLimiter, async (req, res) => {
    let { q, page = 1, limit = 10, sort = 'newest', streamer, submitter } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Missing search query parameter `q`.' });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    try {
        console.log(`Search request: q=${q}, page=${page}, limit=${limit}, sort=${sort}, streamer=${streamer || 'all'}, submitter=${submitter || 'all'}`);
        
        // First get all clips from the database with potential filters
        let query = {};
        if (streamer) query.streamer = streamer;
        if (submitter) query.submitter = submitter;
        
        // Use lean() for better performance with large result sets
        const allClips = await Clip.find(query).lean();
        console.log(`Found ${allClips.length} clips matching base filters`);

        // Perform search with Fuse.js
        const options = {
            keys: ['title', 'streamer', 'submitter'],
            threshold: 0.3,
            includeScore: true, // Include match score for potential relevance sorting
        };
        
        const fuse = new Fuse(allClips, options);
        const searchResults = fuse.search(q);
        console.log(`Search found ${searchResults.length} matching clips`);
        
        if (searchResults.length === 0) {
            return res.status(404).json({ 
                message: `No clips found matching "${q}"${streamer ? ` for streamer "${streamer}"` : ''}${submitter ? ` by submitter "${submitter}"` : ''}.` 
            });
        }
        
        // Apply global sorting to all search results
        let sortedResults;
        switch (sort) {
            case 'oldest':
                sortedResults = searchResults.sort((a, b) => new Date(a.item.createdAt) - new Date(b.item.createdAt));
                console.log('Sorting by oldest first');
                break;
            case 'upvotes':
                sortedResults = searchResults.sort((a, b) => b.item.upvotes - a.item.upvotes);
                console.log('Sorting by most upvotes');
                break;
            case 'downvotes':
                sortedResults = searchResults.sort((a, b) => b.item.downvotes - a.item.downvotes);
                console.log('Sorting by most downvotes');
                break;
            case 'newest':
            default:
                sortedResults = searchResults.sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
                console.log('Sorting by newest first (default)');
                break;
        }
        
        // Calculate pagination values
        const totalResults = sortedResults.length;
        const totalPages = Math.ceil(totalResults / limit);
        
        // Ensure page number is valid
        if (page > totalPages && totalPages > 0) {
            page = totalPages;
        }
        
        // Get the current page of results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = sortedResults.slice(startIndex, endIndex);
        
        // Extract just the clip data from the search results
        const pageClips = paginatedResults.map(result => result.item);
        
        console.log(`Returning page ${page}/${totalPages} with ${pageClips.length} clips`);

        // Send the response with comprehensive metadata
        res.json({
            clips: pageClips,
            currentPage: page,
            totalPages,
            totalClips: totalResults,
            appliedFilters: {
                query: q,
                streamer: streamer || null,
                submitter: submitter || null,
                sort
            }
        });
    } catch (error) {
        console.error('Error searching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/{id}:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get a clip by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Clip not found
 *       500:
 *         description: Internal Server Error
 */
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

router.post('/', authorizeRoles(['uploader', 'admin']), clipUpload.single('clip'), async (req, res) => {
    console.log("=== Handling new clip upload ===");
    try {
        const { streamer, submitter, title, url, link } = req.body;
        console.log("Request body:", { streamer, submitter, title, url, link });

        let fileUrl;
        let thumbnailUrl;
        if (url) {
            fileUrl = url;
            thumbnailUrl = null;
            console.log("Using provided URL:", fileUrl);
        } else if (req.file) {
            fileUrl = `https://api.spoekle.com/uploads/${req.file.filename}`;
            console.log("File uploaded with filename:", req.file.filename);

            // Generate thumbnail
            const thumbnailFilename = `${path.parse(req.file.filename).name}_thumbnail.png`;
            console.log("Generating thumbnail:", thumbnailFilename);

            const uploadPath = path.join(__dirname, '..', 'uploads', req.file.filename);
            await new Promise((resolve, reject) => {
                ffmpeg(uploadPath)
                    .screenshots({
                        timestamps: ['00:00:00.001'],
                        filename: thumbnailFilename,
                        folder: path.join(__dirname, '..', 'uploads'),
                        size: '640x360',
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            thumbnailUrl = `https://api.spoekle.com/uploads/${thumbnailFilename}`;
            console.log("Thumbnail URL:", thumbnailUrl);
        } else {
            console.log("No file or link provided.");
            return res.status(400).json({ error: 'No file or link provided' });
        }

        const newClip = new Clip({ url: fileUrl, thumbnail: thumbnailUrl, streamer, submitter, title, link });
        await newClip.save();

        console.log("New clip saved:", newClip);
        res.json({ success: true, clip: newClip });
    } catch (error) {
        console.error("Error processing clip upload:", error);
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

router.post('/:id/vote/:voteType', async (req, res) => {
    try {
        const clientIp = req.ip;
        const { id, voteType } = req.params;

        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).send('Clip not found');
        }

        const existingVotes = await IpVote.find({ clipId: id });

        for (const vote of existingVotes) {
            if (await bcrypt.compare(clientIp, vote.ip)) {
                if (vote.vote === voteType) {
                    // Same vote => remove vote
                    if (voteType === 'upvote') {
                        clip.upvotes -= 1;
                    } else {
                        clip.downvotes -= 1;
                    }
                    await vote.remove();
                    await clip.save();
                    return res.send(clip);
                } else {
                    // Switching vote
                    if (voteType === 'upvote') {
                        clip.upvotes += 1;
                        clip.downvotes -= 1;
                    } else {
                        clip.downvotes += 1;
                        clip.upvotes -= 1;
                    }
                    vote.vote = voteType;
                    await vote.save();
                    await clip.save();
                    return res.send(clip);
                }
            }
        }

        const hashedIp = await bcrypt.hash(clientIp, 10);
        if (voteType === 'upvote') {
            clip.upvotes += 1;
        } else {
            clip.downvotes += 1;
        }
        const newVote = new IpVote({ clipId: id, ip: hashedIp, vote: voteType });
        await newVote.save();
        await clip.save();
        res.send(clip);
    } catch (error) {
        console.error('Error voting clip:', error.message);
        res.status(500).send('Internal server error');
    }
});

//Comment on post - Store userId correctly
router.post('/:id/comment', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const username = req.user.username;
    const userId = req.user.id;  // Get the user ID from the request

    if (!comment) {
        return res.status(400).json({ error: 'Comment is required' });
    }

    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Store both username and userId
        clip.comments.push({ userId, username, comment });
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

/**
 * Reply to a comment
 */
router.post('/:clipId/comment/:commentId/reply', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  const { clipId, commentId } = req.params;
  const { replyText } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  if (!replyText || replyText.trim() === '') {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  try {
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Find the comment to reply to
    const comment = clip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Add debug logs for the notification
    console.log('Comment user ID:', comment.userId);
    console.log('Current user ID:', userId);

    // Add the reply to the comment
    const reply = {
      userId,
      username,
      replyText,
      createdAt: new Date()
    };
    
    comment.replies.push(reply);
    await clip.save();
    
    // Get the newly created reply's ID
    const newReply = comment.replies[comment.replies.length - 1];

    // Create notification for the original commenter if it's not the same user
    if (comment.userId && comment.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        recipientId: comment.userId,
        senderId: userId,
        senderUsername: username,
        type: 'comment_reply',
        entityId: commentId, // The comment ID
        replyId: newReply._id, // The new reply ID
        clipId: clipId,
        message: `${username} replied to your comment: "${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
      });

      await notification.save();
      console.log('Notification created successfully for user:', comment.userId);
    } else {
      console.log('Notification not created because:',
        !comment.userId ? 'comment.userId is missing' : 'user is replying to their own comment');
    }

    res.json(clip);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Delete a reply
 */
router.delete('/:clipId/comment/:commentId/reply/:replyId', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  const { clipId, commentId, replyId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.roles.includes('admin');

  try {
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    const comment = clip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // Check if the user is the author of the reply or an admin
    if (reply.userId.toString() === userId || isAdmin) {
      reply.remove();
      await clip.save();
      return res.json(clip);
    } else {
      return res.status(403).json({ error: 'You are not authorized to delete this reply' });
    }
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;