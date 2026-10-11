const gameDao = require('../dao/game.dao');
const withErrorHandling = require('../utils/withErrorHandling');

const getGameRanking = withErrorHandling(async (req, res) => {
  const ranking = await gameDao.findRanking(res.locals.query);
  res.json(ranking);
});

const getPreferenceComparison = withErrorHandling(async (req, res) => {
  const comparison = await gameDao.findPreferenceComparison(res.locals.query);
  res.json(comparison);
});

module.exports = { getGameRanking, getPreferenceComparison };
