const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emergencyProfileSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-',''],
    default: ''
  },

  primaryCondition: {
    type: String,
    default: 'None / Healthy',
    trim: true
  },

  secondaryCondition: {
    type: String,
    default: '',
    trim: true
  },

  allergies: {
    type: String,
    default: '',
    trim: true
  },

  medications: {
    type: String,
    default: '',
    trim: true
  },

  emergencyContactName: {
    type: String,
    default: '',
    trim: true
  },

  emergencyContactPhone: {
    type: String,
    default: '',
    trim: true
  },

  secondaryContactName: {
    type: String,
    default: '',
    trim: true
  },

  secondaryContactPhone: {
    type: String,
    default: '',
    trim: true
  },

  surgicalHistory: {
    type: String,
    default: '',
    trim: true
  },

  additionalNotes: {
    type: String,
    default: '',
    trim: true
  }

}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
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

  dateOfBirth: {
    type: Date
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },

  emergencyProfile: {
    type: emergencyProfileSchema,
    default: () => ({})
  },

  role: {
    type: String,
    default: 'patient',
    enum: ['patient']
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

/* Hash password before save */
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();

  } catch (err) {
    next(err);
  }
});

/* Compare login password */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);