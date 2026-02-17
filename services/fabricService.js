// services/fabricService.js — Microsoft Fabric Warehouse connection via ODBC
// Uses the 'odbc' npm package (thin unixODBC wrapper) instead of msnodesqlv8
// which segfaults on Debian 11 due to prebuilt binary incompatibility.
const odbc = require("odbc");

let connectionPool = null;
let schemaCache = null;
let schemaCacheTime = 0;
const SCHEMA_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function buildConnectionString() {
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

  return [
    "Driver={ODBC Driver 18 for SQL Server}",
    `Server=${server}`,
    `Database=${database}`,
    "Authentication=ActiveDirectoryServicePrincipal",
    `UID=${clientId}@${tenantId}`,
    `PWD=${clientSecret}`,
    "Encrypt=yes",
    "TrustServerCertificate=no",
    "Connection Timeout=30",
  ].join(";");
}

async function getPool() {
  if (connectionPool) return connectionPool;

  const connectionString = buildConnectionString();
  connectionPool = await odbc.pool({
    connectionString,
    initialSize: 2,
    maxSize: 10,
    connectTimeout: 30,
    idleTimeout: 300,
  });

  return connectionPool;
}

async function initialize() {
  const pool = await getPool();
  // Verify connection with a simple query
  await pool.query("SELECT 1 AS test");
  console.log("Fabric Warehouse connection verified");
}

async function getSchemaContext() {
  const now = Date.now();
  if (schemaCache && now - schemaCacheTime < SCHEMA_CACHE_TTL) {
    return schemaCache;
  }

  // Fabric Warehouse schema — configurable via FABRIC_SCHEMA env var
  const schema = process.env.FABRIC_SCHEMA || "edp";
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
  const pool = await getPool();
  const result = await pool.query(sqlText);

  // odbc returns an array of row objects directly
  // with a 'columns' property containing metadata
  const rows = Array.isArray(result) ? result : [];
  const columns = result.columns || [];

  // Map columns to fields format expected by responseFormatter
  const fields = columns.map((col) => ({
    name: col.name,
    dataTypeID: col.dataType || "text",
  }));

  return {
    rows,
    fields,
    rowCount: rows.length,
  };
}

async function shutdown() {
  if (connectionPool) {
    await connectionPool.close();
    connectionPool = null;
    console.log("Fabric Warehouse pool closed");
  }
}

module.exports = { initialize, getSchemaContext, executeQuery, shutdown };
