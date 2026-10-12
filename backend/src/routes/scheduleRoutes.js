const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/today', scheduleController.getTodayDoses);
router.post('/log', scheduleController.logDose);
router.get('/adherence', scheduleController.getAdherenceStats);

module.exports = router;
