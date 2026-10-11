'use strict';
// Crea la base de datos ejecutando db/schema.sql (alternativa: abrir el archivo en MySQL Workbench y ejecutarlo).
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  // Lee el script DDL completo
  const script = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  // multipleStatements permite ejecutar todas las sentencias del script de una vez
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  try {
    await connection.query(script);
    console.log('Schema created: database "db_streamers" is ready.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Setup failed: [${error.code || 'ERROR'}] ${error.message}`);
  process.exit(1);
});
