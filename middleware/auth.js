const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Hospital = require('../models/Hospital');

/* ---------------- SIGN TOKEN ---------------- */
function signToken(id, role) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in environment variables.');
  }

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
}

/* ---------------- PROTECT ROUTES ---------------- */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.'
      });
    }

    if (decoded.role === 'patient') {
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      req.user = user;
    }

    else if (decoded.role === 'hospital') {
      const hospital = await Hospital.findById(decoded.id);

      if (!hospital) {
        return res.status(401).json({
          success: false,
          message: 'Hospital not found.'
        });
      }

      if (!hospital.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Hospital account is deactivated.'
        });
      }

      req.hospital = hospital;
    }

    else {
      return res.status(403).json({
        success: false,
        message: 'Invalid role.'
      });
    }

    req.role = decoded.role;

    next();

  } catch (err) {
    console.error('Auth middleware error:', err.message);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

/* ---------------- ROLE GUARDS ---------------- */
function patientOnly(req, res, next) {
  if (req.role !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Patients only.'
    });
  }

  next();
}

function hospitalOnly(req, res, next) {
  if (req.role !== 'hospital') {
    return res.status(403).json({
      success: false,
      message: 'Hospitals only.'
    });
  }

  next();
}

module.exports = {
  protect,
  patientOnly,
  hospitalOnly,
  signToken
};