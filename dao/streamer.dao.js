const db = require('../services/mysql.service');
const { MAIN, SECONDARY } = require('../constants/preferenceOrder');

const findTopByAudience = async ({ minActiveDays, limit }) => {
  const [rows] = await db.query(
    `SELECT name AS streamerName,
            avg_viewers_per_stream AS avgViewersPerStream,
            active_days_per_week AS activeDaysPerWeek
     FROM streamer
     WHERE active_days_per_week >= ?
     ORDER BY avg_viewers_per_stream DESC
     LIMIT ?`,
    [minActiveDays, limit]
  );
  return rows;
};

const findMainGames = async ({ limit }) => {
  const [rows] = await db.query(
    `SELECT streamer.name AS streamerName, game.name AS gameName
     FROM streamer_game
     JOIN streamer ON streamer_game.id_streamer = streamer.id_streamer
     JOIN game ON streamer_game.id_game = game.id_game
     WHERE streamer_game.preference_order = ${MAIN}
     ORDER BY streamer.name
     LIMIT ?`,
    [limit]
  );
  return rows;
};

const findViewsPerFollower = async ({ limit }) => {
  const [rows] = await db.query(
    `SELECT name AS streamerName,
            total_followers AS totalFollowers,
            total_views AS totalViews,
            ROUND(total_views / total_followers, 1) AS viewsPerFollower
     FROM streamer
     WHERE total_followers > 0
     ORDER BY viewsPerFollower DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

const countWithMainGameSharedAsSecondary = async () => {
  const [rows] = await db.query(
    `SELECT COUNT(DISTINCT mainPick.id_streamer) AS streamersCount
     FROM streamer_game mainPick
     WHERE mainPick.preference_order = ${MAIN}
       AND EXISTS (
         SELECT 1
         FROM streamer_game secondaryPick
         WHERE secondaryPick.id_game = mainPick.id_game
           AND secondaryPick.preference_order = ${SECONDARY}
           AND secondaryPick.id_streamer <> mainPick.id_streamer
       )`
  );
  return rows[0].streamersCount;
};

const findActivityRanges = async () => {
  const [rows] = await db.query(
    `SELECT CASE
              WHEN active_days_per_week < 3 THEN '1. Less than 3 days'
              WHEN active_days_per_week < 5 THEN '2. From 3 to less than 5 days'
              WHEN active_days_per_week < 7 THEN '3. From 5 to less than 7 days'
              ELSE '4. Seven days'
            END AS activityRange,
            COUNT(*) AS streamersCount,
            ROUND(AVG(avg_viewers_per_stream)) AS avgViewers,
            MAX(avg_viewers_per_stream) AS maxViewers
     FROM streamer
     GROUP BY activityRange
     ORDER BY activityRange`
  );
  return rows;
};

module.exports = {
  findTopByAudience,
  findMainGames,
  findViewsPerFollower,
  countWithMainGameSharedAsSecondary,
  findActivityRanges,
};
