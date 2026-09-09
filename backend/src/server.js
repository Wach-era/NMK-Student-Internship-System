const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const twilio = require('twilio');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const internRoutes = require('./routes/internRoutes');

// Import models (for OTP endpoints)
const User = require('./models/User');

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    'https://your-vercel-app.vercel.app',
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('❌ Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(path.join(__dirname, '../public')));

// --- Twilio Client Initialization ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !verifyServiceSid) {
    console.error('❌ Missing Twilio environment variables.');
} else {
    console.log('✅ Twilio configured successfully');
}

const client = twilio(accountSid, authToken);

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/interns', internRoutes);

// --- Twilio OTP Endpoints (Moved HERE after app is defined) ---

// Endpoint to send OTP
app.post('/auth/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

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
        res.status(500).json({ success: false, message: 'Failed to send OTP.', error: error.message });
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
            const user = await User.findOne({ phoneNumber: phoneNumber });
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
                res.status(200).json({
                    success: true,
                    message: 'OTP verified successfully!',
                    status: verificationCheck.status,
                    user: null
                });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid OTP.', status: verificationCheck.status });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP.', error: error.message });
    }
});

// --- Health Check Route ---
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;