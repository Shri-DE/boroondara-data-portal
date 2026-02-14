// src/auth/msalConfig.ts
import { Configuration, LogLevel } from "@azure/msal-browser";

const clientId = process.env.REACT_APP_AZURE_AD_CLIENT_ID!;
const tenantId = process.env.REACT_APP_AZURE_AD_TENANT_ID!;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: `${window.location.origin}/auth`,
    postLogoutRedirectUri: window.location.origin,

    // ✅ CRITICAL: prevents redirecting back to /admin too early
    navigateToLoginRequestUrl: false,
  },

  cache: {
    // ✅ FIX: avoids MSAL cache migration crash
    cacheLocation: "sessionStorage",
    temporaryCacheLocation: "sessionStorage",
    cacheMigrationEnabled: false,

    storeAuthStateInCookie: false,
  },

  system: {
    loggerOptions: {
      logLevel: LogLevel.Info,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

// Scopes for Microsoft Graph user/group directory search (admin page)
export const graphSearchScopes = {
  scopes: ["User.Read.All", "Group.Read.All"],
};
