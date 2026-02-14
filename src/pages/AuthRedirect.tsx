// src/pages/AuthRedirect.tsx
import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

export default function AuthRedirect() {
  const { instance } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await instance.handleRedirectPromise();

        if (result?.account) {
          instance.setActiveAccount(result.account);
        } else {
          const accounts = instance.getAllAccounts();
          if (accounts.length > 0) {
            instance.setActiveAccount(accounts[0]);
          }
        }

        if (!cancelled) {
          const target = sessionStorage.getItem("postLoginPath") || "/chat";
          sessionStorage.removeItem("postLoginPath");
          navigate(target, { replace: true });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("AuthRedirect handleRedirectPromise failed:", e);
        if (!cancelled) navigate("/", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [instance, navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h3>Signing you in…</h3>
      <p>Please wait.</p>
    </div>
  );
}

// ✅ Ensures TS treats this as a module under isolatedModules in any edge case
export {};
