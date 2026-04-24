const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, patientOnly, signToken } = require('../middleware/auth');
const saveToJson = require('../utils/saveToJson');

// POST /api/auth/patient/register
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      primaryCondition,
      secondaryCondition,
      allergies,
      medications,
      emergencyContactName,
      emergencyContactPhone,
      secondaryContactName,
      secondaryContactPhone,
      surgicalHistory,
      additionalNotes
    } = req.body;

    // Required validation
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, phone and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || '',
      emergencyProfile: {
        bloodGroup: bloodGroup || '',
        primaryCondition: primaryCondition || 'None / Healthy',
        secondaryCondition: secondaryCondition || '',
        allergies: allergies || '',
        medications: medications || '',
        emergencyContactName: emergencyContactName || '',
        emergencyContactPhone: emergencyContactPhone || '',
        secondaryContactName: secondaryContactName || '',
        secondaryContactPhone: secondaryContactPhone || '',
        surgicalHistory: surgicalHistory || '',
        additionalNotes: additionalNotes || ''
      }
    });

    // Optional backup (without password)
    saveToJson('users.json', {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      emergencyProfile: user.emergencyProfile,
      registeredAt: user.createdAt
    });

    const token = signToken(user._id, 'patient');

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        emergencyProfile: user.emergencyProfile
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: err.message
    });
  }
});

// POST /api/auth/patient/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    const token = signToken(user._id, 'patient');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        emergencyProfile: user.emergencyProfile
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
});

// GET /api/auth/patient/me
router.get('/me', protect, patientOnly, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// PUT /api/auth/patient/emergency-profile
router.put('/emergency-profile', protect, patientOnly, async (req, res) => {
  try {
    const allowed = [
      'bloodGroup',
      'primaryCondition',
      'secondaryCondition',
      'allergies',
      'medications',
      'emergencyContactName',
      'emergencyContactPhone',
      'secondaryContactName',
      'secondaryContactPhone',
      'surgicalHistory',
      'additionalNotes'
    ];

    const updates = {};

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`emergencyProfile.${field}`] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Emergency profile updated.',
      emergencyProfile: user.emergencyProfile
    });

  } catch (err) {
    console.error('Emergency profile update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency profile.'
    });
  }
});

// PUT /api/auth/patient/profile
router.put('/profile', protect, patientOnly, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender'];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });

  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
});

module.exports = router;