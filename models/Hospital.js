const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ---------------- SUB SCHEMAS ---------------- */
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  icon: {
    type: String,
    default: '🏥'
  },

  headDoctor: {
    type: String,
    default: '',
    trim: true
  },

  doctorCount: {
    type: Number,
    default: 1,
    min: 1
  },

  isAvailable: {
    type: Boolean,
    default: true
  }

}, { _id: true });

const bedSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['general', 'icu', 'emergency'],
    required: true
  },

  total: {
    type: Number,
    default: 0,
    min: 0
  },

  available: {
    type: Number,
    default: 0,
    min: 0
  }

}, { _id: false });

/* ---------------- MAIN SCHEMA ---------------- */
const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  address: {
    street: { type: String, default: '', trim: true },
    area: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    pinCode: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true }
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },

    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },

  hospitalType: {
    type: String,
    enum: [
      'Multi-Specialty',
      'Super-Specialty',
      'General',
      'Trauma Center',
      "Children's Hospital"
    ],
    default: 'General'
  },

  specializations: [{
    type: String,
    trim: true
  }],

  departments: [departmentSchema],

  beds: [bedSchema],

  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },

  erStatus: {
    type: Boolean,
    default: false
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

/* ---------------- INDEX ---------------- */
hospitalSchema.index({ location: '2dsphere' });

/* ---------------- HASH PASSWORD ---------------- */
hospitalSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();

  } catch (err) {
    next(err);
  }
});

/* ---------------- METHODS ---------------- */
hospitalSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Hospital', hospitalSchema);