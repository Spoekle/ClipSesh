const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    clipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clip', required: true },
    ratings: {
      '1': [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, username: { type: String } }],
      '2': [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, username: { type: String } }],
      '3': [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, username: { type: String } }],
      '4': [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, username: { type: String } }],
      'deny': [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, username: { type: String } }],
    },
    createdAt: { type: Date, default: Date.now }
  });
  
  const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;