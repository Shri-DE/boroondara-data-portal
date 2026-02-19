// services/dbBootstrap.js — Auto-initialise PostgreSQL tables + seed data
//
// Reads SQL files from the /sql directory and executes them in order.
// Each script uses IF NOT EXISTS / WHERE NOT EXISTS guards, so it is safe
// to run multiple times (idempotent).
//
// Call once at startup after the pool connects successfully.

const path = require("path");
const fs = require("fs").promises;
const pgService = require("./pgService");

const SQL_DIR = path.join(__dirname, "..", "sql");

// Ordered list of SQL files to execute.
// "fatal" means bootstrap aborts if that script fails.
const SQL_SCRIPTS = [
  { file: "pg-01-ddl.sql",          fatal: true  },  // core tables + pgcrypto
  { file: "pg-02-spatial-ddl.sql",   fatal: false },  // PostGIS tables (non-fatal)
  { file: "pg-00-council.sql",       fatal: true  },  // bootstrap council record
  { file: "02-seed-data.sql",        fatal: false },  // comprehensive seed data
  { file: "pg-03-spatial-seed.sql",  fatal: false },  // spatial layers + features
];

/**
 * Check whether the database has been bootstrapped already
 * by looking for the existence of the councils table.
 */
async function needsBootstrap(dbService) {
  try {
    const result = await dbService.executeQuery(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'councils'
    `);
    if (result.rows.length === 0) return true;

    // Table exists — check if it has any rows (seed data loaded?)
    const countResult = await dbService.executeQuery(
      `SELECT COUNT(*) AS cnt FROM councils`
    );
    return Number(countResult.rows[0]?.cnt || 0) === 0;
  } catch {
    return true; // if we can't even query, we need bootstrap
  }
}

/**
 * Split a SQL file into executable statements.
 * Handles:
 *   - Single-line comments (-- ...)
 *   - Multi-statement files separated by ;
 *   - DO $$ ... END $$; blocks (preserved as single statements)
 *   - String literals with embedded semicolons
 */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inDollarBlock = false;
  const lines = sql.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip pure comment lines (but not inside DO blocks)
    if (!inDollarBlock && trimmed.startsWith("--")) continue;

    // Detect start of DO $$ block
    if (!inDollarBlock && /\bDO\s+\$\$/i.test(trimmed)) {
      inDollarBlock = true;
    }

    current += line + "\n";

    // Detect end of DO $$ block
    if (inDollarBlock && /\$\$\s*;/.test(trimmed)) {
      inDollarBlock = false;
      statements.push(current.trim());
      current = "";
      continue;
    }

    // Outside a $$ block, split on semicolons at end of line
    if (!inDollarBlock && trimmed.endsWith(";")) {
      const stmt = current.trim();
      if (stmt && stmt !== ";") {
        statements.push(stmt);
      }
      current = "";
    }
  }

  // Any remaining text
  const remaining = current.trim();
  if (remaining && remaining !== ";") {
    statements.push(remaining);
  }

  return statements;
}

/**
 * Run all SQL bootstrap scripts against the database.
 * Uses a dedicated client from the pool so SET commands stay on the same connection.
 * Splits SQL files into individual statements for reliable execution.
 */
async function bootstrap(dbService) {
  console.log("[BOOTSTRAP] Checking if database needs initialization...");

  const needed = await needsBootstrap(dbService);
  if (!needed) {
    console.log("[BOOTSTRAP] Database already initialized — skipping.");
    return { bootstrapped: false, message: "Already initialized" };
  }

  console.log("[BOOTSTRAP] Database is empty — running initialization scripts...");

  // Get a dedicated client so SET statement_timeout persists across queries
  const pool = pgService.getPool();
  const client = await pool.connect();
  const results = [];

  try {
    // 5-minute timeout for large seed scripts
    await client.query(`SET statement_timeout = '300s'`);

    for (const script of SQL_SCRIPTS) {
      const filePath = path.join(SQL_DIR, script.file);
      try {
        const sql = await fs.readFile(filePath, "utf-8");
        if (!sql.trim()) {
          console.log(`[BOOTSTRAP] Skipping empty file: ${script.file}`);
          continue;
        }

        const sizeKB = (sql.length / 1024).toFixed(1);
        const stmts = splitStatements(sql);
        console.log(`[BOOTSTRAP] Executing ${script.file} (${sizeKB} KB, ${stmts.length} statements)...`);
        const startTime = Date.now();

        let stmtIndex = 0;
        for (const stmt of stmts) {
          stmtIndex++;
          try {
            await client.query(stmt);
          } catch (stmtErr) {
            // Log individual statement failures but don't abort unless fatal
            const preview = stmt.substring(0, 120).replace(/\n/g, " ");
            console.error(`[BOOTSTRAP]    stmt ${stmtIndex}/${stmts.length} failed: ${stmtErr.message}`);
            console.error(`[BOOTSTRAP]    SQL: ${preview}...`);
            // Re-throw to be caught by outer catch for fatal handling
            throw stmtErr;
          }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[BOOTSTRAP] ✅ ${script.file} completed in ${elapsed}ms`);
        results.push({ file: script.file, status: "ok", elapsed });
      } catch (err) {
        console.error(`[BOOTSTRAP] ❌ ${script.file} failed:`, err.message);
        if (err.position) {
          console.error(`[BOOTSTRAP]    Error at position ${err.position}`);
        }
        if (err.detail) {
          console.error(`[BOOTSTRAP]    Detail: ${err.detail}`);
        }
        results.push({ file: script.file, status: "error", error: err.message });

        if (script.fatal) {
          console.error(`[BOOTSTRAP] Fatal script failed — aborting bootstrap.`);
          return { bootstrapped: false, message: `${script.file} failed`, results };
        }
        // Non-fatal — continue with remaining scripts
        console.warn(`[BOOTSTRAP]    (non-fatal — continuing with next script)`);
      }
    }
  } finally {
    // Reset timeout and release client back to pool
    try { await client.query(`SET statement_timeout = '30s'`); } catch {}
    client.release();
  }

  console.log("[BOOTSTRAP] ✅ Database initialization complete.");
  return { bootstrapped: true, message: "Bootstrap complete", results };
}

module.exports = { bootstrap, needsBootstrap };
