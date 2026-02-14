// src/services/graphService.ts
// Microsoft Graph API service for searching Azure AD users and security groups.
import {
  InteractionRequiredAuthError,
} from "@azure/msal-browser";
import { ensureMsalInitialized, msalInstance } from "../auth/msalInstance";
import { graphSearchScopes } from "../auth/msalConfig";

/* ---------- Types ---------- */

export interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string | null;
  jobTitle: string | null;
  department: string | null;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description: string | null;
  mail: string | null;
  securityEnabled: boolean;
}

export type GraphSearchResult =
  | { type: "user"; data: GraphUser }
  | { type: "group"; data: GraphGroup };

/* ---------- Service ---------- */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

class GraphService {
  /** Acquire an access token scoped to Microsoft Graph. */
  private async getGraphToken(): Promise<string> {
    await ensureMsalInitialized();
    const account =
      msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
    if (!account) throw new Error("No authenticated account");

    try {
      const result = await msalInstance.acquireTokenSilent({
        account,
        scopes: graphSearchScopes.scopes,
      });
      return result.accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        // Admin consent may not have been granted yet — trigger redirect
        await msalInstance.acquireTokenRedirect({
          account,
          scopes: graphSearchScopes.scopes,
          redirectUri: `${window.location.origin}/auth`,
        });
        throw new Error("Redirecting for consent…");
      }
      throw e;
    }
  }

  /** Search Azure AD users by display name, email, or UPN. */
  async searchUsers(query: string): Promise<GraphUser[]> {
    if (!query || query.length < 2) return [];

    const token = await this.getGraphToken();
    const escaped = query.replace(/'/g, "''"); // OData single-quote escape

    const filter = [
      `startsWith(displayName,'${escaped}')`,
      `startsWith(mail,'${escaped}')`,
      `startsWith(userPrincipalName,'${escaped}')`,
    ].join(" or ");

    const select =
      "id,displayName,userPrincipalName,mail,jobTitle,department";

    const url =
      `${GRAPH_BASE}/users` +
      `?$filter=${encodeURIComponent(filter)}` +
      `&$select=${select}` +
      `&$top=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        ConsistencyLevel: "eventual",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Graph user search failed:", res.status, err);
      throw new Error(
        (err as any)?.error?.message || `Graph API error ${res.status}`
      );
    }

    const data = await res.json();
    const users = (data.value ?? []) as GraphUser[];
    // Sort client-side (Graph doesn't support $orderby with $filter on these fields)
    users.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return users;
  }

  /** Search Azure AD security groups by display name. */
  async searchGroups(query: string): Promise<GraphGroup[]> {
    if (!query || query.length < 2) return [];

    const token = await this.getGraphToken();
    const escaped = query.replace(/'/g, "''");

    const filter = `startsWith(displayName,'${escaped}') and securityEnabled eq true`;
    const select = "id,displayName,description,mail,securityEnabled";

    const url =
      `${GRAPH_BASE}/groups` +
      `?$filter=${encodeURIComponent(filter)}` +
      `&$select=${select}` +
      `&$top=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        ConsistencyLevel: "eventual",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Graph group search failed:", res.status, err);
      throw new Error(
        (err as any)?.error?.message || `Graph API error ${res.status}`
      );
    }

    const data = await res.json();
    const groups = (data.value ?? []) as GraphGroup[];
    groups.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return groups;
  }

  /**
   * Combined search returning both users and groups.
   * @param type  "user" | "group" | "all"
   */
  async search(
    query: string,
    type: "user" | "group" | "all" = "all"
  ): Promise<GraphSearchResult[]> {
    const results: GraphSearchResult[] = [];

    const promises: Promise<void>[] = [];

    if (type === "user" || type === "all") {
      promises.push(
        this.searchUsers(query).then((users) => {
          results.push(
            ...users.map((u) => ({ type: "user" as const, data: u }))
          );
        })
      );
    }

    if (type === "group" || type === "all") {
      promises.push(
        this.searchGroups(query).then((groups) => {
          results.push(
            ...groups.map((g) => ({ type: "group" as const, data: g }))
          );
        })
      );
    }

    await Promise.all(promises);
    return results;
  }
}

export const graphService = new GraphService();
