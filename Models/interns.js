// models/interns.js

// Import mongoose library to create a database schema
const mongoose = require('mongoose');

// --- NEW: Define the schema (structure) for a single comment ---
// This tells Mongoose what information each comment will have.
const commentSchema = new mongoose.Schema({
    text: { type: String, required: true }, // The actual text of the comment
    author: { type: String, required: true }, // Who wrote the comment (e.g., "Supervisor", "HR")
    timestamp: { type: Date, default: Date.now } // When the comment was added (defaults to current time)
});

// --- Update: Create the main Intern schema (structure of intern data) ---
const internSchema = new mongoose.Schema({
    idNumber: { type: String, required: true, unique: true }, // Unique student ID (your key for finding/deleting/updating)
    fullName: { type: String, required: true },
    institution: { type: String, required: true },
    department: { type: String, required: true }, // The department the intern belongs to
    monthJoined: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    receiptNumber: { type: String, required: true },
    institutionSupervisor: { type: String, required: true },
    attachments: { type: [String], default: [] }, // Array of strings to store file paths (like 'uploads/file1.pdf')
    // --- NEW: Add the comments array to the Intern schema ---
    // This field will store a list of comments, each following the 'commentSchema' structure.
    comments: { type: [commentSchema], default: [] },
    profilePicture: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Suspended', 'Expelled', 'Completed'], default: 'Active' } 

}, {
    timestamps: true // This is a Mongoose option that automatically adds 'createdAt' and 'updatedAt' date fields to your document. Very useful!
});

// Export the Intern model so it can be used in other files (like your server.js)
// 'Intern' will be the name of your collection in MongoDB (it will be pluralized to 'interns' by Mongoose).
module.exports = mongoose.model('Intern', internSchema);