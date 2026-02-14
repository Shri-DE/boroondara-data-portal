import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Spinner,
  SpinnerSize,
  Icon,
  mergeStyleSets,
} from "@fluentui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useSearchParams } from "react-router-dom";

import { agentService } from "../services/agentService";
import type { Agent, Message } from "../types/agent.types";
import { boroondaraPalette } from "../theme/boroondaraTheme";
import { exportTableToExcel, containsMarkdownTable } from "../utils/exportTableToExcel";
import ChartPanel from "../components/chat/ChartPanel";
import WelcomeScreen from "../components/chat/WelcomeScreen";
import InputBar from "../components/chat/InputBar";
import WorkspaceSidebar from "../components/chat/WorkspaceSidebar";
import type { WorkspaceSession } from "../components/chat/WorkspaceSidebar";
import type { AttachedFile, DatasetContextInfo } from "../components/chat/ContextChips";
import {
  loadSessions,
  loadMessages,
  saveMessages,
  deleteSession as deleteSessionStorage,
  upsertSession,
  generateTitle,
} from "../utils/workspaceStorage";

/* =========================
   Styles
========================= */
const styles = mergeStyleSets({
  pageRow: {
    height: "calc(100vh - 52px)",
    display: "flex",
    flexDirection: "row",
    color: boroondaraPalette.text,
    background: boroondaraPalette.bg,
    overflow: "hidden",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  messagesScroll: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
  messagesInner: {
    maxWidth: 820,
    width: "100%",
    margin: "0 auto",
    padding: "24px 24px 8px",
    "@media (max-width: 768px)": {
      padding: "16px 12px 8px",
    },
  } as any,

  /* Messages */
  messageRow: {
    display: "flex",
    gap: 16,
    marginBottom: 32,
    alignItems: "flex-start",
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 600,
  },
  avatarAssistant: {
    background: "#0078D4",
    color: "#fff",
  },
  avatarUser: {
    background: "#F5F5F5",
    color: "#505050",
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
    maxWidth: 720,
  },
  userBubble: {
    background: "#F0F6FF",
    padding: "12px 18px",
    borderRadius: "18px 18px 4px 18px",
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: "1.65",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    width: "fit-content",
    maxWidth: "100%",
    marginLeft: "auto",
  },
  assistantProse: {
    color: "#333333",
    fontSize: 14,
    lineHeight: "1.75",
  },
  systemBubble: {
    background: "#FFF8E1",
    border: "1px solid #FFE082",
    padding: "12px 18px",
    borderRadius: 4,
    color: "#8D6E00",
    fontSize: 14,
    lineHeight: "1.65",
  },
  timeText: {
    fontSize: 11,
    color: "#707070",
    marginTop: 6,
    display: "block",
  },
  timeRight: { textAlign: "right" },

  /* Citations */
  citationsWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid #EDEDED",
  },
  citationsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#707070",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 8,
  },
  citationChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 4,
    background: "#F5F5F5",
    border: "1px solid #EDEDED",
    fontSize: 12,
    color: "#505050",
    marginRight: 8,
    marginBottom: 6,
  },

  /* Export + chart buttons */
  exportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 4,
    border: "1px solid #E1E1E1",
    background: "#F5F5F5",
    color: "#505050",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 10,
    transition: "all 0.15s ease",
    selectors: {
      ":hover": {
        background: "#E8F0FE",
        borderColor: "#0078D4",
        color: "#0078D4",
      },
    },
  },
  chartActionsLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#707070",
    marginRight: 2,
  },
  chartBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 12px",
    borderRadius: 4,
    border: "1px solid #E1E1E1",
    background: "#F5F5F5",
    color: "#505050",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    selectors: {
      ":hover": {
        background: "#E8F0FE",
        borderColor: "#0078D4",
        color: "#0078D4",
      },
    },
  },
  chartBtnActive: {
    background: "#E8F0FE",
    borderColor: "#0078D4",
    color: "#0078D4",
  },

  /* Thinking — step-by-step status */
  thinkingRow: {
    display: "flex",
    gap: 16,
    marginBottom: 32,
    alignItems: "flex-start",
  },
  thinkingBubble: {
    padding: "14px 18px",
    borderRadius: 4,
    background: "#F5F5F5",
    border: "1px solid #EDEDED",
    minWidth: 0,
  },
  stepList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
  },
  stepDone: {
    color: "#107C10",
  },
  stepActive: {
    color: "#1A1A1A",
  },
  stepPending: {
    color: "#C8C8C8",
  },
  stepIcon: {
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  /* Loading */
  loadingPage: {
    height: "calc(100vh - 48px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

/* =========================
   Helpers
========================= */
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (t: any) => {
  const d = t instanceof Date ? t : new Date(t);
  return d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
};

const isNearBottom = (el: HTMLDivElement | null, threshold = 160) => {
  if (!el) return true;
  const { scrollTop, scrollHeight, clientHeight } = el;
  return scrollHeight - (scrollTop + clientHeight) < threshold;
};

type NormalizedCitation = { label: string; url?: string };
const normalizeCitations = (raw: any): NormalizedCitation[] => {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((c: any) => {
      if (!c) return null;
      if (c.id === "sql-query") return null; // handled separately
      if (typeof c === "string") {
        const isUrl = /^https?:\/\//i.test(c);
        return { label: isUrl ? "Source" : c, url: isUrl ? c : undefined };
      }
      if (typeof c === "object") {
        const label = c.title || c.label || c.name || c.source || c.document || c.url || c.href || "Source";
        const url = c.url || c.href || c.link;
        return { label: typeof label === "string" ? label : "Source", url: typeof url === "string" ? url : undefined };
      }
      return null;
    })
    .filter(Boolean) as NormalizedCitation[];
};

/* Thinking steps — shown as step-by-step status indicators */
const AGENT_STEPS = [
  "Understanding your question",
  "Generating SQL query",
  "Querying database",
  "Formatting results",
];
const GENERAL_STEPS = [
  "Reading attached file",
  "Analysing content",
  "Generating response",
];

/* Markdown components */
const markdownComponents: Record<string, React.FC<any>> = {
  table: ({ children, ...props }: any) => (
    <div className="md-table-wrap">
      <table className="md-table" {...props}>{children}</table>
    </div>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code className="md-inline-code" {...props}>{children}</code>;
    return (
      <div className="md-code-block">
        <pre><code className={className} {...props}>{children}</code></pre>
      </div>
    );
  },
  p: ({ children, ...props }: any) => <p className="md-paragraph" {...props}>{children}</p>,
  strong: ({ children, ...props }: any) => <strong className="md-strong" {...props}>{children}</strong>,
  h1: ({ children, ...props }: any) => <h3 className="md-heading" {...props}>{children}</h3>,
  h2: ({ children, ...props }: any) => <h3 className="md-heading" {...props}>{children}</h3>,
  h3: ({ children, ...props }: any) => <h4 className="md-heading" {...props}>{children}</h4>,
};

/* =========================
   Component
========================= */
export default function UnifiedChat() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* --- agents --- */
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  /* --- messages --- */
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isThinking, setIsThinking] = useState(false);
  const [activeCharts, setActiveCharts] = useState<Record<string, "bar" | "pie" | "line">>({});

  /* --- files --- */
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  /* --- thinking steps --- */
  const [thinkingStep, setThinkingStep] = useState(0);
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* --- workspace --- */
  const [workspaceSessions, setWorkspaceSessions] = useState<WorkspaceSession[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  /* --- dataset context (from Datasets "Ask Questions" navigation) --- */
  const [datasetContext, setDatasetContext] = useState<DatasetContextInfo | null>(null);

  /* --- refs --- */
  const scrollHostRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const urlParamsHandledRef = useRef(false);

  const hasConversation = messages.length > 0;

  /* Load agents + workspace sessions */
  useEffect(() => {
    (async () => {
      try {
        const data = await agentService.getAgents();
        setAgents(data);
      } catch (e) {
        console.error("Failed to load agents:", e);
      } finally {
        setLoadingAgents(false);
      }
    })();
    setWorkspaceSessions(loadSessions());
  }, []);

  /* Handle URL params from Datasets page: ?tables=t1,t2&dept=DeptName&agentId=finance */
  useEffect(() => {
    if (urlParamsHandledRef.current) return;
    const tablesParam = searchParams.get("tables");
    const deptParam = searchParams.get("dept");
    const agentIdParam = searchParams.get("agentId");

    if (!tablesParam && !deptParam) return;

    urlParamsHandledRef.current = true;

    // Store table context with mapped agentId for seamless querying
    if (tablesParam || deptParam) {
      setDatasetContext({
        tables: tablesParam ? tablesParam.split(",").filter(Boolean) : [],
        dept: deptParam || "",
        agentId: agentIdParam || undefined,
      });
    }

    // Clear URL params to keep URL clean
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  /* Scroll handling */
  useEffect(() => {
    const host = scrollHostRef.current;
    if (!host) return;
    const onScroll = () => {
      shouldAutoScrollRef.current = isNearBottom(host);
    };
    host.addEventListener("scroll", onScroll, { passive: true });
    return () => host.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isThinking]);

  /* Toggle chart */
  const toggleChart = useCallback((msgId: string, type: "bar" | "pie" | "line") => {
    setActiveCharts((prev) => {
      if (prev[msgId] === type) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: type };
    });
  }, []);

  /* Agent selection */
  const handleSelectAgent = useCallback((agent: Agent) => {
    if (selectedAgent?.id !== agent.id) {
      setMessages([]);
      setSessionId(undefined);
      setActiveCharts({});
      setActiveWorkspaceId(null);
    }
    setSelectedAgent(agent);
  }, [selectedAgent]);

  const handleClearAgent = useCallback(() => {
    setSelectedAgent(null);
    setMessages([]);
    setSessionId(undefined);
    setActiveCharts({});
    setAttachedFiles([]);
    setActiveWorkspaceId(null);
    setDatasetContext(null);
  }, []);

  /* File management */
  const handleFilesAdded = useCallback((files: AttachedFile[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* Build file context string */
  const buildFileContext = useMemo(() => {
    if (attachedFiles.length === 0) return undefined;
    return attachedFiles
      .map((f) => `--- File: ${f.name} ---\n${f.content}`)
      .join("\n\n");
  }, [attachedFiles]);

  /* Start step cycling timer */
  const startStepTimer = useCallback((totalSteps: number) => {
    setThinkingStep(0);
    if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    let step = 0;
    thinkingTimerRef.current = setInterval(() => {
      step++;
      if (step < totalSteps) {
        setThinkingStep(step);
      }
    }, 2200);
  }, []);

  const stopStepTimer = useCallback(() => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopStepTimer(), [stopStepTimer]);

  /* Persist messages to workspace */
  const persistToWorkspace = useCallback((msgs: Message[], sid: string) => {
    saveMessages(sid, msgs);
    const session: WorkspaceSession = {
      id: sid,
      title: generateTitle(msgs),
      agentId: selectedAgent?.id || null,
      agentName: selectedAgent?.name || null,
      lastActivity: new Date().toISOString(),
      messageCount: msgs.length,
    };
    upsertSession(session);
    setWorkspaceSessions(loadSessions());
    setActiveWorkspaceId(sid);
  }, [selectedAgent]);

  /* Send message */
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const hasDataset = !!(datasetContext && datasetContext.tables.length > 0);
      const hasFiles = attachedFiles.length > 0;

      // Resolve which agent to use for this request (local variable, not UI state)
      // Priority: manually selected agent > dataset's mapped agent > finance fallback
      let resolvedAgent = selectedAgent;
      if (!resolvedAgent && hasDataset && agents.length > 0) {
        if (datasetContext?.agentId) {
          resolvedAgent = agents.find((a) => a.id === datasetContext.agentId) || null;
        }
        // Fall back to finance agent for departments without a mapped agent
        if (!resolvedAgent) {
          resolvedAgent = agents.find((a) => a.id === "finance") || null;
        }
      }
      const useAgent = !!resolvedAgent;

      if (!useAgent && !hasFiles) return;

      shouldAutoScrollRef.current = true;
      setIsThinking(true);

      const steps = useAgent ? AGENT_STEPS : GENERAL_STEPS;
      startStepTimer(steps.length);

      // Ensure we have a session ID
      const currentSessionId = sessionId || `session-${Date.now()}`;
      if (!sessionId) setSessionId(currentSessionId);

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      const updatedMsgs = [...messages, userMsg];
      setMessages(updatedMsgs);

      try {
        let resp: any;

        if (useAgent) {
          // Build context with file and dataset table info
          const ctx: Record<string, any> = {};
          if (buildFileContext) ctx.fileContext = buildFileContext;
          if (datasetContext && datasetContext.tables.length > 0) {
            ctx.datasetTables = datasetContext.tables;
            ctx.datasetDept = datasetContext.dept;
          }

          resp = await agentService.queryAgent({
            agentId: resolvedAgent!.id,
            query: trimmed,
            sessionId: currentSessionId,
            context: Object.keys(ctx).length > 0 ? ctx : {},
          });
        } else {
          resp = await agentService.chatGeneral(trimmed, buildFileContext, currentSessionId);
        }

        if (resp?.sessionId) setSessionId(resp.sessionId);

        setThinkingStep(steps.length);

        const assistantMsg: Message = {
          id: makeId(),
          role: "assistant",
          content: resp?.response ?? "(No response returned)",
          timestamp: new Date(),
          citations: resp?.citations,
          chartData: resp?.chartData ?? undefined,
        };
        const finalMsgs = [...updatedMsgs, assistantMsg];
        setMessages(finalMsgs);

        // Persist to workspace
        persistToWorkspace(finalMsgs, resp?.sessionId || currentSessionId);
      } catch (e: any) {
        const errMsg: Message = {
          id: makeId(),
          role: "system",
          content: `${e?.message || "Failed to process request."}`,
          timestamp: new Date(),
        };
        const finalMsgs = [...updatedMsgs, errMsg];
        setMessages(finalMsgs);
        persistToWorkspace(finalMsgs, currentSessionId);
      } finally {
        stopStepTimer();
        setIsThinking(false);
      }
    },
    [selectedAgent, agents, attachedFiles.length, messages, sessionId, buildFileContext, datasetContext, startStepTimer, stopStepTimer, persistToWorkspace]
  );

  /* Workspace: select a past session */
  const handleSelectSession = useCallback((id: string) => {
    const session = workspaceSessions.find((s) => s.id === id);
    if (!session) return;
    const msgs = loadMessages(id);
    setMessages(msgs);
    setSessionId(id);
    setActiveWorkspaceId(id);
    setActiveCharts({});
    setAttachedFiles([]);

    // Restore agent context
    if (session.agentId) {
      const agent = agents.find((a) => a.id === session.agentId);
      if (agent) setSelectedAgent(agent);
    } else {
      setSelectedAgent(null);
    }
  }, [workspaceSessions, agents]);

  /* Workspace: new chat */
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setActiveCharts({});
    setAttachedFiles([]);
    setActiveWorkspaceId(null);
    // Keep selected agent if any
  }, []);

  /* Workspace: delete session */
  const handleDeleteSession = useCallback((id: string) => {
    deleteSessionStorage(id);
    setWorkspaceSessions(loadSessions());
    if (activeWorkspaceId === id) {
      handleNewChat();
    }
  }, [activeWorkspaceId, handleNewChat]);

  /* Render citations — SQL citations are expandable */
  const renderCitations = (raw: any) => {
    if (!raw) return null;
    const arr = Array.isArray(raw) ? raw : [raw];
    if (!arr.length) return null;

    const sqlCitations = arr.filter((c: any) => c?.id === "sql-query" && c?.excerpt);
    const otherCitations = normalizeCitations(arr);

    if (sqlCitations.length === 0 && otherCitations.length === 0) return null;

    return (
      <div className={styles.citationsWrap}>
        {sqlCitations.map((c: any, idx: number) => (
          <details key={`sql-${idx}`} className="sql-citation-details">
            <summary className="sql-citation-summary">
              <Icon iconName="Code" style={{ fontSize: 12, opacity: 0.6 }} />
              Generated SQL
            </summary>
            <div className="md-code-block" style={{ margin: 0, borderRadius: 0, borderTop: "1px solid #EDEDED" }}>
              <pre><code>{c.excerpt}</code></pre>
            </div>
          </details>
        ))}

        {otherCitations.length > 0 && (
          <div style={{ marginTop: sqlCitations.length > 0 ? 8 : 0 }}>
            <div className={styles.citationsTitle}>Sources</div>
            <div>
              {otherCitations.slice(0, 6).map((c, idx) => (
                <span key={`${c.label}-${idx}`} className={styles.citationChip}>
                  <Icon iconName="Database" style={{ fontSize: 11, opacity: 0.6 }} />
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                      {c.label}
                    </a>
                  ) : (
                    c.label
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* Loading state */
  if (loadingAgents) {
    return (
      <div className={styles.loadingPage}>
        <Spinner size={SpinnerSize.large} label="Loading..." />
      </div>
    );
  }

  /* ========== Render ========== */
  return (
    <div className={styles.pageRow}>
      {/* Workspace sidebar */}
      <WorkspaceSidebar
        sessions={workspaceSessions}
        activeSessionId={activeWorkspaceId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Chat area */}
      <div className={styles.chatArea}>
        {/* Scrollable messages area */}
        <div className={styles.messagesScroll} ref={scrollHostRef}>
          <div className={styles.messagesInner}>
            {/* Welcome screen (no messages) */}
            {!hasConversation && (
              <WelcomeScreen
                agents={agents}
                selectedAgent={selectedAgent}
                onSelectAgent={handleSelectAgent}
                onSendPrompt={handleSend}
                isThinking={isThinking}
              />
            )}

            {/* Message list */}
            {messages.map((m: any) => {
              const isUser = m.role === "user";
              const isAssistant = m.role === "assistant";
              const isSystem = m.role === "system";

              if (isUser) {
                return (
                  <div key={m.id} className={`${styles.messageRow} ${styles.messageRowUser}`}>
                    <div className={`${styles.avatar} ${styles.avatarUser}`}>
                      <Icon iconName="Contact" style={{ fontSize: 15 }} />
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.userBubble}>{m.content}</div>
                      <span className={`${styles.timeText} ${styles.timeRight}`}>
                        {formatTime(m.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              }

              if (isAssistant) {
                return (
                  <div key={m.id} className={styles.messageRow}>
                    <div className={`${styles.avatar} ${styles.avatarAssistant}`}>
                      <Icon iconName="ChatBot" style={{ fontSize: 15 }} />
                    </div>
                    <div className={styles.messageContent}>
                      <div className={`${styles.assistantProse} assistant-prose-wrap`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                      {(containsMarkdownTable(m.content) || m.chartData) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          {containsMarkdownTable(m.content) && (
                            <button
                              className={styles.exportBtn}
                              style={{ marginTop: 0 }}
                              onClick={() =>
                                exportTableToExcel(m.content, `export-${new Date().toISOString().slice(0, 10)}.xlsx`)
                              }
                              title="Export table to Excel"
                            >
                              <Icon iconName="ExcelDocument" style={{ fontSize: 14 }} />
                              Export to Excel
                            </button>
                          )}
                          {m.chartData && (
                            <>
                              <span className={styles.chartActionsLabel}>Visualise:</span>
                              {(["bar", "pie", "line"] as const).map((type) => (
                                <button
                                  key={type}
                                  className={`${styles.chartBtn} ${activeCharts[m.id] === type ? styles.chartBtnActive : ""}`}
                                  onClick={() => toggleChart(m.id, type)}
                                  title={`${type.charAt(0).toUpperCase() + type.slice(1)} chart`}
                                >
                                  <Icon
                                    iconName={type === "bar" ? "BarChart4" : type === "pie" ? "DonutChart" : "LineChart"}
                                    style={{ fontSize: 14 }}
                                  />
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                      {activeCharts[m.id] && m.chartData && (
                        <ChartPanel data={m.chartData} chartType={activeCharts[m.id]} />
                      )}
                      {renderCitations(m.citations)}
                      <span className={styles.timeText}>{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                );
              }

              if (isSystem) {
                return (
                  <div key={m.id} className={styles.messageRow}>
                    <div className={styles.avatar} style={{ background: "#FFF8E1", color: "#8D6E00" }}>
                      <Icon iconName="Warning" style={{ fontSize: 15 }} />
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.systemBubble}>{m.content}</div>
                      <span className={styles.timeText}>{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Thinking — step-by-step status */}
            {isThinking && (() => {
              const steps = selectedAgent ? AGENT_STEPS : GENERAL_STEPS;
              return (
                <div className={styles.thinkingRow}>
                  <div className={`${styles.avatar} ${styles.avatarAssistant}`}>
                    <Icon iconName="ChatBot" style={{ fontSize: 15 }} />
                  </div>
                  <div className={styles.thinkingBubble}>
                    <div className={styles.stepList} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {steps.map((label, idx) => {
                        const isDone = idx < thinkingStep;
                        const isActive = idx === thinkingStep;
                        const clsName = isDone
                          ? styles.stepDone
                          : isActive
                            ? styles.stepActive
                            : styles.stepPending;

                        return (
                          <div key={label} className={`${styles.stepItem} ${clsName}`}>
                            <span className={styles.stepIcon}>
                              {isDone ? (
                                <Icon iconName="CheckMark" style={{ fontSize: 13, color: "#107C10" }} />
                              ) : isActive ? (
                                <Spinner size={SpinnerSize.xSmall} />
                              ) : (
                                <Icon iconName="CircleRing" style={{ fontSize: 12, opacity: 0.3 }} />
                              )}
                            </span>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar — pinned to bottom */}
        <InputBar
          agents={agents}
          selectedAgent={selectedAgent}
          attachedFiles={attachedFiles}
          datasetContext={datasetContext}
          isThinking={isThinking}
          onSend={handleSend}
          onSelectAgent={handleSelectAgent}
          onClearAgent={handleClearAgent}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={handleRemoveFile}
          onClearDataset={() => setDatasetContext(null)}
        />
      </div>
    </div>
  );
}
