import { Configuration, LogLevel } from '@azure/msal-browser';

/**
 * Azure Entra ID (Azure AD) Authentication Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Register app in Azure Portal > Entra ID > App Registrations
 * 2. Copy the Application (client) ID
 * 3. Copy the Directory (tenant) ID
 * 4. Add redirect URI: http://localhost:3000 (dev) and your production URL
 * 5. Enable ID tokens in Authentication settings
 * 6. Create app roles (Agent.Finance.User, Agent.Asset.User, etc.)
 */

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_ENTRA_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID || 'YOUR_TENANT_ID_HERE'}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000',
    postLogoutRedirectUri: process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security
    storeAuthStateInCookie: false, // Set to true for IE 11 support
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

/**
 * Scopes for Microsoft Graph API
 */
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

/**
 * Agent-specific scopes (roles)
 * These must match the app roles created in Azure AD
 */
export const agentScopes = {
  finance: 'Agent.Finance.User',
  asset: 'Agent.Asset.User',
  customerService: 'Agent.CustomerService.User',
  hr: 'Agent.HR.User',
  planning: 'Agent.Planning.User',
  compliance: 'Agent.Compliance.User',
  admin: 'Agent.Admin',
  auditor: 'Agent.Auditor',
};

/**
 * API scopes for backend access
 */
export const apiRequest = {
  scopes: [`api://${process.env.REACT_APP_ENTRA_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'}/Agent.Access`],
};
