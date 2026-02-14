import React, { useEffect, useMemo, useState } from 'react';
import { Icon, Spinner, SpinnerSize, mergeStyleSets } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { datasetService } from '../../services/datasetService';
import DataPreview from './DataPreview';
import DataDictionary from './DataDictionary';
import QuickChart from './QuickChart';
import type { DepartmentDetail as DeptDetail, TableDetail } from '../../types/dataset.types';

interface Props {
  departmentId: string;
  onBack: () => void;
}

type PanelType = 'preview' | 'dictionary' | 'chart';
type ActivePanel = { type: PanelType; table: string } | null;

const styles = mergeStyleSets({
  wrap: {
    animation: 'fadeIn 0.2s ease',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 4,
    background: '#F5F5F5',
    border: '1px solid #EDEDED',
    color: '#505050',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s',
    marginBottom: 20,
    selectors: {
      ':hover': { background: '#EBEBEB', color: '#1A1A1A' },
    },
  },
  headerCard: {
    borderRadius: 4,
    padding: 24,
    background: '#FFFFFF',
    border: '1px solid #E1E1E1',
    marginBottom: 16,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  deptName: {
    fontSize: 22,
    fontWeight: 800,
    color: '#1A1A1A',
    letterSpacing: '-0.02em',
  },
  deptDesc: {
    fontSize: 13,
    color: '#505050',
    marginTop: 4,
    lineHeight: '1.6',
  },
  metaRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
    marginTop: 12,
  },
  metaChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 500,
    background: '#F5F5F5',
    border: '1px solid #EDEDED',
    color: '#505050',
  },
  tableCard: {
    borderRadius: 4,
    background: '#FFFFFF',
    border: '1px solid #E1E1E1',
    overflow: 'hidden',
  },
  tableCardHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #E1E1E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableCardTitle: {
    fontSize: 15,
    fontWeight: 650,
    color: '#1A1A1A',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #EDEDED',
    transition: 'background 0.12s',
    selectors: {
      ':hover': { background: '#F5F5F5' },
      ':last-child': { borderBottom: 'none' },
    },
  },
  tableName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: '#1A1A1A',
    cursor: 'pointer',
    selectors: {
      ':hover': { color: '#0078D4' },
    },
  },
  tableStat: {
    fontSize: 12,
    color: '#707070',
    minWidth: 80,
    textAlign: 'right' as const,
    marginRight: 16,
  },
  actionBtns: {
    display: 'flex',
    gap: 6,
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: '#F5F5F5',
    border: '1px solid #EDEDED',
    color: '#505050',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    selectors: {
      ':hover': {
        background: '#E8F0FE',
        borderColor: 'rgba(0,120,212,0.3)',
        color: '#0078D4',
      },
    },
  },
  footerActions: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  footerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  askBtn: {
    background: '#E8F0FE',
    border: '1px solid #0078D4',
    color: '#0078D4',
    selectors: {
      ':hover': { background: '#D0E4FC' },
    },
  },
  downloadAllBtn: {
    background: '#E8F5E9',
    border: '1px solid #107C10',
    color: '#107C10',
    selectors: {
      ':hover': { background: '#D4EDD4' },
    },
  },
  loading: {
    padding: 48,
    textAlign: 'center' as const,
  },
  error: {
    padding: 24,
    color: '#D83B01',
    fontSize: 14,
  },
  panelArea: {
    marginTop: 4,
    padding: '0 20px 16px 20px',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: '1.5px solid #E1E1E1',
    background: 'transparent',
    cursor: 'pointer',
    marginRight: 10,
    appearance: 'none' as const,
    flexShrink: 0,
    transition: 'all 0.15s',
    position: 'relative' as const,
  },
  checkboxChecked: {
    background: '#0078D4',
    borderColor: '#0078D4',
  },
  selectedCount: {
    fontSize: 12,
    color: '#707070',
    padding: '8px 20px',
    borderBottom: '1px solid #EDEDED',
  },
  emptyTableNote: {
    fontSize: 11,
    color: '#707070',
    fontStyle: 'italic' as const,
  },
});

export default function DepartmentDetailView({ departmentId, onBack }: Props) {
  const navigate = useNavigate();
  const [dept, setDept] = useState<DeptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActivePanel(null);
    setSelectedTables(new Set());

    datasetService
      .getDataset(departmentId)
      .then((result) => { if (!cancelled) setDept(result); })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.response?.data?.error || 'Failed to load department details';
          setError(msg);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [departmentId]);

  // Separate tables with data from empty ones
  const tablesWithRows = useMemo(
    () => dept?.tables.filter((t) => t.rowCount > 0) || [],
    [dept]
  );
  const emptyTables = useMemo(
    () => dept?.tables.filter((t) => t.rowCount === 0) || [],
    [dept]
  );

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const handleAskQuestions = () => {
    if (!dept) return;
    // Build query params with selected tables and department
    const params = new URLSearchParams();
    if (selectedTables.size > 0) {
      params.set('tables', Array.from(selectedTables).join(','));
    }
    params.set('dept', dept.department);
    if (dept.agentId) params.set('agentId', dept.agentId);
    navigate(`/chat?${params.toString()}`);
  };

  const handleDownload = async (table: string) => {
    setDownloading(table);
    try {
      await datasetService.exportTable(departmentId, table);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const togglePanel = (type: PanelType, table: string) => {
    if (activePanel?.type === type && activePanel?.table === table) {
      setActivePanel(null);
    } else {
      setActivePanel({ type, table });
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size={SpinnerSize.large} label="Loading department..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className={styles.backBtn} onClick={onBack}>
          <Icon iconName="ChevronLeft" styles={{ root: { fontSize: 12 } }} />
          Back to Departments
        </button>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!dept) return null;

  const colorFaded = dept.color + '20';

  return (
    <div className={styles.wrap}>
      {/* Back button */}
      <button className={styles.backBtn} onClick={onBack}>
        <Icon iconName="ChevronLeft" styles={{ root: { fontSize: 12 } }} />
        Back to Departments
      </button>

      {/* Header card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div
            className={styles.iconWrap}
            style={{ background: colorFaded, border: `1px solid ${dept.color}30` }}
          >
            <Icon iconName={dept.icon} styles={{ root: { color: dept.color, fontSize: 22 } }} />
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.deptName}>{dept.department}</div>
            <div className={styles.deptDesc}>{dept.description}</div>
          </div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaChip}>
            <Icon iconName="Contact" styles={{ root: { fontSize: 12 } }} />
            {dept.owner}
          </span>
          <span className={styles.metaChip}>
            <Icon iconName="Shield" styles={{ root: { fontSize: 12 } }} />
            {dept.classification}
          </span>
          <span className={styles.metaChip}>
            <Icon iconName="Table" styles={{ root: { fontSize: 12 } }} />
            {dept.tables.length} table{dept.tables.length !== 1 ? 's' : ''}
          </span>
          <span
            className={styles.metaChip}
            style={{
              background: '#E8F5E9',
              borderColor: 'rgba(16,124,16,0.3)',
              color: '#107C10',
            }}
          >
            <Icon iconName="LockSolid" styles={{ root: { fontSize: 11 } }} />
            You have access
          </span>
        </div>
      </div>

      {/* Tables list */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <span className={styles.tableCardTitle}>
            Tables
            {tablesWithRows.length > 0 && (
              <span style={{ fontWeight: 400, fontSize: 12, color: '#707070', marginLeft: 8 }}>
                Select tables to ask questions about them
              </span>
            )}
          </span>
        </div>

        {selectedTables.size > 0 && (
          <div className={styles.selectedCount}>
            {selectedTables.size} table{selectedTables.size !== 1 ? 's' : ''} selected
          </div>
        )}

        {tablesWithRows.length === 0 && emptyTables.length === 0 ? (
          <div style={{ padding: 20, color: '#707070', fontSize: 13 }}>
            No tables available yet.
          </div>
        ) : (
          <>
            {/* Tables with data */}
            {tablesWithRows.map((table: TableDetail) => (
              <React.Fragment key={table.name}>
                <div className={styles.tableRow}>
                  <input
                    type="checkbox"
                    className={`${styles.checkbox} ${selectedTables.has(table.name) ? styles.checkboxChecked : ''}`}
                    checked={selectedTables.has(table.name)}
                    onChange={() => toggleTableSelection(table.name)}
                    title={`Select ${table.name}`}
                  />
                  <span
                    className={styles.tableName}
                    onClick={() => togglePanel('dictionary', table.name)}
                    title="View data dictionary"
                  >
                    <Icon
                      iconName="Table"
                      styles={{ root: { fontSize: 12, marginRight: 8, color: '#707070' } }}
                    />
                    {table.name}
                  </span>

                  <span className={styles.tableStat}>
                    {table.rowCount.toLocaleString()} rows
                  </span>
                  <span className={styles.tableStat}>
                    {table.columnCount} cols
                  </span>

                  <div className={styles.actionBtns}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => togglePanel('preview', table.name)}
                      title="Preview first 10 rows"
                    >
                      <Icon iconName="View" styles={{ root: { fontSize: 12 } }} />
                      Preview
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDownload(table.name)}
                      disabled={downloading === table.name}
                      title="Download as CSV"
                    >
                      <Icon iconName="Download" styles={{ root: { fontSize: 12 } }} />
                      {downloading === table.name ? 'Downloading...' : 'Download'}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => togglePanel('chart', table.name)}
                      title="Quick chart"
                    >
                      <Icon iconName="BarChart4" styles={{ root: { fontSize: 12 } }} />
                    </button>
                  </div>
                </div>

                {/* Inline panels */}
                {activePanel?.table === table.name && (
                  <div className={styles.panelArea}>
                    {activePanel.type === 'preview' && (
                      <DataPreview
                        datasetId={departmentId}
                        tableName={table.name}
                        onClose={() => setActivePanel(null)}
                      />
                    )}
                    {activePanel.type === 'dictionary' && (
                      <DataDictionary
                        datasetId={departmentId}
                        tableName={table.name}
                        columns={table.columns}
                        onClose={() => setActivePanel(null)}
                      />
                    )}
                    {activePanel.type === 'chart' && (
                      <QuickChart
                        datasetId={departmentId}
                        tableName={table.name}
                        onClose={() => setActivePanel(null)}
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Empty tables — listed but no actions */}
            {emptyTables.length > 0 && (
              <>
                <div style={{ padding: '10px 20px', borderTop: '1px solid #EDEDED' }}>
                  <span className={styles.emptyTableNote}>
                    {emptyTables.length} table{emptyTables.length !== 1 ? 's' : ''} with no data yet:
                    {' '}{emptyTables.map((t) => t.name).join(', ')}
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className={styles.footerActions}>
        <button
          className={`${styles.footerBtn} ${styles.askBtn}`}
          onClick={handleAskQuestions}
          title={selectedTables.size > 0
            ? `Ask questions about ${selectedTables.size} selected table(s)`
            : 'Ask questions about this department\'s data'
          }
        >
          <Icon iconName="ChatBot" styles={{ root: { fontSize: 15 } }} />
          Ask Questions
          {selectedTables.size > 0 && (
            <span style={{
              background: 'rgba(0,120,212,0.2)',
              padding: '1px 8px',
              borderRadius: 999,
              fontSize: 11,
              marginLeft: 4,
            }}>
              {selectedTables.size} table{selectedTables.size !== 1 ? 's' : ''}
            </span>
          )}
        </button>
        {tablesWithRows.length > 0 && (
          <button
            className={`${styles.footerBtn} ${styles.downloadAllBtn}`}
            onClick={() => {
              if (tablesWithRows[0]) handleDownload(tablesWithRows[0].name);
            }}
          >
            <Icon iconName="Download" styles={{ root: { fontSize: 15 } }} />
            Download CSV
          </button>
        )}
      </div>
    </div>
  );
}
