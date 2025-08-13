// server.js

// Import necessary tools for our server
const express = require('express'); // Express helps us build the web server
const mongoose = require('mongoose'); // Mongoose helps us work with MongoDB database
const cors = require('cors'); // CORS allows your frontend (web page) to talk to this backend server
const multer = require('multer'); // Multer is a tool to handle file uploads
const path = require('path'); // Path helps us work with file and directory paths
const fs = require('fs'); // File System module for deleting files
const crypto = require('crypto'); // Node.js built-in module for cryptographic functions (for tokens)
const nodemailer = require('nodemailer');


const cookieParser = require('cookie-parser'); // ← Add this

// --- NEW: Import dotenv and Twilio ---
require('dotenv').config(); // Load environment variables from .env file. This should be at the very top.
const twilio = require('twilio'); // Twilio helper library
// --- END NEW ---

// Import the Mongoose models
const Intern = require('./Models/interns');
const User = require('./Models/user');

// Create our Express application
const app = express();
app.use(cookieParser()); // ← Add this before routes

// --- Middleware ---
app.use(cors());
app.use(express.json()); // For JSON payloads
app.use('/uploads', express.static('uploads')); // Serve static files from 'uploads'
app.use(express.static(path.join(__dirname, 'public')));


// --- NEW: Twilio Client Initialization ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // The SID of your Twilio Verify Service

// Basic check to ensure Twilio env vars are loaded
if (!accountSid || !authToken || !verifyServiceSid) {
    console.error('ERROR: Missing Twilio environment variables. Please check your .env file for TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.');
    // In a production app, you might want to gracefully exit or prevent OTP functionality from starting.
}

const client = twilio(accountSid, authToken);
// --- END NEW ---

const departmentSenders = {
  'ICT': process.env.ICT_EMAIL, 
  'Human Resources': process.env.HR_EMAIL,
  'Finance': process.env.FINANCE_EMAIL,
  'Marketing': process.env.MARKETING_EMAIL,
};

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: process.env.BREVO_SMTP_PORT,
    secure: false, // Brevo uses port 587 without a secure connection
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

// --- Multer File Upload Setup ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// // --- Dummy User Seeding (simplified) ---
// async function seedUsers() {
//     try {
//         // Staff user for ICT department
//         const ictStaffUser = await User.findOne({ email: 'ictstaff@nmk.org' });
//         if (!ictStaffUser) {
//             await User.create({ email: 'ictstaff@nmk.org', role: 'Staff', department: 'ICT' });
//             console.log('Dummy Staff user created: ictstaff@nmk.org (ICT Department)');
//         }

//         // HR user (no specific department, can view all)
//         const hrUser = await User.findOne({ email: 'hr@nmk.org' });
//         if (!hrUser) {
//             await User.create({ email: 'hr@nmk.org', role: 'HR', department: null }); // HR has no specific department
//             console.log('Dummy HR user created: hr@nmk.org');
//         }
//         console.log('User seeding complete.');
//     } catch (error) {
//         console.error('Error seeding users:', error);
//     }
// }

// --- ORIGINAL: Magic Link Authentication Routes ---
// Add this near your other auth routes
app.post('/auth/login', async (req, res) => {
  try {
    // After successful email verification
    const token = generateToken(user); // Your token generation logic
    
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day expiry
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Add this verification endpoint
app.get('/auth/verify-session', async (req, res) => {
  try {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: "No session" });

    const decoded = verifyToken(token); // Your JWT verification
    res.json({ 
      email: decoded.email, 
      role: decoded.role, 
      department: decoded.department 
    });
  } catch (error) {
    res.clearCookie('authToken');
    res.status(401).json({ error: "Invalid session" });
  }
});

// Add to your logout endpoint
app.post('/auth/logout', async (req, res) => {
    const token = req.cookies.authToken;
    if (token) {
        await User.findOneAndUpdate(
            { sessionToken: token },
            { $set: { sessionToken: null, sessionExpires: null } }
        );
    }
    res.clearCookie('authToken');
    res.json({ success: true });
});

// Request Magic Link Route
app.post('/auth/request-magic-link', async (req, res) => {
    const { department } = req.body;

    if (!department) {
        return res.status(400).json({ message: 'Department is required.' });
    }

    try {
        // [1] Find the user based on the department
        // The recipient's email is retrieved directly from this user object
        const user = await User.findOne({ department: department });

        if (!user) {
            return res.status(404).json({ message: 'No user found for this department.' });
        }

        // [2] Generate a magic link token
        const magicLinkToken = crypto.randomBytes(32).toString('hex');
        const magicLinkTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

        // [3] Save the token to the user's profile
        user.magicLinkToken = magicLinkToken;
        user.magicLinkTokenExpires = magicLinkTokenExpires;
        await user.save();

        // [4] Construct the magic link URL
        const magicLinkUrl = `${req.protocol}://${req.get('host')}/?token=${magicLinkToken}`;

        // [5] Set up the email options
        const mailOptions = {
            // The sender is now a single, hardcoded address for all departments
            from: `"NMK Intern Management - ${user.department}" <hillarybrucewachira@gmail.com`,
            // The recipient is retrieved from the database
            to: user.email, 
            subject: 'Your NMK Intern Management Login Link',
            html: `<p>Hello ${user.department} Staff,</p>
                   <p>You recently requested a login link for the NMK Intern Management System.</p>
                   <p><a href="${magicLinkUrl}">Click here to log in</a></p>
                   <p>This link is valid for 15 minutes.</p>
                   <p>If you did not request this, please ignore this email.</p>`,
        };

        // [6] Send the email
        await transporter.sendMail(mailOptions);
        
        console.log(`Magic link sent to ${user.email} for department ${department}.`);

        // [7] Respond to the front-end
        return res.status(200).json({ message: 'Magic link sent successfully.', email: user.email });

    } catch (err) {
        console.error('Error requesting magic link:', err);
        return res.status(500).json({ message: 'Failed to send magic link.' });
    }
});

app.get('/auth/check-session', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: "No session" });

    try {
        const user = await User.findOne({
            sessionToken: token,
            sessionExpires: { $gt: new Date() }
        });

        if (!user) {
            res.clearCookie('authToken');
            return res.status(401).json({ error: "Invalid session" });
        }

        res.json({
            email: user.email,
            role: user.role,
            department: user.department
        });
    } catch (error) {
        console.error('Session check error:', error);
        res.status(500).json({ error: "Server error" });
    }
});
// Verify Magic Link Route
// Update your verify-magic-link endpoint
app.post('/auth/verify-magic-link', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Token is required.' });
    }

    try {
        const user = await User.findOne({
            magicLinkToken: token,
            magicLinkTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            await User.updateMany(
                { magicLinkToken: token },
                { $set: { magicLinkToken: null, magicLinkTokenExpires: null } }
            );
            return res.status(401).json({ message: 'Invalid or expired magic link token.' });
        }

        // Clear the one-time token
        await User.updateOne({ _id: user._id }, { 
            magicLinkToken: null, 
            magicLinkTokenExpires: null 
        });

        // Generate a persistent session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
        
        // Store session in database
        await User.updateOne({ _id: user._id }, { 
            sessionToken,
            sessionExpires
        });

        // Set HTTP-only cookie
        res.cookie('authToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            message: 'Login successful!',
            user: {
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Error verifying magic link:', error);
        res.status(500).json({ message: 'Error verifying magic link.' });
    }
});

// --- NEW: Twilio OTP Endpoints ---

// Endpoint to send OTP
app.post('/auth/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    // Optional: Validate phone number format before sending
    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });

        console.log(`OTP sent status: ${verification.status} to ${phoneNumber}`);
        res.json({ success: true, message: 'OTP sent successfully!', status: verification.status });
    } catch (error) {
        console.error('Error sending OTP:', error);
        // Twilio errors often have a 'moreInfo' URL for debugging
        res.status(500).json({ success: false, message: 'Failed to send OTP.', error: error.message, moreInfo: error.moreInfo });
    }
});

// Endpoint to verify OTP
app.post('/auth/verify-otp', async (req, res) => {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
        return res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
    }

    try {
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });

        console.log(`OTP verification status for ${phoneNumber}: ${verificationCheck.status}`);

        if (verificationCheck.status === 'approved') {
            // If OTP is the *sole* login method, you would now fetch the user details
            // associated with this phone number from your database and return them.
            // For now, let's just confirm success. If your system requires an email
            // after OTP for login, this is where you'd transition.
            // Assuming this is a complete login step:
            const user = await User.findOne({ contactPhone: phoneNumber }); // Assuming your User model has a contactPhone field
            if (user) {
                res.status(200).json({
                    success: true,
                    message: 'OTP verified and login successful!',
                    status: verificationCheck.status,
                    user: {
                        email: user.email,
                        role: user.role,
                        department: user.department
                    }
                });
            } else {
                // If no user found by phone number after OTP, you might want a registration flow
                res.status(200).json({
                    success: true,
                    message: 'OTP verified successfully! No user associated with this phone number found.',
                    status: verificationCheck.status,
                    user: null // Or prompt for registration
                });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid OTP.', status: verificationCheck.status });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP.', error: error.message, moreInfo: error.moreInfo });
    }
});
// --- END NEW ---

app.use(cors({
    origin: 'http://localhost:5000', // Your React app's URL
    credentials: true
}));
app.use(cookieParser());
// --- Intern Management Routes (No changes needed here from previous step) ---

// Add Intern Route (POST)
app.post('/interns', upload.fields([
    { name: 'letter', maxCount: 1 }, { name: 'idCopy', maxCount: 1 },
    { name: 'acceptanceLetter', maxCount: 1 }, { name: 'receiptCopy', maxCount: 1 },
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

// Get All Interns Route (GET)
app.get('/interns', async (req, res) => {
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

// Update Intern by ID Number Route (PUT)
app.put('/interns/:idNumber', upload.fields([
    { name: 'letter', maxCount: 1 }, { name: 'idCopy', maxCount: 1 },
    { name: 'acceptanceLetter', maxCount: 1 }, { name: 'receiptCopy', maxCount: 1 },
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

// Update Intern Status by ID Number (PATCH)
app.patch('/interns/:idNumber/status', async (req, res) => {
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


// Delete Intern by ID Number Route (DELETE)
app.delete('/interns/:idNumber', async (req, res) => {
    try {
        const internIdNumber = req.params.idNumber;

        const internToDelete = await Intern.findOne({ idNumber: internIdNumber });

        if (!internToDelete) {
            return res.status(404).json({ message: 'Intern not found' });
        }

        if (internToDelete.attachments && internToDelete.attachments.length > 0) {
            internToDelete.attachments.forEach(filePath => {
                const fullPath = path.join(__dirname, filePath);
                fs.unlink(fullPath, (err) => {
                    if (err) { console.error(`Error deleting attachment file ${fullPath}:`, err); }
                    else { console.log(`Successfully deleted attachment file: ${fullPath}`); }
                });
            });
        }
        if (internToDelete.profilePicture) {
            const fullPath = path.join(__dirname, internToDelete.profilePicture);
            fs.unlink(fullPath, (err) => {
                if (err) { console.error(`Error deleting profile picture file ${fullPath}:`, err); }
                else { console.log(`Successfully deleted profile picture file: ${fullPath}`); }
            });
        }

        const deletedIntern = await Intern.findOneAndDelete({ idNumber: internIdNumber });

        res.json({ message: 'Intern deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting intern' });
    }
});

// Add Comment for an Intern (POST)
app.post('/interns/:idNumber/comments', async (req, res) => {
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

// --- NEW: Admin Routes for Postman ---
// Add this route to your server.js file
app.post('/api/users/update-department', async (req, res) => {
    const { email, department } = req.body;

    if (!email || !department) {
        return res.status(400).json({ message: 'Email and department are required.' });
    }

    try {
        const user = await User.updateOne(
            { email: email },
            { $set: { department: department } }
        );

        if (user.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: `User ${email} updated successfully.`, user });
    } catch (error) {
        console.error('Error updating user department:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Add this route to create a new user
app.post('/api/users/create', async (req, res) => {
    const { email, role, department } = req.body;

    if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required.' });
    }
    
    try {
        const newUser = await User.create({ email, role, department });
        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- MongoDB Connection ---
mongoose.connect('mongodb://127.0.0.1:27017/student-internship-db')
    .then(() => {
        console.log('✅ Connected to MongoDB');
        //seedUsers();
    })
    .catch((error) => console.error('❌ MongoDB connection failed:', error));

// --- Start the Server ---
const PORT = 5000; // Retaining original port
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});