USE db_streamers;

-- =====================================================================
-- Consultas de análisis - dataset asignado: Streamers.csv
-- =====================================================================

-- @name A1a_top_main_games
-- Pregunta 1: ¿Qué juego es el principal del mayor número de streamers?
SELECT game.name AS game_name,
       COUNT(*) AS streamers_as_main_game
FROM streamer_game
INNER JOIN game ON game.id_game = streamer_game.id_game
-- 1 = juego principal
WHERE streamer_game.preference_order = 1
GROUP BY game.id_game, game.name
ORDER BY streamers_as_main_game DESC, game.name
LIMIT 5;

-- @name A1b_top_second_games
-- Pregunta 1 (cont.): ¿Es también el juego que más aparece como segunda opción?
SELECT game.name AS game_name,
       COUNT(*) AS streamers_as_second_game
FROM streamer_game
INNER JOIN game ON game.id_game = streamer_game.id_game
-- 2 = segundo juego
WHERE streamer_game.preference_order = 2
GROUP BY game.id_game, game.name
ORDER BY streamers_as_second_game DESC, game.name
LIMIT 5;

-- @name A2_language_average_followers
-- Pregunta 2: ¿Qué idioma tiene el mayor promedio de seguidores por streamer, y ese liderazgo
-- lo sostienen muchos streamers o unos pocos muy grandes?
-- avg_followers_without_top quita del promedio al streamer más grande de cada idioma.
SELECT language.name AS language_name,
       COUNT(*) AS streamers,
       ROUND(AVG(streamer.total_followers)) AS avg_followers,
       MAX(streamer.total_followers) AS max_followers,
       -- promedio sin el streamer más grande (NULLIF evita dividir por cero si el idioma tiene uno solo)
       ROUND((SUM(streamer.total_followers) - MAX(streamer.total_followers)) / NULLIF(COUNT(*) - 1, 0)) AS avg_followers_without_top,
       -- porcentaje de los seguidores del idioma que tiene el streamer más grande
       ROUND(100 * MAX(streamer.total_followers) / SUM(streamer.total_followers), 1) AS top_streamer_share_pct
FROM streamer
INNER JOIN language ON language.id_language = streamer.id_language
GROUP BY language.id_language, language.name
ORDER BY avg_followers DESC, language.name;

-- @name A3a_shared_main_games
-- Pregunta 3: ¿Hay streamers cuyo juego principal es el segundo juego de otro streamer?
SELECT COUNT(DISTINCT main_link.id_streamer) AS streamers_with_shared_main_game,
       COUNT(DISTINCT main_link.id_game) AS games_shared
-- main_link = filas de juegos principales
FROM streamer_game AS main_link
WHERE main_link.preference_order = 1
  -- existe otro streamer que tiene ese mismo juego como segundo juego
  AND EXISTS (
    SELECT 1
    FROM streamer_game AS second_link
    WHERE second_link.preference_order = 2
      AND second_link.id_game = main_link.id_game
      AND second_link.id_streamer <> main_link.id_streamer
  );

-- @name A3b_role_comparison
-- Pregunta 3 (cont.): En los juegos que son principales para unos y secundarios para otros, ¿los
-- streamers que lo juegan como principal tienen más seguidores o vistas que los que lo juegan como secundario?
SELECT streamer_game.preference_order AS game_role,
       COUNT(*) AS streamer_game_links,
       ROUND(AVG(streamer.total_followers)) AS avg_followers,
       -- AVG ignora las vistas NULL
       ROUND(AVG(streamer.total_views)) AS avg_total_views,
       COUNT(streamer.total_views) AS links_with_views_data
FROM streamer_game
INNER JOIN streamer ON streamer.id_streamer = streamer_game.id_streamer
-- se queda solo con los juegos que se usan como principal y también como secundario
WHERE streamer_game.id_game IN (SELECT id_game FROM streamer_game WHERE preference_order = 1)
  AND streamer_game.id_game IN (SELECT id_game FROM streamer_game WHERE preference_order = 2)
GROUP BY streamer_game.preference_order
ORDER BY streamer_game.preference_order;

-- @name A3c_shared_games_detail
-- Pregunta 3 (cont.): ¿El patrón se repite juego por juego? (los 5 juegos compartidos con más filas)
SELECT game.name AS game_name,
       -- SUM sobre una condición cuenta las filas que la cumplen
       SUM(streamer_game.preference_order = 1) AS streamers_as_main,
       SUM(streamer_game.preference_order = 2) AS streamers_as_second,
       ROUND(AVG(CASE WHEN streamer_game.preference_order = 1 THEN streamer.total_followers END)) AS avg_followers_as_main,
       ROUND(AVG(CASE WHEN streamer_game.preference_order = 2 THEN streamer.total_followers END)) AS avg_followers_as_second
FROM streamer_game
INNER JOIN game ON game.id_game = streamer_game.id_game
INNER JOIN streamer ON streamer.id_streamer = streamer_game.id_streamer
GROUP BY game.id_game, game.name
-- solo juegos usados como principal y como secundario
HAVING SUM(streamer_game.preference_order = 1) > 0
   AND SUM(streamer_game.preference_order = 2) > 0
ORDER BY COUNT(*) DESC, game.name
LIMIT 5;

-- @name A4a_active_days_ranges
-- Pregunta 4: Al agrupar los streamers por rango de días activos por semana, ¿qué rango tiene el mejor
-- promedio de espectadores por transmisión? (AVG ignora los streamers sin dato de espectadores)
SELECT CASE
         WHEN streamer.active_days_per_week < 2 THEN '0 to <2 days'
         WHEN streamer.active_days_per_week < 4 THEN '2 to <4 days'
         WHEN streamer.active_days_per_week < 6 THEN '4 to <6 days'
         ELSE '6 to 7 days'
       END AS active_days_range,
       COUNT(*) AS streamers,
       -- streamers que sí tienen dato de espectadores (no NULL)
       COUNT(streamer.avg_viewers_per_stream) AS streamers_with_viewer_data,
       ROUND(AVG(streamer.avg_viewers_per_stream)) AS avg_viewers_per_stream
FROM streamer
GROUP BY active_days_range
ORDER BY MIN(streamer.active_days_per_week);

-- @name A4b_correlation_days_viewers
-- Pregunta 4 (cont.): ¿Más días activos implican más audiencia? Correlación de Pearson calculada en SQL:
-- r = (E[XY] - E[X]E[Y]) / (desviación de X * desviación de Y), con desviación poblacional.
SELECT COUNT(*) AS streamers_with_viewer_data,
       ROUND(
         (AVG(streamer.active_days_per_week * streamer.avg_viewers_per_stream)
          - AVG(streamer.active_days_per_week) * AVG(streamer.avg_viewers_per_stream))
         / (STDDEV_POP(streamer.active_days_per_week) * STDDEV_POP(streamer.avg_viewers_per_stream)),
       3) AS pearson_r
FROM streamer
-- ignora los streamers sin dato de espectadores
WHERE streamer.avg_viewers_per_stream IS NOT NULL;

-- @name A4c_range_by_streamer_type
-- Pregunta 4 (cont.): ¿El resultado de cada rango lo explica un solo tipo de canal (esports o personality)?
SELECT CASE
         WHEN streamer.active_days_per_week < 2 THEN '0 to <2 days'
         WHEN streamer.active_days_per_week < 4 THEN '2 to <4 days'
         WHEN streamer.active_days_per_week < 6 THEN '4 to <6 days'
         ELSE '6 to 7 days'
       END AS active_days_range,
       streamer_type.name AS streamer_type,
       COUNT(*) AS streamers,
       COUNT(streamer.avg_viewers_per_stream) AS streamers_with_viewer_data,
       ROUND(AVG(streamer.avg_viewers_per_stream)) AS avg_viewers_per_stream
FROM streamer
INNER JOIN streamer_type ON streamer_type.id_type = streamer.id_type
-- un grupo por cada combinación de rango y tipo de canal
GROUP BY active_days_range, streamer_type.id_type, streamer_type.name
ORDER BY MIN(streamer.active_days_per_week), streamer_type.name;
