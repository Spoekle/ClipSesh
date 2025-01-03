const mongoose = require('mongoose');

const adminConfigSchema = new mongoose.Schema({
    denyThreshold: { type: Number, default: 5 },
    latestVideoLink: { type: String, default: '' }
  });
  
  const AdminConfig = mongoose.model('AdminConfig', adminConfigSchema);

module.exports = AdminConfig;