const mongoose = require('mongoose');
const Clip = require('../../models/clipModel');

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function deleteClipById(clipId) {
  try {
    if (!clipId) {
      console.error('No clip ID provided. Usage: node removeAdminRow.js <clipId>');
      mongoose.disconnect();
      return;
    }

    const clip = await Clip.findById(clipId);
    if (!clip) {
      console.error(`Clip with ID ${clipId} not found`);
      mongoose.disconnect();
      return;
    }

    const result = await Clip.deleteOne({ _id: clipId });
    
    if (result.deletedCount === 1) {
      console.log(`Successfully deleted clip with ID: ${clipId}`);
    } else {
      console.log(`Failed to delete clip with ID: ${clipId}`);
    }
  } catch (err) {
    console.error(`Error deleting clip: ${err.message}`);
  } finally {
    mongoose.disconnect();
  }
}

// Get clip ID from command line arguments
const clipId = process.argv[2];
deleteClipById(clipId).catch(err => console.error(err));