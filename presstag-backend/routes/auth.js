///backend > routes/auth.js | Authentication routes for handling user registration, login, and token management.///
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { Resend } = require('resend');
const crypto = require('crypto');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

router.post('/register', async (req, res) => {
  try {
    const user = await User.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.login(email, password);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Token refresh endpoint
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { getDB } = require('../config/db');
    const db = getDB(req.tenantId);

    const user = await db.collection('users').findOne({ email });

    // Always return success even if email not found (security best practice)
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Save token to user
    await db.collection('users').updateOne(
      { email },
      { $set: { resetToken, resetTokenExpiry } }
    );

    // Build reset URL matching /reset-password/[slug] page structure
    const resetUrl = `${process.env.ADMIN_URL}/reset-password/${resetToken}`;

    if (resend) {
      await resend.emails.send({
        from: 'PressTag <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your PressTag password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1d4ed8;">Reset your password</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset Password
            </a>
            <p style="color:#6b7280;font-size:13px;">If you didn't request this, ignore this email.</p>
          </div>
        `
      });
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// POST /auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const { getDB } = require('../config/db');
    const db = getDB(req.tenantId);

    // Find user with valid non-expired token
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear token
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword, updatedAt: new Date() },
        $unset: { resetToken: '', resetTokenExpiry: '' }
      }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
