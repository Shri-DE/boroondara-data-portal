// geospatialRoutes.js
// Spatial data API — serves GeoJSON features from PostGIS spatial tables
const express = require("express");
const dbService = require("./services/dbService");

const router = express.Router();

// UUID format validator
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── GET /api/spatial/layers ─────────────────────────────
// Returns all spatial layer metadata
router.get("/layers", async (req, res) => {
  try {
    const result = await dbService.executeQuery(`
      SELECT layer_id, code, name, description, layer_type,
             category, icon, color, feature_count
      FROM spatial_layers
      ORDER BY name
    `);
    res.json({ layers: result.rows });
  } catch (err) {
    console.error("[SPATIAL] Error loading layers:", err.message);
    res.status(500).json({ error: "Failed to load spatial layers" });
  }
});

// ── GET /api/spatial/stats ──────────────────────────────
// Returns summary statistics for KPI cards
router.get("/stats", async (req, res) => {
  try {
    const [layerStats, featureStats, typeStats] = await Promise.all([
      dbService.executeQuery(
        `SELECT COUNT(*) AS total_layers FROM spatial_layers`
      ),
      dbService.executeQuery(
        `SELECT COUNT(*) AS total_features FROM spatial_features`
      ),
      dbService.executeQuery(`
        SELECT
          SUM(CASE WHEN layer_type = 'polygon' THEN 1 ELSE 0 END) AS polygon_layers,
          SUM(CASE WHEN layer_type = 'point'   THEN 1 ELSE 0 END) AS point_layers
        FROM spatial_layers
      `),
    ]);

    res.json({
      totalLayers: Number(layerStats.rows[0]?.total_layers || 0),
      totalFeatures: Number(featureStats.rows[0]?.total_features || 0),
      polygonLayers: Number(typeStats.rows[0]?.polygon_layers || 0),
      pointLayers: Number(typeStats.rows[0]?.point_layers || 0),
    });
  } catch (err) {
    console.error("[SPATIAL] Error loading stats:", err.message);
    res.status(500).json({ error: "Failed to load spatial stats" });
  }
});

// ── GET /api/spatial/layers/:layerId/features ───────────
// Returns GeoJSON FeatureCollection for a single layer
// Optional query: ?bbox=minLng,minLat,maxLng,maxLat
router.get("/layers/:layerId/features", async (req, res) => {
  try {
    const { layerId } = req.params;

    // Validate UUID
    if (!UUID_RE.test(layerId)) {
      return res.status(400).json({ error: "Invalid layer ID format" });
    }

    let sql = `
      SELECT
        sf.feature_id,
        sf.name,
        sf.description,
        sf.properties,
        ST_AsText(sf.geom) AS geom_wkt,
        sl.name  AS layer_name,
        sl.code  AS layer_code,
        sl.color AS layer_color,
        sl.layer_type
      FROM spatial_features sf
      JOIN spatial_layers sl ON sf.layer_id = sl.layer_id
      WHERE sf.layer_id = '${layerId}'
    `;

    // Optional bounding box filter (PostGIS)
    const { bbox } = req.query;
    if (bbox) {
      const parts = String(bbox).split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        sql += ` AND ST_Intersects(sf.geom, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`;
      }
    }

    sql += ` ORDER BY sf.name`;

    const result = await dbService.executeQuery(sql);

    // Convert WKT geometry to GeoJSON on the server side
    const featureCollection = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        id: row.feature_id,
        geometry: wktToGeoJSON(row.geom_wkt),
        properties: {
          feature_id: row.feature_id,
          name: row.name,
          description: row.description,
          layer_name: row.layer_name,
          layer_code: row.layer_code,
          layer_color: row.layer_color,
          layer_type: row.layer_type,
          ...(typeof row.properties === "string" ? JSON.parse(row.properties) : row.properties || {}),
        },
      })),
    };

    res.json(featureCollection);
  } catch (err) {
    console.error("[SPATIAL] Error loading features:", err.message);
    res.status(500).json({ error: "Failed to load spatial features" });
  }
});

// ── GET /api/spatial/features/:featureId ────────────────
// Returns a single feature with full detail
router.get("/features/:featureId", async (req, res) => {
  try {
    const { featureId } = req.params;

    if (!UUID_RE.test(featureId)) {
      return res.status(400).json({ error: "Invalid feature ID format" });
    }

    const result = await dbService.executeQuery(`
      SELECT
        sf.feature_id,
        sf.name,
        sf.description,
        sf.properties,
        ST_AsText(sf.geom) AS geom_wkt,
        sl.name  AS layer_name,
        sl.code  AS layer_code,
        sl.color AS layer_color,
        sl.layer_type
      FROM spatial_features sf
      JOIN spatial_layers sl ON sf.layer_id = sl.layer_id
      WHERE sf.feature_id = '${featureId}'
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Feature not found" });
    }

    const row = result.rows[0];
    res.json({
      type: "Feature",
      id: row.feature_id,
      geometry: wktToGeoJSON(row.geom_wkt),
      properties: {
        feature_id: row.feature_id,
        name: row.name,
        description: row.description,
        layer_name: row.layer_name,
        layer_code: row.layer_code,
        layer_color: row.layer_color,
        layer_type: row.layer_type,
        ...(typeof row.properties === "string" ? JSON.parse(row.properties) : row.properties || {}),
      },
    });
  } catch (err) {
    console.error("[SPATIAL] Error loading feature:", err.message);
    res.status(500).json({ error: "Failed to load feature" });
  }
});

// ── Helper: convert WKT string to GeoJSON geometry object ────
function wktToGeoJSON(wkt) {
  if (!wkt) return null;
  try {
    // POINT(lng lat)
    const pointMatch = wkt.match(/^POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)$/i);
    if (pointMatch) {
      return { type: "Point", coordinates: [parseFloat(pointMatch[1]), parseFloat(pointMatch[2])] };
    }
    // POLYGON((x1 y1, x2 y2, ...))
    const polyMatch = wkt.match(/^POLYGON\s*\(\((.+)\)\)$/i);
    if (polyMatch) {
      const coords = polyMatch[1].split(",").map((pair) => {
        const [x, y] = pair.trim().split(/\s+/).map(Number);
        return [x, y];
      });
      return { type: "Polygon", coordinates: [coords] };
    }
    // MULTIPOLYGON(((x1 y1, ...)), ((x1 y1, ...)))
    const mpMatch = wkt.match(/^MULTIPOLYGON\s*\(\((.+)\)\)$/i);
    if (mpMatch) {
      const rings = mpMatch[1].split(")),((").map((ring) =>
        ring.replace(/[()]/g, "").split(",").map((pair) => {
          const [x, y] = pair.trim().split(/\s+/).map(Number);
          return [x, y];
        })
      );
      return { type: "MultiPolygon", coordinates: rings.map((r) => [r]) };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Auto-initialize spatial tables + seed data on startup ────
// For PostgreSQL: just check if tables exist and report status
async function initializeSpatialTables() {
  const q = (sql) => dbService.executeQuery(sql);

  try {
    // Check if spatial_layers table exists
    const tblCheck = await q(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spatial_layers'`
    );

    if (tblCheck.rows.length === 0) {
      console.log("[SPATIAL] Spatial tables not found — run pg-01-ddl.sql and pg-03-spatial-seed.sql");
      return;
    }

    // Check if already seeded
    const countCheck = await q(`SELECT COUNT(*) AS cnt FROM spatial_layers`);
    if (Number(countCheck.rows[0].cnt) > 0) {
      const fc = await q(`SELECT COUNT(*) AS cnt FROM spatial_features`);
      console.log(
        `✅ Spatial tables ready (${countCheck.rows[0].cnt} layers, ${fc.rows[0].cnt} features)`
      );
      return;
    }

    console.log("[SPATIAL] Spatial tables empty — run pg-03-spatial-seed.sql to load data");
  } catch (err) {
    console.warn("[SPATIAL] Could not check spatial tables:", err.message);
  }
}

module.exports = router;
module.exports.initializeSpatialTables = initializeSpatialTables;
