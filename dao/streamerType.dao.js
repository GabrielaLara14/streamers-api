// DAO de tipos de streamer
const db = require('../services/mysql.service');

// Cantidad de streamers por tipo (personality / esports)
const findDistribution = async () => {
  const [rows] = await db.query(
    `SELECT streamer_type.name AS typeName, COUNT(*) AS streamersCount
     FROM streamer
     JOIN streamer_type ON streamer.id_type = streamer_type.id_type
     GROUP BY streamer_type.name`
  );
  return rows;
};

module.exports = { findDistribution };
