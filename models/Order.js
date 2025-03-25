const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    noodleType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'cooking', 'ready', 'paid'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema); 