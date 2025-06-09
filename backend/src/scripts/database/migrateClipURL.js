const mongoose = require('mongoose');
const Clip = require('../../models/clipModel');
const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function updateClips() {
  const result = await Clip.updateMany(
    { url: { $regex: /^\/uploads\// } },
    [{ $set: { url: { $concat: [backendUrl, "$url"] } } }]
  );

  console.log(result);
  mongoose.disconnect();
}

updateClips().catch(err => console.error(err));