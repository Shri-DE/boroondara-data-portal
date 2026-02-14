import React from "react";
import { Icon, mergeStyleSets } from "@fluentui/react";
import { boroondaraPalette } from "../../theme/boroondaraTheme";

export interface WorkspaceSession {
  id: string;
  title: string;
  agentId: string | null;
  agentName: string | null;
  lastActivity: string; // ISO string
  messageCount: number;
}

interface Props {
  sessions: WorkspaceSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

const AGENT_COLORS: Record<string, string> = {
  finance: "#0078D4",
  asset: "#0078D4",
};

const styles = mergeStyleSets({
  sidebar: {
    width: 260,
    minWidth: 260,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #E1E1E1",
    background: "#FAFAFA",
    overflow: "hidden",
    "@media (max-width: 768px)": {
      display: "none",
    },
  } as any,
  header: {
    padding: "16px 16px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #EDEDED",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: boroondaraPalette.text2,
    letterSpacing: "0.3px",
  },
  newBtn: {
    width: 30,
    height: 30,
    borderRadius: 4,
    border: "1px solid #E1E1E1",
    background: "transparent",
    color: boroondaraPalette.text2,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    selectors: {
      ":hover": {
        background: "#E8F0FE",
        borderColor: "#0078D4",
        color: "#0078D4",
      },
    },
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 8px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 4,
    cursor: "pointer",
    transition: "all 0.12s",
    marginBottom: 2,
    selectors: {
      ":hover": {
        background: "#F0F0F0",
      },
    },
  },
  itemActive: {
    background: "#E8F0FE",
    selectors: {
      ":hover": {
        background: "#DCEAFE",
      },
    },
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: boroondaraPalette.text,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemMeta: {
    fontSize: 11,
    color: boroondaraPalette.text3,
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    border: "none",
    background: "transparent",
    color: "#A0A0A0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    opacity: 0,
    transition: "all 0.15s",
    selectors: {
      ":hover": {
        color: "#D83B01",
        background: "rgba(216,59,1,0.08)",
      },
    },
  },
  emptyState: {
    padding: "32px 16px",
    textAlign: "center",
    color: boroondaraPalette.text3,
    fontSize: 12,
    lineHeight: "1.6",
  },
});

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString();
}

export default function WorkspaceSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: Props) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Workspace</span>
        <button
          className={styles.newBtn}
          onClick={onNewChat}
          title="New chat"
        >
          <Icon iconName="Add" style={{ fontSize: 14 }} />
        </button>
      </div>

      <div className={styles.list}>
        {sessions.length === 0 ? (
          <div className={styles.emptyState}>
            No conversations yet.<br />
            Start a new chat to begin.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            const dotColor = s.agentId
              ? AGENT_COLORS[s.agentId] || boroondaraPalette.primary
              : "#C0C0C0";

            return (
              <div
                key={s.id}
                className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                onClick={() => onSelectSession(s.id)}
                style={{ position: "relative" }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget.querySelector<HTMLElement>("[data-delete]");
                  if (btn) btn.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget.querySelector<HTMLElement>("[data-delete]");
                  if (btn) btn.style.opacity = "0";
                }}
              >
                <div
                  className={styles.itemDot}
                  style={{ background: dotColor }}
                />
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{s.title}</div>
                  <div className={styles.itemMeta}>
                    {s.agentName || "General"} &middot; {s.messageCount} messages &middot; {formatRelativeTime(s.lastActivity)}
                  </div>
                </div>
                <button
                  data-delete
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  title="Delete"
                >
                  <Icon iconName="Delete" style={{ fontSize: 12 }} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
