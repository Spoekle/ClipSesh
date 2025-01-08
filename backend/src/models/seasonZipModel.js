const mongoose = require('mongoose');

const seasonZipSchema = new mongoose.Schema({
    url: { type: String, required: true },
    season: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    clipAmount: { type: Number, default: 0 },
}, { timestamps: true });

const SeasonZip = mongoose.model('SeasonZip', seasonZipSchema);

module.exports = SeasonZip;