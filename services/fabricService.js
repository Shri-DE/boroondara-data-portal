// services/fabricService.js — Microsoft Fabric Warehouse connection via ODBC
//
// LAZY INITIALIZATION: Nothing happens at require() time or server startup.
// The ODBC driver install, native module rebuild, and connection pool are
// all created on the FIRST query. This ensures the portal UI loads instantly
// even if Fabric connectivity isn't ready yet.

let odbc = null;
let connectionPool = null;
let schemaCache = null;
let schemaCacheTime = 0;
let initError = null;
const SCHEMA_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function loadOdbc() {
  if (odbc) return odbc;
  if (initError) throw initError;

  try {
    odbc = require("odbc");
    return odbc;
  } catch (err) {
    initError = new Error(
      `Failed to load odbc native module: ${err.message}. ` +
      `The native binding may need to be rebuilt. Check startup logs.`
    );
    throw initError;
  }
}

function buildConnectionString() {
  const server = process.env.FABRIC_SERVER;
  const database = process.env.FABRIC_DATABASE;
  const clientId = process.env.FABRIC_CLIENT_ID;
  const tenantId = process.env.FABRIC_TENANT_ID;
  const clientSecret = process.env.FABRIC_CLIENT_SECRET;

  if (!server || !database || !clientId || !tenantId || !clientSecret) {
    throw new Error(
      "Missing Fabric Warehouse config. Set FABRIC_SERVER, FABRIC_DATABASE, " +
      "FABRIC_CLIENT_ID, FABRIC_TENANT_ID, FABRIC_CLIENT_SECRET"
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

  const odbcModule = loadOdbc();
  const connectionString = buildConnectionString();
  connectionPool = await odbcModule.pool({
    connectionString,
    initialSize: 2,
    maxSize: 10,
    connectTimeout: 30,
    idleTimeout: 300,
  });

  return connectionPool;
}

// initialize() is now optional — called lazily on first query if needed
async function initialize() {
  const pool = await getPool();
  await pool.query("SELECT 1 AS test");
  console.log("Fabric Warehouse connection verified");
}

async function getSchemaContext() {
  const now = Date.now();
  if (schemaCache && now - schemaCacheTime < SCHEMA_CACHE_TTL) {
    return schemaCache;
  }

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

  const rows = Array.isArray(result) ? result : [];
  const columns = result.columns || [];

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
