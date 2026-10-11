const express = require('express');
const streamerTypeController = require('../controllers/streamerType.controller');

const router = express.Router();

router.get('/distribution', streamerTypeController.getStreamerTypeDistribution);

module.exports = router;
