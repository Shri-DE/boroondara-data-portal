-- ============================================================
-- pg-02-spatial-ddl.sql
-- Spatial tables — requires PostGIS extension
-- Separated from pg-01-ddl.sql so that PostGIS availability
-- does not block creation of core business tables.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS spatial_layers (
    layer_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(30)  NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    layer_type    VARCHAR(20)  NOT NULL,
    category      VARCHAR(60),
    icon          VARCHAR(40),
    color         VARCHAR(20),
    feature_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS spatial_features (
    feature_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id    UUID NOT NULL REFERENCES spatial_layers(layer_id),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    properties  JSONB DEFAULT '{}',
    geom        geometry(Geometry, 4326)
);

CREATE INDEX IF NOT EXISTS idx_spatial_features_geom
    ON spatial_features USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_spatial_features_layer
    ON spatial_features (layer_id);
