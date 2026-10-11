USE db_streamers;

-- @name V1_row_counts_per_table
-- Pregunta: ¿el programa de carga insertó la cantidad esperada de filas en cada tabla?
SELECT 'language' AS table_name, COUNT(*) AS row_count FROM language
UNION ALL SELECT 'streamer_type', COUNT(*) FROM streamer_type
UNION ALL SELECT 'game', COUNT(*) FROM game
UNION ALL SELECT 'streamer', COUNT(*) FROM streamer
UNION ALL SELECT 'streamer_game', COUNT(*) FROM streamer_game;
