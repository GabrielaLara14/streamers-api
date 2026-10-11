-- =====================================================================
-- Laboratorio Streamers - script DDL (MySQL 8)
-- Modelo normalizado (3FN): language, streamer_type, game, streamer,
-- streamer_game (tabla puente de la relación N:M entre streamer y game).
-- ADVERTENCIA: este script borra y vuelve a crear la base de datos "db_streamers".
-- =====================================================================

DROP DATABASE IF EXISTS db_streamers;
CREATE DATABASE db_streamers DEFAULT CHARACTER SET utf8mb4;
USE db_streamers;

-- Catálogo de idiomas de las transmisiones
CREATE TABLE language (
  id_language TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)      NOT NULL,
  PRIMARY KEY (id_language),
  UNIQUE KEY uq_language_name (name)
) ENGINE = InnoDB;

-- Catálogo de tipos de streamer (personality, esports)
CREATE TABLE streamer_type (
  id_type TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name    VARCHAR(50)      NOT NULL,
  PRIMARY KEY (id_type),
  UNIQUE KEY uq_streamer_type_name (name)
) ENGINE = InnoDB;

-- Catálogo de juegos / categorías
CREATE TABLE game (
  id_game SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name    VARCHAR(100)      NOT NULL,
  PRIMARY KEY (id_game),
  UNIQUE KEY uq_game_name (name)
) ENGINE = InnoDB;

-- Entidad principal. avg_viewers_per_stream y total_views quedan en NULL cuando
-- el archivo original trae 0 (una medición faltante, no un cero real).
CREATE TABLE streamer (
  id_streamer            SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                   VARCHAR(50)       NOT NULL,
  id_language            TINYINT UNSIGNED  NOT NULL,
  id_type                TINYINT UNSIGNED  NOT NULL,
  avg_viewers_per_stream INT UNSIGNED      NULL,
  total_followers        INT UNSIGNED      NOT NULL,
  total_views            BIGINT UNSIGNED   NULL,
  active_days_per_week   DECIMAL(2,1)      NOT NULL,
  PRIMARY KEY (id_streamer),
  -- El nombre de un streamer no se puede repetir
  UNIQUE KEY uq_streamer_name (name),
  -- Índices para acelerar los joins con los catálogos
  KEY idx_streamer_language (id_language),
  KEY idx_streamer_type (id_type),
  -- Los días activos por semana van de 0 a 7
  CONSTRAINT ck_streamer_active_days CHECK (active_days_per_week BETWEEN 0 AND 7),
  -- Idioma y tipo vienen de los catálogos; no se puede borrar un catálogo en uso
  CONSTRAINT fk_streamer_language FOREIGN KEY (id_language)
    REFERENCES language (id_language) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_streamer_type FOREIGN KEY (id_type)
    REFERENCES streamer_type (id_type) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla puente: preference_order 1 = juego más transmitido, 2 = segundo juego más transmitido
CREATE TABLE streamer_game (
  id_streamer      SMALLINT UNSIGNED NOT NULL,
  preference_order TINYINT UNSIGNED  NOT NULL,
  id_game          SMALLINT UNSIGNED NOT NULL,
  -- Un streamer tiene como máximo un juego por posición
  PRIMARY KEY (id_streamer, preference_order),
  -- Un streamer no puede tener el mismo juego como principal y como secundario
  UNIQUE KEY uq_streamer_game (id_streamer, id_game),
  KEY idx_streamer_game_game (id_game),
  -- El orden solo puede ser 1 o 2
  CONSTRAINT ck_streamer_game_order CHECK (preference_order IN (1, 2)),
  -- Si se borra un streamer, se borran sus filas de la tabla puente
  CONSTRAINT fk_streamer_game_streamer FOREIGN KEY (id_streamer)
    REFERENCES streamer (id_streamer) ON DELETE CASCADE ON UPDATE CASCADE,
  -- No se puede borrar un juego que esté en uso
  CONSTRAINT fk_streamer_game_game FOREIGN KEY (id_game)
    REFERENCES game (id_game) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
