import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  mergeStyleSets,
  Icon,
} from '@fluentui/react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { agentService } from '../services/agentService';
import type { Agent, Message } from '../types/agent.types';
import { boroondaraPalette } from '../theme/boroondaraTheme';
import { exportTableToExcel, containsMarkdownTable } from '../utils/exportTableToExcel';
import ChartPanel from '../components/chat/ChartPanel';

/* =========================
   Styles — ChatGPT-inspired
========================= */
const styles = mergeStyleSets({
  /* Full-page wrapper — takes up all available space */
  page: {
    height: 'calc(100vh - 48px)',
    display: 'flex',
    flexDirection: 'column',
    color: boroondaraPalette.text,
    background: boroondaraPalette.bg,
    overflow: 'hidden',
  },

  /* Scrollable messages area */
  messagesScroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  /* Centered column for messages */
  messagesInner: {
    maxWidth: 820,
    width: '100%',
    margin: '0 auto',
    padding: '24px 24px 8px',
  },

  /* ---- Welcome / empty state ---- */
  welcomeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px 32px',
    textAlign: 'center',
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${boroondaraPalette.primary}, #5856D6)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0 8px 32px rgba(124,124,255,0.25)',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: boroondaraPalette.text,
    marginBottom: 8,
    letterSpacing: '-0.3px',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: boroondaraPalette.text3,
    maxWidth: 460,
    lineHeight: '1.6',
  },

  /* Example prompt chips */
  promptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
    maxWidth: 680,
    width: '100%',
    marginTop: 28,
  },
  promptChip: {
    padding: '13px 16px',
    borderRadius: 12,
    border: `1px solid ${boroondaraPalette.border}`,
    background: 'rgba(255,255,255,0.03)',
    color: boroondaraPalette.text2,
    fontSize: 13,
    lineHeight: '1.45',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.07)',
      borderColor: 'rgba(255,255,255,0.18)',
      color: boroondaraPalette.text,
    },
  },

  /* ---- Message rows ---- */
  messageRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },

  /* Avatars */
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 600,
  },
  avatarAssistant: {
    background: `linear-gradient(135deg, ${boroondaraPalette.primary}, #5856D6)`,
    color: '#fff',
  },
  avatarUser: {
    background: 'rgba(255,255,255,0.12)',
    color: boroondaraPalette.text2,
  },

  /* Message content area */
  messageContent: {
    flex: 1,
    minWidth: 0,
    maxWidth: 720,
  },

  /* User bubble */
  userBubble: {
    background: 'rgba(255,255,255,0.08)',
    padding: '12px 18px',
    borderRadius: '18px 18px 4px 18px',
    color: boroondaraPalette.text,
    fontSize: 14,
    lineHeight: '1.65',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: 'fit-content',
    maxWidth: '100%',
    marginLeft: 'auto',
  },

  /* Assistant prose — markdown rendered */
  assistantProse: {
    color: boroondaraPalette.text,
    fontSize: 14,
    lineHeight: '1.75',
  },

  /* System / error message */
  systemBubble: {
    background: 'rgba(255,200,50,0.08)',
    border: '1px solid rgba(255,200,50,0.20)',
    padding: '12px 18px',
    borderRadius: 12,
    color: '#ffd866',
    fontSize: 14,
    lineHeight: '1.65',
  },

  /* Timestamp */
  timeText: {
    fontSize: 11,
    color: boroondaraPalette.text3,
    marginTop: 6,
    display: 'block',
  },
  timeRight: {
    textAlign: 'right',
  },

  /* Citations section */
  citationsWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: `1px solid rgba(255,255,255,0.06)`,
  },
  citationsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: boroondaraPalette.text3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
  citationChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid rgba(255,255,255,0.08)`,
    fontSize: 12,
    color: boroondaraPalette.text2,
    marginRight: 8,
    marginBottom: 6,
  },

  /* Export to Excel button */
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 10,
    transition: 'all 0.15s ease',
    selectors: {
      ':hover': {
        background: 'rgba(124,124,255,0.12)',
        borderColor: 'rgba(124,124,255,0.30)',
        color: '#fff',
      },
    },
  },

  /* Chart visualisation actions row */
  chartActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  chartActionsLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.50)',
    marginRight: 2,
  },
  chartBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    selectors: {
      ':hover': {
        background: 'rgba(124,124,255,0.12)',
        borderColor: 'rgba(124,124,255,0.30)',
        color: '#fff',
      },
    },
  },
  chartBtnActive: {
    background: 'rgba(124,124,255,0.18)',
    borderColor: 'rgba(124,124,255,0.40)',
    color: '#fff',
  },

  /* ---- Thinking indicator ---- */
  thinkingRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  thinkingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 18px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid rgba(255,255,255,0.06)`,
  },
  thinkingDots: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  thinkingLabel: {
    fontSize: 13,
    color: boroondaraPalette.text3,
  },

  /* ---- Input area (footer) ---- */
  inputArea: {
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    background: boroondaraPalette.bg,
    padding: '16px 24px 20px',
  },
  inputInner: {
    maxWidth: 820,
    width: '100%',
    margin: '0 auto',
  },
  inputBox: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid rgba(255,255,255,0.10)`,
    borderRadius: 16,
    padding: '12px 16px',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    ':focus-within': {
      borderColor: 'rgba(124,124,255,0.45)',
      boxShadow: '0 0 0 3px rgba(124,124,255,0.10)',
    },
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: boroondaraPalette.text,
    fontSize: 14,
    lineHeight: '1.55',
    resize: 'none',
    fontFamily: 'inherit',
    minHeight: 24,
    maxHeight: 160,
    '::placeholder': {
      color: boroondaraPalette.text3,
    },
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    background: boroondaraPalette.primary,
    color: '#fff',
    ':hover': {
      background: '#8d8dff',
    },
  },
  sendBtnDisabled: {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.25)',
    cursor: 'not-allowed',
  },
  hint: {
    fontSize: 11,
    color: boroondaraPalette.text3,
    textAlign: 'center',
    marginTop: 10,
  },

  /* Loading page */
  loadingPage: {
    height: 'calc(100vh - 48px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* =========================
   Helpers
========================= */
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (t: any) => {
  const d = t instanceof Date ? t : new Date(t);
  return d.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
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
      if (typeof c === 'string') {
        const isUrl = /^https?:\/\//i.test(c);
        return { label: isUrl ? 'Source' : c, url: isUrl ? c : undefined };
      }
      if (typeof c === 'object') {
        const label = c.title || c.label || c.name || c.source || c.document || c.url || c.href || 'Source';
        const url = c.url || c.href || c.link;
        return {
          label: typeof label === 'string' ? label : 'Source',
          url: typeof url === 'string' ? url : undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as NormalizedCitation[];
};

/* =========================
   Markdown components
========================= */
const markdownComponents: Record<string, React.FC<any>> = {
  table: ({ children, ...props }: any) => (
    <div className="md-table-wrap">
      <table className="md-table" {...props}>{children}</table>
    </div>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return <code className="md-inline-code" {...props}>{children}</code>;
    }
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
export default function AgentInteraction() {
  const { agentId } = useParams<{ agentId: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [draft, setDraft] = useState('');
  const [activeCharts, setActiveCharts] = useState<Record<string, 'bar' | 'pie' | 'line'>>({});

  const toggleChart = (msgId: string, type: 'bar' | 'pie' | 'line') => {
    setActiveCharts((prev) => {
      if (prev[msgId] === type) {
        // Same type clicked again — hide chart
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: type };
    });
  };

  const scrollHostRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasConversation = messages.length > 0;

  const promptButtons = useMemo(
    () => agent?.exampleQueries?.filter(Boolean) ?? [],
    [agent]
  );

  /* Load agent */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!agentId) return;
      setLoadingAgent(true);
      setError(null);

      try {
        const a = await agentService.getAgent(agentId);
        if (!mounted) return;
        setAgent(a);
        // Don't add a welcome message — show the welcome UI instead
        setMessages([]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load agent.');
      } finally {
        if (mounted) setLoadingAgent(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [agentId]);

  /* Scroll handling */
  useEffect(() => {
    const host = scrollHostRef.current;
    if (!host) return;

    const onScroll = () => {
      shouldAutoScrollRef.current = isNearBottom(host);
    };

    host.addEventListener('scroll', onScroll, { passive: true });
    return () => host.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isThinking]);

  /* Auto-resize textarea */
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  /* Send message */
  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !agent) return;

    shouldAutoScrollRef.current = true;
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsThinking(true);

    const userMsg: Message = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, userMsg]);

    try {
      const resp = await agentService.queryAgent({
        agentId: agent.id,
        query: trimmed,
        sessionId,
        context: {},
      });

      if (resp?.sessionId) setSessionId(resp.sessionId);

      setMessages((p) => [
        ...p,
        {
          id: makeId(),
          role: 'assistant',
          content: resp?.response ?? '(No response returned)',
          timestamp: new Date(),
          citations: resp?.citations,
          chartData: resp?.chartData ?? undefined,
        } as Message,
      ]);
    } catch (e: any) {
      setMessages((p) => [
        ...p,
        {
          id: makeId(),
          role: 'system',
          content: `${e?.message || 'Failed to query agent.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  };

  /* Render citations */
  const renderCitations = (raw: any) => {
    const citations = normalizeCitations(raw);
    if (!citations.length) return null;

    return (
      <div className={styles.citationsWrap}>
        <div className={styles.citationsTitle}>Sources</div>
        <div>
          {citations.slice(0, 6).map((c, idx) => (
            <span key={`${c.label}-${idx}`} className={styles.citationChip}>
              <Icon iconName="Database" style={{ fontSize: 11, opacity: 0.6 }} />
              {c.url ? (
                <a href={c.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {c.label}
                </a>
              ) : (
                c.label
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

  /* ---- Renders ---- */

  if (loadingAgent) {
    return (
      <div className={styles.loadingPage}>
        <Spinner size={SpinnerSize.large} label="Loading agent..." />
      </div>
    );
  }

  const canSend = draft.trim().length > 0 && !isThinking;

  return (
    <div className={styles.page}>
      {/* Scrollable messages */}
      <div className={styles.messagesScroll} ref={scrollHostRef}>
        <div className={styles.messagesInner}>
          {/* Welcome state — shown when no messages yet */}
          {!hasConversation && (
            <div className={styles.welcomeWrap}>
              <div className={styles.welcomeIcon}>
                <Icon iconName="ChatBot" style={{ fontSize: 26, color: '#fff' }} />
              </div>
              <div className={styles.welcomeTitle}>
                {agent?.name ?? 'Agent'}
              </div>
              <div className={styles.welcomeSubtitle}>
                {agent?.description ?? `Ask me anything related to ${agent?.category}.`}
              </div>

              {error && (
                <MessageBar
                  messageBarType={MessageBarType.error}
                  isMultiline
                  styles={{ root: { marginTop: 16, maxWidth: 500, borderRadius: 8 } }}
                >
                  {error}
                </MessageBar>
              )}

              {promptButtons.length > 0 && (
                <div className={styles.promptsGrid}>
                  {promptButtons.slice(0, 6).map((p) => (
                    <button
                      key={p}
                      className={styles.promptChip}
                      onClick={() => send(p)}
                      disabled={isThinking}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message list */}
          {messages.map((m: any) => {
            const isUser = m.role === 'user';
            const isAssistant = m.role === 'assistant';
            const isSystem = m.role === 'system';

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
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    {(containsMarkdownTable(m.content) || m.chartData) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        {containsMarkdownTable(m.content) && (
                          <button
                            className={styles.exportBtn}
                            style={{ marginTop: 0 }}
                            onClick={() =>
                              exportTableToExcel(
                                m.content,
                                `export-${new Date().toISOString().slice(0, 10)}.xlsx`
                              )
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
                            {(['bar', 'pie', 'line'] as const).map((type) => (
                              <button
                                key={type}
                                className={`${styles.chartBtn} ${activeCharts[m.id] === type ? styles.chartBtnActive : ''}`}
                                onClick={() => toggleChart(m.id, type)}
                                title={`${type.charAt(0).toUpperCase() + type.slice(1)} chart`}
                              >
                                <Icon
                                  iconName={type === 'bar' ? 'BarChart4' : type === 'pie' ? 'DonutChart' : 'LineChart'}
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
                  <div className={`${styles.avatar}`} style={{ background: 'rgba(255,200,50,0.15)', color: '#ffd866' }}>
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

          {/* Thinking indicator */}
          {isThinking && (
            <div className={styles.thinkingRow}>
              <div className={`${styles.avatar} ${styles.avatarAssistant}`}>
                <Icon iconName="ChatBot" style={{ fontSize: 15 }} />
              </div>
              <div className={styles.thinkingBubble}>
                <div className={styles.thinkingDots}>
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </div>
                <span className={styles.thinkingLabel}>
                  {agent?.name} is thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area — pinned to bottom */}
      <div className={styles.inputArea}>
        <div className={styles.inputInner}>
          <div className={styles.inputBox}>
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
              placeholder={`Message ${agent?.name ?? 'agent'}...`}
            />
            <button
              className={`${styles.sendBtn} ${!canSend ? styles.sendBtnDisabled : ''}`}
              onClick={() => send(draft)}
              disabled={!canSend}
              title="Send message"
            >
              <Icon iconName="Send" style={{ fontSize: 16 }} />
            </button>
          </div>
          <div className={styles.hint}>
            <b>Enter</b> to send &nbsp;·&nbsp; <b>Shift + Enter</b> for new line
          </div>
        </div>
      </div>
    </div>
  );
}
