const express = require('express');
const languageController = require('../controllers/language.controller');

const router = express.Router();

router.get('/follower-stats', languageController.getFollowerStats);

module.exports = router;
