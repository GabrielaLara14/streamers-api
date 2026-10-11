// Controlador de idiomas
const languageDao = require('../dao/language.dao');
const withErrorHandling = require('../utils/withErrorHandling');

// Estadísticas de seguidores por idioma
const getFollowerStats = withErrorHandling(async (req, res) => {
  const followerStats = await languageDao.findFollowerStats();
  res.json(followerStats);
});

module.exports = { getFollowerStats };
