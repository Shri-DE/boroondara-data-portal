import React from "react";
import { Icon, mergeStyleSets } from "@fluentui/react";
import type { Agent } from "../../types/agent.types";

export interface AttachedFile {
  name: string;
  size: number;
  content: string; // text/CSV content (client-side read)
}

export interface DatasetContextInfo {
  tables: string[];
  dept: string;
  agentId?: string; // mapped agent for this department (used for API routing)
}

interface Props {
  selectedAgent: Agent | null;
  attachedFiles: AttachedFile[];
  datasetContext?: DatasetContextInfo | null;
  onClearAgent: () => void;
  onRemoveFile: (index: number) => void;
  onClearDataset?: () => void;
}

/* Agent chip color is #00695C for all agents */

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const styles = mergeStyleSets({
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    maxWidth: 820,
    width: "100%",
    margin: "0 auto",
    padding: "0 24px",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    border: "1px solid #E1E1E1",
    background: "#F5F5F5",
    color: "#1A1A1A",
    maxWidth: 240,
    overflow: "hidden",
  },
  chipLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  closeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    borderRadius: 4,
    border: "none",
    background: "transparent",
    color: "#707070",
    cursor: "pointer",
    padding: 0,
    fontSize: 10,
    flexShrink: 0,
    selectors: {
      ":hover": {
        background: "#EDEDED",
        color: "#1A1A1A",
      },
    },
  },
});

export default function ContextChips({
  selectedAgent,
  attachedFiles,
  datasetContext,
  onClearAgent,
  onRemoveFile,
  onClearDataset,
}: Props) {
  const hasDataset = datasetContext && datasetContext.tables.length > 0;
  if (!selectedAgent && attachedFiles.length === 0 && !hasDataset) return null;

  return (
    <div className={styles.wrap}>
      {/* Dataset context chip */}
      {hasDataset && (
        <div
          className={styles.chip}
          style={{
            borderColor: "#A5D6A7",
            background: "#E8F5E9",
            maxWidth: 360,
          }}
        >
          <Icon
            iconName="Database"
            style={{ fontSize: 12, color: "#107C10" }}
          />
          <span className={styles.chipLabel}>
            {datasetContext!.dept} · {datasetContext!.tables.join(", ")}
          </span>
          {onClearDataset && (
            <button
              className={styles.closeBtn}
              onClick={onClearDataset}
              title="Remove dataset context"
            >
              <Icon iconName="Cancel" style={{ fontSize: 9 }} />
            </button>
          )}
        </div>
      )}

      {selectedAgent && (
        <div
          className={styles.chip}
          style={{
            borderColor: "#80CBC4",
            background: "#E0F2F1",
          }}
        >
          <Icon
            iconName="ChatBot"
            style={{
              fontSize: 12,
              color: "#00695C",
            }}
          />
          <span className={styles.chipLabel}>{selectedAgent.name}</span>
          <button
            className={styles.closeBtn}
            onClick={onClearAgent}
            title="Remove agent"
          >
            <Icon iconName="Cancel" style={{ fontSize: 9 }} />
          </button>
        </div>
      )}

      {attachedFiles.map((file, i) => (
        <div key={`${file.name}-${i}`} className={styles.chip}>
          <Icon
            iconName="Attach"
            style={{ fontSize: 12, color: "#00695C" }}
          />
          <span className={styles.chipLabel}>{file.name}</span>
          <span style={{ color: "#707070", fontSize: 10, flexShrink: 0 }}>
            {formatSize(file.size)}
          </span>
          <button
            className={styles.closeBtn}
            onClick={() => onRemoveFile(i)}
            title="Remove file"
          >
            <Icon iconName="Cancel" style={{ fontSize: 9 }} />
          </button>
        </div>
      ))}
    </div>
  );
}
