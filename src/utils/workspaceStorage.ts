import type { Message } from "../types/agent.types";
import type { WorkspaceSession } from "../components/chat/WorkspaceSidebar";

const STORAGE_KEY = "edp_workspace_sessions";
const MESSAGES_KEY_PREFIX = "edp_messages_";
const MAX_SESSIONS = 50;

/** Load session list from localStorage */
export function loadSessions(): WorkspaceSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Save session list to localStorage */
export function saveSessions(sessions: WorkspaceSession[]): void {
  try {
    // Keep only the most recent N sessions
    const trimmed = sessions.slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save sessions:", e);
  }
}

/** Load messages for a session */
export function loadMessages(sessionId: string): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY_PREFIX + sessionId);
    if (!raw) return [];
    const msgs = JSON.parse(raw);
    // Rehydrate Date objects
    return msgs.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

/** Save messages for a session */
export function saveMessages(sessionId: string, messages: Message[]): void {
  try {
    localStorage.setItem(MESSAGES_KEY_PREFIX + sessionId, JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save messages:", e);
  }
}

/** Delete a session and its messages */
export function deleteSession(sessionId: string): void {
  try {
    localStorage.removeItem(MESSAGES_KEY_PREFIX + sessionId);
    const sessions = loadSessions().filter((s) => s.id !== sessionId);
    saveSessions(sessions);
  } catch (e) {
    console.error("Failed to delete session:", e);
  }
}

/** Create or update a session entry */
export function upsertSession(session: WorkspaceSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  // Sort by lastActivity descending
  sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  saveSessions(sessions);
}

/** Generate a title from the first user message */
export function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const text = firstUser.content.trim();
  if (text.length <= 50) return text;
  return text.slice(0, 47) + "...";
}
