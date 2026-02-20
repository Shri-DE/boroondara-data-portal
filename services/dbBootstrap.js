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
  { file: "pg-01-ddl.sql",          fatal: true,  ddl: true },  // core tables + pgcrypto
  { file: "pg-02-spatial-ddl.sql",   fatal: false, ddl: true },  // PostGIS tables (non-fatal)
  { file: "pg-05-abs-ddl.sql",      fatal: false, ddl: true },  // ABS Census tables
  { file: "pg-04-alter-columns.sql", fatal: false, ddl: true },  // add missing columns to existing tables
  { file: "pg-00-council.sql",       fatal: true,  ddl: false }, // bootstrap council record
  { file: "02-seed-data.sql",        fatal: false, ddl: false }, // comprehensive seed data
  { file: "pg-03-spatial-seed.sql",  fatal: false, ddl: false }, // spatial layers + features
  { file: "pg-06-abs-seed.sql",     fatal: false, ddl: false }, // ABS Census seed data
];

/**
 * Check whether the database needs bootstrapping.
 * Returns "full" if tables don't exist, "seed" if tables exist but are empty,
 * or false if everything looks populated.
 */
async function needsBootstrap(dbService) {
  try {
    const result = await dbService.executeQuery(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'councils'
    `);
    if (result.rows.length === 0) return "full";

    // Tables exist — check if seed data has been loaded
    const countResult = await dbService.executeQuery(
      `SELECT COUNT(*) AS cnt FROM employees`
    );
    const empCount = Number(countResult.rows[0]?.cnt || 0);
    if (empCount === 0) return "seed"; // Tables exist but no seed data

    // Seed data present — check if spatial tables exist
    try {
      const spatialResult = await dbService.executeQuery(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'spatial_layers'
      `);
      if (spatialResult.rows.length === 0) return "spatial";
    } catch {
      return "spatial";
    }

    // Check if ABS Census tables exist (added after initial deployment)
    try {
      const absResult = await dbService.executeQuery(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'abs_sa2_areas'
      `);
      if (absResult.rows.length === 0) return "abs";
    } catch {
      return "abs";
    }

    return false; // Everything looks good
  } catch {
    return "full"; // if we can't even query, we need full bootstrap
  }
}

/**
 * Split a SQL file into executable statements.
 * Handles:
 *   - Single-line comments (-- ...)
 *   - Multi-statement files separated by ;
 *   - DO $$ ... END $$; blocks (preserved as single statements)
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

  const mode = await needsBootstrap(dbService);
  if (!mode) {
    console.log("[BOOTSTRAP] Database already initialized — skipping.");
    return { bootstrapped: false, message: "Already initialized" };
  }

  console.log(`[BOOTSTRAP] Mode: ${mode} — running initialization scripts...`);

  // Filter scripts based on mode
  let scriptsToRun;
  if (mode === "spatial") {
    // Only run spatial DDL + spatial seed
    scriptsToRun = SQL_SCRIPTS.filter(s =>
      s.file.includes("spatial") || s.file.includes("alter")
    );
  } else if (mode === "abs") {
    // Only run ABS DDL + ABS seed
    scriptsToRun = SQL_SCRIPTS.filter(s =>
      s.file.includes("abs") || s.file.includes("alter")
    );
  } else if (mode === "seed") {
    // Run ALTER (add missing columns) + seed scripts, skip DDL creates
    scriptsToRun = SQL_SCRIPTS.filter(s => !s.ddl || s.file.includes("alter"));
  } else {
    scriptsToRun = SQL_SCRIPTS;
  }

  // Get a dedicated client so SET statement_timeout persists across queries
  const pool = pgService.getPool();
  const client = await pool.connect();
  const results = [];

  try {
    // 5-minute timeout for large seed scripts
    await client.query(`SET statement_timeout = '300s'`);

    for (const script of scriptsToRun) {
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

/**
 * Reset all data and re-seed from scratch.
 * Truncates all data tables (preserving DDL) then re-runs seed scripts.
 * Used when seed data has changed (e.g. council name change).
 */
async function resetAndReseed(dbService) {
  console.log("[BOOTSTRAP] Resetting all data for re-seed...");

  const pool = pgService.getPool();
  const client = await pool.connect();
  const results = [];

  try {
    await client.query(`SET statement_timeout = '300s'`);

    // Truncate all data tables in dependency order (children first)
    // Using CASCADE to handle foreign key constraints
    const truncateSQL = `
      TRUNCATE TABLE
        abs_cultural_diversity,
        abs_employment,
        abs_education,
        abs_income,
        abs_housing,
        abs_demographics,
        abs_sa2_areas,
        spatial_features,
        spatial_layers,
        facility_bookings,
        waste_collection_routes,
        meeting_resolutions,
        council_meetings,
        permit_inspections,
        planning_permits,
        service_requests,
        payroll_cost_distributions,
        payroll_runs,
        project_expenditures,
        projects,
        asset_maintenance,
        assets,
        receipt_applications,
        receipts,
        ar_invoice_lines,
        ar_invoices,
        journal_lines,
        journal_headers,
        budget_lines,
        gl_balances,
        ap_invoice_lines,
        ap_invoices,
        employees,
        customers,
        suppliers,
        accounting_periods,
        chart_of_accounts,
        organizational_units,
        councils
      CASCADE;
    `;

    try {
      await client.query(truncateSQL);
      console.log("[BOOTSTRAP] ✅ All tables truncated.");
      results.push({ step: "truncate", status: "ok" });
    } catch (err) {
      console.error("[BOOTSTRAP] ❌ Truncate failed:", err.message);
      // Try truncating tables one by one, skipping missing ones
      const tables = truncateSQL.match(/\w+/g).filter(t => t !== 'TRUNCATE' && t !== 'TABLE' && t !== 'CASCADE');
      for (const table of tables) {
        try {
          await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        } catch (tErr) {
          console.warn(`[BOOTSTRAP]    Skipping ${table}: ${tErr.message}`);
        }
      }
      results.push({ step: "truncate", status: "ok-partial" });
    }

    // First run DDL scripts to ensure all tables exist (CREATE IF NOT EXISTS is safe)
    const ddlScripts = SQL_SCRIPTS.filter(s => s.ddl);
    for (const script of ddlScripts) {
      const filePath = path.join(SQL_DIR, script.file);
      try {
        const sql = await fs.readFile(filePath, "utf-8");
        if (!sql.trim()) continue;

        const stmts = splitStatements(sql);
        console.log(`[BOOTSTRAP] Running DDL ${script.file} (${stmts.length} statements)...`);
        const startTime = Date.now();

        let stmtIndex = 0;
        for (const stmt of stmts) {
          stmtIndex++;
          try {
            await client.query(stmt);
          } catch (stmtErr) {
            const preview = stmt.substring(0, 120).replace(/\n/g, " ");
            console.error(`[BOOTSTRAP]    DDL stmt ${stmtIndex}/${stmts.length} failed: ${stmtErr.message}`);
            console.error(`[BOOTSTRAP]    SQL: ${preview}...`);
            if (script.fatal) throw stmtErr;
            // Non-fatal DDL — continue (e.g. PostGIS not available)
          }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[BOOTSTRAP] ✅ DDL ${script.file} completed in ${elapsed}ms`);
        results.push({ file: script.file, status: "ok", elapsed });
      } catch (err) {
        console.error(`[BOOTSTRAP] ❌ DDL ${script.file} failed:`, err.message);
        results.push({ file: script.file, status: "error", error: err.message });
        if (script.fatal) {
          return { reset: true, success: false, message: `DDL ${script.file} failed`, results };
        }
      }
    }

    // Now run all seed scripts (council + seed + spatial + ABS)
    const seedScripts = SQL_SCRIPTS.filter(s => !s.ddl);
    for (const script of seedScripts) {
      const filePath = path.join(SQL_DIR, script.file);
      try {
        const sql = await fs.readFile(filePath, "utf-8");
        if (!sql.trim()) continue;

        const stmts = splitStatements(sql);
        console.log(`[BOOTSTRAP] Executing ${script.file} (${stmts.length} statements)...`);
        const startTime = Date.now();

        let stmtIndex = 0;
        for (const stmt of stmts) {
          stmtIndex++;
          try {
            await client.query(stmt);
          } catch (stmtErr) {
            const preview = stmt.substring(0, 120).replace(/\n/g, " ");
            console.error(`[BOOTSTRAP]    stmt ${stmtIndex}/${stmts.length} failed: ${stmtErr.message}`);
            console.error(`[BOOTSTRAP]    SQL: ${preview}...`);
            throw stmtErr;
          }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[BOOTSTRAP] ✅ ${script.file} completed in ${elapsed}ms`);
        results.push({ file: script.file, status: "ok", elapsed });
      } catch (err) {
        console.error(`[BOOTSTRAP] ❌ ${script.file} failed:`, err.message);
        results.push({ file: script.file, status: "error", error: err.message });
        if (script.fatal) {
          return { reset: true, success: false, message: `${script.file} failed`, results };
        }
      }
    }
  } finally {
    try { await client.query(`SET statement_timeout = '30s'`); } catch {}
    client.release();
  }

  console.log("[BOOTSTRAP] ✅ Reset and re-seed complete.");
  return { reset: true, success: true, message: "Reset and re-seed complete", results };
}

module.exports = { bootstrap, needsBootstrap, resetAndReseed };
