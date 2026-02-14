// geospatialRoutes.js
// Spatial data API — serves GeoJSON features from spatial tables
const express = require("express");
const fabricService = require("./services/fabricService");

const router = express.Router();

// UUID format validator
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── GET /api/spatial/layers ─────────────────────────────
// Returns all spatial layer metadata
router.get("/layers", async (req, res) => {
  try {
    const result = await fabricService.executeQuery(`
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
      fabricService.executeQuery(
        `SELECT COUNT(*) AS total_layers FROM spatial_layers`
      ),
      fabricService.executeQuery(
        `SELECT COUNT(*) AS total_features FROM spatial_features`
      ),
      fabricService.executeQuery(`
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
        sf.geom.STAsText() AS geom_wkt,
        sl.name  AS layer_name,
        sl.code  AS layer_code,
        sl.color AS layer_color,
        sl.layer_type
      FROM spatial_features sf
      JOIN spatial_layers sl ON sf.layer_id = sl.layer_id
      WHERE sf.layer_id = '${layerId}'
    `;

    // Optional bounding box filter
    const { bbox } = req.query;
    if (bbox) {
      const parts = String(bbox).split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        sql += ` AND sf.geom.STIntersects(geometry::STGeomFromText('POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))', 4326)) = 1`;
      }
    }

    sql += ` ORDER BY sf.name`;

    const result = await fabricService.executeQuery(sql);

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

    const result = await fabricService.executeQuery(`
      SELECT
        sf.feature_id,
        sf.name,
        sf.description,
        sf.properties,
        sf.geom.STAsText() AS geom_wkt,
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
// Runs DDL + seed inline so no manual SQL step is needed after deploy
async function initializeSpatialTables() {
  const q = (sql) => fabricService.executeQuery(sql);

  // 1. Fabric Warehouse has built-in geometry support — no extension needed

  // 2. Create tables if they don't exist
  const tblCheck = await q(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'dbo' AND table_name = 'spatial_layers'`
  );
  if (tblCheck.rows.length === 0) {
    console.log("[SPATIAL] Creating spatial tables...");
    await q(`
      CREATE TABLE spatial_layers (
        layer_id      UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        code          VARCHAR(30)  NOT NULL UNIQUE,
        name          VARCHAR(120) NOT NULL,
        description   VARCHAR(MAX),
        layer_type    VARCHAR(20)  NOT NULL,
        category      VARCHAR(60),
        icon          VARCHAR(40),
        color         VARCHAR(20),
        feature_count INT DEFAULT 0
      )
    `);
    await q(`
      CREATE TABLE spatial_features (
        feature_id  UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        layer_id    UNIQUEIDENTIFIER NOT NULL REFERENCES spatial_layers(layer_id),
        name        VARCHAR(200) NOT NULL,
        description VARCHAR(MAX),
        properties  NVARCHAR(MAX) DEFAULT '{}',
        geom        geometry
      )
    `);
    await q(`CREATE INDEX idx_spatial_features_layer ON spatial_features (layer_id)`);
    console.log("[SPATIAL] Tables created");
  }

  // 3. Seed data if empty
  const countCheck = await q(`SELECT COUNT(*) AS cnt FROM spatial_layers`);
  if (Number(countCheck.rows[0].cnt) > 0) {
    const fc = await q(`SELECT COUNT(*) AS cnt FROM spatial_features`);
    console.log(
      `✅ Spatial tables ready (${countCheck.rows[0].cnt} layers, ${fc.rows[0].cnt} features)`
    );
    return;
  }

  console.log("[SPATIAL] Seeding Manningham Council spatial data...");

  // ── Layer definitions ──
  await q(`
    INSERT INTO spatial_layers (code, name, description, layer_type, category, icon, color)
    SELECT v.code, v.name, v.description, v.layer_type, v.category, v.icon, v.color
    FROM (VALUES
      ('facilities',     'Council Facilities',    'Council buildings, libraries, aquatic centres, community centres and depots across Manningham.',          'point',   'Community',       'CityNext',        '#0078D4'),
      ('parks',          'Parks & Reserves',      'Public parks, nature reserves, linear trails and open space areas maintained by council.',                'point',   'Environment',     'Leaf',            '#34D399'),
      ('infrastructure', 'Infrastructure Assets', 'Bridges, drainage pits, stormwater assets and road infrastructure with condition assessments.',           'point',   'Infrastructure',  'Manufacturing',   '#FBBF24'),
      ('wards',          'Ward Boundaries',       'Three electoral wards of Manningham City Council with councillor and population details.',                'polygon', 'Governance',      'Globe',           '#7C7CFF'),
      ('trees',          'Street Trees',          'Council-managed street trees with species, dimensions, health status and planting dates.',                'point',   'Environment',     'Flower',          '#22C55E'),
      ('zones',          'Planning Zones',        'Victorian planning scheme zones including residential, activity centre, green wedge and public use.',     'polygon', 'Planning',        'Org',             '#38BDF8')
    ) AS v(code, name, description, layer_type, category, icon, color)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_layers)
  `);

  // ── Layer 1: Council Facilities (~30 points) ──
  await q(`
    INSERT INTO spatial_features (layer_id, name, description, properties, geom)
    SELECT
      (SELECT layer_id FROM spatial_layers WHERE code = 'facilities'),
      v.name, v.description, v.props,
      geometry::STGeomFromText('POINT(' + CAST(v.lng AS VARCHAR(30)) + ' ' + CAST(v.lat AS VARCHAR(30)) + ')', 4326)
    FROM (VALUES
      ('Manningham Civic Centre',       'Council headquarters and customer service centre',       '{"facility_type":"Civic","address":"699 Doncaster Rd, Doncaster","suburb":"Doncaster","phone":"03 9840 9333"}',            145.1230, -37.7830),
      ('MC Square Library',             'Main library and community hub in Doncaster',            '{"facility_type":"Library","address":"687 Doncaster Rd, Doncaster","suburb":"Doncaster","phone":"03 9877 0274"}',           145.1228, -37.7832),
      ('Aquarena Aquatic Centre',       'Indoor and outdoor swimming pools and fitness centre',   '{"facility_type":"Aquatic Centre","address":"25 Williamsons Rd, Doncaster","suburb":"Doncaster","phone":"03 9842 0366"}',   145.1280, -37.7780),
      ('Doncaster Hill Precinct',       'Major activity centre and residential precinct',         '{"facility_type":"Activity Centre","address":"150 Civic Dr, Doncaster","suburb":"Doncaster"}',                              145.1264, -37.7847),
      ('Templestowe Village',           'Local shopping village and community precinct',           '{"facility_type":"Village Centre","address":"30 Anderson St, Templestowe","suburb":"Templestowe"}',                         145.1170, -37.7560),
      ('Bulleen Park',                  'Multi-purpose sporting facility and open space',          '{"facility_type":"Sports Park","address":"55 Bulleen Rd, Bulleen","suburb":"Bulleen"}',                                    145.0830, -37.7680),
      ('Warrandyte River Reserve',      'Yarra River frontage reserve with walking trails',        '{"facility_type":"Nature Reserve","address":"10 Yarra St, Warrandyte","suburb":"Warrandyte"}',                              145.2260, -37.7530),
      ('Doncaster East Reserve',        'Local park with playground and sports oval',               '{"facility_type":"Reserve","address":"80 George St, Doncaster East","suburb":"Doncaster East"}',                            145.1560, -37.7870),
      ('Westfield Doncaster Surrounds', 'Commercial precinct surrounds and public realm',          '{"facility_type":"Commercial Precinct","address":"619 Doncaster Rd, Doncaster","suburb":"Doncaster"}',                     145.1250, -37.7850),
      ('Ruffey Lake Park',              'Major regional park with lake, trails and playground',     '{"facility_type":"Regional Park","address":"Victoria St, Doncaster","suburb":"Doncaster"}',                                145.1190, -37.7720),
      ('Pettys Orchard Reserve',        'Heritage orchard and open space area',                    '{"facility_type":"Heritage Reserve","address":"Knees Rd, Park Orchards","suburb":"Park Orchards"}',                         145.1850, -37.7680),
      ('Warrandyte Depot',              'Council works depot and vehicle storage',                  '{"facility_type":"Depot","address":"5 Research-Warr Rd, Warrandyte","suburb":"Warrandyte"}',                               145.2230, -37.7510),
      ('Pines Activity Centre',         'Local shops and community services hub',                  '{"facility_type":"Activity Centre","address":"80 Reynolds Rd, Doncaster East","suburb":"Doncaster East"}',                 145.1520, -37.7900),
      ('Donvale Sports Hub',            'Multi-sport facility with ovals and courts',              '{"facility_type":"Sports Hub","address":"20 Mitcham Rd, Donvale","suburb":"Donvale"}',                                     145.1700, -37.7970),
      ('Lower Templestowe Reserve',     'Local park and playground area',                          '{"facility_type":"Reserve","address":"25 Blake St, Lower Templestowe","suburb":"Lower Templestowe"}',                       145.1050, -37.7640),
      ('Serpells Rd Reserve',           'Open space reserve in Templestowe',                       '{"facility_type":"Reserve","address":"10 Serpells Rd, Templestowe","suburb":"Templestowe"}',                                145.1320, -37.7500),
      ('Yarra Valley Parklands',        'Scenic parklands along the Yarra River corridor',         '{"facility_type":"Parkland","address":"Everard Dr, Templestowe","suburb":"Templestowe"}',                                  145.1400, -37.7610),
      ('Templestowe Bike Track',        'BMX and mountain bike facility',                          '{"facility_type":"Bike Track","address":"Porter St, Templestowe","suburb":"Templestowe"}',                                 145.1285, -37.7545),
      ('Deep Creek Reserve',            'Bushland reserve with walking tracks',                    '{"facility_type":"Bushland Reserve","address":"Stintons Rd, Park Orchards","suburb":"Park Orchards"}',                      145.1920, -37.7620),
      ('Schramms Reserve',              'Local park and open space',                               '{"facility_type":"Reserve","address":"Heidelberg-Warr Rd, Doncaster","suburb":"Doncaster"}',                               145.1100, -37.7710),
      ('Jumping Creek Reserve',         'Bushland reserve near Jumping Creek',                     '{"facility_type":"Bushland Reserve","address":"Jumping Creek Rd, Wonga Park","suburb":"Wonga Park"}',                       145.2530, -37.7490),
      ('Wonga Park Village',            'Rural village centre and community hub',                  '{"facility_type":"Village Centre","address":"22 Old Yarra Rd, Wonga Park","suburb":"Wonga Park"}',                         145.2580, -37.7430),
      ('Rieschiecks Reserve',           'Sports ground and community reserve',                     '{"facility_type":"Sports Reserve","address":"Thompson St, Templestowe","suburb":"Templestowe"}',                            145.1370, -37.7490),
      ('Zerbes Reserve',                'Local park with playground',                              '{"facility_type":"Reserve","address":"Zerbes Way, Doncaster","suburb":"Doncaster"}',                                       145.1360, -37.7770),
      ('Tulloch Reserve',               'Open space reserve in Lower Templestowe',                 '{"facility_type":"Reserve","address":"Tulloch Gv, Templestowe Lower","suburb":"Templestowe Lower"}',                       145.1000, -37.7650),
      ('Mullum Mullum Linear Park',     'Major linear trail along Mullum Mullum Creek',            '{"facility_type":"Linear Park","address":"Springvale Rd, Donvale","suburb":"Donvale"}',                                    145.1650, -37.8000),
      ('Koonung Creek Reserve',         'Creek-side reserve and walking trail',                    '{"facility_type":"Creek Reserve","address":"Koonung Creek, Doncaster","suburb":"Doncaster"}',                              145.1090, -37.7860),
      ('Currawong Bush Park',           'Native bushland park with walking trails',                '{"facility_type":"Bush Park","address":"Reynolds Rd, Doncaster East","suburb":"Doncaster East"}',                          145.1610, -37.7920),
      ('Birrarung Park',                'Riverside park at confluence of Yarra and Mullum Mullum', '{"facility_type":"Riverside Park","address":"Fitzsimons Ln, Templestowe","suburb":"Templestowe"}',                         145.1120, -37.7580),
      ('Woodridge Linear Reserve',      'Walking and cycling trail through residential area',      '{"facility_type":"Linear Reserve","address":"Woodridge Dr, Doncaster East","suburb":"Doncaster East"}',                    145.1640, -37.7890)
    ) AS v(name, description, props, lng, lat)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'facilities')
  `);

  // ── Layer 2: Parks & Reserves (~20 points) ──
  await q(`
    INSERT INTO spatial_features (layer_id, name, description, properties, geom)
    SELECT
      (SELECT layer_id FROM spatial_layers WHERE code = 'parks'),
      v.name, v.description, v.props,
      geometry::STGeomFromText('POINT(' + CAST(v.lng AS VARCHAR(30)) + ' ' + CAST(v.lat AS VARCHAR(30)) + ')', 4326)
    FROM (VALUES
      ('Ruffey Lake Park',              'Regional park with 3km trail loop around ornamental lake',                '{"park_type":"Regional","area_ha":28.5,"facilities":["Playground","BBQ","Toilet","Car Park","Lake","Walking Trail"]}',     145.1190, -37.7720),
      ('Warrandyte River Reserve',      'Yarra River frontage with indigenous flora and canoe launch',             '{"park_type":"River Reserve","area_ha":42.0,"facilities":["Walking Trail","Canoe Launch","Lookout","Toilet"]}',            145.2260, -37.7530),
      ('Mullum Mullum Linear Park',     '10km shared trail along Mullum Mullum Creek to Yarra confluence',        '{"park_type":"Linear","area_ha":35.0,"facilities":["Cycling Path","Walking Trail","Bridge Crossings"]}',                  145.1650, -37.8000),
      ('Deep Creek Reserve',            'Remnant bushland with seasonal wildflower displays',                      '{"park_type":"Bushland","area_ha":18.0,"facilities":["Walking Trail","Bird Hide","Interpretive Signs"]}',                  145.1920, -37.7620),
      ('Currawong Bush Park',           'Native bushland with 5km of sealed and gravel trails',                    '{"park_type":"Bushland","area_ha":22.0,"facilities":["Walking Trail","Picnic Area","Toilet","Car Park"]}',                 145.1610, -37.7920),
      ('Birrarung Park',                'Riverside reserve at Yarra and Mullum Mullum confluence',                 '{"park_type":"Riverside","area_ha":12.0,"facilities":["Playground","BBQ","Toilet","Canoe Launch"]}',                       145.1120, -37.7580),
      ('Schramms Reserve',              'Sports ovals, playground and community space',                            '{"park_type":"Sports","area_ha":8.5,"facilities":["Sports Oval","Playground","Toilet","Car Park"]}',                       145.1100, -37.7710),
      ('Zerbes Reserve',                'Neighbourhood park with adventure playground',                            '{"park_type":"Local","area_ha":3.2,"facilities":["Playground","Open Space","Seating"]}',                                   145.1360, -37.7770),
      ('Pettys Orchard',                'Heritage apple and pear orchard preserved as public open space',          '{"park_type":"Heritage","area_ha":5.0,"facilities":["Walking Path","Heritage Orchard","Picnic Area"]}',                    145.1850, -37.7680),
      ('Jumping Creek Reserve',         'Bushland corridor linking Warrandyte State Park',                         '{"park_type":"Bushland","area_ha":15.0,"facilities":["Walking Trail","Creek Crossing"]}',                                  145.2530, -37.7490),
      ('Koonung Creek Reserve',         'Creek corridor with shared pathway and revegetation',                     '{"park_type":"Creek Reserve","area_ha":10.0,"facilities":["Shared Path","Seating","Revegetation Area"]}',                  145.1090, -37.7860),
      ('Yarra Valley Parklands',        'Scenic Yarra River frontage with river red gums',                         '{"park_type":"Riverine","area_ha":20.0,"facilities":["Walking Trail","Lookout","Car Park"]}',                              145.1400, -37.7610),
      ('Bulleen Park',                  'Major sporting precinct with multiple ovals',                             '{"park_type":"Sports","area_ha":16.0,"facilities":["Sports Oval","Cricket Nets","Tennis Courts","Toilet","Car Park"]}',    145.0830, -37.7680),
      ('Tulloch Reserve',               'Neighbourhood green space with mature trees',                             '{"park_type":"Local","area_ha":2.5,"facilities":["Open Space","Seating","Dog Off-Leash"]}',                                145.1000, -37.7650),
      ('Rieschiecks Reserve',           'Sports ground with pavilion and playground',                               '{"park_type":"Sports","area_ha":6.0,"facilities":["Sports Oval","Pavilion","Playground","Toilet"]}',                       145.1370, -37.7490),
      ('Woodridge Linear Reserve',      'Neighbourhood walking trail through Doncaster East',                      '{"park_type":"Linear","area_ha":4.0,"facilities":["Walking Path","Seating"]}',                                             145.1640, -37.7890),
      ('Serpells Reserve',              'Open space with mature eucalypts and informal paths',                      '{"park_type":"Local","area_ha":3.5,"facilities":["Walking Path","Open Space"]}',                                           145.1320, -37.7500),
      ('Finns Reserve',                 'Community reserve with sports facilities',                                 '{"park_type":"Sports","area_ha":7.0,"facilities":["Sports Oval","Tennis Courts","Playground"]}',                            145.0920, -37.7750),
      ('Domeney Reserve',               'Community park in Doncaster East with skate park',                        '{"park_type":"Community","area_ha":4.5,"facilities":["Skate Park","Playground","BBQ","Toilet"]}',                           145.1480, -37.7880),
      ('Donvale Reserve',               'Neighbourhood park with sports oval and playground',                      '{"park_type":"Sports","area_ha":5.5,"facilities":["Sports Oval","Playground","Toilet"]}',                                  145.1750, -37.7950)
    ) AS v(name, description, props, lng, lat)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'parks')
  `);

  // ── Layer 3: Infrastructure Assets (~40 points) ──
  await q(`
    INSERT INTO spatial_features (layer_id, name, description, properties, geom)
    SELECT
      (SELECT layer_id FROM spatial_layers WHERE code = 'infrastructure'),
      v.name, v.description, v.props,
      geometry::STGeomFromText('POINT(' + CAST(v.lng AS VARCHAR(30)) + ' ' + CAST(v.lat AS VARCHAR(30)) + ')', 4326)
    FROM (VALUES
      ('Fitzsimons Lane Bridge',        'Major road bridge over Yarra River',                     '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-09-15","replacement_value":8500000}',   145.1120, -37.7600),
      ('Templestowe Rd Bridge',         'Road bridge over Mullum Mullum Creek',                   '{"asset_type":"Bridge","condition":3,"condition_label":"Fair","last_inspected":"2024-07-20","replacement_value":3200000}',   145.1290, -37.7580),
      ('Warrandyte Bridge',             'Historic timber bridge over Yarra River',                '{"asset_type":"Bridge","condition":2,"condition_label":"Poor","last_inspected":"2024-11-01","replacement_value":12000000}',  145.2240, -37.7540),
      ('Reynolds Rd Bridge',            'Road bridge over Koonung Creek',                          '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-06-10","replacement_value":2800000}',   145.1530, -37.7910),
      ('Doncaster Rd Drainage Pit #1',  'Stormwater collection pit on Doncaster Rd',              '{"asset_type":"Drainage Pit","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-10","replacement_value":15000}', 145.1240, -37.7840),
      ('Doncaster Rd Drainage Pit #2',  'Stormwater collection pit near civic centre',            '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-12-05","replacement_value":15000}',     145.1210, -37.7835),
      ('Williamsons Rd Drainage Pit',   'Stormwater pit at Williamsons Rd intersection',          '{"asset_type":"Drainage Pit","condition":3,"condition_label":"Fair","last_inspected":"2024-10-18","replacement_value":15000}',      145.1280, -37.7790),
      ('Bulleen Rd Drainage Pit',       'Major stormwater pit on Bulleen Rd',                     '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-08-22","replacement_value":18000}',      145.0840, -37.7690),
      ('Templestowe Rd Drain Outlet',   'Stormwater outlet to Mullum Mullum Creek',               '{"asset_type":"Drain Outlet","condition":3,"condition_label":"Fair","last_inspected":"2024-05-15","replacement_value":45000}',      145.1300, -37.7560),
      ('Anderson Creek Culvert',        'Box culvert under Anderson St',                           '{"asset_type":"Culvert","condition":4,"condition_label":"Good","last_inspected":"2024-09-30","replacement_value":280000}',          145.1170, -37.7565),
      ('Koonung Creek Retaining Wall',  'Gabion retaining wall along creek channel',              '{"asset_type":"Retaining Wall","condition":3,"condition_label":"Fair","last_inspected":"2024-04-12","replacement_value":350000}',   145.1090, -37.7855),
      ('Doncaster Rd - Section A',      'Arterial road segment: Williamsons to Civic',            '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-11-20","replacement_value":1200000}',    145.1250, -37.7845),
      ('Doncaster Rd - Section B',      'Arterial road segment: Civic to Blackburn Rd',          '{"asset_type":"Road Segment","condition":3,"condition_label":"Fair","last_inspected":"2024-11-20","replacement_value":1400000}',    145.1150, -37.7840),
      ('Manningham Rd - Section A',     'Arterial road segment through Bulleen',                   '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-10-05","replacement_value":980000}',    145.0870, -37.7700),
      ('Thompsons Rd Footpath',         'Concrete footpath along Thompsons Rd',                    '{"asset_type":"Footpath","condition":4,"condition_label":"Good","last_inspected":"2024-08-01","replacement_value":120000}',        145.1200, -37.7650),
      ('King St Footpath',              'Concrete footpath through Templestowe Village',           '{"asset_type":"Footpath","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-05","replacement_value":95000}',    145.1175, -37.7555),
      ('Parker St Footpath',            'Shared path section in Templestowe',                     '{"asset_type":"Footpath","condition":3,"condition_label":"Fair","last_inspected":"2024-06-18","replacement_value":85000}',          145.1250, -37.7530),
      ('Stormwater Pump Station #1',    'Automated stormwater pump at Koonung Creek',             '{"asset_type":"Pump Station","condition":4,"condition_label":"Good","last_inspected":"2024-12-01","replacement_value":450000}',     145.1080, -37.7870),
      ('Stormwater Pump Station #2',    'Automated stormwater pump at Ruffey Creek',              '{"asset_type":"Pump Station","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-15","replacement_value":380000}', 145.1200, -37.7730),
      ('Yarra St Retaining Wall',       'Stone retaining wall along Yarra St, Warrandyte',       '{"asset_type":"Retaining Wall","condition":2,"condition_label":"Poor","last_inspected":"2024-03-20","replacement_value":520000}',   145.2250, -37.7535),
      ('Blackburn Rd - Section A',      'Arterial road through Doncaster East',                   '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-09-10","replacement_value":1100000}',   145.1450, -37.7870),
      ('Springvale Rd - Section A',     'Major road through Donvale',                             '{"asset_type":"Road Segment","condition":3,"condition_label":"Fair","last_inspected":"2024-07-15","replacement_value":1300000}',   145.1650, -37.7980),
      ('George St Drainage',            'Underground stormwater pipe network',                    '{"asset_type":"Stormwater Pipe","condition":4,"condition_label":"Good","last_inspected":"2024-05-28","replacement_value":220000}', 145.1555, -37.7865),
      ('Mitcham Rd Culvert',            'Pipe culvert under Mitcham Rd',                          '{"asset_type":"Culvert","condition":3,"condition_label":"Fair","last_inspected":"2024-08-12","replacement_value":180000}',          145.1690, -37.7960),
      ('Old Warrandyte Rd Footpath',    'Gravel footpath in Donvale',                             '{"asset_type":"Footpath","condition":2,"condition_label":"Poor","last_inspected":"2024-04-05","replacement_value":65000}',          145.1800, -37.7900),
      ('Tindals Rd Bridge',             'Pedestrian bridge over creek',                            '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-10-22","replacement_value":680000}',          145.1400, -37.7620),
      ('Westerfolds Dr Drainage',       'Stormwater infrastructure along Westerfolds Dr',         '{"asset_type":"Stormwater Pipe","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-08","replacement_value":310000}', 145.1050, -37.7640),
      ('Heidelberg-Warrandyte Rd',      'Major road connection to Warrandyte',                    '{"asset_type":"Road Segment","condition":3,"condition_label":"Fair","last_inspected":"2024-06-30","replacement_value":2200000}',   145.1600, -37.7600),
      ('Foote St Drainage Pit',         'Stormwater pit at Foote St, Templestowe',                '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-09-05","replacement_value":15000}',     145.1150, -37.7510),
      ('Research-Warrandyte Rd',        'Rural road through green wedge zone',                    '{"asset_type":"Road Segment","condition":3,"condition_label":"Fair","last_inspected":"2024-07-25","replacement_value":1800000}',   145.2100, -37.7500),
      ('High St Warrandyte Footpath',   'Heritage-area footpath through Warrandyte shops',        '{"asset_type":"Footpath","condition":4,"condition_label":"Good","last_inspected":"2024-11-10","replacement_value":140000}',        145.2250, -37.7530),
      ('Knees Rd Culvert',              'Agricultural culvert in Park Orchards',                   '{"asset_type":"Culvert","condition":3,"condition_label":"Fair","last_inspected":"2024-05-10","replacement_value":95000}',          145.1840, -37.7670),
      ('Blackburn Rd Drainage Pit',     'Stormwater pit near Blackburn Rd shops',                 '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-08-18","replacement_value":15000}',     145.1455, -37.7860),
      ('Tram Rd Footpath',              'Shared use path along old tramway corridor',             '{"asset_type":"Footpath","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-20","replacement_value":200000}',   145.0900, -37.7730),
      ('Tuckers Rd Bridge',             'Vehicle bridge over Mullum Mullum Creek',                '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-10-15","replacement_value":1500000}',         145.1350, -37.7700),
      ('Doncaster East Pump Station',   'Stormwater pump station serving eastern catchment',      '{"asset_type":"Pump Station","condition":3,"condition_label":"Fair","last_inspected":"2024-06-05","replacement_value":420000}',    145.1550, -37.7880),
      ('Civic Dr Retaining Wall',       'Concrete retaining wall at Doncaster Hill',              '{"asset_type":"Retaining Wall","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-12","replacement_value":280000}', 145.1260, -37.7845),
      ('Serpells Rd Drainage',          'Underground drainage serving Templestowe',               '{"asset_type":"Stormwater Pipe","condition":4,"condition_label":"Good","last_inspected":"2024-07-08","replacement_value":175000}', 145.1325, -37.7505),
      ('Porter St Footpath',            'Concrete footpath near Templestowe Reserve',             '{"asset_type":"Footpath","condition":4,"condition_label":"Good","last_inspected":"2024-09-22","replacement_value":110000}',        145.1285, -37.7550),
      ('Andersons Creek Rd Bridge',     'Road bridge over Andersons Creek',                       '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-08-30","replacement_value":2100000}',         145.2050, -37.7560)
    ) AS v(name, description, props, lng, lat)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'infrastructure')
  `);

  // ── Layer 4: Ward Boundaries (3 polygons) ──
  await q(`
    INSERT INTO spatial_features (layer_id, name, description, properties, geom)
    SELECT
      (SELECT layer_id FROM spatial_layers WHERE code = 'wards'),
      v.name, v.description, v.props,
      geometry::STGeomFromText(v.wkt, 4326)
    FROM (VALUES
      ('Koonung Ward',
       'South-western ward covering Doncaster, Bulleen and parts of Doncaster East',
       '{"councillor":"Cr. Anna Chen","area_km2":18.5,"population":38200,"suburbs":["Doncaster","Bulleen","Doncaster East"]}',
       'POLYGON((145.055 -37.775, 145.138 -37.775, 145.138 -37.812, 145.055 -37.812, 145.055 -37.775))'),
      ('Westerfolds Ward',
       'North-western ward covering Templestowe and Lower Templestowe',
       '{"councillor":"Cr. David Kumar","area_km2":22.0,"population":35800,"suburbs":["Templestowe","Lower Templestowe","Bulleen"]}',
       'POLYGON((145.055 -37.735, 145.138 -37.735, 145.138 -37.775, 145.055 -37.775, 145.055 -37.735))'),
      ('Mullum Mullum Ward',
       'Eastern ward covering Doncaster East, Warrandyte, Donvale, Park Orchards and Wonga Park',
       '{"councillor":"Cr. Sarah Mitchell","area_km2":73.0,"population":40500,"suburbs":["Doncaster East","Warrandyte","Donvale","Park Orchards","Wonga Park"]}',
       'POLYGON((145.138 -37.730, 145.270 -37.730, 145.270 -37.812, 145.138 -37.812, 145.138 -37.730))')
    ) AS v(name, description, props, wkt)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'wards')
  `);

  // ── Layer 5: Street Trees (~50 points) ──
  await q(`
    INSERT INTO spatial_features (layer_id, name, description, properties, geom)
    SELECT
      (SELECT layer_id FROM spatial_layers WHERE code = 'trees'),
      v.name, v.description, v.props,
      geometry::STGeomFromText('POINT(' + CAST(v.lng AS VARCHAR(30)) + ' ' + CAST(v.lat AS VARCHAR(30)) + ')', 4326)
    FROM (VALUES
      ('River Red Gum #DNC001',       'Mature specimen on Doncaster Rd median',             '{"species":"Eucalyptus camaldulensis","common_name":"River Red Gum","height_m":18,"dbh_cm":85,"health_status":"Good","planted_date":"1985-06-15"}',         145.1235, -37.7838),
      ('Lemon-scented Gum #DNC002',   'Street tree near civic centre',                      '{"species":"Corymbia citriodora","common_name":"Lemon-scented Gum","height_m":22,"dbh_cm":60,"health_status":"Excellent","planted_date":"1990-04-20"}',    145.1225, -37.7830),
      ('Brush Box #DNC003',            'Street tree on Williamsons Rd',                      '{"species":"Lophostemon confertus","common_name":"Brush Box","height_m":12,"dbh_cm":40,"health_status":"Good","planted_date":"2005-07-10"}',                145.1282, -37.7785),
      ('English Elm #TMP001',          'Heritage tree in Templestowe Village',               '{"species":"Ulmus procera","common_name":"English Elm","height_m":20,"dbh_cm":95,"health_status":"Fair","planted_date":"1960-03-01"}',                     145.1168, -37.7558),
      ('Silky Oak #TMP002',            'Flowering specimen on Anderson St',                  '{"species":"Grevillea robusta","common_name":"Silky Oak","height_m":15,"dbh_cm":45,"health_status":"Good","planted_date":"1998-09-15"}',                   145.1175, -37.7565),
      ('Spotted Gum #BUL001',          'Street tree along Bulleen Rd',                       '{"species":"Corymbia maculata","common_name":"Spotted Gum","height_m":25,"dbh_cm":70,"health_status":"Excellent","planted_date":"1988-05-20"}',            145.0835, -37.7685),
      ('Paperbark #BUL002',            'Wetland planting near Bulleen Park',                 '{"species":"Melaleuca quinquenervia","common_name":"Paperbark","height_m":10,"dbh_cm":30,"health_status":"Good","planted_date":"2010-08-12"}',              145.0825, -37.7675),
      ('Yellow Box #WAR001',            'Native tree in Warrandyte township',                 '{"species":"Eucalyptus melliodora","common_name":"Yellow Box","height_m":16,"dbh_cm":55,"health_status":"Good","planted_date":"1975-04-10"}',              145.2255, -37.7535),
      ('Manna Gum #WAR002',            'Riverside specimen near Yarra River',                '{"species":"Eucalyptus viminalis","common_name":"Manna Gum","height_m":20,"dbh_cm":65,"health_status":"Excellent","planted_date":"1970-06-01"}',           145.2245, -37.7525),
      ('Pin Oak #DNE001',               'Street tree on George St',                           '{"species":"Quercus palustris","common_name":"Pin Oak","height_m":14,"dbh_cm":42,"health_status":"Good","planted_date":"2002-07-20"}',                    145.1560, -37.7872),
      ('Ironbark #DNE002',              'Native tree near Doncaster East shops',              '{"species":"Eucalyptus sideroxylon","common_name":"Red Ironbark","height_m":18,"dbh_cm":50,"health_status":"Good","planted_date":"1995-03-15"}',          145.1555, -37.7865),
      ('Japanese Maple #DNC004',        'Ornamental tree in Doncaster Hill precinct',         '{"species":"Acer palmatum","common_name":"Japanese Maple","height_m":5,"dbh_cm":15,"health_status":"Excellent","planted_date":"2015-09-01"}',              145.1265, -37.7848),
      ('Crepe Myrtle #DNC005',          'Flowering tree on civic drive median',               '{"species":"Lagerstroemia indica","common_name":"Crepe Myrtle","height_m":6,"dbh_cm":18,"health_status":"Good","planted_date":"2012-04-15"}',             145.1240, -37.7842),
      ('Swamp Gum #LTP001',            'Native tree in Lower Templestowe',                   '{"species":"Eucalyptus ovata","common_name":"Swamp Gum","height_m":14,"dbh_cm":48,"health_status":"Fair","planted_date":"1992-05-10"}',                   145.1055, -37.7645),
      ('Blackwood #LTP002',            'Street tree on Blake St',                             '{"species":"Acacia melanoxylon","common_name":"Blackwood","height_m":12,"dbh_cm":35,"health_status":"Good","planted_date":"2000-08-20"}',                 145.1048, -37.7638),
      ('Sugar Gum #DON001',            'Large specimen in Donvale',                           '{"species":"Eucalyptus cladocalyx","common_name":"Sugar Gum","height_m":24,"dbh_cm":80,"health_status":"Good","planted_date":"1980-03-10"}',              145.1705, -37.7975),
      ('Silver Birch #DON002',         'European ornamental in Donvale streetscape',          '{"species":"Betula pendula","common_name":"Silver Birch","height_m":10,"dbh_cm":25,"health_status":"Fair","planted_date":"2008-06-15"}',                  145.1695, -37.7965),
      ('Messmate #PKO001',              'Tall eucalypt in Park Orchards',                     '{"species":"Eucalyptus obliqua","common_name":"Messmate","height_m":28,"dbh_cm":90,"health_status":"Good","planted_date":"1965-02-01"}',                  145.1855, -37.7685),
      ('Narrow-leaved Peppermint #PKO002','Native tree on Knees Rd',                         '{"species":"Eucalyptus radiata","common_name":"Narrow-leaved Peppermint","height_m":16,"dbh_cm":42,"health_status":"Excellent","planted_date":"1990-07-10"}', 145.1845, -37.7675),
      ('Candlebark Gum #WPK001',       'Signature white-barked tree in Wonga Park',          '{"species":"Eucalyptus rubida","common_name":"Candlebark Gum","height_m":20,"dbh_cm":55,"health_status":"Good","planted_date":"1978-04-20"}',              145.2585, -37.7435),
      ('Golden Wattle #WPK002',        'Native wattle near Wonga Park village',               '{"species":"Acacia pycnantha","common_name":"Golden Wattle","height_m":6,"dbh_cm":20,"health_status":"Good","planted_date":"2015-07-25"}',               145.2575, -37.7428),
      ('London Plane #DNC006',         'Large shade tree on Doncaster Rd',                    '{"species":"Platanus x acerifolia","common_name":"London Plane","height_m":18,"dbh_cm":70,"health_status":"Good","planted_date":"1985-04-10"}',           145.1195, -37.7835),
      ('Claret Ash #DNC007',           'Deciduous tree on Council car park edge',             '{"species":"Fraxinus angustifolia","common_name":"Claret Ash","height_m":10,"dbh_cm":28,"health_status":"Good","planted_date":"2010-05-20"}',             145.1220, -37.7832),
      ('White Cedar #TMP003',          'Deciduous shade tree in Templestowe',                 '{"species":"Melia azedarach","common_name":"White Cedar","height_m":9,"dbh_cm":30,"health_status":"Fair","planted_date":"2003-09-10"}',                   145.1330, -37.7495),
      ('Scribbly Gum #TMP004',         'Distinctive barked eucalypt near Serpells Rd',        '{"species":"Eucalyptus haemastoma","common_name":"Scribbly Gum","height_m":14,"dbh_cm":38,"health_status":"Excellent","planted_date":"1998-02-15"}',      145.1315, -37.7502),
      ('Sweet Pittosporum #BUL003',    'Native understorey tree in Bulleen',                  '{"species":"Pittosporum undulatum","common_name":"Sweet Pittosporum","height_m":8,"dbh_cm":22,"health_status":"Good","planted_date":"2012-10-05"}',      145.0850, -37.7695),
      ('Liquidambar #DNE003',          'Autumn colour tree on Reynolds Rd',                    '{"species":"Liquidambar styraciflua","common_name":"Liquidambar","height_m":16,"dbh_cm":48,"health_status":"Good","planted_date":"1995-06-20"}',        145.1525, -37.7905),
      ('Coast Banksia #WAR003',        'Native banksia near Warrandyte shops',                 '{"species":"Banksia integrifolia","common_name":"Coast Banksia","height_m":8,"dbh_cm":25,"health_status":"Excellent","planted_date":"2008-03-15"}',      145.2260, -37.7528),
      ('Mountain Ash #DCP001',         'Tall eucalypt in Deep Creek Reserve edge',            '{"species":"Eucalyptus regnans","common_name":"Mountain Ash","height_m":35,"dbh_cm":110,"health_status":"Good","planted_date":"1950-01-01"}',             145.1925, -37.7625),
      ('Snow Gum #RFL001',             'Ornamental planting near Ruffey Lake',                 '{"species":"Eucalyptus pauciflora","common_name":"Snow Gum","height_m":8,"dbh_cm":20,"health_status":"Good","planted_date":"2018-04-10"}',               145.1185, -37.7718),
      ('Desert Ash #DNC008',           'Common street tree in Doncaster residential',         '{"species":"Fraxinus angustifolia","common_name":"Desert Ash","height_m":12,"dbh_cm":35,"health_status":"Fair","planted_date":"1998-07-15"}',              145.1300, -37.7850),
      ('Lilly Pilly #DNC009',          'Native screen planting near civic centre',            '{"species":"Syzygium smithii","common_name":"Lilly Pilly","height_m":8,"dbh_cm":18,"health_status":"Excellent","planted_date":"2016-03-20"}',             145.1232, -37.7828),
      ('Red Flowering Gum #TMP005',    'Ornamental eucalypt on King St',                      '{"species":"Corymbia ficifolia","common_name":"Red Flowering Gum","height_m":10,"dbh_cm":30,"health_status":"Good","planted_date":"2005-09-01"}',        145.1178, -37.7552),
      ('Chinese Elm #SRP001',          'Deciduous tree near Serpells Rd shops',                '{"species":"Ulmus parvifolia","common_name":"Chinese Elm","height_m":12,"dbh_cm":35,"health_status":"Good","planted_date":"2001-06-10"}',                145.1318, -37.7510),
      ('Turpentine #BRG001',           'Native hardwood near Birrarung Park',                  '{"species":"Syncarpia glomulifera","common_name":"Turpentine","height_m":18,"dbh_cm":50,"health_status":"Good","planted_date":"1988-04-20"}',            145.1125, -37.7585),
      ('Weeping Willow #YVP001',       'Riparian tree along Yarra Valley Parklands',          '{"species":"Salix babylonica","common_name":"Weeping Willow","height_m":12,"dbh_cm":45,"health_status":"Fair","planted_date":"1990-11-15"}',              145.1395, -37.7608),
      ('Tulip Tree #DNC010',           'Ornamental tree in Doncaster precinct',               '{"species":"Liriodendron tulipifera","common_name":"Tulip Tree","height_m":15,"dbh_cm":42,"health_status":"Excellent","planted_date":"2000-04-10"}',     145.1255, -37.7850),
      ('White Gum #CRW001',            'Native eucalypt at Currawong Bush Park',              '{"species":"Eucalyptus viminalis","common_name":"White Gum","height_m":22,"dbh_cm":60,"health_status":"Good","planted_date":"1975-08-01"}',               145.1615, -37.7925),
      ('Corymbia #KNG001',             'Street tree along Koonung Creek path',                 '{"species":"Corymbia eximia","common_name":"Yellow Bloodwood","height_m":12,"dbh_cm":32,"health_status":"Good","planted_date":"2010-03-20"}',            145.1085, -37.7858),
      ('Jacaranda #MLP001',            'Ornamental tree near Mullum Mullum trailhead',        '{"species":"Jacaranda mimosifolia","common_name":"Jacaranda","height_m":10,"dbh_cm":28,"health_status":"Excellent","planted_date":"2014-10-15"}',        145.1655, -37.7995),
      ('Angophora #DNV001',            'Native tree along Mitcham Rd, Donvale',               '{"species":"Angophora costata","common_name":"Sydney Red Gum","height_m":16,"dbh_cm":45,"health_status":"Good","planted_date":"1995-02-10"}',            145.1710, -37.7968),
      ('Callitris #PKO003',            'Native cypress-pine in Park Orchards',                 '{"species":"Callitris rhomboidea","common_name":"Oyster Bay Pine","height_m":10,"dbh_cm":22,"health_status":"Good","planted_date":"2005-06-15"}',        145.1860, -37.7690),
      ('Chinese Tallow #FNR001',       'Autumn colour tree at Finns Reserve',                  '{"species":"Triadica sebifera","common_name":"Chinese Tallow","height_m":8,"dbh_cm":20,"health_status":"Fair","planted_date":"2008-04-10"}',             145.0925, -37.7755),
      ('Leptospermum #SCH001',         'Native tea-tree near Schramms Reserve',                '{"species":"Leptospermum continentale","common_name":"Prickly Tea-tree","height_m":4,"dbh_cm":10,"health_status":"Good","planted_date":"2018-07-20"}',   145.1105, -37.7715),
      ('Melaleuca #ZRB001',            'Native paperbark at Zerbes Reserve',                   '{"species":"Melaleuca styphelioides","common_name":"Prickly Paperbark","height_m":8,"dbh_cm":22,"health_status":"Good","planted_date":"2015-05-10"}',    145.1355, -37.7768),
      ('Norfolk Island Pine #WFD001',  'Landmark tree at Westfield Doncaster entrance',       '{"species":"Araucaria heterophylla","common_name":"Norfolk Island Pine","height_m":25,"dbh_cm":60,"health_status":"Good","planted_date":"1980-10-01"}',  145.1252, -37.7852),
      ('Photinia #DMR001',             'Ornamental hedge tree at Domeney Reserve',            '{"species":"Photinia x fraseri","common_name":"Photinia","height_m":5,"dbh_cm":12,"health_status":"Excellent","planted_date":"2019-03-10"}',              145.1482, -37.7882),
      ('Banksia #JCR001',              'Native banksia near Jumping Creek',                    '{"species":"Banksia marginata","common_name":"Silver Banksia","height_m":6,"dbh_cm":15,"health_status":"Good","planted_date":"2012-08-15"}',             145.2535, -37.7495),
      ('Allocasuarina #WRD001',        'Native sheoak at Woodridge Reserve',                   '{"species":"Allocasuarina littoralis","common_name":"Black Sheoak","height_m":10,"dbh_cm":25,"health_status":"Good","planted_date":"2008-05-20"}',       145.1645, -37.7895),
      ('Callistemon #TLC001',          'Native bottlebrush at Tulloch Reserve',                '{"species":"Callistemon citrinus","common_name":"Crimson Bottlebrush","height_m":5,"dbh_cm":12,"health_status":"Excellent","planted_date":"2017-09-15"}', 145.1005, -37.7655)
    ) AS v(name, description, props, lng, lat)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'trees')
  `);

  // ── Layer 6: Planning Zones (8 polygons) ──
  await q(`
    INSERT INTO spatial_features (layer_id, name, description, properties, geom)
    SELECT
      (SELECT layer_id FROM spatial_layers WHERE code = 'zones'),
      v.name, v.description, v.props,
      geometry::STGeomFromText(v.wkt, 4326)
    FROM (VALUES
      ('General Residential Zone',
       'Standard residential areas allowing moderate housing growth and development',
       '{"zone_code":"GRZ","max_height":"11m","min_lot_size":"500sqm","description":"Moderate growth residential with neighbourhood character considerations"}',
       'POLYGON((145.105 -37.775, 145.138 -37.775, 145.138 -37.800, 145.105 -37.800, 145.105 -37.775))'),
      ('Neighbourhood Residential Zone',
       'Areas of identified neighbourhood character requiring protection',
       '{"zone_code":"NRZ","max_height":"9m","min_lot_size":"650sqm","description":"Limited change residential preserving existing character"}',
       'POLYGON((145.055 -37.740, 145.105 -37.740, 145.105 -37.775, 145.055 -37.775, 145.055 -37.740))'),
      ('Low Density Residential Zone',
       'Low density residential in eastern areas with larger lots',
       '{"zone_code":"LDRZ","max_height":"9m","min_lot_size":"4000sqm","description":"Rural-residential character with minimum 4000sqm lots"}',
       'POLYGON((145.170 -37.755, 145.210 -37.755, 145.210 -37.800, 145.170 -37.800, 145.170 -37.755))'),
      ('Activity Centre Zone',
       'Doncaster Hill major activity centre for mixed-use development',
       '{"zone_code":"ACZ","max_height":"40m","min_lot_size":"N/A","description":"High-density mixed use centre supporting significant growth"}',
       'POLYGON((145.118 -37.781, 145.130 -37.781, 145.130 -37.790, 145.118 -37.790, 145.118 -37.781))'),
      ('Green Wedge Zone',
       'Non-urban land in Warrandyte, Wonga Park and Park Orchards',
       '{"zone_code":"GWZ","max_height":"7.5m","min_lot_size":"40ha","description":"Rural and conservation land protecting green wedge from urban development"}',
       'POLYGON((145.210 -37.730, 145.270 -37.730, 145.270 -37.770, 145.210 -37.770, 145.210 -37.730))'),
      ('Public Use Zone',
       'Land used for public purposes including civic, education and community',
       '{"zone_code":"PUZ","max_height":"N/A","min_lot_size":"N/A","description":"Public purpose land for government, education and community facilities"}',
       'POLYGON((145.120 -37.780, 145.127 -37.780, 145.127 -37.786, 145.120 -37.786, 145.120 -37.780))'),
      ('Mixed Use Zone',
       'Commercial and residential mixed use along key corridors',
       '{"zone_code":"MUZ","max_height":"14m","min_lot_size":"N/A","description":"Mixed commercial and residential along activity corridors"}',
       'POLYGON((145.100 -37.778, 145.118 -37.778, 145.118 -37.785, 145.100 -37.785, 145.100 -37.778))'),
      ('Rural Conservation Zone',
       'Conservation land in the north-eastern green wedge',
       '{"zone_code":"RCZ","max_height":"7.5m","min_lot_size":"40ha","description":"Conservation-priority rural land with environmental significance"}',
       'POLYGON((145.220 -37.730, 145.270 -37.730, 145.270 -37.755, 145.220 -37.755, 145.220 -37.730))')
    ) AS v(name, description, props, wkt)
    WHERE NOT EXISTS (SELECT TOP 1 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'zones')
  `);

  // ── Update feature counts ──
  await q(`
    UPDATE spatial_layers sl
    SET feature_count = (
      SELECT COUNT(*) FROM spatial_features sf WHERE sf.layer_id = sl.layer_id
    )
  `);

  const finalLayers = await q(`SELECT COUNT(*) AS cnt FROM spatial_layers`);
  const finalFeatures = await q(`SELECT COUNT(*) AS cnt FROM spatial_features`);
  console.log(
    `✅ Spatial tables ready (${finalLayers.rows[0].cnt} layers, ${finalFeatures.rows[0].cnt} features)`
  );
}

module.exports = router;
module.exports.initializeSpatialTables = initializeSpatialTables;
