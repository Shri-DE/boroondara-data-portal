import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PrimaryButton,
  DefaultButton,
  TextField,
  Dropdown,
  Toggle,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Icon,
  mergeStyleSets,
} from "@fluentui/react";
import type { IDropdownOption } from "@fluentui/react";

/* ── Palette ── */
const p = {
  bg: "#FFFFFF",
  surface: "#F5F5F5",
  border: "#E1E1E1",
  borderSoft: "#EDEDED",
  text: "#1A1A1A",
  text2: "#505050",
  text3: "#707070",
  primary: "#0078D4",
};

/* ── Styles ── */
const s = mergeStyleSets({
  page: { background: p.bg, minHeight: "100vh" },

  /* Header */
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
  backLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: p.text2,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    background: "none",
    border: "none",
    fontFamily: "inherit",
  },

  /* Content */
  content: {
    maxWidth: 620,
    margin: "0 auto",
    padding: "40px 24px 80px",
    "@media (max-width: 768px)": {
      padding: "24px 16px 60px",
    },
  } as any,
  title: {
    color: p.text,
    fontWeight: 800,
    fontSize: 28,
    letterSpacing: "-0.02em",
    marginBottom: 8,
    "@media (max-width: 768px)": {
      fontSize: 22,
    },
  } as any,
  subtitle: {
    color: p.text2,
    fontSize: 15,
    lineHeight: "24px",
    marginBottom: 32,
  },

  /* Step indicator */
  stepRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepDotActive: {
    background: p.primary,
    color: "#FFFFFF",
  },
  stepDotDone: {
    background: "#107C10",
    color: "#FFFFFF",
  },
  stepDotPending: {
    background: p.surface,
    color: p.text3,
    border: `1px solid ${p.border}`,
  },
  stepLine: {
    flex: 1,
    height: 2,
    margin: "0 8px",
  },
  stepLineActive: { background: p.primary },
  stepLinePending: { background: p.borderSoft },

  /* Card */
  card: {
    borderRadius: 4,
    padding: 32,
    background: p.bg,
    "@media (max-width: 768px)": {
      padding: 20,
    },
    border: `1px solid ${p.border}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    color: p.text,
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 6,
  },
  cardSub: {
    color: p.text2,
    fontSize: 13,
    lineHeight: "20px",
    marginBottom: 24,
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    color: p.text,
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 6,
  },
  btnRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 28,
  },

  /* Success */
  successWrap: {
    textAlign: "center" as const,
    padding: "24px 0",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#E8F5E9",
    border: "1px solid rgba(16,124,16,0.24)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    color: p.text,
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 8,
  },
  successBody: {
    color: p.text2,
    fontSize: 14,
    lineHeight: "22px",
    marginBottom: 28,
    maxWidth: 420,
    margin: "0 auto 28px",
  },
});

/* ── Types ── */
type Agent = { id: string; name: string; description: string };
type Dataset = { id: string; department: string; description: string };

/* ──────────────────────────────────────────────── */
export default function Onboard() {
  const navigate = useNavigate();

  /* Step state */
  const [step, setStep] = useState(1);

  /* Step 1 — Email */
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  /* Step 2 — Access selection */
  const [agents, setAgents] = useState<Agent[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [wantDashboard, setWantDashboard] = useState(false);
  const [wantReports, setWantReports] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* Load agents and datasets when step 2 is reached */
  useEffect(() => {
    if (step !== 2) return;
    let alive = true;
    (async () => {
      try {
        const [agRes, dsRes] = await Promise.all([
          axios.get<Agent[]>("/api/onboard/agents"),
          axios.get<Dataset[]>("/api/onboard/datasets"),
        ]);
        if (!alive) return;
        setAgents(agRes.data);
        setDatasets(dsRes.data);
      } catch (err) {
        console.error("[ONBOARD] Failed to load options:", err);
      }
    })();
    return () => { alive = false; };
  }, [step]);

  /* ── Validation helpers ── */
  const validateEmail = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    if (!trimmed.endsWith("@boroondara.vic.gov.au")) {
      setEmailError("Only @boroondara.vic.gov.au email addresses are accepted.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleContinue = () => {
    if (validateEmail(email)) setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError("");
    try {
      await axios.post("/api/onboard", {
        email: email.trim().toLowerCase(),
        requestedAgents: selectedAgents,
        requestedDatasets: selectedDatasets,
        requestDashboard: wantDashboard,
        requestReports: wantReports,
      });
      setStep(3);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Something went wrong. Please try again.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Dropdown options ── */
  const agentOptions: IDropdownOption[] = agents.map((a) => ({
    key: a.id,
    text: a.name,
    title: a.description,
  }));

  const datasetOptions: IDropdownOption[] = datasets.map((d) => ({
    key: d.id,
    text: `${d.department}${d.description ? ` — ${d.description}` : ""}`,
  }));

  /* ── Step indicator ── */
  const renderSteps = () => {
    const items = [1, 2, 3];
    return (
      <div className={s.stepRow}>
        {items.map((n, i) => {
          const isDone = step > n;
          const isActive = step === n;
          const dotClass = isDone
            ? s.stepDotDone
            : isActive
            ? s.stepDotActive
            : s.stepDotPending;
          return (
            <React.Fragment key={n}>
              <div className={`${s.stepDot} ${dotClass}`}>
                {isDone ? (
                  <Icon iconName="CheckMark" styles={{ root: { fontSize: 14 } }} />
                ) : (
                  n
                )}
              </div>
              {i < items.length - 1 && (
                <div
                  className={`${s.stepLine} ${
                    step > n ? s.stepLineActive : s.stepLinePending
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className={s.page}>
      {/* ── Header ── */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.brandRow} onClick={() => navigate("/")}>
            <div className={s.brandMark}>
              <span className={s.brandEye}>D</span>
            </div>
            <div>
              <div className={s.brandSub}>BOROONDARA</div>
              <div className={s.brandTitle}>Enterprise Data Portal</div>
            </div>
          </div>
          <button className={s.backLink} onClick={() => navigate("/")}>
            <Icon iconName="Back" styles={{ root: { fontSize: 14 } }} />
            Back to Home
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className={s.content}>
        <div className={s.title}>Request Portal Access</div>
        <div className={s.subtitle}>
          Complete the steps below to request access. An administrator will review
          your request and configure your permissions.
        </div>

        {renderSteps()}

        {/* ── Step 1: Email ── */}
        {step === 1 && (
          <div className={s.card}>
            <div className={s.cardTitle}>Your Email</div>
            <div className={s.cardSub}>
              Enter your Boroondara email address to get started.
            </div>

            <div className={s.fieldGroup}>
              <TextField
                label="Email address"
                placeholder="yourname@boroondara.vic.gov.au"
                value={email}
                onChange={(_, val) => {
                  setEmail(val || "");
                  if (emailError) setEmailError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleContinue();
                }}
                errorMessage={emailError}
                styles={{
                  root: { maxWidth: 400 },
                  fieldGroup: {
                    borderColor: p.border,
                    borderRadius: 4,
                    selectors: { ":hover": { borderColor: "#D0D0D0" } },
                  },
                }}
              />
            </div>

            <div className={s.btnRow}>
              <PrimaryButton
                text="Continue"
                onClick={handleContinue}
                disabled={!email.trim()}
                styles={{
                  root: {
                    borderRadius: 4,
                    background: p.primary,
                    border: "none",
                    fontWeight: 600,
                    height: 38,
                    padding: "0 24px",
                  },
                  rootHovered: { background: "#004578" },
                }}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Access Selection ── */}
        {step === 2 && (
          <div className={s.card}>
            <div className={s.cardTitle}>Select Access</div>
            <div className={s.cardSub}>
              Choose the agents, datasets and capabilities you need. You can
              request additional access later.
            </div>

            {submitError && (
              <MessageBar
                messageBarType={MessageBarType.error}
                onDismiss={() => setSubmitError("")}
                styles={{ root: { marginBottom: 16, borderRadius: 4 } }}
              >
                {submitError}
              </MessageBar>
            )}

            {/* Agents */}
            <div className={s.fieldGroup}>
              <div className={s.fieldLabel}>AI Agents</div>
              <Dropdown
                placeholder="Select agents you need access to"
                multiSelect
                options={agentOptions}
                selectedKeys={selectedAgents}
                onChange={(_, opt) => {
                  if (!opt) return;
                  setSelectedAgents((prev) =>
                    opt.selected
                      ? [...prev, opt.key as string]
                      : prev.filter((k) => k !== opt.key)
                  );
                }}
                styles={{
                  dropdown: { borderColor: p.border, borderRadius: 4 },
                  title: { borderColor: p.border, borderRadius: 4 },
                }}
              />
            </div>

            {/* Datasets */}
            <div className={s.fieldGroup}>
              <div className={s.fieldLabel}>Datasets</div>
              <Dropdown
                placeholder="Select datasets you need access to"
                multiSelect
                options={datasetOptions}
                selectedKeys={selectedDatasets}
                onChange={(_, opt) => {
                  if (!opt) return;
                  setSelectedDatasets((prev) =>
                    opt.selected
                      ? [...prev, opt.key as string]
                      : prev.filter((k) => k !== opt.key)
                  );
                }}
                styles={{
                  dropdown: { borderColor: p.border, borderRadius: 4 },
                  title: { borderColor: p.border, borderRadius: 4 },
                }}
              />
            </div>

            {/* Toggles */}
            <div className={s.fieldGroup}>
              <Toggle
                label="Dashboard Access"
                inlineLabel
                checked={wantDashboard}
                onChange={(_, checked) => setWantDashboard(!!checked)}
                styles={{
                  root: { marginBottom: 12 },
                  label: { color: p.text, fontWeight: 600, fontSize: 13 },
                }}
              />
              <Toggle
                label="Reports Access"
                inlineLabel
                checked={wantReports}
                onChange={(_, checked) => setWantReports(!!checked)}
                styles={{
                  label: { color: p.text, fontWeight: 600, fontSize: 13 },
                }}
              />
            </div>

            <div className={s.btnRow}>
              <DefaultButton
                text="Back"
                onClick={() => setStep(1)}
                styles={{
                  root: {
                    borderRadius: 4,
                    border: `1px solid ${p.border}`,
                    background: p.surface,
                    fontWeight: 600,
                    height: 38,
                  },
                  rootHovered: { background: p.borderSoft },
                }}
              />
              <PrimaryButton
                text={loading ? "Submitting..." : "Submit Request"}
                onClick={handleSubmit}
                disabled={loading}
                styles={{
                  root: {
                    borderRadius: 4,
                    background: p.primary,
                    border: "none",
                    fontWeight: 600,
                    height: 38,
                    padding: "0 24px",
                  },
                  rootHovered: { background: "#004578" },
                }}
              />
            </div>

            {loading && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Spinner size={SpinnerSize.small} label="Submitting your request..." />
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <div className={s.card}>
            <div className={s.successWrap}>
              <div className={s.successIcon}>
                <Icon
                  iconName="CheckMark"
                  styles={{ root: { color: "#107C10", fontSize: 28 } }}
                />
              </div>
              <div className={s.successTitle}>Request Submitted</div>
              <div className={s.successBody}>
                Your access request has been submitted successfully. An
                administrator will review your request and configure your
                permissions. You will be notified once your account is activated.
              </div>
              <PrimaryButton
                text="Back to Home"
                onClick={() => navigate("/")}
                styles={{
                  root: {
                    borderRadius: 4,
                    background: p.primary,
                    border: "none",
                    fontWeight: 600,
                    height: 40,
                    padding: "0 28px",
                  },
                  rootHovered: { background: "#004578" },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
