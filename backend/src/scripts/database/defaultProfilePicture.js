const mongoose = require('mongoose');
const User = require('../../models/userModel');
const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function setDefaultProfilePicture() {
  const result = await User.updateMany(
    { profilePicture: `${backendUrl}/profilePictures/profile_placeholder` },
    { $set: { profilePicture: `${backendUrl}/profilePictures/profile_placeholder.png` } }
  );

  console.log(result);
  mongoose.disconnect();
}

setDefaultProfilePicture().catch(err => console.error(err));