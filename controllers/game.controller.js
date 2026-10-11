// Controlador de juegos: recibe la petición, llama al DAO y responde en JSON
const gameDao = require('../dao/game.dao');
const withErrorHandling = require('../utils/withErrorHandling');

// Juegos más elegidos como principal o secundario
const getGameRanking = withErrorHandling(async (req, res) => {
  const ranking = await gameDao.findRanking(res.locals.query);
  res.json(ranking);
});

// Compara cada juego como principal y como secundario
const getPreferenceComparison = withErrorHandling(async (req, res) => {
  const comparison = await gameDao.findPreferenceComparison(res.locals.query);
  res.json(comparison);
});

module.exports = { getGameRanking, getPreferenceComparison };
