const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const Clip = require('../../models/clipModel');

mongoose.connect('mongodb://mongo:27017/clipsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB:', err));

async function generateThumbnails() {
  try {
    const clips = await Clip.find({ thumbnail: { $exists: true } });

    for (const clip of clips) {
      if (clip.url && clip.url.includes('https://api.spoekle.com/uploads/')) {
        const filename = path.basename(clip.url);
        const inputPath = path.join(__dirname, '..', '..', 'uploads', filename);

        if (!fs.existsSync(inputPath)) {
          console.log(`File not found locally for clip ${clip._id}, skipping`);
          continue;
        }

        const thumbnailFilename = `${path.parse(filename).name}_thumbnail.png`;
        const thumbnailPath = path.join(__dirname, '..', '..', 'uploads', thumbnailFilename);

        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .screenshots({
              timestamps: ['00:00:00.001'],
              filename: thumbnailFilename,
              folder: path.join(__dirname, '..', '..', 'uploads'),
              size: '640x360',
            })
            .on('end', resolve)
            .on('error', reject);
        });

        clip.thumbnail = `https://api.spoekle.com/uploads/${thumbnailFilename}`;
        await clip.save();

        console.log(`Thumbnail generated for clip ${clip._id}: ${clip.thumbnail}`);
      }
    }
  } catch (err) {
    console.error('Error generating thumbnails:', err);
  } finally {
    mongoose.disconnect();
  }
}

generateThumbnails().catch((err) => console.error(err));