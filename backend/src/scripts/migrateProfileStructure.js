const mongoose = require('mongoose');
const User = require('../models/userModel');

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/clipsesh';

const migrateProfileStructure = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all users without a proper profile structure
    const usersWithoutProfile = await User.find({
      $or: [
        { profile: { $exists: false } },
        { profile: null },
        { 'profile.isPublic': { $exists: false } }
      ]
    });

    console.log(`Found ${usersWithoutProfile.length} users that need profile structure migration`);

    for (const user of usersWithoutProfile) {
      console.log(`Migrating user: ${user.username} (${user._id})`);
      
      // Initialize profile with default values
      const profileUpdate = {
        'profile.bio': '',
        'profile.website': '',
        'profile.socialLinks': {
          youtube: '',
          twitch: '',
          twitter: '',
          instagram: '',
          github: ''
        },
        'profile.isPublic': true,
        'profile.lastActive': new Date(),
        'profile.trophies': []
      };

      await User.findByIdAndUpdate(user._id, { $set: profileUpdate });
    }

    console.log('Profile structure migration completed successfully');
  } catch (error) {
    console.error('Error during profile structure migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateProfileStructure();
}

module.exports = migrateProfileStructure;
