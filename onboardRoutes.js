// onboardRoutes.js — Public API for self-service onboarding
// All endpoints are PUBLIC (no authentication required)
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { sendEmail } = require("./services/emailService");

const router = express.Router();

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const catalogueFile = path.join(dataDir, "datasetCatalogue.json");

const PORTAL_ADMINS = (process.env.PORTAL_ADMINS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Allowed email domain for onboarding (set via ALLOWED_EMAIL_DOMAIN env var)
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || "").toLowerCase();

// Agent metadata for onboarding display (public, minimal)
const AGENTS = [
  { id: "finance", name: "Finance Agent", description: "GL balances, budgets, AP, AR, journals and project spend insights." },
  { id: "asset", name: "Asset Management Agent", description: "Asset register, depreciation, condition assessments and location reporting." },
];

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
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
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

// ──────────────────────────────────────────
// GET /api/onboard/agents — public agent list
// ──────────────────────────────────────────
router.get("/agents", (req, res) => {
  res.json(AGENTS);
});

// ──────────────────────────────────────────
// GET /api/onboard/datasets — public active dataset list
// ──────────────────────────────────────────
router.get("/datasets", async (req, res) => {
  try {
    const data = await fs.readFile(catalogueFile, "utf-8");
    const catalogue = JSON.parse(data);
    const active = catalogue
      .filter((ds) => ds.status === "active")
      .map((ds) => ({
        id: ds.id,
        department: ds.department,
        description: ds.description || "",
      }));
    res.json(active);
  } catch (err) {
    console.error("[ONBOARD] Failed to load datasets:", err);
    res.status(500).json({ error: "Failed to load datasets" });
  }
});

// ──────────────────────────────────────────
// POST /api/onboard — submit access request
// ──────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { email, requestedAgents, requestedDatasets, requestDashboard, requestReports } = req.body;

    // 1. Validate email domain
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (ALLOWED_EMAIL_DOMAIN && !trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      return res.status(400).json({ error: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses are accepted` });
    }

    // 2. Load existing users
    const users = await loadUsers();

    // 3. Check if already registered
    const existing = users.find((u) => u.upn === trimmedEmail);
    if (existing && existing.isActive) {
      return res.status(409).json({ error: "This email is already registered and active. Please sign in instead." });
    }

    const now = new Date().toISOString();

    if (existing) {
      // User exists but is inactive — update their request
      existing.allowedAgents = requestedAgents || [];
      existing.allowedDatasets = requestedDatasets || [];
      existing.canAccessDashboard = !!requestDashboard;
      existing.canAccessReports = !!requestReports;
      existing.updatedAt = now;
    } else {
      // 4. Create new user record (inactive)
      users.push({
        upn: trimmedEmail,
        role: "user",
        isActive: false,
        allowedAgents: requestedAgents || [],
        allowedDatasets: requestedDatasets || [],
        canAccessDashboard: !!requestDashboard,
        canAccessReports: !!requestReports,
        type: "user",
        displayName: trimmedEmail.split("@")[0],
        objectId: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 5. Save
    await saveUsers(users);
    console.log("[ONBOARD] User created/updated:", trimmedEmail);

    // 6. Send admin notification email (non-blocking)
    try {
      await sendAdminNotification(trimmedEmail, {
        requestedAgents: requestedAgents || [],
        requestedDatasets: requestedDatasets || [],
        requestDashboard: !!requestDashboard,
        requestReports: !!requestReports,
      }, users);
    } catch (emailErr) {
      console.error("[ONBOARD] Failed to send admin email:", emailErr);
      // Don't fail the request — user record was still created
    }

    res.json({ success: true, message: "Access request submitted successfully" });
  } catch (err) {
    console.error("[ONBOARD] Error:", err);
    res.status(500).json({ error: "Failed to process access request" });
  }
});

// ──────────────────────────────────────────
// Admin notification email
// ──────────────────────────────────────────
async function sendAdminNotification(userEmail, access, users) {
  // Send notifications to the configured admin contact
  const ADMIN_CONTACT = process.env.ADMIN_CONTACT_EMAIL || "";

  // Also collect admin emails from PORTAL_ADMINS + active admins in users.json
  let adminEmails = [ADMIN_CONTACT, ...PORTAL_ADMINS].filter(Boolean);
  try {
    const fileAdmins = users
      .filter((u) => u.role === "admin" && u.isActive && u.upn)
      .map((u) => u.upn.toLowerCase());
    adminEmails = [...new Set([...adminEmails, ...fileAdmins])];
  } catch {
    // Use default list only
  }

  if (adminEmails.length === 0) {
    console.warn("[ONBOARD] No admin emails to notify");
    return;
  }

  // Map IDs to names for the email
  const agentNames = (access.requestedAgents || [])
    .map((id) => {
      const a = AGENTS.find((a) => a.id === id);
      return a ? a.name : id;
    })
    .join(", ") || "None";

  const datasetNames = (access.requestedDatasets || []).join(", ") || "None";

  const subject = `New Access Request: ${userEmail}`;

  const html = `
    <div style="font-family: 'Segoe UI', -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #00695C; color: white; padding: 20px 24px; border-radius: 4px 4px 0 0;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">New Access Request</h2>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Boroondara Enterprise Data Portal</p>
      </div>
      <div style="border: 1px solid #E1E1E1; border-top: none; padding: 24px; border-radius: 0 0 4px 4px; background: #FFFFFF;">
        <p style="margin: 0 0 16px; color: #1A1A1A; font-size: 14px;">
          A new user has requested access to the portal:
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 10px 12px; background: #F5F5F5; border: 1px solid #EDEDED; font-weight: 600; width: 160px; color: #1A1A1A;">Email</td>
            <td style="padding: 10px 12px; border: 1px solid #EDEDED; color: #1A1A1A;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; background: #F5F5F5; border: 1px solid #EDEDED; font-weight: 600; color: #1A1A1A;">Agents Requested</td>
            <td style="padding: 10px 12px; border: 1px solid #EDEDED; color: #1A1A1A;">${agentNames}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; background: #F5F5F5; border: 1px solid #EDEDED; font-weight: 600; color: #1A1A1A;">Datasets Requested</td>
            <td style="padding: 10px 12px; border: 1px solid #EDEDED; color: #1A1A1A;">${datasetNames}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; background: #F5F5F5; border: 1px solid #EDEDED; font-weight: 600; color: #1A1A1A;">Dashboard Access</td>
            <td style="padding: 10px 12px; border: 1px solid #EDEDED; color: #1A1A1A;">${access.requestDashboard ? "Requested" : "Not requested"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; background: #F5F5F5; border: 1px solid #EDEDED; font-weight: 600; color: #1A1A1A;">Reports Access</td>
            <td style="padding: 10px 12px; border: 1px solid #EDEDED; color: #1A1A1A;">${access.requestReports ? "Requested" : "Not requested"}</td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #505050; font-size: 13px; line-height: 1.5;">
          The user has been created as <strong>inactive</strong>. Please review and approve their access in the
          <a href="${process.env.PORTAL_BASE_URL || ''}/admin" style="color: #00695C; text-decoration: none; font-weight: 600;">Admin Panel</a>.
        </p>
      </div>
    </div>
  `;

  const text = [
    `New Access Request from ${userEmail}`,
    "",
    `Agents: ${agentNames}`,
    `Datasets: ${datasetNames}`,
    `Dashboard: ${access.requestDashboard ? "Yes" : "No"}`,
    `Reports: ${access.requestReports ? "Yes" : "No"}`,
    "",
    `Please review in the Admin Panel: ${process.env.PORTAL_BASE_URL || ''}/admin`,
  ].join("\n");

  await sendEmail({ to: adminEmails, subject, html, text });
}

module.exports = router;
