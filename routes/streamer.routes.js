const express = require('express');
const streamerController = require('../controllers/streamer.controller');
const validateQuery = require('../middlewares/validateQuery');
const { DEFAULT_LIMITS, limitRule, minActiveDaysRule } = require('../constants/queryRules');

const router = express.Router();

router.get(
  '/',
  validateQuery({
    minActiveDays: minActiveDaysRule,
    limit: limitRule(DEFAULT_LIMITS.TOP_STREAMERS),
  }),
  streamerController.getTopStreamersByAudience
);
router.get(
  '/main-games',
  validateQuery({ limit: limitRule(DEFAULT_LIMITS.MAIN_GAMES) }),
  streamerController.getStreamersMainGames
);
router.get(
  '/views-per-follower',
  validateQuery({ limit: limitRule(DEFAULT_LIMITS.VIEWS_PER_FOLLOWER) }),
  streamerController.getStreamersViewsPerFollower
);
router.get(
  '/main-game-shared-as-secondary',
  streamerController.getMainGameSharedAsSecondaryCount
);
router.get('/activity-ranges', streamerController.getActivityRanges);

module.exports = router;
