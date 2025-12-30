const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

router.post('/start', telemetryController.startProcess);
router.post('/stop', telemetryController.stopProcess);
router.get('/data', telemetryController.getData);

module.exports = router;