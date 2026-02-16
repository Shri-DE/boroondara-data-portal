import React, { useCallback, useRef, useState } from "react";
import { Icon, mergeStyleSets } from "@fluentui/react";
import type { Agent } from "../../types/agent.types";
import type { AttachedFile, DatasetContextInfo } from "./ContextChips";
import AgentPicker from "./AgentPicker";
import AttachMenu, { readFileContent, MAX_FILE_SIZE } from "./AttachMenu";
import ContextChips from "./ContextChips";

interface Props {
  agents: Agent[];
  selectedAgent: Agent | null;
  attachedFiles: AttachedFile[];
  datasetContext?: DatasetContextInfo | null;
  isThinking: boolean;
  onSend: (text: string) => void;
  onSelectAgent: (agent: Agent) => void;
  onClearAgent: () => void;
  onFilesAdded: (files: AttachedFile[]) => void;
  onRemoveFile: (index: number) => void;
  onClearDataset?: () => void;
}

const styles = mergeStyleSets({
  area: {
    borderTop: `1px solid #E1E1E1`,
    background: "#FFFFFF",
    padding: "12px 24px 18px",
  },
  inner: {
    maxWidth: 820,
    width: "100%",
    margin: "0 auto",
  },
  inputCard: {
    background: "#FFFFFF",
    border: `1px solid #E1E1E1`,
    borderRadius: 4,
    padding: "14px 18px 10px",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    selectors: {
      ":focus-within": {
        borderColor: "#00695C",
        boxShadow: "0 0 0 2px rgba(0,120,212,0.15)",
      },
    },
  },
  textarea: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: "1.55",
    resize: "none",
    fontFamily: "inherit",
    minHeight: 24,
    maxHeight: 160,
    display: "block",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 4,
    border: "none",
    background: "transparent",
    color: "#707070",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    position: "relative",
    selectors: {
      ":hover": {
        background: "#F5F5F5",
        color: "#1A1A1A",
      },
    },
  },
  toolBtnActive: {
    background: "#E0F2F1",
    color: "#00695C",
  },
  spacer: {
    flex: 1,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s ease",
    background: "#00695C",
    color: "#fff",
    selectors: {
      ":hover": {
        background: "#004F45",
      },
    },
  },
  sendBtnDisabled: {
    background: "#F5F5F5",
    color: "#C8C8C8",
    cursor: "not-allowed",
  },
  hint: {
    fontSize: 11,
    color: "#707070",
    textAlign: "center",
    marginTop: 8,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    background: "#00695C",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    marginTop: 6,
    marginBottom: 2,
  },
});

export default function InputBar({
  agents,
  selectedAgent,
  attachedFiles,
  datasetContext,
  isThinking,
  onSend,
  onSelectAgent,
  onClearAgent,
  onFilesAdded,
  onRemoveFile,
  onClearDataset,
}: Props) {
  const [draft, setDraft] = useState("");
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachBtnRef = useRef<HTMLButtonElement>(null);
  const agentBtnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allow sending if: has text + not thinking + (agent selected OR files attached OR dataset with tables)
  const hasDataset = !!(datasetContext && datasetContext.tables.length > 0);
  const canSend = draft.trim().length > 0 && !isThinking && (!!selectedAgent || attachedFiles.length > 0 || hasDataset);

  /** Handle file input change — lives in InputBar so the ref never unmounts */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const results: AttachedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large (max 5 MB).`);
        continue;
      }
      try {
        const content = await readFileContent(file);
        results.push({ name: file.name, size: file.size, content });
      } catch (err) {
        console.error(`Failed to read ${file.name}:`, err);
        alert(`Could not read "${file.name}".`);
      }
    }

    if (results.length > 0) {
      onFilesAdded(results);
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onFilesAdded]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || isThinking) return;
    if (!selectedAgent && attachedFiles.length === 0 && !hasDataset) return;
    onSend(text);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [draft, selectedAgent, attachedFiles.length, hasDataset, isThinking, onSend]);

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.area}>
      {/* Hidden file input — lives in InputBar so it's always mounted */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json,.txt"
        multiple
        style={{ position: "fixed", top: -9999, left: -9999, opacity: 0 }}
        onChange={handleFileChange}
      />

      <div className={styles.inner}>
        {/* Context chips (dataset + agent + files) */}
        {(selectedAgent || attachedFiles.length > 0 || (datasetContext && datasetContext.tables.length > 0)) && (
          <div className={styles.chipsRow}>
            <ContextChips
              selectedAgent={selectedAgent}
              attachedFiles={attachedFiles}
              datasetContext={datasetContext}
              onClearAgent={onClearAgent}
              onRemoveFile={onRemoveFile}
              onClearDataset={onClearDataset}
            />
          </div>
        )}

        {/* Input card */}
        <div className={styles.inputCard}>
          <textarea
            ref={textareaRef}
            className={styles.textarea as any}
            rows={1}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
            disabled={isThinking}
            placeholder={
              selectedAgent
                ? `Message ${selectedAgent.name}...`
                : attachedFiles.length > 0
                  ? "Ask about your file..."
                  : hasDataset
                    ? `Ask about ${datasetContext!.dept} data...`
                    : "Attach a file or select an agent to start..."
            }
          />

          {/* Toolbar row */}
          <div className={styles.toolbar}>
            {/* [+] Attach */}
            <button
              ref={attachBtnRef}
              className={styles.toolBtn}
              onClick={() => setShowAttachMenu((p) => !p)}
              title="Add attachments"
            >
              <Icon iconName="Add" style={{ fontSize: 16 }} />
            </button>

            {/* Agent selector */}
            <button
              ref={agentBtnRef}
              className={`${styles.toolBtn} ${selectedAgent ? styles.toolBtnActive : ""}`}
              onClick={() => setShowAgentPicker((p) => !p)}
              title="Select agent"
            >
              <Icon iconName="ChatBot" style={{ fontSize: 16 }} />
            </button>

            {/* File count badge (if files attached) */}
            {attachedFiles.length > 0 && (
              <button
                className={styles.toolBtn}
                onClick={() => setShowAttachMenu((p) => !p)}
                title={`${attachedFiles.length} file(s) attached`}
                style={{ pointerEvents: "none" }}
              >
                <Icon iconName="Attach" style={{ fontSize: 15 }} />
                <span className={styles.badge} style={{ position: "absolute" as any }}>
                  {attachedFiles.length}
                </span>
              </button>
            )}

            <div className={styles.spacer} />

            {/* Send */}
            <button
              className={`${styles.sendBtn} ${!canSend ? styles.sendBtnDisabled : ""}`}
              onClick={handleSend}
              disabled={!canSend}
              title="Send message"
            >
              <Icon iconName="Send" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        <div className={styles.hint}>
          <b>Enter</b> to send &nbsp;&middot;&nbsp; <b>Shift + Enter</b> for new line
        </div>
      </div>

      {/* Callouts */}
      {showAttachMenu && (
        <AttachMenu
          target={attachBtnRef.current}
          onDismiss={() => setShowAttachMenu(false)}
          fileInputRef={fileInputRef}
        />
      )}
      {showAgentPicker && (
        <AgentPicker
          agents={agents}
          selectedAgent={selectedAgent}
          target={agentBtnRef.current}
          onSelect={onSelectAgent}
          onDismiss={() => setShowAgentPicker(false)}
        />
      )}
    </div>
  );
}
