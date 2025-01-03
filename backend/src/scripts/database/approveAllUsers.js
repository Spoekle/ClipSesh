const mongoose = require('mongoose');
const User = require('../../models/userModel');

mongoose.connect('mongodb://mongo:27017/clipsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

async function convertRoleToRoles() {
  const result = await User.updateMany(
    { role: { $exists: true } },
    [
      { $set: { roles: ["$role"] } },
      { $unset: "role" }
    ]
  );
  console.log(result);
  mongoose.disconnect();
}

convertRoleToRoles().catch(err => console.error(err));