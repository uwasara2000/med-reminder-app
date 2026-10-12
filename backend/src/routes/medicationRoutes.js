const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', medicationController.getMedications);
router.post('/scan-image', medicationController.scanMedicationImage);
router.get('/:id', medicationController.getMedicationById);
router.post('/', medicationController.createMedication);
router.put('/:id', medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);
router.post('/:id/refill', medicationController.addRefill);

module.exports = router;
