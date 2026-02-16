// services/fabricService.js — Microsoft Fabric Warehouse connection via mssql (pure JS)
const sql = require("mssql");

let pool = null;
let schemaCache = null;
let schemaCacheTime = 0;
const SCHEMA_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function buildConfig() {
  const server = process.env.FABRIC_SERVER;
  const database = process.env.FABRIC_DATABASE;
  const clientId = process.env.FABRIC_CLIENT_ID;
  const tenantId = process.env.FABRIC_TENANT_ID;
  const clientSecret = process.env.FABRIC_CLIENT_SECRET;

  if (!server || !database || !clientId || !tenantId || !clientSecret) {
    throw new Error(
      "Missing Fabric Warehouse config. Set FABRIC_SERVER, FABRIC_DATABASE, FABRIC_CLIENT_ID, FABRIC_TENANT_ID, FABRIC_CLIENT_SECRET"
    );
  }

  return {
    server,
    database,
    authentication: {
      type: "azure-active-directory-service-principal-secret",
      options: {
        clientId,
        tenantId,
        clientSecret,
      },
    },
    pool: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 300000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      port: 1433,
      requestTimeout: 30000,
      connectionTimeout: 15000,
    },
  };
}

async function initialize() {
  if (pool) return;

  const config = buildConfig();
  pool = await sql.connect(config);

  pool.on("error", (err) => {
    console.error("Unexpected Fabric Warehouse pool error:", err.message);
  });

  // Verify connection with a simple query
  await executeQuery("SELECT 1 AS test");
  console.log("Fabric Warehouse connection verified");
}

async function getSchemaContext() {
  const now = Date.now();
  if (schemaCache && now - schemaCacheTime < SCHEMA_CACHE_TTL) {
    return schemaCache;
  }

  // Fabric Warehouse schema — configurable via FABRIC_SCHEMA env var
  const schema = process.env.FABRIC_SCHEMA || 'edp';
  const result = await executeQuery(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${schema}'
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  const tables = {};
  for (const row of result.rows) {
    const tableName = row.TABLE_NAME;
    if (!tables[tableName]) {
      tables[tableName] = [];
    }
    const nullable = row.IS_NULLABLE === "YES" ? "nullable" : "NOT NULL";
    tables[tableName].push(
      `  - ${row.COLUMN_NAME} (${row.DATA_TYPE}, ${nullable})`
    );
  }

  const lines = [];
  for (const [tableName, columns] of Object.entries(tables)) {
    lines.push(`Table: ${tableName}`);
    lines.push(...columns);
    lines.push("");
  }

  schemaCache = lines.join("\n");
  schemaCacheTime = now;
  return schemaCache;
}

async function executeQuery(sqlText) {
  if (!pool) {
    await initialize();
  }

  const result = await pool.request().query(sqlText);

  // result.recordset is already an array of objects with named keys
  const rows = result.recordset || [];

  // Build fields array from column metadata
  const columns = (result.recordset && result.recordset.columns) || {};
  const fields = Object.keys(columns).map((colName) => ({
    name: colName,
    dataTypeID: columns[colName].type?.declaration || columns[colName].type?.name || "text",
  }));

  return {
    rows,
    fields,
    rowCount: rows.length,
  };
}

async function shutdown() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("Fabric Warehouse pool closed");
  }
}

module.exports = { initialize, getSchemaContext, executeQuery, shutdown };
