// src/pages/AdminDebug.tsx
import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";

export default function AdminDebug() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const active = instance.getActiveAccount();

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin</h2>
      <p>If you can see this, routing + auth gate is working.</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd" }}>
        <div>
          <b>inProgress:</b> {String(inProgress)}
        </div>
        <div>
          <b>useIsAuthenticated():</b> {String(isAuthenticated)}
        </div>
        <div>
          <b>accounts.length:</b> {accounts?.length ?? 0}
        </div>
        <div>
          <b>activeAccount:</b> {active ? active.username : "null"}
        </div>
      </div>

      <button
        style={{ marginTop: 16 }}
        onClick={() =>
          instance.logoutRedirect({
            postLogoutRedirectUri: window.location.origin,
          })
        }
      >
        Logout
      </button>
    </div>
  );
}
