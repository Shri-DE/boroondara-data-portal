import React, { useEffect, useState } from 'react';
import { Icon, Spinner, SpinnerSize, mergeStyleSets } from '@fluentui/react';
import { datasetService } from '../../services/datasetService';
import type { PreviewResult } from '../../types/dataset.types';

interface Props {
  datasetId: string;
  tableName: string;
  onClose: () => void;
}

const styles = mergeStyleSets({
  wrap: {
    marginTop: 12,
    borderRadius: 4,
    border: '1px solid #E1E1E1',
    background: '#FAFAFA',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid #E1E1E1',
    background: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1A1A1A',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#707070',
    cursor: 'pointer',
    fontSize: 14,
    padding: '4px 8px',
    borderRadius: 4,
    selectors: {
      ':hover': { background: '#F0F0F0', color: '#1A1A1A' },
    },
  },
  tableScroll: {
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
  },
  empty: {
    padding: 24,
    textAlign: 'center' as const,
    color: '#707070',
    fontSize: 13,
  },
  loading: {
    padding: 24,
    textAlign: 'center' as const,
  },
  error: {
    padding: 16,
    color: '#D83B01',
    fontSize: 13,
  },
});

export default function DataPreview({ datasetId, tableName, onClose }: Props) {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    datasetService
      .getPreview(datasetId, tableName)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load preview');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [datasetId, tableName]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          <Icon iconName="View" styles={{ root: { fontSize: 14 } }} />
          Preview: {tableName} (first 10 rows)
        </span>
        <button className={styles.closeBtn} onClick={onClose} title="Close preview">
          <Icon iconName="ChromeClose" />
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <Spinner size={SpinnerSize.medium} label="Loading preview..." />
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && data && data.rows.length === 0 && (
        <div className={styles.empty}>No data in this table yet.</div>
      )}

      {!loading && !error && data && data.rows.length > 0 && (
        <div className={styles.tableScroll}>
          {/* Reuse the .md-table-wrap CSS from App.css */}
          <div className="md-table-wrap">
            <table>
              <thead>
                <tr>
                  {data.fields.map((f) => (
                    <th key={f.name}>{f.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, idx) => (
                  <tr key={idx}>
                    {data.fields.map((f) => (
                      <td key={f.name}>
                        {row[f.name] === null || row[f.name] === undefined
                          ? ''
                          : String(row[f.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
