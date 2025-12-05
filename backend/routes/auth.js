const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const axios = require('axios');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


console.log("SENDGRID_API_KEY present:", !!process.env.SENDGRID_API_KEY);
console.log("SENDER_EMAIL:", !!process.env.SENDER_EMAIL);

// --- SEND REGISTRATION OTP ---
// @route   POST /api/auth/send-otp
// @desc    Send a verification OTP to a new usera
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      // User exists but is not verified, update their details
      user.name = name;
      user.password = hashedPassword;
      user.verificationToken = otp;
      user.verificationTokenExpires = Date.now() + 600000; // 10 minutes
      await user.save();
    } else {
      // Create new user, but as unverified
      user = new User({
        name,
        email,
        password: hashedPassword,
        verificationToken: otp,
        verificationTokenExpires: Date.now() + 600000, // 10 minutes
        isVerified: false
      });
      await user.save();
    }

    // --- SEND OTP EMAIL ---
    const mailOptions = {
      to: user.email,
      from: process.env.SENDER_EMAIL,
      subject: 'Your Campus360 Verification Code',
      text: `Hello ${user.name},\n\nYour One-Time Password (OTP) for registering your account is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n`
    };
    try {
  await sgMail.send(mailOptions);
  res.status(200).json({ msg: 'Verification OTP has been sent to your email.' });
} catch (sendErr) {
  // Log useful SendGrid response if available
  console.error('SENDGRID SEND ERROR:', sendErr.response?.body || sendErr.message || sendErr);
  // Respond with 502 Bad Gateway (or 500) so frontend shows friendly error
  return res.status(502).json({ msg: 'Failed to send verification email. Please try again later.' });
}

  } catch (err) {
    console.error("Send OTP Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- VERIFY OTP & COMPLETE REGISTRATION ---
// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and register the user
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ msg: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ 
      email: email,
      verificationToken: otp,
      verificationTokenExpires: { $gt: Date.now() } 
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired OTP. Please try again.' });
    }

    // Success! Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.status(201).json({ msg: 'Account verified successfully! You can now log in.' });

  } catch (err) {
    console.error("Verify OTP Error:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- LOGIN (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // --- ADD VERIFICATION CHECK ---
    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Account not verified. Please check your email.' });
    }
    // --- END CHECK ---

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, name: user.name, userId: user.id });
      }
    );
  } catch (err) { /* ... error handling ... */ }
});


// --- GOOGLE LOGIN (POST /api/auth/google-login) ---
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      const password = email + process.env.JWT_SECRET;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name: name,
        email: email,
        password: hashedPassword,
      });

      await user.save();
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, appToken) => {
        if (err) throw err;
        res.json({ token: appToken, role: user.role, name: user.name,userId: user.id });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- FORGOT PASSWORD (POST /api/auth/forgot-password) ---
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ msg: 'Email has been sent' });
    }

    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Expires in 1 hour
    await user.save();

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.SENDER_EMAIL, // Your verified SendGrid email
      subject: 'Campus360 - Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetLink}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await sgMail.send(mailOptions);

    res.status(200).json({ msg: 'Email has been sent' });

  } catch (err) {
    console.error('SENDGRID ERROR:', err.message);
    if (err.response) {
      console.error(err.response.body)
    }
    res.status(500).send('Server Error');
  }
});


// --- RESET PASSWORD (POST /api/auth/reset-password/:token) ---
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }, //  greater than
    });

    if (!user) {
      return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
    }

    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ msg: 'Password has been reset successfully.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/auth/me
// @desc    Get current user data (excluding password)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('followedClubs', 'name category'); 
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- FACEBOOK LOGIN (POST /api/auth/facebook-login) ---
router.post('/facebook-login', async (req, res) => {
  try {
    const { userId, accessToken } = req.body;

    const url = `https://graph.facebook.com/v19.0/${userId}?fields=id,name,email&access_token=${accessToken}`;
    const fbRes = await axios.get(url);
    const { email, name, id } = fbRes.data;

    const userEmail = email || `${id}@facebook.com`;

    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const password = userEmail + process.env.JWT_SECRET;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name: name,
        email: userEmail, 
        password: hashedPassword,
        isVerified: true
      });

      await user.save();
    }

    const payload = {
      user: { id: user.id, role: user.role }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
            token, 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            email: user.email 
        });
      }
    );

  } catch (err) {
    console.error("Facebook Login Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;