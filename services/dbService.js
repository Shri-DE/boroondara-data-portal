// services/dbService.js — Database service router
//
// Uses PostgreSQL (pgService) as the primary backend.
// Falls back to Fabric (fabricService) if PGHOST is not set.
// All route files should import from this module instead of fabricService directly.

const DB_BACKEND = process.env.DB_BACKEND || (process.env.PGHOST ? "postgres" : "fabric");

let activeService;
if (DB_BACKEND === "postgres") {
  activeService = require("./pgService");
  console.log("[DB] Using PostgreSQL backend");
} else {
  activeService = require("./fabricService");
  console.log("[DB] Using Fabric Warehouse backend");
}

module.exports = activeService;
