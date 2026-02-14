// admin/adminStore.js
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const permsFile = path.join(dataDir, "agentPerms.json");

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, "[]");
  if (!fs.existsSync(permsFile)) fs.writeFileSync(permsFile, "[]");
}

function readJson(file) {
  ensure();
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  ensure();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function listUsers() {
  return readJson(usersFile);
}

/**
 * Upsert user by UPN (case-insensitive).
 * Expected call shape:
 *   upsertUser({ upn, role, isActive })
 */
function upsertUser({ upn, role, isActive }) {
  if (!upn) throw new Error("upn is required");

  const users = listUsers();
  const now = new Date().toISOString();
  const key = String(upn).toLowerCase();

  const existing = users.find((u) => (u.upn || "").toLowerCase() === key);
  if (existing) {
    existing.role = role ?? existing.role ?? "User";
    existing.isActive =
      typeof isActive === "boolean" ? isActive : existing.isActive ?? true;
    existing.updatedAt = now;
    writeJson(usersFile, users);
    return existing;
  }

  const user = {
    upn: key,
    role: role ?? "User",
    isActive: typeof isActive === "boolean" ? isActive : true,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  writeJson(usersFile, users);
  return user;
}

function getAllPerms() {
  return readJson(permsFile);
}

function getAgentPermissions(upn) {
  const key = String(upn || "").toLowerCase();
  return getAllPerms()
    .filter((p) => (p.upn || "").toLowerCase() === key)
    .map((p) => p.agentId);
}

/**
 * Replace only the given user's permissions.
 * IMPORTANT: does NOT overwrite other users’ permissions.
 * Returns the updated list of agentIds for this user.
 */
function setAgentPermissions(upn, agentIds) {
  const key = String(upn || "").toLowerCase();
  const desired = Array.isArray(agentIds) ? agentIds : [];

  const others = getAllPerms().filter(
    (p) => (p.upn || "").toLowerCase() !== key
  );

  const next = [...others, ...desired.map((agentId) => ({ upn: key, agentId }))];

  writeJson(permsFile, next);
  return getAgentPermissions(key);
}

module.exports = {
  listUsers,
  upsertUser,
  setAgentPermissions,
  getAgentPermissions,
};
