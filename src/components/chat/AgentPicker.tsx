import React from "react";
import { Callout, DirectionalHint, Icon, mergeStyleSets } from "@fluentui/react";
import { boroondaraPalette } from "../../theme/boroondaraTheme";
import type { Agent } from "../../types/agent.types";

const AGENT_COLORS: Record<string, string> = {
  finance: "#00695C",
  asset: "#00695C",
};

const AGENT_ICONS: Record<string, string> = {
  finance: "Money",
  asset: "Settings",
};

interface Props {
  agents: Agent[];
  selectedAgent: Agent | null;
  target: HTMLElement | null;
  onSelect: (agent: Agent) => void;
  onDismiss: () => void;
}

const styles = mergeStyleSets({
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #EDEDED",
    transition: "background 0.15s",
    selectors: {
      ":hover": {
        background: "#F5F5F5",
      },
      ":last-child": {
        borderBottom: "none",
      },
    },
  },
  itemSelected: {
    background: "#E0F2F1",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 600,
    fontSize: 13,
    color: boroondaraPalette.text,
  },
  desc: {
    fontSize: 11,
    color: boroondaraPalette.text3,
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  check: {
    fontSize: 14,
    color: "#00695C",
  },
  header: {
    padding: "10px 16px 6px",
    fontSize: 11,
    fontWeight: 600,
    color: "#707070",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
});

export default function AgentPicker({
  agents,
  selectedAgent,
  target,
  onSelect,
  onDismiss,
}: Props) {
  if (!target) return null;

  return (
    <Callout
      target={target}
      isBeakVisible={false}
      directionalHint={DirectionalHint.topLeftEdge}
      onDismiss={onDismiss}
      calloutWidth={320}
      styles={{
        root: {
          background: "#FFFFFF",
          border: "1px solid #E1E1E1",
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <div className={styles.header}>Select Agent</div>
      {agents.map((a) => {
        const color = AGENT_COLORS[a.id] || boroondaraPalette.primary;
        const icon = AGENT_ICONS[a.id] || "ChatBot";
        const isSelected = selectedAgent?.id === a.id;

        return (
          <div
            key={a.id}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ""}`}
            onClick={() => {
              onSelect(a);
              onDismiss();
            }}
          >
            <div
              className={styles.iconWrap}
              style={{
                background: `${color}20`,
                border: `1px solid ${color}40`,
              }}
            >
              <Icon iconName={icon} style={{ fontSize: 16, color }} />
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{a.name}</div>
              <div className={styles.desc}>{a.description}</div>
            </div>
            {isSelected && (
              <Icon iconName="CheckMark" className={styles.check} />
            )}
          </div>
        );
      })}
    </Callout>
  );
}
