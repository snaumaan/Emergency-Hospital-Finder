const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { protect, hospitalOnly, signToken } = require('../middleware/auth');
const saveToJson = require('../utils/saveToJson');

// POST /api/auth/hospital/register
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      street,
      area,
      city,
      pinCode,
      state,
      latitude,
      longitude,
      hospitalType,
      specializations,
      totalBeds,
      icuBeds,
      emergencyBeds,
      departments
    } = req.body;

    // Required validation
    if (!name || !email || !password || !phone || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, phone, city and state are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await Hospital.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const generalBeds = Number(totalBeds) || 100;
    const icu = Number(icuBeds) || 20;
    const emergency = Number(emergencyBeds) || 10;

    const hospital = await Hospital.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone,
      address: {
        street: street || '',
        area: area || '',
        city,
        pinCode: pinCode || '',
        state
      },
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(longitude) || 0,
          parseFloat(latitude) || 0
        ]
      },
      hospitalType: hospitalType || 'General',
      specializations: Array.isArray(specializations) ? specializations : [],
      beds: [
        {
          type: 'general',
          total: generalBeds,
          available: generalBeds
        },
        {
          type: 'icu',
          total: icu,
          available: icu
        },
        {
          type: 'emergency',
          total: emergency,
          available: emergency
        }
      ],
      departments: Array.isArray(departments) ? departments : [],
      erStatus: true
    });

    // Optional local backup (without password)
    saveToJson('hospitals.json', {
      _id: hospital._id,
      name: hospital.name,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      location: hospital.location,
      hospitalType: hospital.hospitalType,
      beds: hospital.beds,
      registeredAt: hospital.createdAt
    });

    const token = signToken(hospital._id, 'hospital');

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully.',
      token,
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        hospitalType: hospital.hospitalType,
        specializations: hospital.specializations,
        departments: hospital.departments,
        beds: hospital.beds,
        erStatus: hospital.erStatus
      }
    });

  } catch (err) {
    console.error('Hospital register error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: err.message
    });
  }
});

// POST /api/auth/hospital/login
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

    const hospital = await Hospital.findOne({
      email: normalizedEmail
    }).select('+password');

    if (!hospital || !(await hospital.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!hospital.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hospital account is deactivated.'
      });
    }

    const token = signToken(hospital._id, 'hospital');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        hospitalType: hospital.hospitalType,
        specializations: hospital.specializations,
        departments: hospital.departments,
        beds: hospital.beds,
        erStatus: hospital.erStatus,
        rating: hospital.rating
      }
    });

  } catch (err) {
    console.error('Hospital login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
});

// GET /api/auth/hospital/me
router.get('/me', protect, hospitalOnly, (req, res) => {
  res.json({
    success: true,
    hospital: req.hospital
  });
});

// PUT /api/auth/hospital/er-status
router.put('/er-status', protect, hospitalOnly, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.hospital._id,
      { erStatus: Boolean(req.body.erStatus) },
      { new: true }
    );

    res.json({
      success: true,
      erStatus: hospital.erStatus
    });

  } catch (err) {
    console.error('ER status update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update ER status.'
    });
  }
});

module.exports = router;