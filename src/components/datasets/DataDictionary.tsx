import React, { useEffect, useState } from 'react';
import { Icon, Spinner, SpinnerSize, mergeStyleSets } from '@fluentui/react';
import { datasetService } from '../../services/datasetService';
import type { ColumnInfo, SampleValuesResult } from '../../types/dataset.types';

interface Props {
  datasetId: string;
  tableName: string;
  columns: ColumnInfo[];
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
  },
  sampleChip: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    background: '#F5F5F5',
    border: '1px solid #EDEDED',
    color: '#505050',
    marginRight: 4,
    marginBottom: 4,
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  loading: {
    padding: '8px 16px',
    fontSize: 11,
    color: '#707070',
  },
});

export default function DataDictionary({ datasetId, tableName, columns, onClose }: Props) {
  const [samples, setSamples] = useState<Record<string, any[]> | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingSamples(true);

    datasetService
      .getSampleValues(datasetId, tableName)
      .then((result: SampleValuesResult) => {
        if (!cancelled) setSamples(result.samples);
      })
      .catch(() => {
        if (!cancelled) setSamples(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSamples(false);
      });

    return () => { cancelled = true; };
  }, [datasetId, tableName]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          <Icon iconName="TextDocument" styles={{ root: { fontSize: 14 } }} />
          Data Dictionary: {tableName}
        </span>
        <button className={styles.closeBtn} onClick={onClose} title="Close">
          <Icon iconName="ChromeClose" />
        </button>
      </div>

      <div className={styles.tableScroll}>
        <div className="md-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Data Type</th>
                <th>Nullable</th>
                <th>Sample Values</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.name}>
                  <td style={{ fontWeight: 600 }}>{col.name}</td>
                  <td>
                    <code style={{
                      fontSize: 11,
                      background: '#E0F2F1',
                      padding: '2px 6px',
                      borderRadius: 4,
                      color: '#00695C',
                    }}>
                      {col.dataType}
                    </code>
                  </td>
                  <td>{col.nullable ? 'Yes' : 'No'}</td>
                  <td>
                    {loadingSamples ? (
                      <span className={styles.loading}>
                        <Spinner size={SpinnerSize.xSmall} />
                      </span>
                    ) : samples && samples[col.name] ? (
                      <div>
                        {samples[col.name].slice(0, 5).map((val, i) => (
                          <span key={i} className={styles.sampleChip}>
                            {val === null ? 'NULL' : String(val)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#707070', fontSize: 11 }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
