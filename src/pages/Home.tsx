import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PrimaryButton,
  DefaultButton,
  Icon,
  mergeStyleSets,
} from "@fluentui/react";

import { useAuth } from "../hooks/useAuth";

/* ── Palette ── */
const p = {
  bg: "#FFFFFF",
  surface: "#F5F5F5",
  border: "#E1E1E1",
  borderSoft: "#EDEDED",
  text: "#1A1A1A",
  text2: "#505050",
  text3: "#707070",
  primary: "#00695C",
  accent: "#00897B",
};

/* ── Styles ── */
const s = mergeStyleSets({
  /* Page wrapper */
  page: { background: p.bg, minHeight: "100vh" },

  /* ── Mini Header ── */
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    background: p.bg,
    borderBottom: `1px solid ${p.border}`,
  },
  headerInner: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "0 24px",
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 4,
    background: p.surface,
    border: `1px solid ${p.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandEye: { color: p.text, fontWeight: 800, fontSize: 14 },
  brandSub: { fontSize: 10, color: p.text3, fontWeight: 700, letterSpacing: "1px" },
  brandTitle: { fontSize: 13, color: p.text, fontWeight: 700 },
  demoPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 999,
    background: "#FFF3E0",
    border: "1px solid #FFE0B2",
    color: "#E65100",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },

  /* ── Hero ── */
  hero: {
    position: "relative" as const,
    overflow: "hidden",
    background: p.surface,
    borderBottom: `1px solid ${p.border}`,
    padding: "56px 0 52px",
    "@media (max-width: 768px)": {
      padding: "32px 0 28px",
    },
  } as any,
  heroInner: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "0 24px",
    "@media (max-width: 768px)": {
      padding: "0 16px",
    },
  } as any,
  heroEyebrow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  eyebrowText: {
    color: p.text3,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontSize: 11,
    fontWeight: 600,
  },
  headline: {
    color: p.text,
    fontWeight: 800,
    letterSpacing: "-0.035em",
    lineHeight: "58px",
    fontSize: "46px",
    marginBottom: 20,
    maxWidth: 900,
    "@media (max-width: 768px)": {
      fontSize: "28px",
      lineHeight: "36px",
    },
  } as any,
  subtitle: {
    maxWidth: 740,
    color: p.text2,
    fontSize: 17,
    lineHeight: "29px",
    fontWeight: 400,
    marginBottom: 32,
    "@media (max-width: 768px)": {
      fontSize: 15,
      lineHeight: "24px",
    },
  } as any,
  chipRow: { display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 36 },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 16px",
    borderRadius: 999,
    background: p.bg,
    border: `1px solid ${p.borderSoft}`,
    color: p.text2,
    fontSize: 13,
    fontWeight: 500,
  },
  ctaRow: { display: "flex", flexWrap: "wrap" as const, gap: 14, marginBottom: 48 },

  /* KPI row */
  kpiRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    "@media (max-width: 768px)": {
      gap: 10,
    },
  } as any,
  kpiCard: {
    minWidth: 140,
    flex: "1 1 calc(50% - 8px)",
    "@media (min-width: 769px)": {
      flex: "1 1 calc(25% - 12px)",
      minWidth: 200,
    },
    padding: 22,
    borderRadius: 4,
    background: p.bg,
    border: `1px solid ${p.border}`,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    transition: "all 0.2s ease",
    selectors: { "&:hover": { transform: "translateY(-2px)", background: "#FAFAFA" } },
  },
  kpiLabel: {
    color: p.text3,
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    marginBottom: 10,
  },
  kpiValue: {
    color: p.text,
    fontWeight: 700,
    fontSize: 28,
    lineHeight: "36px",
    letterSpacing: "-0.02em",
    marginBottom: 6,
  },
  kpiHint: { color: p.text3, fontSize: 12, lineHeight: "18px" },

  /* ── Capabilities Section ── */
  section: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "48px 24px 0",
    "@media (max-width: 768px)": {
      padding: "32px 16px 0",
    },
  } as any,
  sectionTitle: {
    color: p.text,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    fontSize: 24,
    lineHeight: "32px",
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: p.text2,
    fontSize: 14,
    lineHeight: "22px",
    marginBottom: 6,
  },
  divider: { height: 1, background: p.borderSoft, marginBottom: 24 },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 18,
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: 12,
    },
  } as any,
  card: {
    borderRadius: 4,
    padding: 28,
    minHeight: 160,
    background: p.bg,
    border: `1px solid ${p.borderSoft}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    transition: "all 0.18s ease",
    cursor: "default",
    display: "flex",
    flexDirection: "column" as const,
    selectors: {
      "&:hover": {
        transform: "translateY(-4px)",
        borderColor: "#D0D0D0",
        background: p.surface,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  cardTitle: {
    color: p.text,
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: "-0.01em",
    lineHeight: "24px",
    marginBottom: 8,
  },
  cardBody: {
    color: p.text2,
    fontSize: 14,
    lineHeight: "23px",
    flex: 1,
  },
  cardTag: {
    marginTop: 14,
    fontSize: 11,
    color: p.text3,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },

  /* ── Security Section ── */
  securityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: 12,
    },
  } as any,
  secCard: {
    borderRadius: 4,
    padding: 24,
    background: p.bg,
    border: `1px solid ${p.borderSoft}`,
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    transition: "all 0.18s ease",
    selectors: {
      "&:hover": {
        borderColor: "#D0D0D0",
        background: p.surface,
      },
    },
  },
  secIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#EDE7F6",
    border: "1px solid rgba(106,90,205,0.22)",
    flexShrink: 0,
  },
  secTitle: {
    color: p.text,
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 4,
  },
  secBody: {
    color: p.text2,
    fontSize: 13,
    lineHeight: "20px",
  },

  /* ── CTA Footer ── */
  ctaFooter: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "56px 24px 64px",
    textAlign: "center" as const,
    "@media (max-width: 768px)": {
      padding: "40px 16px 48px",
    },
  } as any,
  ctaFooterTitle: {
    color: p.text,
    fontWeight: 800,
    fontSize: 28,
    letterSpacing: "-0.02em",
    marginBottom: 12,
  },
  ctaFooterSub: {
    color: p.text2,
    fontSize: 15,
    lineHeight: "24px",
    marginBottom: 28,
    maxWidth: 560,
    margin: "0 auto 28px",
  },
  ctaFooterBtns: {
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap" as const,
  },
  signInLink: {
    color: p.primary,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    background: "none",
    border: "none",
    textDecoration: "underline",
    fontFamily: "inherit",
    marginTop: 12,
  },
});

/* ── Capability cards data ── */
const capabilities = [
  {
    icon: "ChatBot",
    iconBg: "#E8F0FE",
    iconBorder: "rgba(0,120,212,0.24)",
    iconColor: "#00695C",
    title: "AI Domain Agents",
    body: "Conversational agents for Finance, Assets, Planning and more. Ask questions in natural language and get structured answers backed by live data.",
    tag: "Live",
  },
  {
    icon: "Database",
    iconBg: "#E8F0FE",
    iconBorder: "rgba(0,103,184,0.24)",
    iconColor: "#00897B",
    title: "Self-Serve Datasets",
    body: "Discover, explore and request access to governed datasets across the organisation. Browse tables, preview data and export to CSV.",
    tag: "Live",
  },
  {
    icon: "BarChart4",
    iconBg: "#E8F5E9",
    iconBorder: "rgba(16,124,16,0.24)",
    iconColor: "#107C10",
    title: "Real-Time Dashboards",
    body: "Interactive dashboards powered by live data feeds. Monitor key metrics, track trends and drill into details across all domains.",
    tag: "Live",
  },
  {
    icon: "ReportDocument",
    iconBg: "#FFF8E1",
    iconBorder: "rgba(154,123,0,0.24)",
    iconColor: "#9A7B00",
    title: "Report Builder",
    body: "Build custom reports from any dataset. Select columns, apply grouping, aggregation and filters then export results to CSV.",
    tag: "Live",
  },
  {
    icon: "Globe",
    iconBg: "#FCE4EC",
    iconBorder: "rgba(194,24,91,0.24)",
    iconColor: "#C2185B",
    title: "Geospatial Explorer",
    body: "Map-based exploration of spatial datasets including asset locations, infrastructure overlays, zoning and community boundaries.",
    tag: "Coming Soon",
  },
  {
    icon: "Shield",
    iconBg: "#EDE7F6",
    iconBorder: "rgba(106,90,205,0.22)",
    iconColor: "#6A5ACD",
    title: "Governance & Security",
    body: "Enterprise-grade access controls with Azure AD, data classification, audit trails and role-based permissions across all portal capabilities.",
    tag: "Active",
  },
];

/* ── Security items ── */
const securityItems = [
  {
    icon: "AADLogo",
    title: "Azure AD Integration",
    body: "Single sign-on via Azure Active Directory (Entra ID). All portal access is authenticated and identity-verified through your organisation's directory.",
  },
  {
    icon: "Lock",
    title: "Role-Based Access Control",
    body: "Granular permissions at the agent, dataset, dashboard and report level. Admins approve or reject every access request individually.",
  },
  {
    icon: "DocumentSet",
    title: "Data Classification",
    body: "Every dataset is tagged with classification levels and ownership metadata. Access controls are enforced according to data sensitivity.",
  },
  {
    icon: "ComplianceAudit",
    title: "Audit & Compliance",
    body: "Full audit logging of user activity, data access and permission changes. Built for regulatory compliance and internal governance reviews.",
  },
];

/* ── Button styles ── */
const primaryBtnStyles = {
  root: {
    height: 48,
    borderRadius: 4,
    padding: "0 28px",
    background: p.primary,
    border: "none",
    color: "#FFFFFF",
    fontWeight: 700 as const,
    fontSize: 15,
  },
  rootHovered: { background: "#004578", color: "#FFFFFF" },
};

const secondaryBtnStyles = {
  root: {
    height: 48,
    borderRadius: 4,
    padding: "0 28px",
    background: p.bg,
    color: p.text,
    border: `1px solid ${p.border}`,
    fontWeight: 600 as const,
    fontSize: 15,
  },
  rootHovered: { background: p.surface, border: `1px solid #D0D0D0` },
};

/* ──────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  return (
    <div className={s.page}>
      {/* ── Mini Header ── */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.brandRow} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className={s.brandMark}>
              <span className={s.brandEye}>B</span>
            </div>
            <div>
              <div className={s.brandSub}>BOROONDARA</div>
              <div className={s.brandTitle}>Enterprise Data Portal</div>
            </div>
          </div>

          <div className={s.headerRight}>
            <span className={s.demoPill}>
              <Icon iconName="TestBeaker" styles={{ root: { fontSize: 12 } }} />
              Demo
            </span>
            {isAuthenticated ? (
              <DefaultButton
                text="Go to Portal"
                onClick={() => navigate("/chat")}
                styles={{
                  root: {
                    borderRadius: 4,
                    border: `1px solid ${p.border}`,
                    background: p.surface,
                    color: p.text,
                    fontSize: 13,
                    fontWeight: 600,
                    height: 34,
                    padding: "0 16px",
                  },
                  rootHovered: { background: p.borderSoft },
                }}
              />
            ) : (
              <DefaultButton
                text="Sign In"
                onClick={login}
                styles={{
                  root: {
                    borderRadius: 4,
                    border: `1px solid ${p.border}`,
                    background: p.surface,
                    color: p.text,
                    fontSize: 13,
                    fontWeight: 600,
                    height: 34,
                    padding: "0 16px",
                  },
                  rootHovered: { background: p.borderSoft },
                }}
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroEyebrow}>
            <span className={s.eyebrowText}>BOROONDARA — DEMO</span>
            <span className={s.demoPill} style={{ fontSize: 10 }}>
              <Icon iconName="TestBeaker" styles={{ root: { fontSize: 10 } }} />
              Preview Environment
            </span>
          </div>

          <div className={s.headline}>
            Your single pane of glass for enterprise data
          </div>
          <div className={s.subtitle}>
            A unified, secure portal for discovering and interacting with enterprise data.
            Access AI-powered domain agents, self-serve datasets, real-time dashboards,
            custom reports, geospatial layers and governed analytics — all in one place.
          </div>

          {/* Security chips */}
          <div className={s.chipRow}>
            <span className={s.chip}>
              <Icon iconName="AADLogo" styles={{ root: { color: p.primary, fontSize: 14 } }} />
              Azure AD Secured
            </span>
            <span className={s.chip}>
              <Icon iconName="Lock" styles={{ root: { color: "#6A5ACD", fontSize: 14 } }} />
              Role-Based Access
            </span>
            <span className={s.chip}>
              <Icon iconName="Shield" styles={{ root: { color: "#107C10", fontSize: 14 } }} />
              Data Governance
            </span>
            <span className={s.chip}>
              <Icon iconName="EnterpriseLogo" styles={{ root: { color: "#9A7B00", fontSize: 14 } }} />
              Enterprise-Grade
            </span>
          </div>

          {/* CTAs */}
          <div className={s.ctaRow}>
            <PrimaryButton
              text="Get Started"
              onClick={() => navigate("/onboard")}
              styles={primaryBtnStyles}
            />
            {isAuthenticated ? (
              <DefaultButton
                text="Go to Portal"
                onClick={() => navigate("/chat")}
                styles={secondaryBtnStyles}
              />
            ) : (
              <DefaultButton
                text="Sign In"
                onClick={login}
                styles={secondaryBtnStyles}
              />
            )}
          </div>

          {/* KPI row */}
          <div className={s.kpiRow}>
            <div className={s.kpiCard}>
              <div className={s.kpiLabel}>Capabilities</div>
              <div className={s.kpiValue}>6</div>
              <div className={s.kpiHint}>Agents, Datasets, Dashboards, Reports, Geo, Governance</div>
            </div>
            <div className={s.kpiCard}>
              <div className={s.kpiLabel}>AI Agents</div>
              <div className={s.kpiValue}>2+</div>
              <div className={s.kpiHint}>Finance & Asset Management live</div>
            </div>
            <div className={s.kpiCard}>
              <div className={s.kpiLabel}>Data Domains</div>
              <div className={s.kpiValue}>5+</div>
              <div className={s.kpiHint}>Finance, Assets, Projects, Payroll, AP/AR</div>
            </div>
            <div className={s.kpiCard}>
              <div className={s.kpiLabel}>Security</div>
              <div className={s.kpiValue}>Enterprise</div>
              <div className={s.kpiHint}>Azure AD, RBAC, audit logging</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <div className={s.section}>
        <div className={s.sectionTitle}>Portal Capabilities</div>
        <div className={s.sectionSubtitle}>
          Everything you need to discover, explore and act on enterprise data.
        </div>
        <div className={s.divider} />

        <div className={s.cardsGrid}>
          {capabilities.map((cap) => (
            <div key={cap.title} className={s.card}>
              <div
                className={s.cardIconWrap}
                style={{ background: cap.iconBg, border: `1px solid ${cap.iconBorder}` }}
              >
                <Icon iconName={cap.icon} styles={{ root: { color: cap.iconColor, fontSize: 20 } }} />
              </div>
              <div className={s.cardTitle}>{cap.title}</div>
              <div className={s.cardBody}>{cap.body}</div>
              <div className={s.cardTag}>{cap.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Security & Governance ── */}
      <div className={s.section} style={{ paddingBottom: 0 }}>
        <div className={s.sectionTitle}>Security & Governance</div>
        <div className={s.sectionSubtitle}>
          Enterprise-grade security built into every layer of the platform.
        </div>
        <div className={s.divider} />

        <div className={s.securityGrid}>
          {securityItems.map((item) => (
            <div key={item.title} className={s.secCard}>
              <div className={s.secIconWrap}>
                <Icon iconName={item.icon} styles={{ root: { color: "#6A5ACD", fontSize: 18 } }} />
              </div>
              <div>
                <div className={s.secTitle}>{item.title}</div>
                <div className={s.secBody}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Footer ── */}
      <div className={s.ctaFooter}>
        <div className={s.ctaFooterTitle}>Ready to explore your data?</div>
        <div className={s.ctaFooterSub}>
          Request access to the portal in minutes. Choose the agents, datasets and capabilities
          you need, and an administrator will review your request.
        </div>
        <div className={s.ctaFooterBtns}>
          <PrimaryButton
            text="Get Started"
            onClick={() => navigate("/onboard")}
            styles={primaryBtnStyles}
          />
        </div>
        {!isAuthenticated && (
          <button className={s.signInLink} onClick={login}>
            Already have access? Sign in
          </button>
        )}
        {isAuthenticated && (
          <button className={s.signInLink} onClick={() => navigate("/chat")}>
            Already signed in? Go to portal
          </button>
        )}
      </div>
    </div>
  );
}
