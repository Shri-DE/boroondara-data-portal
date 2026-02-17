// datasetRoutes.js - Self-serve datasets API
// Endpoints: list, detail, preview, sample-values, export (CSV)
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { requireUser } = require("./admin/requireUser");
const dbService = require("./services/dbService");

const router = express.Router();

// ✅ All dataset routes require authentication in production
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
    console.error("[DATASETS] Error checking access:", err);
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

// ──────────────────────────────────────────
// GET /api/datasets — List all departments with live metadata
// ──────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const userUpn = getUserUpn(req);

    // Build result with access status and live table metadata
    const results = await Promise.all(
      catalogue.map(async (dept) => {
        const hasAccess = await userHasDatasetAccess(userUpn, dept);

        // For active departments with tables, try to get row counts
        let tablesMeta = [];
        if (dept.status === "active" && dept.tables.length > 0) {
          tablesMeta = await Promise.all(
            dept.tables.map(async (tableName) => {
              try {
                const countResult = await dbService.executeQuery(
                  `SELECT COUNT(*) AS row_count FROM "${tableName}"`
                );
                return {
                  name: tableName,
                  rowCount: parseInt(countResult.rows[0]?.row_count || "0", 10),
                };
              } catch {
                return { name: tableName, rowCount: 0 };
              }
            })
          );
        }

        const totalRows = tablesMeta.reduce((sum, t) => sum + t.rowCount, 0);

        return {
          id: dept.id,
          department: dept.department,
          icon: dept.icon,
          color: dept.color,
          classification: dept.classification,
          owner: dept.owner,
          ownerEmail: dept.ownerEmail,
          agentId: dept.agentId,
          description: dept.description,
          status: dept.status,
          tableCount: dept.tables.length,
          totalRows,
          hasAccess,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("[DATASETS] Error listing datasets:", err);
    res.status(500).json({ error: "Failed to load datasets" });
  }
});

// ──────────────────────────────────────────
// GET /api/datasets/:id — Single department detail with table + column info
// ──────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const dept = catalogue.find((d) => d.id === req.params.id);
    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    const userUpn = getUserUpn(req);
    const hasAccess = await userHasDatasetAccess(userUpn, dept);

    if (!hasAccess) {
      return res.status(403).json({
        error: "You don't have access to this department's datasets",
        department: dept.department,
      });
    }

    // Get table details (columns, row counts) from information_schema
    const tablesDetail = await Promise.all(
      dept.tables.map(async (tableName) => {
        try {
          // Column info
          const colResult = await dbService.executeQuery(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '${tableName}'
            ORDER BY ordinal_position
          `);

          // Row count
          const countResult = await dbService.executeQuery(
            `SELECT COUNT(*) AS row_count FROM "${tableName}"`
          );

          return {
            name: tableName,
            rowCount: parseInt(countResult.rows[0]?.row_count || "0", 10),
            columnCount: colResult.rows.length,
            columns: colResult.rows.map((c) => ({
              name: c.column_name,
              dataType: c.data_type,
              nullable: c.is_nullable === "YES",
            })),
          };
        } catch {
          return {
            name: tableName,
            rowCount: 0,
            columnCount: 0,
            columns: [],
          };
        }
      })
    );

    res.json({
      id: dept.id,
      department: dept.department,
      icon: dept.icon,
      color: dept.color,
      classification: dept.classification,
      owner: dept.owner,
      ownerEmail: dept.ownerEmail,
      agentId: dept.agentId,
      description: dept.description,
      status: dept.status,
      hasAccess: true,
      tables: tablesDetail,
    });
  } catch (err) {
    console.error("[DATASETS] Error getting dataset detail:", err);
    res.status(500).json({ error: "Failed to load dataset details" });
  }
});

// ──────────────────────────────────────────
// GET /api/datasets/:id/preview/:table — First 10 rows (access-controlled)
// ──────────────────────────────────────────
router.get("/:id/preview/:table", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const dept = catalogue.find((d) => d.id === req.params.id);
    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Validate table name against catalogue (NEVER use user input directly)
    if (!isValidTable(dept, req.params.table)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const userUpn = getUserUpn(req);
    const hasAccess = await userHasDatasetAccess(userUpn, dept);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tableName = req.params.table;
    const result = await dbService.executeQuery(
      `SELECT * FROM "${tableName}" LIMIT 10`
    );

    res.json({
      table: tableName,
      rows: result.rows,
      fields: result.fields.map((f) => ({
        name: f.name,
        dataType: f.dataTypeID || "text",
      })),
      rowCount: result.rows.length,
    });
  } catch (err) {
    console.error("[DATASETS] Error previewing table:", err);
    res.status(500).json({ error: "Failed to preview table" });
  }
});

// ──────────────────────────────────────────
// GET /api/datasets/:id/chart-data/:table — Smart aggregated chart data
// ──────────────────────────────────────────
router.get("/:id/chart-data/:table", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const dept = catalogue.find((d) => d.id === req.params.id);
    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    if (!isValidTable(dept, req.params.table)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const userUpn = getUserUpn(req);
    const hasAccess = await userHasDatasetAccess(userUpn, dept);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tableName = req.params.table;

    // 1. Introspect columns from information_schema
    const colResult = await dbService.executeQuery(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `);

    const NUMERIC_TYPES = [
      "integer", "bigint", "smallint", "numeric", "decimal",
      "real", "double precision",
    ];
    const DATE_TYPES = [
      "date", "timestamp without time zone", "timestamp with time zone",
    ];
    const SKIP_TYPES = ["uuid", "boolean", "bytea"];

    // Hint names that make good labels
    const LABEL_HINTS = [
      "name", "code", "type", "status", "category", "department",
      "classification", "period", "source", "method", "priority",
      "label", "description", "title",
    ];

    const numericCols = [];
    const categoricalCols = [];
    const dateCols = [];

    for (const col of colResult.rows) {
      const cn = col.column_name;
      const dt = col.data_type;

      // Skip UUID, boolean, bytea, and any _id columns
      if (SKIP_TYPES.includes(dt) || cn.endsWith("_id") || cn === "id") continue;

      if (NUMERIC_TYPES.includes(dt)) {
        numericCols.push(cn);
      } else if (DATE_TYPES.includes(dt)) {
        dateCols.push(cn);
      } else {
        // varchar / text / char
        categoricalCols.push(cn);
      }
    }

    // 2. Pick label column (best categorical, then date, then fallback)
    let labelCol = null;
    let useDate = false;

    // Prefer categorical columns whose name contains a label hint
    const hinted = categoricalCols.find((c) =>
      LABEL_HINTS.some((h) => c.toLowerCase().includes(h))
    );
    if (hinted) {
      labelCol = hinted;
    } else if (categoricalCols.length > 0) {
      labelCol = categoricalCols[0];
    } else if (dateCols.length > 0) {
      labelCol = dateCols[0];
      useDate = true;
    }

    // 3. Pick value columns (max 5 numeric cols)
    const valueCols = numericCols.slice(0, 5);

    // Fallback: if no label or no values, return raw top-10
    if (!labelCol || valueCols.length === 0) {
      const raw = await dbService.executeQuery(
        `SELECT * FROM "${tableName}" LIMIT 10`
      );
      return res.json({
        table: tableName,
        rows: raw.rows,
        fields: raw.fields.map((f) => ({
          name: f.name,
          dataType: f.dataTypeID || "text",
        })),
        rowCount: raw.rows.length,
      });
    }

    // 4. Build aggregated query (PostgreSQL syntax)
    const selectLabel = useDate
      ? `TO_CHAR(DATE_TRUNC('month', "${labelCol}"), 'Mon YYYY') AS "${labelCol}"`
      : `"${labelCol}"`;

    const groupLabel = useDate
      ? `DATE_TRUNC('month', "${labelCol}")`
      : `"${labelCol}"`;

    const selectValues = valueCols
      .map((c) => `COALESCE(SUM("${c}"), 0) AS "${c}"`)
      .join(", ");

    const orderCol = useDate
      ? `DATE_TRUNC('month', "${labelCol}")`
      : `SUM("${valueCols[0]}") DESC`;

    const sql = `
      SELECT ${selectLabel}, ${selectValues}
      FROM "${tableName}"
      WHERE "${labelCol}" IS NOT NULL
      GROUP BY ${groupLabel}
      ORDER BY ${orderCol}
      LIMIT 15
    `;

    const result = await dbService.executeQuery(sql);

    res.json({
      table: tableName,
      rows: result.rows,
      fields: result.fields.map((f) => ({
        name: f.name,
        dataType: f.dataTypeID || "text",
      })),
      rowCount: result.rows.length,
    });
  } catch (err) {
    console.error("[DATASETS] Error building chart data:", err);
    res.status(500).json({ error: "Failed to build chart data" });
  }
});

// ──────────────────────────────────────────
// GET /api/datasets/:id/sample-values/:table — 5 distinct sample values per column
// ──────────────────────────────────────────
router.get("/:id/sample-values/:table", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const dept = catalogue.find((d) => d.id === req.params.id);
    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    if (!isValidTable(dept, req.params.table)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const userUpn = getUserUpn(req);
    const hasAccess = await userHasDatasetAccess(userUpn, dept);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tableName = req.params.table;

    // Get column names first
    const colResult = await dbService.executeQuery(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `);

    // For each column, get 5 distinct non-null samples
    const samplesByColumn = {};
    for (const col of colResult.rows) {
      try {
        const sampleResult = await dbService.executeQuery(
          `SELECT DISTINCT "${col.column_name}" AS val
           FROM "${tableName}"
           WHERE "${col.column_name}" IS NOT NULL
           LIMIT 5`
        );
        samplesByColumn[col.column_name] = sampleResult.rows.map((r) => r.val);
      } catch {
        samplesByColumn[col.column_name] = [];
      }
    }

    res.json({ table: tableName, samples: samplesByColumn });
  } catch (err) {
    console.error("[DATASETS] Error getting sample values:", err);
    res.status(500).json({ error: "Failed to get sample values" });
  }
});

// ──────────────────────────────────────────
// GET /api/datasets/:id/export/:table — Download table as CSV (max 10K rows)
// ──────────────────────────────────────────
const MAX_EXPORT_ROWS = 10000;

router.get("/:id/export/:table", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const dept = catalogue.find((d) => d.id === req.params.id);
    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    if (!isValidTable(dept, req.params.table)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const userUpn = getUserUpn(req);
    const hasAccess = await userHasDatasetAccess(userUpn, dept);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tableName = req.params.table;
    const result = await dbService.executeQuery(
      `SELECT * FROM "${tableName}" LIMIT ${MAX_EXPORT_ROWS}`
    );

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
    const filename = `${tableName}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error("[DATASETS] Error exporting table:", err);
    res.status(500).json({ error: "Failed to export table" });
  }
});

// Allow admin routes to invalidate the catalogue cache after mutations
function clearCatalogueCache() {
  catalogueCache = null;
}
router.clearCatalogueCache = clearCatalogueCache;

module.exports = router;
