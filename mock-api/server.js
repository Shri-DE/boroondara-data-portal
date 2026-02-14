const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Demo agent catalog
 * Shape aligned with frontend expectations
 */
const agents = [
  {
    id: "finance",
    name: "Finance Agent",
    description:
      "General ledger actuals, budgets, AP and project spend insights for councils.",
    category: "Finance",
    status: "beta",
    enabled: true,
    hasAccess: true,
    version: "0.1.0",
    exampleQueries: [
      "Show FY2025 YTD actuals by cost centre",
      "Top budget variances this year",
      "Top vendors by spend",
      "Project spend vs budget"
    ]
  }
];

/**
 * List agents (used by Home + Agent Catalog)
 */
app.get("/api/agents", (req, res) => {
  res.json(agents.filter(a => a.enabled));
});

/**
 * Get single agent
 */
app.get("/api/agents/:id", (req, res) => {
  const agent = agents.find(a => a.id === req.params.id && a.enabled);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }
  res.json(agent);
});

/**
 * Chat/query endpoint (placeholder for now)
 * IMPORTANT: response shape matches UI chat expectations
 */
app.post("/api/agents/:id/query", (req, res) => {
  const agent = agents.find(a => a.id === req.params.id && a.enabled);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const query = req.body?.query || "";

  res.json({
    response: `✅ Finance Agent is enabled.\n\nYou asked:\n"${query}"\n\nNext step: connect this to Azure AI Foundry + finance datasets.`,
    charts: [],
    tables: [],
    citations: [],
    suggestions: agent.exampleQueries
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}`);
});
