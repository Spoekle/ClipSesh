const mongoose = require('mongoose');

const zipSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    season: {
        type: String,
        required: true,
        enum: ['Spring', 'Summer', 'Fall', 'Winter']
    },
    year: {
        type: Number,
        required: true
    },
    clipAmount: {
        type: Number,
        default: 0
    },
    size: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Zip = mongoose.model('Zip', zipSchema);

module.exports = Zip;
