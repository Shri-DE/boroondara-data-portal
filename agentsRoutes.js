// agentsRoutes.js (repo root) - Updated with user permission filtering
const express = require("express");
const { requireUser } = require("./admin/requireUser");
const path = require("path");
const fs = require("fs").promises;

const aiFoundryService = require("./services/aiFoundryService");
const fabricService = require("./services/fabricService");
const sqlValidator = require("./services/sqlValidator");
const responseFormatter = require("./services/responseFormatter");

const router = express.Router();

// ✅ All agent routes require authentication
if (process.env.NODE_ENV === "production") {
  router.use(requireUser);
}

const agents = [
  {
    id: "finance",
    name: "Finance Agent",
    description: "GL balances, budgets, AP, AR, journals and project spend insights for councils.",
    category: "Finance",
    status: "active",
    enabled: true,
    hasAccess: true,
    version: "0.1.0",
    exampleQueries: [
      "Show YTD actuals vs budget by organisational unit for FY2025",
      "Top 10 suppliers by total AP invoice amount",
      "Outstanding AP invoices not yet fully paid",
      "Capital project spend vs budget summary",
      "Revenue breakdown by account classification",
      "Show journal entries posted in the last 3 months"
    ]
  },
  {
    id: "asset",
    name: "Asset Management Agent",
    description: "Asset register, depreciation schedules, net book values, condition assessments and location reporting for councils.",
    category: "Asset Management",
    status: "active",
    enabled: true,
    hasAccess: true,
    version: "0.1.0",
    exampleQueries: [
      "Show all assets by category with total net book value",
      "Assets in poor or very poor condition",
      "Total depreciation expense by asset category for FY2025",
      "Assets approaching end of useful life within 2 years",
      "Asset count and total acquisition cost by location",
      "Condition assessment summary by category"
    ]
  }
];

// ✅ Helper: Load users from file to check permissions
const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");

// ✅ Safety net: PORTAL_ADMINS env var ensures these users always have admin access
// even if they are accidentally removed from users.json
const PORTAL_ADMINS = (process.env.PORTAL_ADMINS || "admin@boroondara.vic.gov.au")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function loadUsers() {
  try {
    const data = await fs.readFile(usersFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function saveUsers(users) {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save users:", err);
  }
}

// ✅ Helper: Resolve user from file, auto-provision PORTAL_ADMINS if missing
async function resolveUser(userUpn) {
  const users = await loadUsers();
  let user = users.find((u) => u.upn === userUpn);

  // If user is in PORTAL_ADMINS but missing from file, auto-add them
  if (!user && PORTAL_ADMINS.includes(userUpn.toLowerCase())) {
    const now = new Date().toISOString();
    user = {
      upn: userUpn.toLowerCase(),
      role: "admin",
      isActive: true,
      allowedAgents: [],
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
    await saveUsers(users);
    console.log(`[AUTH] Auto-provisioned PORTAL_ADMIN: ${userUpn}`);
  }

  // If user exists but is a PORTAL_ADMIN, ensure they always have admin role
  if (user && PORTAL_ADMINS.includes(userUpn.toLowerCase()) && user.role !== "admin") {
    user.role = "admin";
    user.isActive = true;
    user.updatedAt = new Date().toISOString();
    await saveUsers(users);
    console.log(`[AUTH] Restored admin role for PORTAL_ADMIN: ${userUpn}`);
  }

  return user;
}

// ✅ Helper: Check if user has access to an agent
async function userHasAgentAccess(userUpn, agentId) {
  try {
    const user = await resolveUser(userUpn);

    if (!user) return false; // User not found
    if (!user.isActive) return false; // Inactive user
    if (user.role === "admin") return true; // Admins have access to all agents

    // Check if user has this specific agent assigned
    return user.allowedAgents && user.allowedAgents.includes(agentId);
  } catch (err) {
    console.error("Error checking agent access:", err);
    return false;
  }
}

// ✅ Helper: Get all agents user has access to
async function filterAgentsForUser(userUpn) {
  try {
    const user = await resolveUser(userUpn);

    if (!user || !user.isActive) return []; // No access
    if (user.role === "admin") return agents.filter((a) => a.enabled); // Admins see all

    // Users see only their assigned agents
    const allowedIds = user.allowedAgents || [];
    return agents.filter((a) => a.enabled && allowedIds.includes(a.id));
  } catch (err) {
    console.error("Error filtering agents:", err);
    return [];
  }
}

// ✅ GET /api/agents - List agents (filtered by user permissions)
router.get("/", async (req, res) => {
  try {
    // In development, return all agents
    if (process.env.NODE_ENV !== "production") {
      return res.json(agents.filter((a) => a.enabled));
    }

    // In production, filter by user permissions
    const user = req.currentUser || req.user;
    const userUpn = user?.upn || user?.email || user?.preferred_username;

    if (!userUpn) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const allowedAgents = await filterAgentsForUser(userUpn);
    res.json(allowedAgents);
  } catch (err) {
    console.error("Error getting agents:", err);
    res.status(500).json({ error: "Failed to get agents" });
  }
});

// ✅ GET /api/agents/:id - Get single agent (check permissions)
router.get("/:id", async (req, res) => {
  const agent = agents.find((a) => a.id === req.params.id && a.enabled);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  try {
    // In development, return agent
    if (process.env.NODE_ENV !== "production") {
      return res.json(agent);
    }

    // In production, check permissions
    const user = req.currentUser || req.user;
    const userUpn = user?.upn || user?.email || user?.preferred_username;

    if (!userUpn) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const hasAccess = await userHasAgentAccess(userUpn, agent.id);

    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have access to this agent" });
    }

    res.json(agent);
  } catch (err) {
    console.error("Error getting agent:", err);
    res.status(500).json({ error: "Failed to get agent" });
  }
});

// ✅ POST /api/agents/:id/query - Query agent (check permissions)
router.post("/:id/query", async (req, res) => {
  const agent = agents.find((a) => a.id === req.params.id && a.enabled);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  // In production, check permissions
  // Note: requireUser middleware sets req.currentUser (not req.user)
  if (process.env.NODE_ENV === "production") {
    const user = req.currentUser || req.user;
    const userUpn = user?.upn || user?.email || user?.preferred_username;

    if (!userUpn) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const hasAccess = await userHasAgentAccess(userUpn, agent.id);

    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have access to this agent" });
    }
  }

  const startTime = Date.now();
  const query = (req.body?.query || "").trim();
  const sessionId = req.body?.sessionId || `session-${Date.now()}`;
  const fileContext = (req.body?.context?.fileContext || "").trim();
  const datasetTables = req.body?.context?.datasetTables || null;
  const datasetDept = req.body?.context?.datasetDept || null;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  if (query.length > 500) {
    return res.status(400).json({ error: "Query exceeds maximum length of 500 characters" });
  }

  try {
    // Step 1: Get database schema context
    const schemaContext = await fabricService.getSchemaContext();

    // Step 2: Generate SQL from natural language via Azure AI Foundry
    const aiResult = await aiFoundryService.generateSQL(query, schemaContext, fileContext || undefined, agent.id, {
      datasetTables: Array.isArray(datasetTables) ? datasetTables : null,
      datasetDept: datasetDept || null,
    });

    // Step 2b: If AI responded without SQL (greeting, clarification, etc.), return directly
    if (!aiResult.sql) {
      return res.json({
        response: aiResult.explanation,
        sessionId,
        citations: [],
        suggestions: agent.exampleQueries,
        metadata: {
          tokensUsed: aiResult.tokensUsed || 0,
          responseTime: Date.now() - startTime,
          model: aiResult.model || "unknown",
        },
      });
    }

    // Step 3: Validate the generated SQL
    const validation = sqlValidator.validate(aiResult.sql);
    if (!validation.valid) {
      return res.json({
        response: `I generated a query but it didn't pass safety validation: ${validation.error}. Please try rephrasing your question.`,
        sessionId,
        citations: [],
        suggestions: agent.exampleQueries,
        metadata: {
          tokensUsed: aiResult.tokensUsed,
          responseTime: Date.now() - startTime,
          model: aiResult.model,
        },
      });
    }

    // Step 4: Execute the validated SQL against Fabric Warehouse (with retry on failure)
    let dbResult;
    let usedSql = validation.sanitizedSql;
    try {
      dbResult = await fabricService.executeQuery(usedSql);
    } catch (dbErr) {
      // Retry: send error back to AI for correction
      console.log("[RETRY] DB error, asking AI to fix:", dbErr.message);
      try {
        const retryResult = await aiFoundryService.generateSQL(
          `The previous SQL query had an error: "${dbErr.message}". Original question: "${query}". Please generate a corrected SQL query.`,
          schemaContext
        );
        if (retryResult.sql) {
          const retryValidation = sqlValidator.validate(retryResult.sql);
          if (retryValidation.valid) {
            dbResult = await fabricService.executeQuery(retryValidation.sanitizedSql);
            usedSql = retryValidation.sanitizedSql;
            // Update explanation from retry
            aiResult.explanation = retryResult.explanation || aiResult.explanation;
            console.log("[RETRY] Success on retry");
          }
        }
      } catch (retryErr) {
        console.log("[RETRY] Retry also failed:", retryErr.message);
      }

      // If retry didn't produce a result, return friendly error
      if (!dbResult) {
        return res.json({
          response: `I tried to answer your question but ran into a technical issue. Could you try rephrasing?\n\nHere's what I attempted:\n\n${aiResult.explanation}`,
          sessionId,
          citations: [],
          suggestions: agent.exampleQueries,
          metadata: {
            tokensUsed: aiResult.tokensUsed || 0,
            responseTime: Date.now() - startTime,
            model: aiResult.model || "unknown",
          },
        });
      }
    }

    // Step 5: Format and return the response
    const formatted = responseFormatter.formatResponse({
      query,
      sql: usedSql,
      explanation: aiResult.explanation,
      rows: dbResult.rows,
      fields: dbResult.fields,
      rowCount: dbResult.rowCount,
      tokensUsed: aiResult.tokensUsed,
      model: aiResult.model,
      startTime,
      sessionId,
      exampleQueries: agent.exampleQueries,
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error in agent query pipeline:", err);

    // Friendly error messages instead of raw 500
    const msg = (err.message || "").toLowerCase();
    let userMsg;
    if (msg.includes("timeout") || msg.includes("timed out")) {
      userMsg = "That query was too complex and timed out. Try asking for a smaller or more specific subset of data.";
    } else if (msg.includes("connect") || msg.includes("econnrefused") || msg.includes("enotfound")) {
      userMsg = "I'm having trouble reaching the database right now. Please try again in a moment.";
    } else if (msg.includes("azure") || msg.includes("ai_endpoint") || msg.includes("api_key")) {
      userMsg = "The AI service is temporarily unavailable. Please try again shortly.";
    } else {
      userMsg = "I wasn't able to process that question. Could you try rephrasing it?";
    }

    res.json({
      response: userMsg,
      sessionId,
      citations: [],
      suggestions: agent.exampleQueries,
      metadata: {
        tokensUsed: 0,
        responseTime: Date.now() - startTime,
      },
    });
  }
});

module.exports = router;
