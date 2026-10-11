// Punto de entrada de la API: crea el servidor Express y registra las rutas
const express = require('express');
const streamerRoutes = require('./routes/streamer.routes');
const gameRoutes = require('./routes/game.routes');
const languageRoutes = require('./routes/language.routes');
const streamerTypeRoutes = require('./routes/streamerType.routes');

// Puerto por defecto 5000, se puede cambiar con la variable de entorno PORT
const DEFAULT_PORT = 5000;
const PORT = process.env.PORT || DEFAULT_PORT;
const api = express();


// Cada grupo de rutas cuelga de un prefijo
api.use('/streamers', streamerRoutes);
api.use('/games', gameRoutes);
api.use('/languages', languageRoutes);
api.use('/streamer-types', streamerTypeRoutes);

// Si ninguna ruta coincide, responde 404 en formato JSON
api.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Arranca el servidor
api.listen(PORT, () => {
  console.log(`Server running in http://localhost:${PORT}`);
});
