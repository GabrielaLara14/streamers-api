// Configuración de la conexión a MySQL
// Todo se lee de variables de entorno; la contraseña nunca se guarda en el código
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'db_streamers',
  // Devuelve los DECIMAL como números y no como texto
  decimalNumbers: true,
};

module.exports = config;
