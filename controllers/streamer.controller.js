const streamerDao = require('../dao/streamer.dao');
const withErrorHandling = require('../utils/withErrorHandling');

const getTopStreamersByAudience = withErrorHandling(async (req, res) => {
  const streamers = await streamerDao.findTopByAudience(res.locals.query);
  res.json(streamers);
});

const getStreamersMainGames = withErrorHandling(async (req, res) => {
  const mainGames = await streamerDao.findMainGames(res.locals.query);
  res.json(mainGames);
});

const getStreamersViewsPerFollower = withErrorHandling(async (req, res) => {
  const streamers = await streamerDao.findViewsPerFollower(res.locals.query);
  res.json(streamers);
});

const getMainGameSharedAsSecondaryCount = withErrorHandling(async (req, res) => {
  const streamersCount = await streamerDao.countWithMainGameSharedAsSecondary();
  res.json({ streamersCount });
});

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
