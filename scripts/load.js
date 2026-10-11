'use strict';
/**
 * Programa de carga: lee data/Streamers.csv y lo inserta en el esquema normalizado.
 *
 * Decisión de arquitectura: es un script independiente (no usa la arquitectura por capas
 * de rutas/controladores/servicios). Se ejecuta una sola vez, no tiene interfaz HTTP y su
 * lógica no se reutiliza, así que las capas solo añadirían archivos. Aun así está dividido
 * en funciones pequeñas (leer, transformar, insertar, verificar) para que cada paso se
 * pueda leer y probar por separado.
 *
 * Uso: npm run db:load                    (se detiene si alguna fila es inválida)
 *      npm run db:load -- --skip-invalid  (carga las filas válidas e informa las rechazadas)
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mysql = require('mysql2/promise');

// Ruta del CSV y tamaño de los lotes de inserción
const CSV_PATH = path.join(__dirname, '..', 'data', 'Streamers.csv');
const BATCH_SIZE = 500;
const SKIP_INVALID = process.argv.includes('--skip-invalid');

// Solo las columnas que el sistema necesita (justificadas en el informe). El resto del CSV se ignora.
const REQUIRED_COLUMNS = [
  'NAME', 'LANGUAGE', 'TYPE', 'MOST_STREAMED_GAME', '2ND_MOST_STREAMED_GAME',
  'AVG_VIEWERS_PER_STREAM', 'TOTAL_FOLLOWERS', 'TOTAL_VIEWS', 'ACTIVE_DAYS_PER_WEEK',
];

// Error propio para las filas con datos inválidos
class ValidationError extends Error {}

// Lee el CSV y comprueba que tenga filas y todas las columnas requeridas
function readDataset() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  if (rows.length === 0) throw new Error('The CSV file has no data rows');
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in rows[0]));
  if (missing.length > 0) throw new Error(`The CSV is missing required columns: ${missing.join(', ')}`);
  return rows;
}

// Convierte un texto a número y valida que sea numérico, entero (si aplica) y esté en rango
function parseNumber(value, column, line, { integer, min, max }) {
  const number = Number(value);
  if (value === '' || !Number.isFinite(number)) {
    throw new ValidationError(`line ${line}: ${column} is not a number ("${value}")`);
  }
  if (integer && !Number.isInteger(number)) {
    throw new ValidationError(`line ${line}: ${column} must be an integer ("${value}")`);
  }
  if (number < min || number > max) {
    throw new ValidationError(`line ${line}: ${column} is out of range (${number})`);
  }
  return number;
}

// Un mismo juego aparece con distintas mayúsculas (por ejemplo VALORANT / Valorant).
// Cada grupo (sin distinguir mayúsculas) se unifica a la grafía más frecuente.
function buildGameSpellings(rows) {
  // Cuenta cuántas veces aparece cada grafía de cada juego
  const counts = new Map();
  for (const row of rows) {
    for (const column of ['MOST_STREAMED_GAME', '2ND_MOST_STREAMED_GAME']) {
      const game = row[column];
      if (!game) continue;
      const key = game.toLowerCase();
      if (!counts.has(key)) counts.set(key, new Map());
      counts.get(key).set(game, (counts.get(key).get(game) || 0) + 1);
    }
  }
  // Elige la grafía más frecuente (si hay empate, la primera en orden alfabético)
  const canonical = new Map();
  const merged = [];
  for (const [key, spellings] of counts) {
    const ordered = [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    canonical.set(key, ordered[0][0]);
    if (ordered.length > 1) merged.push({ kept: ordered[0][0], merged: ordered.slice(1).map(([name]) => name) });
  }
  return { canonical, merged };
}

// Valida y transforma cada fila del CSV en un registro listo para insertar
function transform(rawRows) {
  const { canonical, merged } = buildGameSpellings(rawRows);
  const records = [];
  const rejected = [];
  // Contadores de las decisiones de calidad de datos (se muestran al final)
  const stats = {
    avg_viewers_zero_to_null: 0,
    total_views_zero_to_null: 0,
    missing_second_game: 0,
    second_equals_main_dropped: [],
    game_spellings_merged: merged,
  };

  rawRows.forEach((row, index) => {
    const line = index + 2; // +1 por el encabezado, +1 porque las líneas empiezan en 1
    try {
      // Campos de texto obligatorios
      for (const column of ['NAME', 'LANGUAGE', 'TYPE', 'MOST_STREAMED_GAME']) {
        if (!row[column]) throw new ValidationError(`line ${line}: ${column} is empty`);
      }
      // Campos numéricos con su rango válido
      let avgViewers = parseNumber(row.AVG_VIEWERS_PER_STREAM, 'AVG_VIEWERS_PER_STREAM', line, { integer: true, min: 0, max: 4294967295 });
      let totalViews = parseNumber(row.TOTAL_VIEWS, 'TOTAL_VIEWS', line, { integer: true, min: 0, max: Number.MAX_SAFE_INTEGER });
      const totalFollowers = parseNumber(row.TOTAL_FOLLOWERS, 'TOTAL_FOLLOWERS', line, { integer: true, min: 0, max: 4294967295 });
      const activeDays = parseNumber(row.ACTIVE_DAYS_PER_WEEK, 'ACTIVE_DAYS_PER_WEEK', line, { integer: false, min: 0, max: 7 });

      // Un 0 aquí es una medición faltante (un streamer con millones de seguidores no promedia 0 espectadores)
      if (avgViewers === 0) { avgViewers = null; stats.avg_viewers_zero_to_null += 1; }
      if (totalViews === 0) { totalViews = null; stats.total_views_zero_to_null += 1; }

      // Juegos con la grafía unificada
      const mainGame = canonical.get(row.MOST_STREAMED_GAME.toLowerCase());
      let secondGame = row['2ND_MOST_STREAMED_GAME'] ? canonical.get(row['2ND_MOST_STREAMED_GAME'].toLowerCase()) : null;
      if (!secondGame) {
        stats.missing_second_game += 1;
      } else if (secondGame === mainGame) {
        // El segundo juego no puede ser igual al primero: dato inconsistente del archivo
        stats.second_equals_main_dropped.push(row.NAME);
        secondGame = null;
      }

      records.push({
        name: row.NAME, language: row.LANGUAGE, type: row.TYPE, mainGame, secondGame,
        avgViewers, totalFollowers, totalViews, activeDays,
      });
    } catch (error) {
      // Las filas inválidas se guardan para informarlas; cualquier otro error se relanza
      if (!(error instanceof ValidationError)) throw error;
      rejected.push(error.message);
    }
  });
  return { records, rejected, stats };
}

// Inserta los valores únicos de un catálogo y devuelve un mapa nombre -> id
async function insertCatalog(connection, table, names) {
  const sorted = [...new Set(names)].sort((a, b) => a.localeCompare(b));
  await connection.query(`INSERT INTO ${table} (name) VALUES ?`, [sorted.map((name) => [name])]);
  const idColumn = table === 'streamer_type' ? 'id_type' : `id_${table}`;
  const [rows] = await connection.query(`SELECT ${idColumn} AS id, name FROM ${table}`);
  return new Map(rows.map((row) => [row.name, row.id]));
}

// Inserta las filas en lotes de BATCH_SIZE
async function insertInBatches(connection, sql, rows) {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    await connection.query(sql, [rows.slice(start, start + BATCH_SIZE)]);
  }
}

// Inserta todo en el orden que exigen las claves foráneas: catálogos, streamers y tabla puente
async function load(connection, records) {
  // Evita cargar dos veces sobre una base que ya tiene datos
  const [[{ already }]] = await connection.query('SELECT COUNT(*) AS already FROM streamer');
  if (already > 0) {
    throw new Error('The database already contains data. Run "npm run setup" to recreate it before loading again.');
  }
  // 1. Catálogos
  const languages = await insertCatalog(connection, 'language', records.map((record) => record.language));
  const types = await insertCatalog(connection, 'streamer_type', records.map((record) => record.type));
  const games = await insertCatalog(connection, 'game', records.flatMap((record) => [record.mainGame, record.secondGame].filter(Boolean)));

  // 2. Streamers
  await insertInBatches(
    connection,
    'INSERT INTO streamer (name, id_language, id_type, avg_viewers_per_stream, total_followers, total_views, active_days_per_week) VALUES ?',
    records.map((record) => [record.name, languages.get(record.language), types.get(record.type),
      record.avgViewers, record.totalFollowers, record.totalViews, record.activeDays])
  );
  const [streamerRows] = await connection.query('SELECT id_streamer, name FROM streamer');
  const streamerIds = new Map(streamerRows.map((row) => [row.name, row.id_streamer]));

  // 3. Tabla puente: orden 1 = juego principal, orden 2 = segundo juego (si existe)
  const links = [];
  for (const record of records) {
    links.push([streamerIds.get(record.name), 1, games.get(record.mainGame)]);
    if (record.secondGame) links.push([streamerIds.get(record.name), 2, games.get(record.secondGame)]);
  }
  await insertInBatches(connection, 'INSERT INTO streamer_game (id_streamer, preference_order, id_game) VALUES ?', links);
  return { languages: languages.size, types: types.size, games: games.size, streamers: records.length, links: links.length };
}

// Compara el conteo esperado con el conteo real de cada tabla; falla si no coinciden
async function verify(connection, expected) {
  const counts = {};
  for (const table of ['language', 'streamer_type', 'game', 'streamer', 'streamer_game']) {
    const [[{ total }]] = await connection.query(`SELECT COUNT(*) AS total FROM ${table}`);
    counts[table] = total;
  }
  const matches =
    counts.language === expected.languages && counts.streamer_type === expected.types &&
    counts.game === expected.games && counts.streamer === expected.streamers &&
    counts.streamer_game === expected.links;
  if (!matches) throw new Error(`Verification failed. Expected ${JSON.stringify(expected)} but found ${JSON.stringify(counts)}`);
  return counts;
}

// Pistas de solución según el código de error de MySQL
const HINTS = {
  ER_BAD_DB_ERROR: 'The database does not exist. Run "npm run setup" first.',
  ER_NO_SUCH_TABLE: 'A table is missing. Run "npm run setup" first.',
  ER_ACCESS_DENIED_ERROR: 'Wrong MySQL user or password. Check the DB_USER and DB_PASSWORD environment variables.',
  ECONNREFUSED: 'MySQL is not running or DB_HOST is wrong.',
  ER_DUP_ENTRY: 'Unique constraint violated (duplicate value).',
  ER_NO_REFERENCED_ROW_2: 'Foreign key violated (referenced row does not exist).',
  ER_DATA_TOO_LONG: 'A value is longer than its column allows.',
  ER_WARN_DATA_OUT_OF_RANGE: 'A numeric value does not fit in its column.',
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 'A value has an incompatible data type.',
  ER_CHECK_CONSTRAINT_VIOLATED: 'A CHECK constraint was violated.',
};

// Flujo principal: leer, validar, cargar, verificar e imprimir el resumen
async function main() {
  const { records, rejected, stats } = transform(readDataset());
  // Si hay filas inválidas, informa las primeras 20 y se detiene (salvo con --skip-invalid)
  if (rejected.length > 0) {
    console.error(`${rejected.length} invalid row(s) found:`);
    rejected.slice(0, 20).forEach((message) => console.error(`  - ${message}`));
    if (!SKIP_INVALID) throw new Error('Aborting: fix the CSV or run with --skip-invalid.');
  }

  // Conexión a MySQL con variables de entorno
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_streamers',
  });
  try {
    // Hace que el servidor rechace valores fuera de rango o truncados en lugar de ajustarlos en silencio
    await connection.query("SET SESSION sql_mode = CONCAT_WS(',', @@SESSION.sql_mode, 'STRICT_ALL_TABLES')");
    // Todo ocurre en una transacción: si algo falla, no queda nada a medias
    await connection.beginTransaction();
    const expected = await load(connection, records);
    const counts = await verify(connection, expected);
    await connection.commit();
    console.log(JSON.stringify({
      csv_rows_read: records.length + rejected.length,
      rows_rejected: rejected.length,
      rows_loaded: records.length,
      rows_per_table: counts,
      data_quality_decisions: stats,
    }, null, 2));
  } catch (error) {
    // Ante cualquier error se revierte la transacción
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

// Si algo falla, muestra el error con su pista y termina con código distinto de cero
main().catch((error) => {
  const hint = HINTS[error.code] ? ` -> ${HINTS[error.code]}` : '';
  console.error(`Load failed: [${error.code || 'ERROR'}] ${error.message}${hint}`);
  process.exit(1);
});
