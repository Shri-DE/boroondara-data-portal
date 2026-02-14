// src/services/accessService.ts
import axios from "axios";
import { ensureMsalInitialized, msalInstance } from "../auth/msalInstance";
import { authService } from "./authService";

// In production, CRA env vars may not be present unless set during build.
// Default to same-origin /api so Azure works out-of-the-box.
const apiBaseUrl =
  (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim()) ||
  "/api";

export const accessService = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

accessService.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};

  // Bearer token (future: validate on server)
  const token = await authService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Local dev helper header for server-side auth
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  if (isLocal) {
    await ensureMsalInitialized();

    const account =
      msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

    const upnRaw = (account?.username || "").trim();
    const upn = upnRaw.toLowerCase();

    if (upn) {
      config.headers["x-user-upn"] = upn;
    }
  }

  return config;
});
