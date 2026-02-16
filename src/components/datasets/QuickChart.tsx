import React, { useEffect, useState } from 'react';
import { Icon, Spinner, SpinnerSize, mergeStyleSets } from '@fluentui/react';
import { datasetService } from '../../services/datasetService';
import ChartPanel from '../chat/ChartPanel';
import type { PreviewResult } from '../../types/dataset.types';
import type { ChartData } from '../../types/agent.types';

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
  chartTypeRow: {
    display: 'flex',
    gap: 6,
    padding: '10px 16px 0 16px',
  },
  chartTypeBtn: {
    padding: '5px 12px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid #EDEDED',
    background: '#F5F5F5',
    color: '#505050',
    cursor: 'pointer',
    transition: 'all 0.15s',
    selectors: {
      ':hover': { background: '#EBEBEB' },
    },
  },
  chartTypeBtnActive: {
    background: '#E0F2F1',
    borderColor: 'rgba(0,120,212,0.4)',
    color: '#00695C',
  },
  chartWrap: {
    padding: '0 8px 8px 8px',
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
});

type ChartType = 'bar' | 'pie' | 'line';

export default function QuickChart({ datasetId, tableName, onClose }: Props) {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    datasetService
      .getChartData(datasetId, tableName)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.error || 'Failed to load chart data'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [datasetId, tableName]);

  // Convert preview data to ChartData format
  const chartData: ChartData | null = data && data.rows.length > 0
    ? {
        rows: data.rows,
        fields: data.fields.map((f) => ({
          name: f.name,
          dataType: typeof f.dataType === 'number' ? f.dataType : f.dataType,
        })),
        rowCount: data.rows.length,
      }
    : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          <Icon iconName="BarChart4" styles={{ root: { fontSize: 14 } }} />
          Quick Chart: {tableName}
        </span>
        <button className={styles.closeBtn} onClick={onClose} title="Close">
          <Icon iconName="ChromeClose" />
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <Spinner size={SpinnerSize.medium} label="Loading chart data..." />
        </div>
      )}

      {error && (
        <div style={{ padding: 16, color: '#D83B01', fontSize: 13 }}>{error}</div>
      )}

      {!loading && !error && !chartData && (
        <div className={styles.empty}>No data available to chart.</div>
      )}

      {!loading && !error && chartData && (
        <>
          <div className={styles.chartTypeRow}>
            {(['bar', 'line', 'pie'] as ChartType[]).map((type) => (
              <button
                key={type}
                className={`${styles.chartTypeBtn} ${chartType === type ? styles.chartTypeBtnActive : ''}`}
                onClick={() => setChartType(type)}
              >
                {type === 'bar' ? 'Bar' : type === 'line' ? 'Line' : 'Pie'}
              </button>
            ))}
          </div>
          <div className={styles.chartWrap}>
            <ChartPanel data={chartData} chartType={chartType} />
          </div>
        </>
      )}
    </div>
  );
}
