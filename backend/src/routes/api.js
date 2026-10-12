const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const medicationRoutes = require('./medicationRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const caregiverRoutes = require('./caregiverRoutes');
const emergencyRoutes = require('./emergencyRoutes');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Medication Reminder API',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth', authRoutes);
router.use('/medications', medicationRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/caregiver', caregiverRoutes);
router.use('/emergency', emergencyRoutes);

module.exports = router;
