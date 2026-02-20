// services/pgService.js — Azure PostgreSQL connection via `pg` (pure JS, no native modules)
//
// Drop-in replacement for fabricService with the same interface:
//   initialize(), executeQuery(sql), getSchemaContext(), shutdown()
//
// Required env vars:
//   PGHOST     - e.g. svr-boroondara-edp-aue.postgres.database.azure.com
//   PGPORT     - default 5432
//   PGDATABASE - e.g. edp
//   PGUSER     - e.g. dbadmin
//   PGPASSWORD - the password
//   PGSSLMODE  - default 'require'

const { Pool } = require("pg");

let pool = null;
let schemaCache = null;
let schemaCacheTime = 0;
const SCHEMA_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getPool() {
  if (pool) return pool;

  const config = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "edp",
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  };

  // Azure PostgreSQL requires SSL
  const sslMode = (process.env.PGSSLMODE || "require").toLowerCase();
  if (sslMode !== "disable") {
    config.ssl = { rejectUnauthorized: false };
  }

  if (!config.host || !config.user || !config.password) {
    throw new Error(
      "Missing PostgreSQL config. Set PGHOST, PGUSER, PGPASSWORD " +
      "(and optionally PGPORT, PGDATABASE, PGSSLMODE)"
    );
  }

  pool = new Pool(config);

  pool.on("error", (err) => {
    console.error("[PG] Unexpected pool error:", err.message);
  });

  return pool;
}

async function initialize() {
  const p = getPool();
  const client = await p.connect();
  try {
    const res = await client.query("SELECT 1 AS test");
    console.log("✅ PostgreSQL connected:", process.env.PGHOST);
  } finally {
    client.release();
  }
}

async function getSchemaContext() {
  const now = Date.now();
  if (schemaCache && now - schemaCacheTime < SCHEMA_CACHE_TTL) {
    return schemaCache;
  }

  const schema = process.env.PG_SCHEMA || "public";
  const result = await executeQuery(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = '${schema}'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'spatial_%'
    ORDER BY table_name, ordinal_position
  `);

  const tables = {};
  for (const row of result.rows) {
    const tableName = row.table_name;
    if (!tables[tableName]) {
      tables[tableName] = [];
    }
    const nullable = row.is_nullable === "YES" ? "nullable" : "NOT NULL";
    tables[tableName].push(
      `  - ${row.column_name} (${row.data_type}, ${nullable})`
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

async function executeQuery(sqlText, params) {
  const p = getPool();
  const result = params ? await p.query(sqlText, params) : await p.query(sqlText);

  const rows = result.rows || [];
  const fields = (result.fields || []).map((f) => ({
    name: f.name,
    dataTypeID: f.dataTypeID || "text",
  }));

  return {
    rows,
    fields,
    rowCount: rows.length,
  };
}

async function shutdown() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("PostgreSQL pool closed");
  }
}

module.exports = { initialize, getSchemaContext, executeQuery, shutdown, getPool };
