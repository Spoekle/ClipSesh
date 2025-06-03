const mongoose = require('mongoose');
const Clip = require('../models/clipModel');
const User = require('../models/userModel');
require('../config/config');

mongoose.connect('mongodb://mongo:27017/clipsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB for migration');
  migrateComments();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

async function migrateComments() {
  try {
    // Find all clips with comments
    const clips = await Clip.find({ "comments.0": { $exists: true } });
    console.log(`Found ${clips.length} clips with comments`);

    let totalComments = 0;
    let updatedComments = 0;
    
    for (const clip of clips) {
      let clipUpdated = false;
      
      for (const comment of clip.comments) {
        totalComments++;
        
        if (!comment.userId) {
          // Try to find a user with this username
          const user = await User.findOne({ username: comment.username });
          
          if (user) {
            comment.userId = user._id;
            clipUpdated = true;
            updatedComments++;
            console.log(`Updated userId for comment by ${comment.username}`);
          } else {
            console.log(`Could not find user for username: ${comment.username}`);
          }
        }
      }
      
      if (clipUpdated) {
        await clip.save();
        console.log(`Saved clip ${clip._id} with updated comments`);
      }
    }
    
    console.log(`Migration complete: Updated ${updatedComments} out of ${totalComments} comments`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Migration error:', error);
    mongoose.disconnect();
  }
}
