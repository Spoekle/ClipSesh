const mongoose = require('mongoose');

const seasonZipSchema = new mongoose.Schema({
    url: { type: String, required: true },
    season: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    clips: { type: Number, required: true },
}, { timestamps: true });

const SeasonZip = mongoose.model('SeasonZip', seasonZipSchema);

module.exports = SeasonZip;