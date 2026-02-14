-- ============================================================
-- 03-spatial-ddl.sql
-- Enterprise Data Portal — Spatial data tables (reference SQL)
-- NOTE: This app now targets Microsoft Fabric Warehouse (T-SQL)
--       with built-in geometry support. No PostGIS extension needed.
--       Spatial tables are auto-initialized by geospatialRoutes.js.
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================
--  SPATIAL LAYER REGISTRY
-- =========================

CREATE TABLE IF NOT EXISTS spatial_layers (
    layer_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(30)  NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    layer_type    VARCHAR(20)  NOT NULL,   -- 'point' | 'polygon' | 'line'
    category      VARCHAR(60),
    icon          VARCHAR(40),             -- Fluent UI icon name
    color         VARCHAR(20),             -- Hex color e.g. '#34D399'
    feature_count INT DEFAULT 0
);

-- =========================
--  SPATIAL FEATURES
-- =========================

CREATE TABLE IF NOT EXISTS spatial_features (
    feature_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id    UUID NOT NULL REFERENCES spatial_layers(layer_id),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    properties  JSONB DEFAULT '{}',
    geom        geometry(Geometry, 4326)
);

-- Spatial index for bounding-box and intersection queries
CREATE INDEX IF NOT EXISTS idx_spatial_features_geom
    ON spatial_features USING GIST (geom);

-- Layer lookup index
CREATE INDEX IF NOT EXISTS idx_spatial_features_layer
    ON spatial_features (layer_id);
