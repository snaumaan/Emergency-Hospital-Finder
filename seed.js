require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const User     = require('./models/User');

const HOSPITALS = [
  {
    name: 'Apollo Hospitals', email: 'admin@apollo-bangalore.com', password: 'Hospital@123',
    phone: '+91 80 2630 4050',
    address: { area: 'Bannerghatta Road', city: 'Bengaluru', pinCode: '560076', state: 'Karnataka' },
    location: { type: 'Point', coordinates: [77.5947, 12.8931] },
    hospitalType: 'Multi-Specialty',
    specializations: ['Emergency','Cardiology','Neurology','Oncology','Orthopedics'],
    departments: [
      { name: 'Cardiology',   icon: '❤️',  headDoctor: 'Dr. Priya Nair',   doctorCount: 4 },
      { name: 'Neurology',    icon: '🧠',  headDoctor: 'Dr. Arjun Menon',  doctorCount: 3 },
      { name: 'Emergency',    icon: '🚨',  headDoctor: 'Dr. Rajan Kumar',  doctorCount: 8 },
      { name: 'Oncology',     icon: '🔬',  headDoctor: 'Dr. Vikram Nair',  doctorCount: 3 },
      { name: 'Orthopedics',  icon: '🦴',  headDoctor: 'Dr. Kavya Rao',    doctorCount: 5 }
    ],
    beds: [
      { type: 'general',   total: 120, available: 45 },
      { type: 'icu',       total: 30,  available: 12 },
      { type: 'emergency', total: 20,  available: 8  }
    ],
    rating: 4.8, ratingCount: 1240, erStatus: true, isVerified: true
  },
  {
    name: 'Manipal Hospital', email: 'admin@manipal-whitefield.com', password: 'Hospital@123',
    phone: '+91 80 2502 4444',
    address: { area: 'Whitefield', city: 'Bengaluru', pinCode: '560066', state: 'Karnataka' },
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
    hospitalType: 'Super-Specialty',
    specializations: ['Cardiology','Orthopedics','Neurology','Transplant'],
    departments: [
      { name: 'Cardiology',       icon: '❤️',  headDoctor: 'Dr. Suresh Kamath', doctorCount: 5 },
      { name: 'Orthopedics',      icon: '🦴',  headDoctor: 'Dr. Anita Sharma',  doctorCount: 4 },
      { name: 'Neurology',        icon: '🧠',  headDoctor: 'Dr. Ravi Pillai',   doctorCount: 3 },
      { name: 'General Medicine', icon: '🩺',  headDoctor: 'Dr. Mohan Das',     doctorCount: 6 }
    ],
    beds: [
      { type: 'general',   total: 200, available: 62 },
      { type: 'icu',       total: 40,  available: 18 },
      { type: 'emergency', total: 15,  available: 5  }
    ],
    rating: 4.7, ratingCount: 980, erStatus: true, isVerified: true
  },
  {
    name: 'Fortis Hospital', email: 'admin@fortis-koramangala.com', password: 'Hospital@123',
    phone: '+91 80 4696 0000',
    address: { area: 'Koramangala', city: 'Bengaluru', pinCode: '560034', state: 'Karnataka' },
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    hospitalType: 'Multi-Specialty',
    specializations: ['Emergency','Orthopedics','Trauma','Pediatrics'],
    departments: [
      { name: 'Emergency',   icon: '🚨',  headDoctor: 'Dr. Deepak Rao',  doctorCount: 6 },
      { name: 'Orthopedics', icon: '🦴',  headDoctor: 'Dr. Meena Iyer',  doctorCount: 4 },
      { name: 'Trauma',      icon: '🏥',  headDoctor: 'Dr. Arun Mehta',  doctorCount: 5 },
      { name: 'Pediatrics',  icon: '👶',  headDoctor: 'Dr. Sneha Reddy', doctorCount: 3 }
    ],
    beds: [
      { type: 'general',   total: 80, available: 28 },
      { type: 'icu',       total: 20, available: 7  },
      { type: 'emergency', total: 10, available: 3  }
    ],
    rating: 4.6, ratingCount: 750, erStatus: true, isVerified: true
  },
  {
    name: 'Narayana Health', email: 'admin@narayana-ec.com', password: 'Hospital@123',
    phone: '+91 80 7122 2200',
    address: { area: 'Electronic City', city: 'Bengaluru', pinCode: '560100', state: 'Karnataka' },
    location: { type: 'Point', coordinates: [77.6713, 12.8399] },
    hospitalType: 'Super-Specialty',
    specializations: ['Cardiology','Pediatrics','Gynecology','Neurology'],
    departments: [
      { name: 'Cardiology',  icon: '❤️',  headDoctor: 'Dr. Rajesh Kumar', doctorCount: 7 },
      { name: 'Pediatrics',  icon: '👶',  headDoctor: 'Dr. Latha Nair',   doctorCount: 5 },
      { name: 'Gynecology',  icon: '🌸',  headDoctor: 'Dr. Anita Shenoy', doctorCount: 4 },
      { name: 'Neurology',   icon: '🧠',  headDoctor: 'Dr. Hari Menon',   doctorCount: 4 }
    ],
    beds: [
      { type: 'general',   total: 300, available: 90 },
      { type: 'icu',       total: 50,  available: 24 },
      { type: 'emergency', total: 25,  available: 14 }
    ],
    rating: 4.9, ratingCount: 1870, erStatus: true, isVerified: true
  }
];

const DEMO_USER = {
  firstName: 'Ravi', lastName: 'Sharma',
  email: 'ravi@demo.com', password: 'Demo@1234',
  phone: '+91 98765 43210', dateOfBirth: new Date('1988-03-14'), gender: 'Male',
  emergencyProfile: {
    bloodGroup: 'O+', primaryCondition: 'Diabetes', secondaryCondition: 'Hypertension',
    allergies: 'Penicillin, Sulfa Drugs', medications: 'Metformin 500mg, Lisinopril 10mg',
    emergencyContactName: 'Priya Sharma', emergencyContactPhone: '+91 98765 00000',
    additionalNotes: 'Carry glucose tablets. History of hypoglycemic episodes.'
  }
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');
    await Hospital.deleteMany({});
    await User.deleteMany({ email: DEMO_USER.email });
    console.log('🗑️   Cleared existing seed data');
    const hospitals = await Hospital.insertMany(HOSPITALS);
    console.log(`🏥  Inserted ${hospitals.length} hospitals`);
    const user = await User.create(DEMO_USER);
    console.log(`👤  Demo patient: ${user.email} / Demo@1234`);
    console.log('\n🔑  Hospital logins (password: Hospital@123):');
    hospitals.forEach(h => console.log(`   ${h.name.padEnd(25)} → ${h.email}`));
    await mongoose.disconnect();
    console.log('\n✅  Seeding complete!');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}
seed();
