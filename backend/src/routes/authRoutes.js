const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { sendMagicLinkEmail } = require('../config/email');

// Request Magic Link Route
router.post('/request-magic-link', async (req, res) => {
    const { department } = req.body;

    if (!department) {
        return res.status(400).json({ message: 'Department is required.' });
    }

    try {
        const user = await User.findOne({ department: department });

        if (!user) {
            return res.status(404).json({ message: 'No user found for this department.' });
        }

        const magicLinkToken = crypto.randomBytes(32).toString('hex');
        const magicLinkTokenExpires = Date.now() + 15 * 60 * 1000;

        user.magicLinkToken = magicLinkToken;
        user.magicLinkTokenExpires = magicLinkTokenExpires;
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const magicLinkUrl = `${frontendUrl}/?token=${magicLinkToken}`;

        await sendMagicLinkEmail(user.email, user.department, magicLinkUrl);

        return res.status(200).json({ 
            message: 'Magic link sent successfully.', 
            email: user.email 
        });

    } catch (err) {
        console.error('Error requesting magic link:', err);
        return res.status(500).json({ message: 'Failed to send magic link.' });
    }
});

// Verify Magic Link Route
router.post('/verify-magic-link', async (req, res) => {
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
            return res.status(401).json({ message: 'Invalid or expired magic link.' });
        }

        // Clear magic link token
        await User.updateOne(
            { _id: user._id },
            { $set: { magicLinkToken: null, magicLinkTokenExpires: null } }
        );

        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await User.updateOne(
            { _id: user._id },
            { $set: { sessionToken, sessionExpires } }
        );

        // Set HTTP-only cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('authToken', sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
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

// Check Session Route
router.get('/check-session', async (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: "No session" });
    }

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

// Logout Route
router.post('/logout', async (req, res) => {
    const token = req.cookies.authToken;

    if (token) {
        await User.updateOne(
            { sessionToken: token },
            { $set: { sessionToken: null, sessionExpires: null } }
        );
    }

    res.clearCookie('authToken');
    res.json({ success: true });
});

module.exports = router;