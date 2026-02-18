// admin/adminRoutes.js - Updated with agent assignment support + admin role enforcement
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { requireAdmin } = require("./requireUser");

const router = express.Router();

// ✅ All admin endpoints require admin role (not just authentication)
router.use(requireAdmin);

const dataDir = path.join(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");

// ✅ Helper: ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

// ✅ Helper: load users from file
async function loadUsers() {
  try {
    const data = await fs.readFile(usersFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

// ✅ Helper: save users to file
async function saveUsers(users) {
  await ensureDataDir();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

// ✅ GET /admin/users - List all users (admin only)
router.get("/users", async (req, res) => {
  try {
    const users = await loadUsers();
    res.json(users);
  } catch (err) {
    console.error("Failed to load users:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// ✅ POST /admin/users - Create or update user/group (admin only)
router.post("/users", async (req, res) => {
  try {
    const { upn, role, isActive, allowedAgents, allowedDatasets, type, displayName, objectId, canAccessDashboard, canAccessReports } =
      req.body;

    const entityType = type || "user"; // backward-compat: default to "user"

    // Validate by entity type
    if (entityType === "user") {
      if (!upn || typeof upn !== "string" || !upn.includes("@")) {
        return res.status(400).json({ error: "Invalid UPN/email" });
      }
    } else if (entityType === "group") {
      if (!objectId || typeof objectId !== "string") {
        return res
          .status(400)
          .json({ error: "objectId is required for security groups" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "type must be 'user' or 'group'" });
    }

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'admin' or 'user'" });
    }

    if (allowedAgents !== undefined && !Array.isArray(allowedAgents)) {
      return res.status(400).json({ error: "allowedAgents must be an array" });
    }

    if (allowedDatasets !== undefined && !Array.isArray(allowedDatasets)) {
      return res.status(400).json({ error: "allowedDatasets must be an array" });
    }

    const users = await loadUsers();

    // Lookup: users by upn, groups by objectId
    const existing = users.find((u) => {
      if ((u.type || "user") === "group" && entityType === "group") {
        return u.objectId === objectId;
      }
      if ((u.type || "user") === "user" && entityType === "user") {
        return u.upn?.toLowerCase() === upn?.toLowerCase();
      }
      return false;
    });

    const now = new Date().toISOString();

    if (existing) {
      existing.role = role;
      existing.isActive = isActive !== undefined ? isActive : true;
      existing.allowedAgents = allowedAgents || [];
      existing.allowedDatasets = allowedDatasets || existing.allowedDatasets || [];
      existing.displayName = displayName || existing.displayName;
      existing.type = entityType;
      existing.objectId = objectId || existing.objectId;
      existing.canAccessDashboard = canAccessDashboard !== undefined ? canAccessDashboard : existing.canAccessDashboard;
      existing.canAccessReports = canAccessReports !== undefined ? canAccessReports : existing.canAccessReports;
      if (upn) existing.upn = upn;
      existing.updatedAt = now;
    } else {
      users.push({
        upn: upn || "",
        role,
        isActive: isActive !== undefined ? isActive : true,
        allowedAgents: allowedAgents || [],
        allowedDatasets: allowedDatasets || [],
        type: entityType,
        displayName: displayName || upn || objectId,
        objectId: objectId || null,
        canAccessDashboard: canAccessDashboard !== undefined ? canAccessDashboard : true,
        canAccessReports: canAccessReports !== undefined ? canAccessReports : true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await saveUsers(users);

    // Return the saved record
    const saved =
      entityType === "group"
        ? users.find((u) => u.objectId === objectId)
        : users.find((u) => u.upn?.toLowerCase() === upn?.toLowerCase());

    res.json(saved);
  } catch (err) {
    console.error("Failed to save user:", err);
    res.status(500).json({ error: "Failed to save user" });
  }
});

// ✅ DELETE /admin/users/:upn - Delete a user or group (admin only)
// For groups, pass the objectId as the :upn param
router.delete("/users/:upn", async (req, res) => {
  try {
    const { upn } = req.params;
    const users = await loadUsers();
    const filtered = users.filter(
      (u) =>
        u.upn?.toLowerCase() !== upn.toLowerCase() &&
        u.objectId !== upn
    );

    if (filtered.length === users.length) {
      return res.status(404).json({ error: "User/group not found" });
    }

    await saveUsers(filtered);
    res.json({ deleted: upn });
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ──────────────────────────────────────────
// Dataset catalogue management
// ──────────────────────────────────────────

const datasetRoutes = require("../datasetRoutes");
const dbService = require("../services/dbService");

const catalogueFile = path.join(dataDir, "datasetCatalogue.json");

async function loadCatalogue() {
  try {
    const data = await fs.readFile(catalogueFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function saveCatalogue(catalogue) {
  await ensureDataDir();
  await fs.writeFile(catalogueFile, JSON.stringify(catalogue, null, 2), "utf-8");
  // Invalidate the in-memory cache in datasetRoutes
  if (typeof datasetRoutes.clearCatalogueCache === "function") {
    datasetRoutes.clearCatalogueCache();
  }
}

// GET /admin/datasets — List all datasets
router.get("/datasets", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    res.json(catalogue);
  } catch (err) {
    console.error("Failed to load datasets:", err);
    res.status(500).json({ error: "Failed to load datasets" });
  }
});

// GET /admin/datasets/:id — Get single dataset
router.get("/datasets/:id", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const ds = catalogue.find((d) => d.id === req.params.id);
    if (!ds) return res.status(404).json({ error: "Dataset not found" });
    res.json(ds);
  } catch (err) {
    console.error("Failed to load dataset:", err);
    res.status(500).json({ error: "Failed to load dataset" });
  }
});

// POST /admin/datasets — Create or update dataset (upsert by id)
router.post("/datasets", async (req, res) => {
  try {
    const {
      id, department, description, owner, ownerEmail,
      icon, color, classification, agentId, status, tables,
    } = req.body;

    if (!id || !department) {
      return res.status(400).json({ error: "id and department are required" });
    }
    if (tables !== undefined && !Array.isArray(tables)) {
      return res.status(400).json({ error: "tables must be an array" });
    }
    if (status && !["active", "coming_soon"].includes(status)) {
      return res.status(400).json({ error: "status must be 'active' or 'coming_soon'" });
    }

    const catalogue = await loadCatalogue();
    const existing = catalogue.find((d) => d.id === id);

    if (existing) {
      existing.department = department || existing.department;
      existing.description = description !== undefined ? description : existing.description;
      existing.owner = owner !== undefined ? owner : existing.owner;
      existing.ownerEmail = ownerEmail !== undefined ? ownerEmail : existing.ownerEmail;
      existing.icon = icon || existing.icon;
      existing.color = color || existing.color;
      existing.classification = classification || existing.classification;
      existing.agentId = agentId !== undefined ? (agentId || null) : existing.agentId;
      existing.status = status || existing.status;
      existing.tables = tables !== undefined ? tables : existing.tables;
    } else {
      catalogue.push({
        id,
        department,
        icon: icon || "Database",
        color: color || "#6366F1",
        classification: classification || "OFFICIAL",
        owner: owner || "",
        ownerEmail: ownerEmail || "",
        agentId: agentId || null,
        description: description || "",
        tables: tables || [],
        status: status || "coming_soon",
      });
    }

    await saveCatalogue(catalogue);
    const saved = catalogue.find((d) => d.id === id);
    res.json(saved);
  } catch (err) {
    console.error("Failed to save dataset:", err);
    res.status(500).json({ error: "Failed to save dataset" });
  }
});

// DELETE /admin/datasets/:id — Delete a dataset
router.delete("/datasets/:id", async (req, res) => {
  try {
    const catalogue = await loadCatalogue();
    const filtered = catalogue.filter((d) => d.id !== req.params.id);
    if (filtered.length === catalogue.length) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    await saveCatalogue(filtered);
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error("Failed to delete dataset:", err);
    res.status(500).json({ error: "Failed to delete dataset" });
  }
});

// GET /admin/tables — Discover all tables from information_schema
router.get("/tables", async (req, res) => {
  try {
    const result = await dbService.executeQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    res.json(result.rows.map((r) => r.table_name));
  } catch (err) {
    console.error("Failed to discover tables:", err);
    res.status(500).json({ error: "Failed to discover tables" });
  }
});

// POST /admin/bootstrap — Run DDL + seed scripts to initialise the database
router.post("/bootstrap", async (req, res) => {
  try {
    const { bootstrap } = require("../services/dbBootstrap");
    const result = await bootstrap(dbService);
    res.json(result);
  } catch (err) {
    console.error("Bootstrap failed:", err);
    res.status(500).json({ error: "Bootstrap failed: " + err.message });
  }
});

module.exports = router;