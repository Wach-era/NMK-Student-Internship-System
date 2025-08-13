const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['Staff', 'HR'], required: true },
    department: {
        type: String,
        required: function() { return this.role === 'Staff'; },
        default: null
    },
    // --- NEW FIELDS for Magic Link Authentication ---
    magicLinkToken: { type: String, default: null },
    magicLinkTokenExpires: { type: Date, default: null },
    sessionToken: { type: String, default: null },
    sessionExpires: { type: Date, default: null }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);

module.exports = User;
