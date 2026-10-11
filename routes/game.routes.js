const express = require('express');
const gameController = require('../controllers/game.controller');
const validateQuery = require('../middlewares/validateQuery');
const { DEFAULT_LIMITS, limitRule, preferenceOrderRule } = require('../constants/queryRules');

const router = express.Router();

router.get(
  '/rankings',
  validateQuery({
    preferenceOrder: preferenceOrderRule,
    limit: limitRule(DEFAULT_LIMITS.GAME_RANKING),
  }),
  gameController.getGameRanking
);
router.get(
  '/preference-comparison',
  validateQuery({ limit: limitRule(DEFAULT_LIMITS.PREFERENCE_COMPARISON) }),
  gameController.getPreferenceComparison
);

module.exports = router;
