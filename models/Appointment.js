const mongoose = require('mongoose');

/* ---------------- TOKEN GENERATOR ---------------- */
async function generateToken() {
  const Appointment = mongoose.model('Appointment');

  for (let i = 0; i < 20; i++) {
    const token = `MQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const exists = await Appointment.exists({ token });
    if (!exists) return token;
  }

  throw new Error('Failed to generate unique token');
}

/* ---------------- HELPERS ---------------- */
function getDayRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/* ---------------- SCHEMA ---------------- */
const appointmentSchema = new mongoose.Schema({
  token: {
    type: String,
    unique: true,
    uppercase: true
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },

  department: {
    type: String,
    required: true,
    trim: true
  },

  preferredDate: {
    type: Date,
    required: true
  },

  preferredTimeSlot: {
    type: String,
    enum: [
      'Morning (9–12 AM)',
      'Afternoon (12–3 PM)',
      'Evening (3–6 PM)'
    ],
    default: 'Morning (9–12 AM)'
  },

  reasonForVisit: {
    type: String,
    default: '',
    trim: true
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },

  queuePosition: {
    type: Number,
    default: null
  },

  estimatedWaitMinutes: {
    type: Number,
    default: null
  },

  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date,

  cancelReason: {
    type: String,
    default: ''
  },

  notes: {
    type: String,
    default: ''
  },

  patientSnapshot: {
    bloodGroup: String,
    allergies: String,
    medications: String,
    conditions: String,
    emergencyContact: String,
    emergencyPhone: String
  }

}, { timestamps: true });

/* ---------------- VALIDATE DATE ---------------- */
appointmentSchema.pre('validate', function(next) {
  if (this.preferredDate) {
    const selected = new Date(this.preferredDate);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      return next(new Error('Past appointment dates are not allowed.'));
    }
  }

  next();
});

/* ---------------- BEFORE SAVE ---------------- */
appointmentSchema.pre('save', async function(next) {
  try {
    if (!this.isNew) return next();

    this.token = await generateToken();

    const Appointment = mongoose.model('Appointment');
    const { start, end } = getDayRange(this.preferredDate);

    const count = await Appointment.countDocuments({
      hospital: this.hospital,
      department: this.department,
      preferredDate: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] }
    });

    this.queuePosition = count + 1;
    this.estimatedWaitMinutes = this.queuePosition * 7;

    next();

  } catch (err) {
    next(err);
  }
});

/* ---------------- REQUEUE AFTER STATUS CHANGE ---------------- */
appointmentSchema.statics.recalculateQueue = async function(hospitalId, department, date) {
  const { start, end } = getDayRange(date);

  const active = await this.find({
    hospital: hospitalId,
    department,
    preferredDate: { $gte: start, $lte: end },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ createdAt: 1 });

  for (let i = 0; i < active.length; i++) {
    active[i].queuePosition = i + 1;
    active[i].estimatedWaitMinutes = (i + 1) * 7;
    await active[i].save();
  }
};

/* ---------------- INDEXES ---------------- */
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ hospital: 1, status: 1 });
appointmentSchema.index({ hospital: 1, department: 1, preferredDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);