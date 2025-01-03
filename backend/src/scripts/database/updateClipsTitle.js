const mongoose = require('mongoose');
const Clip = require('../../models/clipModel');

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true }) // Replace 'yourDatabaseName' with your actual database name
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function updateClips() {
  const result = await Clip.updateMany(
    { submitter: { $exists: false } },
    { $set: { submitter: 'Legacy(no data)' } }
  );

  console.log(result);
  mongoose.disconnect();
}

updateClips().catch(err => console.error(err));