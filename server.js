// server.js
require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // fallback to .env

const express = require("express");
const path = require("path");
const fabricService = require("./services/fabricService");

const adminRoutes = require("./admin/adminRoutes");
const agentsRoutes = require("./agentsRoutes");
const datasetRoutes = require("./datasetRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reportRoutes = require("./reportRoutes");
const onboardRoutes = require("./onboardRoutes");
const geospatialRoutes = require("./geospatialRoutes");
const { initializeSpatialTables } = geospatialRoutes;
const chatService = require("./services/chatService");
const { requireUser } = require("./admin/requireUser");
const path_data = require("path");
const fs_data = require("fs").promises;
const fs = require("fs");

// -------------------------------
// Ensure data directory and users.json exist (survives deploys)
// -------------------------------
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const usersBootstrap = path.join(dataDir, "users.json");
if (!fs.existsSync(usersBootstrap)) fs.writeFileSync(usersBootstrap, "[]", "utf-8");

const app = express();

// -------------------------------
// Config
// -------------------------------
const PORT = process.env.PORT || 3000;
const buildPath = path.join(__dirname, "build");

// -------------------------------
// Middleware
// -------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// API routes (MUST come before static + SPA fallback)
// -------------------------------
app.use("/api/admin", adminRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/onboard", onboardRoutes);
app.use("/api/spatial", geospatialRoutes);

// ── GET /api/me — Current user profile with access flags ──
const PORTAL_ADMINS_ME = (process.env.PORTAL_ADMINS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

app.get("/api/me", requireUser, async (req, res) => {
  try {
    const upn = (req.currentUser?.upn || "").toLowerCase();
    if (!upn) return res.status(401).json({ error: "Unauthenticated" });

    // Check if portal admin
    const isAdmin = PORTAL_ADMINS_ME.includes(upn);

    // Load user from users.json
    const usersFile = path_data.join(__dirname, "data", "users.json");
    let users = [];
    try {
      const data = await fs_data.readFile(usersFile, "utf-8");
      users = JSON.parse(data);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    const user = users.find((u) => u.upn === upn);

    // Admins always get full access
    if (isAdmin || (user && user.role === "admin")) {
      return res.json({
        upn,
        role: "admin",
        isActive: true,
        canAccessDashboard: true,
        canAccessReports: true,
      });
    }

    if (!user || !user.isActive) {
      return res.json({
        upn,
        role: user?.role || "user",
        isActive: user?.isActive ?? false,
        canAccessDashboard: false,
        canAccessReports: false,
      });
    }

    // Derive reports access from dataset access:
    // User can access reports if the toggle is not off AND they have access to at least one dataset
    let hasAnyDatasetAccess = false;
    try {
      const cataloguePath = path_data.join(__dirname, "data", "datasetCatalogue.json");
      const catRaw = await fs_data.readFile(cataloguePath, "utf-8");
      const catalogue = JSON.parse(catRaw);

      const userDatasets = user.allowedDatasets || [];
      const userAgents = user.allowedAgents || [];

      hasAnyDatasetAccess = catalogue.some((ds) => {
        if (ds.status !== "active") return false;
        // Explicit dataset access
        if (userDatasets.includes(ds.id)) return true;
        // Implicit: agent access grants dataset access
        if (ds.agentId && userAgents.includes(ds.agentId)) return true;
        return false;
      });
    } catch (catErr) {
      console.error("[ME] Error loading catalogue:", catErr);
      // Default to true if catalogue can't be loaded
      hasAnyDatasetAccess = true;
    }

    // Return user profile with access flags
    res.json({
      upn,
      role: user.role || "user",
      isActive: user.isActive,
      canAccessDashboard: user.canAccessDashboard !== undefined ? user.canAccessDashboard : true,
      canAccessReports: (user.canAccessReports !== false) && hasAnyDatasetAccess,
    });
  } catch (err) {
    console.error("[ME] Error:", err);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// General chat endpoint (no agent required — for file analysis and general questions)
app.post("/api/chat", async (req, res) => {
  const startTime = Date.now();
  const query = (req.body?.query || "").trim();
  const fileContext = (req.body?.fileContext || "").trim();
  const sessionId = req.body?.sessionId || `chat-${Date.now()}`;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const result = await chatService.chat(query, fileContext || undefined);
    res.json({
      response: result.response,
      sessionId,
      citations: [],
      suggestions: [],
      metadata: {
        tokensUsed: result.tokensUsed || 0,
        responseTime: Date.now() - startTime,
        model: result.model || "unknown",
      },
    });
  } catch (err) {
    console.error("Error in chat endpoint:", err);
    const msg = (err.message || "").toLowerCase();
    let userMsg;
    if (msg.includes("timeout") || msg.includes("timed out")) {
      userMsg = "That took too long to process. Try a simpler question or a smaller file.";
    } else if (msg.includes("azure") || msg.includes("api_key")) {
      userMsg = "The AI service is temporarily unavailable. Please try again shortly.";
    } else {
      userMsg = "I wasn't able to process that. Could you try rephrasing?";
    }
    res.json({
      response: userMsg,
      sessionId,
      citations: [],
      suggestions: [],
      metadata: { tokensUsed: 0, responseTime: Date.now() - startTime },
    });
  }
});

// Health check (optional but useful)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// API safety net: any unknown /api route returns JSON (never HTML)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// -------------------------------
// Static UI (React build)
// -------------------------------
app.use(express.static(buildPath));

// -------------------------------
// SPA fallback (Express 5 SAFE)
// - Use regex so /api/* NEVER matches this
// -------------------------------
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile("index.html", { root: buildPath });
});

// -------------------------------
// Startup validation
// -------------------------------
const requiredEnv = [
  "AZURE_AI_ENDPOINT",
  "AZURE_AI_API_KEY",
];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);

if (missingEnv.length > 0) {
  console.warn(`⚠️  Missing env vars: ${missingEnv.join(", ")}`);
  // Only exit for truly required vars (AI endpoint); Fabric connects lazily
  if (process.env.NODE_ENV === "production") {
    console.error("Exiting due to missing required configuration in production.");
    process.exit(1);
  }
}
if (!process.env.FABRIC_SERVER) {
  console.warn("⚠️  FABRIC_SERVER not set — Fabric Warehouse queries will fail until configured.");
}

// -------------------------------
// Start server
// -------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
  console.log("   Portal UI is ready. Fabric Warehouse connects on first query.");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await fabricService.shutdown();
  process.exit(0);
});
