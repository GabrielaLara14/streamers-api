const db = require('../services/mysql.service');

const findFollowerStats = async () => {
  const [rows] = await db.query(
    `SELECT language.name AS languageName,
            COUNT(*) AS streamersCount,
            ROUND(AVG(streamer.total_followers)) AS avgFollowers,
            MAX(streamer.total_followers) AS topStreamerFollowers,
            ROUND(MAX(streamer.total_followers) / SUM(streamer.total_followers) * 100, 1)
              AS topStreamerSharePercent
     FROM streamer
     JOIN language ON streamer.id_language = language.id_language
     GROUP BY language.id_language, language.name
     ORDER BY avgFollowers DESC`
  );
  return rows;
};

module.exports = { findFollowerStats };
