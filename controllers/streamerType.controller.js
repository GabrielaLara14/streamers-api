const streamerTypeDao = require('../dao/streamerType.dao');
const withErrorHandling = require('../utils/withErrorHandling');

const getStreamerTypeDistribution = withErrorHandling(async (req, res) => {
  const distribution = await streamerTypeDao.findDistribution();
  res.json(distribution);
});

module.exports = { getStreamerTypeDistribution };
