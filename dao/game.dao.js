// DAO de juegos: consultas SQL sobre game y streamer_game
const db = require('../services/mysql.service');
const { MAIN, SECONDARY } = require('../constants/preferenceOrder');

// Genera la expresión SQL del promedio de una columna del streamer
// solo para las filas con el orden de preferencia indicado
const averageByPreference = (preferenceOrder, streamerColumn, alias) =>
  `ROUND(AVG(CASE WHEN streamer_game.preference_order = ${preferenceOrder}
                  THEN streamer.${streamerColumn} END)) AS ${alias}`;

// Ranking de juegos más elegidos como principal (1) o secundario (2)
const findRanking = async ({ preferenceOrder, limit }) => {
  const [rows] = await db.query(
    `SELECT game.name AS gameName, COUNT(*) AS streamersCount
     FROM streamer_game
     JOIN game ON streamer_game.id_game = game.id_game
     WHERE streamer_game.preference_order = ?
     GROUP BY game.id_game, game.name
     ORDER BY streamersCount DESC, game.name
     LIMIT ?`,
    [preferenceOrder, limit]
  );
  return rows;
};

// Compara los juegos usados como principal y como secundario:
// cantidad de streamers, seguidores promedio y vistas promedio
const findPreferenceComparison = async ({ limit }) => {
  const [rows] = await db.query(
    `SELECT game.name AS gameName,
            SUM(streamer_game.preference_order = ${MAIN}) AS mainStreamersCount,
            SUM(streamer_game.preference_order = ${SECONDARY}) AS secondaryStreamersCount,
            ${averageByPreference(MAIN, 'total_followers', 'avgFollowersMain')},
            ${averageByPreference(SECONDARY, 'total_followers', 'avgFollowersSecondary')},
            ${averageByPreference(MAIN, 'total_views', 'avgViewsMain')},
            ${averageByPreference(SECONDARY, 'total_views', 'avgViewsSecondary')}
     FROM streamer_game
     JOIN game ON streamer_game.id_game = game.id_game
     JOIN streamer ON streamer_game.id_streamer = streamer.id_streamer
     GROUP BY game.id_game, game.name
     HAVING mainStreamersCount > 0 AND secondaryStreamersCount > 0
     ORDER BY mainStreamersCount DESC, game.name
     LIMIT ?`,
    [limit]
  );
  return rows;
};

module.exports = { findRanking, findPreferenceComparison };
