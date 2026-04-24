const express = require('express');
const router = express.Router();

const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const { protect, hospitalOnly } = require('../middleware/auth');

// GET /api/hospitals — public search with geo sort
router.get('/', async (req, res) => {
  try {
    const { lat, lng, specialization, search } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    let query = { isActive: true };

    if (specialization && specialization !== 'All') {
      query.specializations = { $in: [specialization] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.area': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    let hospitals;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Geo search
    if (!isNaN(userLat) && !isNaN(userLng)) {
      hospitals = await Hospital.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [userLng, userLat]
            },
            $maxDistance: 50000
          }
        }
      })
        .limit(limit)
        .lean();

      // Add distance
      hospitals = hospitals.map(h => {
        const [hLng, hLat] = h.location.coordinates;

        const R = 6371;
        const dLat = ((hLat - userLat) * Math.PI) / 180;
        const dLng = ((hLng - userLng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLat * Math.PI) / 180) *
          Math.cos((hLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;

        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return {
          ...h,
          distanceKm: Math.round(distance * 10) / 10
        };
      });

    } else {
      hospitals = await Hospital.find(query)
        .limit(limit)
        .lean();
    }

    res.json({
      success: true,
      hospitals
    });

  } catch (err) {
    console.error('Hospital search error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospitals.'
    });
  }
});

// PUT /api/hospitals/beds/update
router.put('/beds/update', protect, hospitalOnly, async (req, res) => {
  try {
    const { bedType, delta } = req.body;

    if (!bedType || delta === undefined) {
      return res.status(400).json({
        success: false,
        message: 'bedType and delta are required.'
      });
    }

    const hospital = await Hospital.findById(req.hospital._id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.'
      });
    }

    const bed = hospital.beds.find(b => b.type === bedType);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed type not found.'
      });
    }

    const change = parseInt(delta) || 0;

    bed.available = Math.max(
      0,
      Math.min(bed.total, bed.available + change)
    );

    await hospital.save();

    res.json({
      success: true,
      beds: hospital.beds
    });

  } catch (err) {
    console.error('Bed update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update beds.'
    });
  }
});

// POST /api/hospitals/departments/add
router.post('/departments/add', protect, hospitalOnly, async (req, res) => {
  try {
    const { name, icon, headDoctor, doctorCount } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name required.'
      });
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.hospital._id,
      {
        $push: {
          departments: {
            name: name.trim(),
            icon: icon || '🏥',
            headDoctor: headDoctor || '',
            doctorCount: Number(doctorCount) || 1
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      departments: hospital.departments
    });

  } catch (err) {
    console.error('Add department error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add department.'
    });
  }
});

// DELETE /api/hospitals/departments/:deptId
router.delete('/departments/:deptId', protect, hospitalOnly, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.hospital._id,
      {
        $pull: {
          departments: { _id: req.params.deptId }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      departments: hospital.departments
    });

  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department.'
    });
  }
});

// GET /api/hospitals/dashboard/stats
router.get('/dashboard/stats', protect, hospitalOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount, pendingCount, hospital] = await Promise.all([
      Appointment.countDocuments({
        hospital: req.hospital._id,
        createdAt: { $gte: today, $lt: tomorrow }
      }),

      Appointment.countDocuments({
        hospital: req.hospital._id,
        status: 'pending'
      }),

      Hospital.findById(req.hospital._id)
    ]);

    const totalBeds = hospital.beds.reduce((sum, b) => sum + b.total, 0);
    const availableBeds = hospital.beds.reduce((sum, b) => sum + b.available, 0);

    res.json({
      success: true,
      stats: {
        todayCount,
        pendingCount,
        totalBeds,
        availableBeds,
        erStatus: hospital.erStatus
      }
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats.'
    });
  }
});

// GET /api/hospitals/:id — public single hospital
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).lean();

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.'
      });
    }

    res.json({
      success: true,
      hospital
    });

  } catch (err) {
    console.error('Single hospital fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital.'
    });
  }
});

module.exports = router;