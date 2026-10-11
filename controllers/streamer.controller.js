// Controlador de streamers: cada función atiende un endpoint de /streamers
const streamerDao = require('../dao/streamer.dao');
const withErrorHandling = require('../utils/withErrorHandling');

// Streamers con más espectadores promedio
const getTopStreamersByAudience = withErrorHandling(async (req, res) => {
  const streamers = await streamerDao.findTopByAudience(res.locals.query);
  res.json(streamers);
});

// Juego principal de cada streamer
const getStreamersMainGames = withErrorHandling(async (req, res) => {
  const mainGames = await streamerDao.findMainGames(res.locals.query);
  res.json(mainGames);
});

// Vistas totales por seguidor
const getStreamersViewsPerFollower = withErrorHandling(async (req, res) => {
  const streamers = await streamerDao.findViewsPerFollower(res.locals.query);
  res.json(streamers);
});

// Cantidad de streamers cuyo juego principal es el secundario de otro
const getMainGameSharedAsSecondaryCount = withErrorHandling(async (req, res) => {
  const streamersCount = await streamerDao.countWithMainGameSharedAsSecondary();
  res.json({ streamersCount });
});

// Audiencia promedio por rango de días activos
const getActivityRanges = withErrorHandling(async (req, res) => {
  const activityRanges = await streamerDao.findActivityRanges();
  res.json(activityRanges);
});

module.exports = {
  getTopStreamersByAudience,
  getStreamersMainGames,
  getStreamersViewsPerFollower,
  getMainGameSharedAsSecondaryCount,
  getActivityRanges,
};
