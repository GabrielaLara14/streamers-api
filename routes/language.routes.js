// Rutas de /languages
const express = require('express');
const languageController = require('../controllers/language.controller');

const router = express.Router();

// GET /languages/follower-stats
router.get('/follower-stats', languageController.getFollowerStats);

module.exports = router;
