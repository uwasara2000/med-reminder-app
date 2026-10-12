const bcrypt = require('bcryptjs');
const db = require('../db/database');

const runSeed = async () => {
  console.log('🌱 Seeding Medication Reminder Database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Patient User (Grandpa Arthur)
  const patientUser = {
    id: 'usr_patient_demo',
    name: 'Arthur Pendelton',
    email: 'arthur@example.com',
    password: passwordHash,
    role: 'patient',
    phone: '+1-555-010-4491',
    caregiverCode: 'CARE88',
    seniorMode: true,
    voiceAnnouncements: true,
    highContrast: false,
    createdAt: new Date().toISOString()
  };

  // 2. Create Caregiver User (Sarah)
  const caregiverUser = {
    id: 'usr_caregiver_demo',
    name: 'Sarah Pendelton',
    email: 'sarah@example.com',
    password: passwordHash,
    role: 'caregiver',
    phone: '+1-555-018-7721',
    caregiverCode: null,
    seniorMode: false,
    voiceAnnouncements: true,
    highContrast: false,
    createdAt: new Date().toISOString()
  };

  // Clear existing and set new data
  db.data.users = [patientUser, caregiverUser];
  db.data.caregiverLinks = [
    {
      id: 'link_demo_1',
      caregiverId: caregiverUser.id,
      patientId: patientUser.id,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  // 3. Create Realistic Elderly Medications
  const meds = [
    {
      id: 'med_lisinopril',
      userId: patientUser.id,
      name: 'Lisinopril',
      genericName: 'Prinivil (ACE Inhibitor)',
      dosage: '10mg (1 pink tablet)',
      form: 'pill',
      color: '#EC4899', // Pink
      icon: 'pill',
      foodInstruction: 'before_meal',
      instructions: 'Take in the morning with a full glass of water. Do not skip.',
      currentStock: 22,
      totalQuantity: 30,
      refillThreshold: 5,
      notes: 'Prescribed by Dr. Williams for Blood Pressure.',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'med_metformin',
      userId: patientUser.id,
      name: 'Metformin',
      genericName: 'Glucophage',
      dosage: '500mg (1 white capsule)',
      form: 'capsule',
      color: '#3B82F6', // Blue
      icon: 'capsule',
      foodInstruction: 'with_meal',
      instructions: 'Take immediately with or right after food to prevent stomach upset.',
      currentStock: 48,
      totalQuantity: 60,
      refillThreshold: 8,
      notes: 'Blood sugar regulation for Type 2 Diabetes.',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'med_glucosamine',
      userId: patientUser.id,
      name: 'Glucosamine & Joint Complex',
      genericName: 'Chondroitin + MSM',
      dosage: '1500mg (2 yellow tablets)',
      form: 'pill',
      color: '#F59E0B', // Amber
      icon: 'pill',
      foodInstruction: 'after_meal',
      instructions: 'Take with midday lunch.',
      currentStock: 14,
      totalQuantity: 60,
      refillThreshold: 5,
      notes: 'Helps knee and hip joint mobility.',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'med_melatonin',
      userId: patientUser.id,
      name: 'Melatonin Sleep Aid',
      genericName: 'Melatonin Extra Strength',
      dosage: '3mg (1 purple softgel)',
      form: 'capsule',
      color: '#8B5CF6', // Purple
      icon: 'moon',
      foodInstruction: 'anytime',
      instructions: 'Take 30 minutes before bedtime in a dark room.',
      currentStock: 3, // LOW STOCK - Refill Warning!
      totalQuantity: 30,
      refillThreshold: 5,
      notes: 'Refill needed soon from pharmacy!',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  db.data.medications = meds;

  // 4. Create Schedules
  db.data.schedules = [
    {
      id: 'sch_lisinopril_morn',
      medicationId: 'med_lisinopril',
      reminderTime: '08:00',
      period: 'morning',
      daysOfWeek: 'ALL',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sch_metformin_morn',
      medicationId: 'med_metformin',
      reminderTime: '08:30',
      period: 'morning',
      daysOfWeek: 'ALL',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sch_glucosamine_noon',
      medicationId: 'med_glucosamine',
      reminderTime: '13:00',
      period: 'afternoon',
      daysOfWeek: 'ALL',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sch_metformin_eve',
      medicationId: 'med_metformin',
      reminderTime: '19:30',
      period: 'evening',
      daysOfWeek: 'ALL',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sch_melatonin_night',
      medicationId: 'med_melatonin',
      reminderTime: '21:30',
      period: 'night',
      daysOfWeek: 'ALL',
      createdAt: new Date().toISOString()
    }
  ];

  // 5. Prepopulate today's dose log for demo
  const todayStr = new Date().toISOString().split('T')[0];
  db.data.doseLogs = [
    {
      id: 'log_demo_1',
      medicationId: 'med_lisinopril',
      scheduleId: 'sch_lisinopril_morn',
      scheduledDate: todayStr,
      status: 'taken',
      takenAt: new Date(Date.now() - 3600000).toISOString(),
      notes: 'Taken with breakfast',
      updatedAt: new Date().toISOString()
    }
  ];

  // 6. Prepopulate Emergency Contacts
  db.data.emergencyContacts = [
    {
      id: 'emg_1',
      userId: patientUser.id,
      name: 'Sarah Pendelton (Daughter)',
      relation: 'Daughter & Primary Caregiver',
      phone: '+1-555-018-7721',
      isDoctor: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'emg_2',
      userId: patientUser.id,
      name: 'Dr. Robert Williams, MD',
      relation: 'Cardiologist',
      phone: '+1-555-019-2834',
      isDoctor: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'emg_3',
      userId: patientUser.id,
      name: 'St. Mary Community Pharmacy',
      relation: 'Local Pharmacy (Refills & Inquiries)',
      phone: '+1-555-014-9988',
      isDoctor: false,
      createdAt: new Date().toISOString()
    }
  ];

  db.save();
  console.log('✅ Seed completed successfully!');
  console.log('👤 Patient Demo Login: arthur@example.com / password123 (Code: CARE88)');
  console.log('👩‍⚕️ Caregiver Demo Login: sarah@example.com / password123');
};

if (require.main === module) {
  runSeed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runSeed;
