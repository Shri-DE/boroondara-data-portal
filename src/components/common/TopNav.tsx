import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Text,
  DefaultButton,
  Persona,
  PersonaSize,
  Icon,
} from "@fluentui/react";

import { useAuth } from "../../hooks/useAuth";
import { accessService } from "../../services/accessService";

type Props = { show?: boolean };

type NavItem = {
  key: string;
  label: string;
  path: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { key: "chat", label: "Chat", path: "/chat" },
  { key: "datasets", label: "Datasets", path: "/datasets" },
  { key: "dashboards", label: "Dashboards", path: "/dashboards" },
  { key: "reports", label: "Reports", path: "/reports" },
  { key: "geospatial", label: "Geospatial", path: "/geospatial" },
  { key: "abs", label: "Boroondara ABS", path: "/abs" },
  { key: "admin", label: "Admin", path: "/admin", adminOnly: true },
];

export default function TopNav({ show = true }: Props) {
  const nav = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [canAccessDashboard, setCanAccessDashboard] = useState(true);
  const [canAccessReports, setCanAccessReports] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Probe admin status
      try {
        await accessService.get("/admin/users");
        if (alive) setIsAdmin(true);
      } catch (e: any) {
        if (!alive) return;
        if (e?.response?.status === 403) setIsAdmin(false);
      }

      // Fetch user profile for page access flags
      try {
        const res = await accessService.get<{
          role?: string;
          canAccessDashboard?: boolean;
          canAccessReports?: boolean;
        }>("/me");
        if (!alive) return;
        const d = res.data;
        if (d.role === "admin") {
          setCanAccessDashboard(true);
          setCanAccessReports(true);
        } else {
          setCanAccessDashboard(d.canAccessDashboard !== false);
          setCanAccessReports(d.canAccessReports !== false);
        }
      } catch {
        // Default to showing all if /api/me fails
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const upn =
    (user as any)?.upn ||
    (user as any)?.email ||
    (user as any)?.username ||
    "";

  const visibleItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.key === "dashboards" && !canAccessDashboard) return false;
        if (item.key === "reports" && !canAccessReports) return false;
        return true;
      }),
    [isAdmin, canAccessDashboard, canAccessReports]
  );

  // Determine active nav item
  const activeKey = useMemo(() => {
    const path = location.pathname;
    if (path === "/chat") return "chat";
    // Match /agents, /agents/:id etc
    const match = visibleItems.find(
      (item) => item.path !== "/" && path.startsWith(item.path)
    );
    return match?.key || "home";
  }, [location.pathname, visibleItems]);

  if (!show) return null;

  return (
    <>
      <style>{`
        .topnav-outer { position: sticky; top: 0; z-index: 50; background: #FFFFFF; border-bottom: 1px solid #E1E1E1; }
        .topnav-inner { max-width: 1240px; margin: 0 auto; display: flex; align-items: center; padding: 0 16px; height: 52px; }
        .topnav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0; flex-shrink: 0; }
        .topnav-brand-mark { width: 32px; height: 32px; border-radius: 4px; background: #F5F5F5; border: 1px solid #E1E1E1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .topnav-brand-text { display: flex; flex-direction: column; }
        .topnav-links { flex: 1; display: flex; align-items: center; gap: 2px; margin-left: 16px; overflow-x: auto; }
        .topnav-link { background: transparent; border: none; border-radius: 4px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.12s ease; font-family: inherit; white-space: nowrap; color: #505050; }
        .topnav-link:hover { background: #F5F5F5; color: #1A1A1A; }
        .topnav-link-active { background: #E0F2F1; color: #00695C; font-weight: 600; }
        .topnav-link-active:hover { background: #E0F2F1; color: #00695C; }
        .topnav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: 12px; }
        .topnav-hamburger { display: none; background: none; border: 1px solid #E1E1E1; border-radius: 4px; width: 36px; height: 36px; cursor: pointer; align-items: center; justify-content: center; color: #1A1A1A; }
        .topnav-mobile-overlay { display: none; position: fixed; top: 52px; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 49; }
        .topnav-mobile-menu { display: none; position: fixed; top: 52px; left: 0; right: 0; background: #FFFFFF; border-bottom: 1px solid #E1E1E1; z-index: 50; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: calc(100vh - 52px); overflow-y: auto; }
        .topnav-mobile-link { display: flex; align-items: center; padding: 12px 16px; border-radius: 4px; font-size: 15px; font-weight: 500; cursor: pointer; color: #505050; border: none; background: none; width: 100%; text-align: left; font-family: inherit; }
        .topnav-mobile-link:hover { background: #F5F5F5; }
        .topnav-mobile-link-active { background: #E0F2F1; color: #00695C; font-weight: 600; }
        .topnav-mobile-user { padding: 12px 16px; border-top: 1px solid #EDEDED; margin-top: 4px; display: flex; align-items: center; justify-content: space-between; }

        @media (max-width: 768px) {
          .topnav-links { display: none; }
          .topnav-right .topnav-persona { display: none; }
          .topnav-right .topnav-signout { display: none; }
          .topnav-hamburger { display: flex; }
          .topnav-mobile-overlay.open { display: block; }
          .topnav-mobile-menu.open { display: block; }
          .topnav-brand-text .topnav-brand-sub { display: none; }
        }
      `}</style>

      <div className="topnav-outer">
        <div className="topnav-inner">
          {/* Brand */}
          <div className="topnav-brand" onClick={() => nav("/")}>
            <div className="topnav-brand-mark">
              <Text styles={{ root: { fontWeight: 800, color: "#00695C", fontSize: 14 } }}>B</Text>
            </div>
            <div className="topnav-brand-text">
              <Text
                className="topnav-brand-sub"
                styles={{
                  root: { fontSize: 10, color: "#707070", fontWeight: 700, letterSpacing: "1px" },
                }}
              >
                BOROONDARA
              </Text>
              <Text styles={{ root: { fontSize: 13, color: "#1A1A1A", fontWeight: 700 } }}>
                Enterprise Data Portal
              </Text>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="topnav-links">
            {visibleItems.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => nav(item.path)}
                  className={`topnav-link ${isActive ? "topnav-link-active" : ""}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="topnav-right">
            <div className="topnav-persona">
              <Persona
                text={upn || "Signed in"}
                secondaryText={upn ? "Entra ID" : ""}
                size={PersonaSize.size32}
                styles={{
                  root: { color: "#1A1A1A" },
                  primaryText: { color: "#1A1A1A", fontSize: 12 },
                  secondaryText: { color: "#707070", fontSize: 11 },
                }}
              />
            </div>

            <DefaultButton
              className="topnav-signout"
              text="Sign out"
              onClick={logout}
              styles={{
                root: {
                  borderRadius: 4,
                  border: "1px solid #E1E1E1",
                  background: "#F5F5F5",
                  color: "#1A1A1A",
                  fontSize: 12,
                  height: 32,
                  padding: "0 14px",
                },
                rootHovered: { background: "#EDEDED" },
              }}
            />

            {/* Hamburger (mobile only) */}
            <button
              className="topnav-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <Icon iconName={mobileOpen ? "Cancel" : "GlobalNavButton"} style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`topnav-mobile-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile menu */}
      <div className={`topnav-mobile-menu ${mobileOpen ? "open" : ""}`}>
        {visibleItems.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { nav(item.path); setMobileOpen(false); }}
              className={`topnav-mobile-link ${isActive ? "topnav-mobile-link-active" : ""}`}
            >
              {item.label}
            </button>
          );
        })}
        <div className="topnav-mobile-user">
          <Persona
            text={upn || "Signed in"}
            secondaryText={upn ? "Entra ID" : ""}
            size={PersonaSize.size24}
            styles={{
              root: { color: "#1A1A1A" },
              primaryText: { color: "#1A1A1A", fontSize: 12 },
              secondaryText: { color: "#707070", fontSize: 11 },
            }}
          />
          <DefaultButton
            text="Sign out"
            onClick={() => { logout(); setMobileOpen(false); }}
            styles={{
              root: {
                borderRadius: 4,
                border: "1px solid #E1E1E1",
                background: "#F5F5F5",
                color: "#1A1A1A",
                fontSize: 12,
                height: 32,
                padding: "0 14px",
              },
              rootHovered: { background: "#EDEDED" },
            }}
          />
        </div>
      </div>
    </>
  );
}
