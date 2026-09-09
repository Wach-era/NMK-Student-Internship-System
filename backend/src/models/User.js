const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['Staff', 'HR'],
        required: true,
    },
    department: {
        type: String,
        enum: ['ICT', 'Human Resources', 'Finance', 'Marketing', null],
        default: null,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    magicLinkToken: String,
    magicLinkTokenExpires: Date,
    sessionToken: String,
    sessionExpires: Date,
}, {
    timestamps: true,
});

// Indexes for faster lookups
userSchema.index({ magicLinkToken: 1 });
userSchema.index({ sessionToken: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);