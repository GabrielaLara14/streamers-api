'use strict';
/**
 * Ejecuta todas las consultas de sql/*.sql (bloques marcados con "-- @name") e imprime los resultados.
 * Uso: npm run db:queries                         (imprime tablas)
 *      npm run db:queries -- --json resultados.json   (además guarda los resultados en un archivo)
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Archivos SQL que se ejecutan, en este orden
const FILES = ['verification.sql', 'basic_queries.sql', 'analysis_queries.sql'];

// Divide un archivo en bloques usando la marca "-- @name"; devuelve el nombre y el SQL de cada uno
function readBlocks(fileName) {
  const text = fs.readFileSync(path.join(__dirname, '..', 'sql', fileName), 'utf8');
  return text
    .split(/^-- @name\s+/m)
    .slice(1)
    .map((block) => {
      const [name, ...rest] = block.split('\n');
      return { name: name.trim(), sql: rest.join('\n').trim().replace(/;\s*$/, '') };
    });
}

async function main() {
  // Si se pasa --json, el siguiente argumento es el archivo de salida
  const jsonIndex = process.argv.indexOf('--json');
  const jsonPath = jsonIndex >= 0 ? process.argv[jsonIndex + 1] : null;
  // Conexión a MySQL con variables de entorno
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_streamers',
  });
  const output = {};
  try {
    // Ejecuta cada consulta y muestra su resultado en una tabla
    for (const file of FILES) {
      for (const { name, sql } of readBlocks(file)) {
        const [rows] = await connection.query(sql);
        output[name] = rows;
        console.log(`\n=== ${name} ===`);
        console.table(rows);
      }
    }
  } finally {
    await connection.end();
  }
  // Guarda los resultados en JSON si se pidió
  if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(`Query run failed: [${error.code || 'ERROR'}] ${error.message}`);
  process.exit(1);
});
