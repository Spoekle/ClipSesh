const mongoose = require('mongoose');
const User = require('../../models/userModel');

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function removeisAdminRow() {
    const result = await User.updateMany(
        {},
        { $unset: { isAdmin: 1 } }
    );

    console.log(result);
    mongoose.disconnect();
}

removeisAdminRow().catch(err => console.error(err));