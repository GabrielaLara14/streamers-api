// DAO de streamers: consultas SQL sobre streamer y tablas relacionadas
const db = require('../services/mysql.service');
const { MAIN, SECONDARY } = require('../constants/preferenceOrder');

// Streamers con más espectadores promedio, con un mínimo de días activos
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

// Juego principal de cada streamer, en orden alfabético
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

// Vistas totales divididas entre seguidores (se evita dividir por cero)
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

// Cuenta los streamers cuyo juego principal es el secundario de otro streamer
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

// Agrupa los streamers por rango de días activos y calcula su audiencia
// (AVG y MAX ignoran los valores NULL)
const findActivityRanges = async () => {
  const [rows] = await db.query(
    `SELECT CASE
              WHEN active_days_per_week < 2 THEN '1. 0 to less than 2 days'
              WHEN active_days_per_week < 4 THEN '2. 2 to less than 4 days'
              WHEN active_days_per_week < 6 THEN '3. 4 to less than 6 days'
              ELSE '4. 6 to 7 days'
            END AS activityRange,
            COUNT(*) AS streamersCount,
            COUNT(avg_viewers_per_stream) AS streamersWithViewerData,
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
