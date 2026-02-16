// reportRoutes.js - Custom report builder API
// Endpoints: /query (run report), /export (download CSV)
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { requireUser } = require("./admin/requireUser");
const fabricService = require("./services/fabricService");

const router = express.Router();

// ✅ All report routes require authentication in production
if (process.env.NODE_ENV === "production") {
  router.use(requireUser);
}

// ──────────────────────────────────────────
// Load catalogue (cached)
// ──────────────────────────────────────────
const cataloguePath = path.join(__dirname, "data", "datasetCatalogue.json");
let catalogueCache = null;

async function loadCatalogue() {
  if (catalogueCache) return catalogueCache;
  const raw = await fs.readFile(cataloguePath, "utf-8");
  catalogueCache = JSON.parse(raw);
  return catalogueCache;
}

// ──────────────────────────────────────────
// Load users (for permission checks)
// ──────────────────────────────────────────
const usersFile = path.join(__dirname, "data", "users.json");
const PORTAL_ADMINS = (process.env.PORTAL_ADMINS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function loadUsers() {
  try {
    const data = await fs.readFile(usersFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function resolveUserAccess(userUpn) {
  const users = await loadUsers();
  let user = users.find((u) => u.upn === userUpn);

  // PORTAL_ADMINS auto-provision
  if (!user && PORTAL_ADMINS.includes(userUpn.toLowerCase())) {
    return { role: "admin", allowedDatasets: [], allowedAgents: [] };
  }

  if (!user || !user.isActive) return null;
  return user;
}

// ✅ Check if user has access to a dataset
async function userHasDatasetAccess(userUpn, dataset) {
  try {
    const user = await resolveUserAccess(userUpn);
    if (!user) return false;
    if (user.role === "admin") return true;

    // Explicit dataset access
    if (user.allowedDatasets && user.allowedDatasets.includes(dataset.id)) return true;

    // Implicit: if user has agent access and dataset has that agentId
    if (dataset.agentId && user.allowedAgents && user.allowedAgents.includes(dataset.agentId)) return true;

    return false;
  } catch (err) {
    console.error("[REPORTS] Error checking access:", err);
    return false;
  }
}

// Helper: get UPN from request
function getUserUpn(req) {
  if (process.env.NODE_ENV !== "production") return "dev@local";
  const user = req.currentUser || req.user;
  return (user?.upn || user?.email || user?.preferred_username || "").toLowerCase();
}

// ✅ Safety: validate table name against catalogue
function isValidTable(dataset, tableName) {
  return dataset.tables && dataset.tables.includes(tableName);
}

// ✅ Validate columns against information_schema
async function getValidColumns(tableName) {
  const result = await fabricService.executeQuery(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'edp' AND table_name = '${tableName}'
    ORDER BY ordinal_position
  `);
  return result.rows;
}

const NUMERIC_TYPES = [
  "integer", "bigint", "smallint", "numeric", "decimal",
  "real", "double precision",
];

const VALID_AGGREGATIONS = ["SUM", "COUNT", "AVG"];

// ──────────────────────────────────────────
// Shared: parse + validate report params
// ──────────────────────────────────────────
async function parseReportParams(req) {
  const { datasetId, table, columns, groupBy, aggregation, aggregationColumn, limit } = req.query;

  if (!datasetId || !table || !columns) {
    return { error: "datasetId, table, and columns are required", status: 400 };
  }

  // Load catalogue and find dataset
  const catalogue = await loadCatalogue();
  const dataset = catalogue.find((d) => d.id === datasetId);
  if (!dataset) {
    return { error: "Dataset not found", status: 404 };
  }

  // Validate table
  if (!isValidTable(dataset, table)) {
    return { error: "Invalid table name", status: 400 };
  }

  // Check user access
  const userUpn = getUserUpn(req);
  const hasAccess = await userHasDatasetAccess(userUpn, dataset);
  if (!hasAccess) {
    return { error: "Access denied", status: 403 };
  }

  // Get valid columns from information_schema
  const dbColumns = await getValidColumns(table);
  const dbColumnMap = {};
  for (const col of dbColumns) {
    dbColumnMap[col.column_name] = col.data_type;
  }

  // Validate requested columns
  const requestedColumns = columns.split(",").map((c) => c.trim()).filter(Boolean);
  for (const col of requestedColumns) {
    if (!dbColumnMap[col]) {
      return { error: `Invalid column: ${col}`, status: 400 };
    }
  }

  // Validate groupBy if provided
  if (groupBy && !dbColumnMap[groupBy]) {
    return { error: `Invalid groupBy column: ${groupBy}`, status: 400 };
  }

  // Validate aggregation
  if (aggregation && !VALID_AGGREGATIONS.includes(aggregation.toUpperCase())) {
    return { error: `Invalid aggregation. Must be one of: ${VALID_AGGREGATIONS.join(", ")}`, status: 400 };
  }

  // Validate aggregation column
  if (aggregationColumn && !dbColumnMap[aggregationColumn]) {
    return { error: `Invalid aggregation column: ${aggregationColumn}`, status: 400 };
  }

  // If aggregation is SUM or AVG, aggregation column must be numeric
  if (aggregation && ["SUM", "AVG"].includes(aggregation.toUpperCase()) && aggregationColumn) {
    if (!NUMERIC_TYPES.includes(dbColumnMap[aggregationColumn])) {
      return { error: `Aggregation column "${aggregationColumn}" must be numeric for ${aggregation}`, status: 400 };
    }
  }

  // Parse limit
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 500, 1), 5000);

  return {
    dataset,
    table,
    requestedColumns,
    groupBy: groupBy || null,
    aggregation: aggregation ? aggregation.toUpperCase() : null,
    aggregationColumn: aggregationColumn || null,
    limit: parsedLimit,
    dbColumnMap,
  };
}

// ──────────────────────────────────────────
// Build SQL from validated params
// ──────────────────────────────────────────
function buildReportSQL(params) {
  const { table, requestedColumns, groupBy, aggregation, aggregationColumn, limit } = params;

  if (groupBy && aggregation && aggregationColumn) {
    // GROUP BY with aggregation on a specific column
    return `SELECT TOP ${limit} "${groupBy}", ${aggregation}("${aggregationColumn}") AS agg_value FROM "${table}" GROUP BY "${groupBy}" ORDER BY agg_value DESC`;
  }

  if (groupBy && aggregation === "COUNT") {
    // COUNT doesn't need aggregation column
    return `SELECT TOP ${limit} "${groupBy}", COUNT(*) AS count FROM "${table}" GROUP BY "${groupBy}" ORDER BY count DESC`;
  }

  if (groupBy) {
    // GROUP BY without explicit aggregation — default to COUNT
    return `SELECT TOP ${limit} "${groupBy}", COUNT(*) AS count FROM "${table}" GROUP BY "${groupBy}" ORDER BY count DESC`;
  }

  // Flat query — selected columns
  const colList = requestedColumns.map((c) => `"${c}"`).join(", ");
  return `SELECT TOP ${limit} ${colList} FROM "${table}"`;
}

// ──────────────────────────────────────────
// GET /api/reports/query — Run a dynamic report
// ──────────────────────────────────────────
router.get("/query", async (req, res) => {
  try {
    const params = await parseReportParams(req);
    if (params.error) {
      return res.status(params.status).json({ error: params.error });
    }

    const sql = buildReportSQL(params);
    console.log("[REPORTS] Executing:", sql);

    const result = await fabricService.executeQuery(sql);

    res.json({
      rows: result.rows,
      fields: result.fields.map((f) => ({
        name: f.name,
        dataType: f.dataTypeID || "text",
      })),
      rowCount: result.rows.length,
      sql: sql, // helpful for debugging
    });
  } catch (err) {
    console.error("[REPORTS] Query error:", err);
    res.status(500).json({ error: "Failed to execute report query" });
  }
});

// ──────────────────────────────────────────
// GET /api/reports/export — Download report as CSV
// ──────────────────────────────────────────
router.get("/export", async (req, res) => {
  try {
    const params = await parseReportParams(req);
    if (params.error) {
      return res.status(params.status).json({ error: params.error });
    }

    const sql = buildReportSQL(params);
    console.log("[REPORTS] Exporting:", sql);

    const result = await fabricService.executeQuery(sql);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    // Build CSV
    const headers = result.fields.map((f) => f.name);
    const csvLines = [headers.join(",")];

    for (const row of result.rows) {
      const cells = headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escape CSV: wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      csvLines.push(cells.join(","));
    }

    const csv = csvLines.join("\n");
    const filename = `report_${params.table}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error("[REPORTS] Export error:", err);
    res.status(500).json({ error: "Failed to export report" });
  }
});

module.exports = router;
