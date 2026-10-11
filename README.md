# Streamers API + SQL Lab

REST API over the `db_streamers` MySQL database, plus the DDL script, the Node.js load program and the SQL queries
of the lab "Modelado y Análisis de Datos con SQL" (Universidad San Buenaventura). The dataset is `data/Streamers.csv`
(999 streamers).

## Structure
- `server.js`, `routes/`, `controllers/`, `dao/`, `services/`, `middlewares/`, `constants/`, `utils/`, `env/` - REST API (layered)
- `db/schema.sql` - DDL script (database `db_streamers`, 5 tables)
- `scripts/setup.js` - creates the database by running `db/schema.sql`
- `scripts/load.js` - load program (reads the CSV, validates, inserts, verifies)
- `scripts/run-queries.js` - runs every query in `sql/` and prints the results
- `sql/basic_queries.sql` - 4 basic queries (WHERE, 2-table JOIN, 4-table JOIN, GROUP BY)
- `sql/analysis_queries.sql` - the 4 analysis questions of the Streamers dataset (several statements per question)
- `sql/verification.sql` - row counts per table
- `data/Streamers.csv` - assigned dataset
- `docs/Diagrama E-R  Workbench.png` - ER diagram exported from MySQL Workbench
- `report/` - IEEE report in LaTeX (`main.tex`, `figures/`, `main.pdf`)

## Requirements
Node.js 18+ and MySQL 8.0.16+ (CHECK constraints are enforced from that version).

## Setup
1. `npm install`
2. Set your MySQL password as an environment variable in the terminal you will use (it is never stored in the repository).
   The API and the scripts read `DB_PASSWORD` (and optionally `DB_HOST`, `DB_USER`, `DB_NAME`, `PORT`;
   defaults: `localhost`, `root`, `db_streamers`, `5000`).
   - Windows (cmd): `set DB_PASSWORD=your_password` (on its own line, then run the npm commands)
   - Windows (PowerShell): `$env:DB_PASSWORD = "your_password"`
   - Linux / macOS: `export DB_PASSWORD=your_password`
3. `npm run db:setup` - creates the database (WARNING: drops and recreates `db_streamers`).
   Alternative: open `db/schema.sql` in MySQL Workbench and run it with the first lightning bolt.
4. `npm run db:load` - loads the CSV and prints rows read/loaded, rows per table and the data-quality decisions.
   Expected: 19 languages, 2 types, 211 games, 999 streamers, 1915 streamer-game links.
   Running it twice is refused; run `npm run db:setup` first to recreate the database.
5. `npm run db:queries` - runs and prints all the SQL queries (or open the files in `sql/` in Workbench).
6. `npm start` - starts the API (default port 5000).

## API endpoints (all GET)
| Route | Query parameters (defaults) | Description |
|---|---|---|
| `/streamers` | `minActiveDays` (5), `limit` (10) | Streamers with the highest average viewers |
| `/streamers/main-games` | `limit` (20) | Main game of each streamer (alphabetical) |
| `/streamers/views-per-follower` | `limit` (10) | Total views per follower |
| `/streamers/main-game-shared-as-secondary` | - | Streamers whose main game is the second game of another streamer |
| `/streamers/activity-ranges` | - | Average viewers by range of active days per week (0-2, 2-4, 4-6, 6-7) |
| `/games/rankings` | `preferenceOrder` (1), `limit` (5) | Most chosen games as main (1) or second (2) option |
| `/games/preference-comparison` | `limit` (15) | Games used as main and second, with average followers and views |
| `/languages/follower-stats` | - | Streamers, average followers and top-streamer share per language |
| `/streamer-types/distribution` | - | Number of streamers per type |

Invalid parameters answer `400`, unknown routes `404` and database failures `500`, always as JSON.

## Design decisions (details in the report)
- Only 9 of 17 CSV columns are kept: the ones the system needs.
- `MOST_STREAMED_GAME` and `2ND_MOST_STREAMED_GAME` are a repeating group, moved to the bridge table `streamer_game`.
- Language, type and game are catalog tables.
- Zeros in `AVG_VIEWERS_PER_STREAM` and `TOTAL_VIEWS` are missing measurements and are loaded as `NULL`.
- The load program is a standalone script (single run, no HTTP interface); the layered architecture is used by the API.
