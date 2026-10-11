const PREFERENCE_ORDER = require('./preferenceOrder');

const MAX_LIMIT = 100;
const DAYS_PER_WEEK = 7;
const DEFAULT_MIN_ACTIVE_DAYS = 5;

const DEFAULT_LIMITS = {
  TOP_STREAMERS: 10,
  MAIN_GAMES: 20,
  VIEWS_PER_FOLLOWER: 10,
  GAME_RANKING: 5,
  PREFERENCE_COMPARISON: 15,
};

const limitRule = (defaultValue) => ({
  type: 'integer',
  min: 1,
  max: MAX_LIMIT,
  defaultValue,
});

const minActiveDaysRule = {
  type: 'number',
  min: 0,
  max: DAYS_PER_WEEK,
  defaultValue: DEFAULT_MIN_ACTIVE_DAYS,
};

const preferenceOrderRule = {
  type: 'integer',
  min: PREFERENCE_ORDER.MAIN,
  max: PREFERENCE_ORDER.SECONDARY,
  defaultValue: PREFERENCE_ORDER.MAIN,
};

module.exports = { DEFAULT_LIMITS, limitRule, minActiveDaysRule, preferenceOrderRule };
