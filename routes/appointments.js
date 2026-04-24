const express = require('express');
const router = express.Router();

const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const { protect, patientOnly, hospitalOnly } = require('../middleware/auth');

/* ---------------- HELPERS ---------------- */
function normalizeDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ---------------- POST /api/appointments ---------------- */
/* Patient books appointment */
router.post('/', protect, patientOnly, async (req, res) => {
  try {
    const {
      hospitalId,
      department,
      preferredDate,
      preferredTimeSlot,
      reasonForVisit
    } = req.body;

    if (!hospitalId || !department || !preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'Hospital, department and date are required.'
      });
    }

    // Validate hospital exists
    const hospital = await Hospital.findById(hospitalId).select('_id name');
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.'
      });
    }

    // Validate past dates
    const selectedDate = normalizeDateOnly(preferredDate);
    const today = normalizeDateOnly(new Date());

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date.'
      });
    }

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book appointments for past dates.'
      });
    }

    const ep = req.user.emergencyProfile || {};

    const appt = await Appointment.create({
      patient: req.user._id,
      hospital: hospitalId,
      department: department.trim(),
      preferredDate,
      preferredTimeSlot,
      reasonForVisit: reasonForVisit || '',
      patientSnapshot: {
        bloodGroup: ep.bloodGroup || '',
        allergies: ep.allergies || '',
        medications: ep.medications || '',
        conditions: [
          ep.primaryCondition,
          ep.secondaryCondition
        ].filter(Boolean).join(', '),
        emergencyContact: ep.emergencyContactName || '',
        emergencyPhone: ep.emergencyContactPhone || ''
      }
    });

    await appt.populate('hospital', 'name address phone');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully.',
      appointment: appt
    });

  } catch (err) {
    console.error('Appointment create error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment.',
      error: err.message
    });
  }
});

/* ---------------- GET /api/appointments/my ---------------- */
/* Patient appointments */
router.get('/my', protect, patientOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id
    })
      .populate('hospital', 'name address phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      appointments
    });

  } catch (err) {
    console.error('Fetch my appointments error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments.'
    });
  }
});

/* ---------------- GET /api/appointments/hospital ---------------- */
/* Hospital appointments */
router.get('/hospital', protect, hospitalOnly, async (req, res) => {
  try {
    const query = { hospital: req.hospital._id };

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName phone email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      appointments
    });

  } catch (err) {
    console.error('Hospital appointments error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments.'
    });
  }
});

/* ---------------- GET /api/appointments/queue/:hospitalId ---------------- */
/* Public queue */
router.get('/queue/:hospitalId', async (req, res) => {
  try {
    const queue = await Appointment.find({
      hospital: req.params.hospitalId,
      status: { $in: ['pending', 'confirmed'] }
    })
      .select('token department queuePosition estimatedWaitMinutes status preferredDate')
      .sort({ queuePosition: 1 })
      .lean();

    res.json({
      success: true,
      queue
    });

  } catch (err) {
    console.error('Queue fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue.'
    });
  }
});

/* ---------------- GET /api/appointments/token/:token ---------------- */
/* Lookup by token */
router.get('/token/:token', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      token: req.params.token.toUpperCase()
    })
      .populate('hospital', 'name address phone')
      .populate('patient', 'firstName lastName phone')
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Token not found.'
      });
    }

    res.json({
      success: true,
      appointment
    });

  } catch (err) {
    console.error('Token lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment.'
    });
  }
});

/* ---------------- PATCH /api/appointments/:id/status ---------------- */
/* Hospital updates appointment status */
router.patch('/:id/status', protect, hospitalOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status.'
      });
    }

    const appt = await Appointment.findOne({
      _id: req.params.id,
      hospital: req.hospital._id
    });

    if (!appt) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    appt.status = status;

    if (notes) appt.notes = notes;

    if (status === 'confirmed') {
      appt.confirmedAt = new Date();
    }

    if (status === 'completed') {
      appt.completedAt = new Date();
    }

    if (status === 'cancelled') {
      appt.cancelledAt = new Date();
      appt.cancelReason = notes || '';
    }

    await appt.save();

    // Recalculate queue if removed from active line
    if (status === 'completed' || status === 'cancelled') {
      await Appointment.recalculateQueue(
        appt.hospital,
        appt.department,
        appt.preferredDate
      );
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully.',
      appointment: appt
    });

  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update status.'
    });
  }
});

module.exports = router;