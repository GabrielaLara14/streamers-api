// Rutas de /streamers
const express = require('express');
const streamerController = require('../controllers/streamer.controller');
const validateQuery = require('../middlewares/validateQuery');
const { DEFAULT_LIMITS, limitRule, minActiveDaysRule } = require('../constants/queryRules');

const router = express.Router();

// GET /streamers?minActiveDays=5&limit=10
router.get(
  '/',
  validateQuery({
    minActiveDays: minActiveDaysRule,
    limit: limitRule(DEFAULT_LIMITS.TOP_STREAMERS),
  }),
  streamerController.getTopStreamersByAudience
);
// GET /streamers/main-games?limit=20
router.get(
  '/main-games',
  validateQuery({ limit: limitRule(DEFAULT_LIMITS.MAIN_GAMES) }),
  streamerController.getStreamersMainGames
);
// GET /streamers/views-per-follower?limit=10
router.get(
  '/views-per-follower',
  validateQuery({ limit: limitRule(DEFAULT_LIMITS.VIEWS_PER_FOLLOWER) }),
  streamerController.getStreamersViewsPerFollower
);
// GET /streamers/main-game-shared-as-secondary (sin parámetros)
router.get(
  '/main-game-shared-as-secondary',
  streamerController.getMainGameSharedAsSecondaryCount
);
// GET /streamers/activity-ranges (sin parámetros)
router.get('/activity-ranges', streamerController.getActivityRanges);

module.exports = router;
