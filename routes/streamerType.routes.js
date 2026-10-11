// Rutas de /streamer-types
const express = require('express');
const streamerTypeController = require('../controllers/streamerType.controller');

const router = express.Router();

// GET /streamer-types/distribution
router.get('/distribution', streamerTypeController.getStreamerTypeDistribution);

module.exports = router;
