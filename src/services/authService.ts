// src/services/authService.ts
import {
  InteractionRequiredAuthError,
  SilentRequest,
} from "@azure/msal-browser";
import { msalInstance, ensureMsalInitialized } from "../auth/msalInstance";
import { loginRequest } from "../auth/msalConfig";

class AuthService {
  /**
   * Login via redirect (always returns after navigation)
   */
  async login(): Promise<void> {
    await ensureMsalInitialized();

    await msalInstance.loginRedirect({
      ...loginRequest,
      redirectUri: `${window.location.origin}/auth`,
    });
  }

  /**
   * Logout via redirect
   */
  async logout(): Promise<void> {
    await ensureMsalInitialized();

    await msalInstance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  }

  /**
   * Acquire an access token for calling your API.
   * - Uses silent token acquisition when possible
   * - Falls back to redirect if user interaction is required
   *
   * NOTE: If you haven't configured API scopes yet, this will return an ID-token-like token
   * only if scopes are valid. For real API calls, use an API scope like:
   *   api://<api-client-id>/access_as_user
   */
  async getAccessToken(scopes?: string[]): Promise<string | null> {
    await ensureMsalInitialized();

    const account =
      msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

    if (!account) {
      // Not logged in yet
      return null;
    }

    const silentRequest: SilentRequest = {
      account,
      scopes: scopes && scopes.length > 0 ? scopes : loginRequest.scopes,
    };

    try {
      const result = await msalInstance.acquireTokenSilent(silentRequest);
      return result.accessToken || null;
    } catch (e) {
      // If MSAL requires interaction (consent, MFA, etc.), fall back to redirect
      if (e instanceof InteractionRequiredAuthError) {
        await msalInstance.acquireTokenRedirect({
          ...silentRequest,
          redirectUri: `${window.location.origin}/auth`,
        });
        return null; // Redirect will occur
      }

      // Unexpected error
      // eslint-disable-next-line no-console
      console.error("getAccessToken failed:", e);
      return null;
    }
  }

  /**
   * ---- Role helpers ----
   * Keep your existing implementation here.
   * For now, these are safe placeholders.
   */
  getUserRoles(): string[] {
    // TODO: implement based on ID token claims or your API response
    return [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some((r) => userRoles.includes(r));
  }
}

export const authService = new AuthService();
