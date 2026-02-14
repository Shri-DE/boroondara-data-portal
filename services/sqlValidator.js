const BLOCKED_KEYWORDS = [
  "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
  "TRUNCATE", "GRANT", "REVOKE", "EXECUTE", "EXEC", "CALL",
  "COPY", "LOAD", "INTO", "BULK", "MERGE", "DBCC",
];

const BLOCKED_FUNCTIONS = [
  "xp_cmdshell", "xp_regread", "xp_regwrite",
  "xp_dirtree", "xp_fileexist", "xp_fixeddrives",
  "sp_OACreate", "sp_OAMethod", "sp_OAGetProperty",
  "sp_configure", "sp_addrolemember", "sp_droprolemember",
  "OPENROWSET", "OPENDATASOURCE", "OPENQUERY",
  "fn_my_permissions",
];

const MAX_SQL_LENGTH = 4000;

function stripComments(sql) {
  // Remove block comments
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Remove line comments
  result = result.replace(/--[^\n]*/g, " ");
  return result;
}

function validate(sql) {
  if (!sql || typeof sql !== "string") {
    return { valid: false, error: "No SQL provided", sanitizedSql: "" };
  }

  const trimmed = sql.trim();

  if (trimmed.length > MAX_SQL_LENGTH) {
    return { valid: false, error: `SQL exceeds maximum length of ${MAX_SQL_LENGTH} characters`, sanitizedSql: "" };
  }

  // Strip comments for analysis
  const cleaned = stripComments(trimmed).replace(/\s+/g, " ").trim();

  // Check for multiple statements (split on semicolons not inside quotes)
  const statements = cleaned.split(";").filter((s) => s.trim().length > 0);
  if (statements.length > 1) {
    return { valid: false, error: "Multiple SQL statements not allowed", sanitizedSql: "" };
  }

  // Must start with SELECT or WITH
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return { valid: false, error: "Only SELECT queries are allowed", sanitizedSql: "" };
  }

  // Check blocked keywords (word-boundary match)
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    // Special case: INTO is allowed inside "CAST(... INTO ...)" patterns but block SELECT INTO
    if (keyword === "INTO" && regex.test(cleaned)) {
      // Only block if it looks like "SELECT ... INTO" or "INSERT INTO"
      if (/\bSELECT\b[^)]*\bINTO\b/i.test(cleaned) && !/\bCAST\s*\(/i.test(cleaned)) {
        return { valid: false, error: `Blocked keyword detected: ${keyword}`, sanitizedSql: "" };
      }
      continue;
    }
    if (keyword !== "INTO" && regex.test(cleaned)) {
      return { valid: false, error: `Blocked keyword detected: ${keyword}`, sanitizedSql: "" };
    }
  }

  // Check blocked functions
  for (const func of BLOCKED_FUNCTIONS) {
    const regex = new RegExp(`\\b${func}\\s*\\(`, "i");
    if (regex.test(cleaned)) {
      return { valid: false, error: `Blocked function detected: ${func}`, sanitizedSql: "" };
    }
  }

  // Remove trailing semicolon for execution
  const sanitizedSql = trimmed.replace(/;\s*$/, "");

  return { valid: true, error: null, sanitizedSql };
}

module.exports = { validate };
