const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Intern = require('../models/Intern');

// --- Multer File Upload Setup ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- Intern Routes ---

// Add Intern Route (POST)
router.post('/', upload.fields([
    { name: 'letter', maxCount: 1 },
    { name: 'idCopy', maxCount: 1 },
    { name: 'acceptanceLetter', maxCount: 1 },
    { name: 'receiptCopy', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
]), async (req, res) => {
    try {
        const internData = req.body;
        const attachments = [];
        let profilePicturePath = '';

        if (req.files) {
            for (const fieldName of ['letter', 'idCopy', 'acceptanceLetter', 'receiptCopy']) {
                if (req.files[fieldName] && req.files[fieldName][0]) {
                    attachments.push(req.files[fieldName][0].path);
                }
            }
            if (req.files['profilePicture'] && req.files['profilePicture'][0]) {
                profilePicturePath = req.files['profilePicture'][0].path;
            }
        }

        internData.attachments = attachments;
        internData.profilePicture = profilePicturePath;
        internData.comments = [];

        if (req.body.staffEmail) {
            internData.addedByStaffEmail = req.body.staffEmail;
        }

        const newIntern = new Intern(internData);
        await newIntern.save();

        res.status(201).json({ message: 'Intern added successfully', intern: newIntern });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({ message: 'Validation failed', errors: errors });
        }
        res.status(500).json({ message: 'Error adding intern' });
    }
});

// Get All Interns (GET)
router.get('/', async (req, res) => {
    try {
        const { department } = req.query;
        let interns;

        if (department) {
            interns = await Intern.find({ department: department });
        } else {
            interns = await Intern.find();
        }

        res.json(interns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching interns' });
    }
});

// Update Intern by ID Number (PUT)
router.put('/:idNumber', upload.fields([
    { name: 'letter', maxCount: 1 },
    { name: 'idCopy', maxCount: 1 },
    { name: 'acceptanceLetter', maxCount: 1 },
    { name: 'receiptCopy', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
]), async (req, res) => {
    try {
        const internIdNumber = req.params.idNumber;
        const internData = req.body;
        const newAttachments = [];
        let newProfilePicturePath = '';

        if (req.files) {
            for (const fieldName of ['letter', 'idCopy', 'acceptanceLetter', 'receiptCopy']) {
                if (req.files[fieldName] && req.files[fieldName][0]) {
                    newAttachments.push(req.files[fieldName][0].path);
                }
            }
            if (req.files['profilePicture'] && req.files['profilePicture'][0]) {
                newProfilePicturePath = req.files['profilePicture'][0].path;
            }
        }

        const existingIntern = await Intern.findOne({ idNumber: internIdNumber });

        if (existingIntern) {
            internData.attachments = [...(existingIntern.attachments || []), ...newAttachments];
            internData.profilePicture = newProfilePicturePath || existingIntern.profilePicture;
            if (!internData.comments) {
                internData.comments = existingIntern.comments;
            }
            if (req.body.staffEmail) {
                internData.updatedByStaffEmail = req.body.staffEmail;
            }
        } else {
            internData.attachments = newAttachments;
            internData.profilePicture = newProfilePicturePath;
            internData.comments = [];
        }

        const updatedIntern = await Intern.findOneAndUpdate(
            { idNumber: internIdNumber },
            internData,
            { new: true, runValidators: true }
        );

        if (!updatedIntern) {
            return res.status(404).json({ message: 'Intern not found' });
        }

        res.json({ message: 'Intern updated successfully', intern: updatedIntern });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({ message: 'Validation failed', errors: errors });
        }
        res.status(500).json({ message: 'Error updating intern' });
    }
});

// Update Intern Status (PATCH)
router.patch('/:idNumber/status', async (req, res) => {
    try {
        const internIdNumber = req.params.idNumber;
        const { status, hrEmail } = req.body;

        const allowedStatuses = ['Active', 'Suspended', 'Expelled', 'Completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const updateFields = { status: status };
        if (hrEmail) {
            updateFields.statusChangedByHREmail = hrEmail;
        }

        const updatedIntern = await Intern.findOneAndUpdate(
            { idNumber: internIdNumber },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedIntern) {
            return res.status(404).json({ message: 'Intern not found' });
        }

        res.json({ message: `Intern status updated to ${status} successfully`, intern: updatedIntern });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({ message: 'Validation failed', errors: errors });
        }
        res.status(500).json({ message: 'Error updating intern status' });
    }
});

// Delete Intern (DELETE)
router.delete('/:idNumber', async (req, res) => {
    try {
        const internIdNumber = req.params.idNumber;

        const internToDelete = await Intern.findOne({ idNumber: internIdNumber });

        if (!internToDelete) {
            return res.status(404).json({ message: 'Intern not found' });
        }

        // Delete files
        if (internToDelete.attachments && internToDelete.attachments.length > 0) {
            internToDelete.attachments.forEach(filePath => {
                const fullPath = path.join(__dirname, '../', filePath);
                fs.unlink(fullPath, (err) => {
                    if (err) console.error(`Error deleting attachment file ${fullPath}:`, err);
                });
            });
        }
        if (internToDelete.profilePicture) {
            const fullPath = path.join(__dirname, '../', internToDelete.profilePicture);
            fs.unlink(fullPath, (err) => {
                if (err) console.error(`Error deleting profile picture file ${fullPath}:`, err);
            });
        }

        await Intern.findOneAndDelete({ idNumber: internIdNumber });

        res.json({ message: 'Intern deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting intern' });
    }
});

// Add Comment for an Intern (POST)
router.post('/:idNumber/comments', async (req, res) => {
    try {
        const internIdNumber = req.params.idNumber;
        const { text, author, authorEmail } = req.body;

        if (!text || !author || !authorEmail) {
            return res.status(400).json({ message: 'Comment text, author, and author email are required.' });
        }

        const intern = await Intern.findOne({ idNumber: internIdNumber });

        if (!intern) {
            return res.status(404).json({ message: 'Intern not found' });
        }

        intern.comments.push({ text, author, authorEmail, timestamp: new Date() });
        await intern.save();

        res.status(200).json({ message: 'Comment added successfully', intern: intern });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

module.exports = router;