const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/link', caregiverController.linkPatientByCode);
router.get('/patients', caregiverController.getMonitoredPatients);

module.exports = router;
