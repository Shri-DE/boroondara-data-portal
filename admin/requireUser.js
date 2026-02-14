// admin/requireUser.js
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;

// PORTAL_ADMINS env var: these users are always treated as admin
const PORTAL_ADMINS = (process.env.PORTAL_ADMINS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const usersFile = path.join(__dirname, "../data/users.json");

async function loadUsers() {
  try {
    const data = await fs.readFile(usersFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

function requireUser(req, res, next) {
  const existing = req.currentUser || req.user || null;

  if (existing?.upn) {
    req.currentUser = existing;
    console.log("[AUTH] existing user:", existing.upn);
    return next();
  }

  // 1) Preferred: Authorization: Bearer <token>
  const authHeader = (req.headers["authorization"] || "").toString().trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();

    const decoded = jwt.decode(token);
    if (!decoded) {
      console.log("[AUTH] bearer token present but could not decode");
      return res.status(401).json({ error: "Invalid token" });
    }

    // Common Entra claims for username/email
    const upnRaw =
      decoded.preferred_username ||
      decoded.upn ||
      decoded.email ||
      (Array.isArray(decoded.emails) ? decoded.emails[0] : null);

    const upn = (upnRaw || "").toString().trim().toLowerCase();
    const name = (decoded.name || "").toString().trim();

    console.log("[AUTH] bearer token user:", upn || "(missing upn claim)");

    if (upn) {
      req.currentUser = {
        upn,
        name,
        oid: decoded.oid,
        tid: decoded.tid,
      };
      return next();
    }

    return res.status(401).json({ error: "No user identity in token" });
  }

  // 2) Dev fallback: x-user-upn header
  const upn = (req.headers["x-user-upn"] || "").toString().trim().toLowerCase();
  const name = (req.headers["x-user-name"] || "").toString().trim();

  console.log("[AUTH] x-user-upn header:", upn || "(missing)");

  if (upn) {
    req.currentUser = { upn, name };
    return next();
  }

  return res.status(401).json({ error: "Unauthenticated" });
}

// ✅ requireAdmin: must be authenticated AND have admin role (or be in PORTAL_ADMINS)
async function requireAdmin(req, res, next) {
  // First ensure user is authenticated
  requireUser(req, res, async () => {
    try {
      const upn = (req.currentUser?.upn || "").toLowerCase();

      // PORTAL_ADMINS always pass
      if (PORTAL_ADMINS.includes(upn)) {
        console.log("[AUTH] PORTAL_ADMIN access granted:", upn);
        return next();
      }

      // Check role in users.json
      const users = await loadUsers();
      const user = users.find((u) => u.upn === upn);

      if (user && user.isActive && user.role === "admin") {
        console.log("[AUTH] Admin access granted:", upn);
        return next();
      }

      console.log("[AUTH] Admin access DENIED:", upn, "role:", user?.role || "not found");
      return res.status(403).json({ error: "Forbidden: admin role required" });
    } catch (err) {
      console.error("[AUTH] Error checking admin role:", err);
      return res.status(500).json({ error: "Failed to verify admin role" });
    }
  });
}

module.exports = { requireUser, requireAdmin };
