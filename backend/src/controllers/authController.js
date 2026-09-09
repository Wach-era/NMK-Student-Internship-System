import crypto from 'crypto';
import User from '../models/User.js';
import { sendMagicLinkEmail } from '../config/email.js';
import { generateToken, setAuthCookie } from '../utils/helpers.js';

// @desc    Request magic link
// @route   POST /api/auth/request-magic-link
export const requestMagicLink = async (req, res) => {
  const { department } = req.body;

  if (!department) {
    return res.status(400).json({ message: 'Department is required.' });
  }

  try {
    const user = await User.findOne({ department });

    if (!user) {
      return res.status(404).json({ message: 'No user found for this department.' });
    }

    // Generate magic link token
    const magicLinkToken = crypto.randomBytes(32).toString('hex');
    const magicLinkTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.magicLinkToken = magicLinkToken;
    user.magicLinkTokenExpires = magicLinkTokenExpires;
    await user.save();

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLinkUrl = `${frontendUrl}/?token=${magicLinkToken}`;

    await sendMagicLinkEmail(user.email, user.department, magicLinkUrl);

    console.log(`✅ Magic link sent to ${user.email} for department ${department}`);
    res.status(200).json({
      message: 'Magic link sent successfully.',
      email: user.email,
    });

  } catch (error) {
    console.error('Error requesting magic link:', error);
    res.status(500).json({ message: 'Failed to send magic link.' });
  }
};

// @desc    Verify magic link
// @route   POST /api/auth/verify-magic-link
export const verifyMagicLink = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  try {
    const user = await User.findOne({
      magicLinkToken: token,
      magicLinkTokenExpires: { $gt: new Date() },
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
    const sessionToken = generateToken();
    const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      { $set: { sessionToken, sessionExpires } }
    );

    // Set cookie
    setAuthCookie(res, sessionToken);

    res.status(200).json({
      message: 'Login successful!',
      user: {
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });

  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ message: 'Error verifying magic link.' });
  }
};

// @desc    Check session
// @route   GET /api/auth/check-session
export const checkSession = async (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: 'No session' });
  }

  try {
    const user = await User.findOne({
      sessionToken: token,
      sessionExpires: { $gt: new Date() },
    });

    if (!user) {
      res.clearCookie('authToken');
      return res.status(401).json({ error: 'Invalid session' });
    }

    res.json({
      email: user.email,
      role: user.role,
      department: user.department,
    });

  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  const token = req.cookies.authToken;

  if (token) {
    await User.updateOne(
      { sessionToken: token },
      { $set: { sessionToken: null, sessionExpires: null } }
    );
  }

  res.clearCookie('authToken');
  res.json({ success: true });
};