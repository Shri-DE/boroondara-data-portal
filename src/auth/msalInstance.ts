// src/auth/msalInstance.ts
import {
  EventType,
  PublicClientApplication,
  AuthenticationResult,
} from "@azure/msal-browser";
import { msalConfig } from "./msalConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

// ✅ A single shared initialization promise for the entire app
let initPromise: Promise<void> | null = null;

export function ensureMsalInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = msalInstance.initialize();
  }
  return initPromise;
}

// ✅ Always set active account on successful login/token
msalInstance.addEventCallback((event) => {
  if (
    (event.eventType === EventType.LOGIN_SUCCESS ||
      event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
    event.payload
  ) {
    const result = event.payload as AuthenticationResult;
    if (result.account) {
      msalInstance.setActiveAccount(result.account);
    }
  }
});
