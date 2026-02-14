// src/components/common/ProtectedRoute.tsx
import React, { useEffect, useRef } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../../auth/msalConfig";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const didAttemptLogin = useRef(false);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    // If authenticated OR MSAL has cached account, allow access
    if (isAuthenticated || accounts.length > 0) {
      if (!instance.getActiveAccount() && accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
      }
      return;
    }

    // Not authenticated and no cached accounts => login once
    if (!didAttemptLogin.current) {
      didAttemptLogin.current = true;

      const currentPath =
        window.location.pathname + window.location.search + window.location.hash;

      sessionStorage.setItem("postLoginPath", currentPath);

      instance.loginRedirect({
        ...loginRequest,
        redirectUri: `${window.location.origin}/auth`,
      });
    }
  }, [accounts, inProgress, instance, isAuthenticated]);

  if (inProgress !== InteractionStatus.None) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Loading…</h3>
        <p>Please wait.</p>
      </div>
    );
  }

  if (isAuthenticated || accounts.length > 0) {
    return <>{children}</>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h3>Redirecting to sign in…</h3>
      <p>Please wait.</p>
    </div>
  );
}
