// Controlador de tipos de streamer
const streamerTypeDao = require('../dao/streamerType.dao');
const withErrorHandling = require('../utils/withErrorHandling');

// Cantidad de streamers por tipo
const getStreamerTypeDistribution = withErrorHandling(async (req, res) => {
  const distribution = await streamerTypeDao.findDistribution();
  res.json(distribution);
});

module.exports = { getStreamerTypeDistribution };
