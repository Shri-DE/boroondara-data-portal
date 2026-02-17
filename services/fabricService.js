// services/fabricService.js — Microsoft Fabric Warehouse connection via ODBC
// msnodesqlv8 is loaded lazily to avoid segfault at require() time if the
// native binary was compiled against a different glibc / Node.js version.
let sql = null;

function getSql() {
  if (!sql) {
    sql = require("msnodesqlv8");
  }
  return sql;
}

let pool = null;
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
  ].join(";");
}

function createPool() {
  if (pool) return pool;

  const connectionString = buildConnectionString();

  pool = new (getSql()).Pool({
    connectionString,
    ceiling: 10,
    floor: 2,
    heartbeatSecs: 30,
    inactivityTimeoutSecs: 300,
  });

  pool.on("error", (err) => {
    console.error("Unexpected Fabric Warehouse pool error:", err.message);
  });

  return pool;
}

function openPool(p) {
  return new Promise((resolve, reject) => {
    p.open((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function initialize() {
  const p = createPool();
  await openPool(p);
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
  const p = createPool();
  return new Promise((resolve, reject) => {
    p.queryRaw(sqlText, (err, results) => {
      if (err) return reject(err);

      const meta = results.meta || [];
      const rawRows = results.rows || [];

      // Convert array-of-arrays to array-of-objects (matching pg result shape)
      const rows = rawRows.map((rawRow) => {
        const obj = {};
        for (let i = 0; i < meta.length; i++) {
          obj[meta[i].name] = rawRow[i];
        }
        return obj;
      });

      // Map meta to fields format expected by responseFormatter
      const fields = meta.map((m) => ({
        name: m.name,
        dataTypeID: m.sqlType || m.type || "text",
      }));

      resolve({
        rows,
        fields,
        rowCount: rows.length,
      });
    });
  });
}

async function shutdown() {
  if (pool) {
    pool.close();
    pool = null;
    console.log("Fabric Warehouse pool closed");
  }
}

module.exports = { initialize, getSchemaContext, executeQuery, shutdown };
