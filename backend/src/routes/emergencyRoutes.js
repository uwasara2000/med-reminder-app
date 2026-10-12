const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', emergencyController.getContacts);
router.post('/', emergencyController.createContact);
router.delete('/:id', emergencyController.deleteContact);

module.exports = router;
