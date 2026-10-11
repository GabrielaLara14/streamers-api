// Reglas de validación de los parámetros de consulta (query string) de la API
const PREFERENCE_ORDER = require('./preferenceOrder');

const MAX_LIMIT = 100;
const DAYS_PER_WEEK = 7;
const DEFAULT_MIN_ACTIVE_DAYS = 5;

// Valor de limit por defecto de cada endpoint
const DEFAULT_LIMITS = {
  TOP_STREAMERS: 10,
  MAIN_GAMES: 20,
  VIEWS_PER_FOLLOWER: 10,
  GAME_RANKING: 5,
  PREFERENCE_COMPARISON: 15,
};

// Regla para limit: entero entre 1 y MAX_LIMIT
const limitRule = (defaultValue) => ({
  type: 'integer',
  min: 1,
  max: MAX_LIMIT,
  defaultValue,
});

// Regla para minActiveDays: número entre 0 y 7
const minActiveDaysRule = {
  type: 'number',
  min: 0,
  max: DAYS_PER_WEEK,
  defaultValue: DEFAULT_MIN_ACTIVE_DAYS,
};

// Regla para preferenceOrder: 1 (principal) o 2 (secundario)
const preferenceOrderRule = {
  type: 'integer',
  min: PREFERENCE_ORDER.MAIN,
  max: PREFERENCE_ORDER.SECONDARY,
  defaultValue: PREFERENCE_ORDER.MAIN,
};

module.exports = { DEFAULT_LIMITS, limitRule, minActiveDaysRule, preferenceOrderRule };
