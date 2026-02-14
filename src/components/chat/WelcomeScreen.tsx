import React from "react";
import { Icon, mergeStyleSets } from "@fluentui/react";
import { boroondaraPalette } from "../../theme/boroondaraTheme";
import type { Agent } from "../../types/agent.types";

const AGENT_COLORS: Record<string, string> = {
  finance: "#0078D4",
  asset: "#0078D4",
};

const AGENT_ICONS: Record<string, string> = {
  finance: "Money",
  asset: "Settings",
};

interface Props {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
  onSendPrompt: (text: string) => void;
  isThinking: boolean;
}

const styles = mergeStyleSets({
  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px 24px",
    textAlign: "center",
    flex: 1,
  },
  heading: {
    fontSize: 32,
    fontWeight: 700,
    color: "#1A1A1A",
    letterSpacing: "-0.5px",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: boroondaraPalette.text3,
    maxWidth: 480,
    lineHeight: "1.6",
    marginBottom: 36,
  },

  /* Agent cards grid (no agent selected) */
  agentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
    maxWidth: 600,
    width: "100%",
  },
  agentCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 20px",
    borderRadius: 4,
    border: "1px solid #E1E1E1",
    background: "#FFFFFF",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    selectors: {
      ":hover": {
        background: "#F5F5F5",
        borderColor: "#C0C0C0",
        transform: "translateY(-1px)",
      },
    },
  },
  agentIcon: {
    width: 44,
    height: 44,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  agentInfo: {
    flex: 1,
    minWidth: 0,
  },
  agentName: {
    fontWeight: 600,
    fontSize: 14,
    color: boroondaraPalette.text,
  },
  agentDesc: {
    fontSize: 12,
    color: boroondaraPalette.text3,
    marginTop: 3,
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  } as any,

  /* Agent selected — show info + example queries */
  selectedWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  selectedIcon: {
    width: 56,
    height: 56,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    boxShadow: "0 8px 32px rgba(0,120,212,0.25)",
  },
  selectedName: {
    fontSize: 22,
    fontWeight: 700,
    color: boroondaraPalette.text,
    marginBottom: 6,
  },
  selectedDesc: {
    fontSize: 14,
    color: boroondaraPalette.text3,
    maxWidth: 460,
    lineHeight: "1.6",
    marginBottom: 28,
  },
  promptsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
    maxWidth: 680,
    width: "100%",
  },
  promptChip: {
    padding: "13px 16px",
    borderRadius: 4,
    border: "1px solid #EDEDED",
    background: "#F5F5F5",
    color: "#1A1A1A",
    fontSize: 13,
    lineHeight: "1.45",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    selectors: {
      ":hover": {
        background: "#E8F0FE",
        borderColor: "#90CAF9",
        color: "#1A1A1A",
      },
    },
  },
});

export default function WelcomeScreen({
  agents,
  selectedAgent,
  onSelectAgent,
  onSendPrompt,
  isThinking,
}: Props) {
  /* Agent selected — show its info + example queries */
  if (selectedAgent) {
    const color = AGENT_COLORS[selectedAgent.id] || boroondaraPalette.primary;
    const icon = AGENT_ICONS[selectedAgent.id] || "ChatBot";
    const prompts = selectedAgent.exampleQueries?.filter(Boolean) ?? [];

    return (
      <div className={styles.wrap}>
        <div className={styles.selectedWrap}>
          <div
            className={styles.selectedIcon}
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
            }}
          >
            <Icon iconName={icon} style={{ fontSize: 26, color: "#fff" }} />
          </div>
          <div className={styles.selectedName}>{selectedAgent.name}</div>
          <div className={styles.selectedDesc}>{selectedAgent.description}</div>

          {prompts.length > 0 && (
            <div className={styles.promptsGrid}>
              {prompts.slice(0, 6).map((p) => (
                <button
                  key={p}
                  className={styles.promptChip}
                  onClick={() => onSendPrompt(p)}
                  disabled={isThinking}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* No agent selected — show "What can I do for you?" + agent cards */
  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>What can I do for you?</div>
      <div className={styles.subtitle}>
        Select an agent to get started, or choose one from the input bar below.
      </div>

      {agents.length > 0 && (
        <div className={styles.agentGrid}>
          {agents.map((a) => {
            const color = AGENT_COLORS[a.id] || boroondaraPalette.primary;
            const icon = AGENT_ICONS[a.id] || "ChatBot";
            return (
              <button
                key={a.id}
                className={styles.agentCard}
                onClick={() => onSelectAgent(a)}
              >
                <div
                  className={styles.agentIcon}
                  style={{
                    background: `linear-gradient(135deg, ${color}30, ${color}15)`,
                    border: `1px solid ${color}40`,
                  }}
                >
                  <Icon
                    iconName={icon}
                    style={{ fontSize: 20, color }}
                  />
                </div>
                <div className={styles.agentInfo}>
                  <div className={styles.agentName}>{a.name}</div>
                  <div className={styles.agentDesc}>{a.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
