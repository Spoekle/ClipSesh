const mongoose = require('mongoose');
const User = require('../../models/userModel');

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function setDefaultProfilePicture() {
  const result = await User.updateMany(
    { profilePicture: 'https://api.spoekle.com/profilePictures/profile_placeholder' },
    { $set: { profilePicture: 'https://api.spoekle.com/profilePictures/profile_placeholder.png' } }
  );

  console.log(result);
  mongoose.disconnect();
}

setDefaultProfilePicture().catch(err => console.error(err));