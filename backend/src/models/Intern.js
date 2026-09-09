const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    authorEmail: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const internSchema = new mongoose.Schema({
    idNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    institution: {
        type: String,
        required: true,
        trim: true,
    },
    department: {
        type: String,
        required: true,
        enum: ['ICT', 'Human Resources', 'Finance', 'Marketing'],
    },
    monthJoined: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0,
    },
    receiptNumber: {
        type: String,
        required: true,
        trim: true,
    },
    institutionSupervisor: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Expelled', 'Completed'],
        default: 'Active',
    },
    profilePicture: {
        type: String,
        default: '',
    },
    attachments: [{
        type: String,
    }],
    comments: [commentSchema],
    addedByStaffEmail: {
        type: String,
    },
    updatedByStaffEmail: {
        type: String,
    },
    statusChangedByHREmail: {
        type: String,
    },
}, {
    timestamps: true,
});

// Update timestamp on save
internSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Intern', internSchema);