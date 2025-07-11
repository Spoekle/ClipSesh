const mongoose = require('mongoose');
const Clip = require('../../models/clipModel');
const { PublicConfig } = require('../../models/configModel');

async function updateClipCount() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/clipsDB');
    console.log('Connected to MongoDB');
    
    // Get clip counts
    const totalClips = await Clip.countDocuments();
    const activeClips = await Clip.countDocuments({ archived: { $ne: true } });
    const archivedClips = await Clip.countDocuments({ archived: true });
    
    console.log('\nCurrent clip counts:');
    console.log('- Total clips:', totalClips);
    console.log('- Active clips:', activeClips);
    console.log('- Archived clips:', archivedClips);
    
    // Update the config with active clips count
    const result = await PublicConfig.findOneAndUpdate(
      {}, 
      { clipAmount: activeClips }, 
      { upsert: true, new: true }
    );
    
    console.log('\nUpdated clipAmount in config to:', result.clipAmount);
    console.log('Update completed successfully!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the update
updateClipCount();
