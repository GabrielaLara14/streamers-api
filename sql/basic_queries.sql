USE db_streamers;

-- =====================================================================
-- Consultas básicas (una por cada tipo exigido)
-- =====================================================================

-- @name B1_where_two_conditions
-- Pregunta: ¿Qué streamers tienen más de 5 millones de seguidores Y transmiten al menos 5 días a la semana?
SELECT streamer.name AS streamer_name,
       streamer.total_followers,
       streamer.active_days_per_week
FROM streamer
-- más de 5 millones de seguidores
WHERE streamer.total_followers > 5000000
  -- y al menos 5 días activos por semana
  AND streamer.active_days_per_week >= 5
ORDER BY streamer.total_followers DESC, streamer.name;

-- @name B2_join_two_entities
-- Pregunta: ¿Quiénes son los 10 streamers con más seguidores y en qué idioma transmiten?
SELECT streamer.name AS streamer_name,
       language.name AS language_name,
       streamer.total_followers
FROM streamer
-- el nombre del idioma está en la tabla de catálogo
INNER JOIN language ON language.id_language = streamer.id_language
ORDER BY streamer.total_followers DESC, streamer.name
LIMIT 10;

-- @name B3_join_four_entities
-- Pregunta: ¿Cuál es el juego principal de los cinco streamers en portugués con más seguidores?
SELECT streamer.name AS streamer_name,
       language.name AS language_name,
       game.name AS main_game,
       streamer.total_followers
FROM streamer
INNER JOIN language ON language.id_language = streamer.id_language
-- la tabla puente une los streamers con sus juegos
INNER JOIN streamer_game ON streamer_game.id_streamer = streamer.id_streamer
INNER JOIN game ON game.id_game = streamer_game.id_game
WHERE language.name = 'Portuguese'
  -- 1 = juego principal (2 sería el segundo juego)
  AND streamer_game.preference_order = 1
ORDER BY streamer.total_followers DESC, streamer.name
LIMIT 5;

-- @name B4_aggregation_group_by
-- Pregunta: ¿Cómo se comparan los canales esports y personality en cantidad, seguidores promedio y días activos?
SELECT streamer_type.name AS streamer_type,
       COUNT(*) AS streamers,
       ROUND(AVG(streamer.total_followers)) AS avg_followers,
       ROUND(AVG(streamer.active_days_per_week), 2) AS avg_active_days
FROM streamer
INNER JOIN streamer_type ON streamer_type.id_type = streamer.id_type
-- una fila de resultado por cada tipo de streamer
GROUP BY streamer_type.id_type, streamer_type.name
ORDER BY streamers DESC;
