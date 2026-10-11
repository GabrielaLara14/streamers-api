const express = require('express');
const streamerRoutes = require('./routes/streamer.routes');
const gameRoutes = require('./routes/game.routes');
const languageRoutes = require('./routes/language.routes');
const streamerTypeRoutes = require('./routes/streamerType.routes');

const DEFAULT_PORT = 5000;
const PORT = process.env.PORT || DEFAULT_PORT;
const api = express();


api.use('/streamers', streamerRoutes);
api.use('/games', gameRoutes);
api.use('/languages', languageRoutes);
api.use('/streamer-types', streamerTypeRoutes);

api.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

api.listen(PORT, () => {
  console.log(`Server running in http://localhost:${PORT}`);
});
