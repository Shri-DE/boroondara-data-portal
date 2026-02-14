import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, Text, Icon, TextField, mergeStyleSets, Spinner, SpinnerSize } from '@fluentui/react';
import { datasetService } from '../services/datasetService';
import DepartmentTile from '../components/datasets/DepartmentTile';
import DepartmentDetailView from '../components/datasets/DepartmentDetail';
import type { DepartmentSummary } from '../types/dataset.types';

/* ---------- Filter Types ---------- */
type StatusFilter = 'all' | 'active' | 'coming_soon';
type AccessFilter = 'all' | 'has_access' | 'locked';

/* ---------- Styles ---------- */
const styles = mergeStyleSets({
  page: {
    padding: 32,
    minHeight: 'calc(100vh - 52px)',
    background: '#FFFFFF',
    '@media (max-width: 768px)': {
      padding: 16,
    },
  } as any,
  container: {
    maxWidth: 1320,
    margin: '0 auto',
  },
  headerRow: {
    marginBottom: 24,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#505050',
    marginTop: 6,
    maxWidth: 720,
    lineHeight: '1.6',
  },
  chipRow: {
    marginTop: 14,
    flexWrap: 'wrap' as const,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 999,
    background: '#F5F5F5',
    border: '1px solid #EDEDED',
    color: '#505050',
    fontSize: 12,
    fontWeight: 500,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  },
  searchBox: {
    maxWidth: 340,
    flex: 1,
    '@media (max-width: 768px)': {
      maxWidth: '100%',
      minWidth: '100%',
    },
  } as any,
  filterGroup: {
    display: 'flex',
    gap: 4,
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid #EDEDED',
    background: '#F5F5F5',
    color: '#505050',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    selectors: {
      ':hover': {
        background: '#EBEBEB',
      },
    },
  },
  filterBtnActive: {
    background: '#E8F0FE',
    borderColor: 'rgba(0,120,212,0.4)',
    color: '#0078D4',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: 16,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: 12,
    },
  } as any,
  countText: {
    color: '#707070',
    fontSize: 12,
    marginBottom: 12,
  },
  loading: {
    padding: 64,
    textAlign: 'center' as const,
  },
  error: {
    padding: 24,
    borderRadius: 4,
    background: 'rgba(216,59,1,0.08)',
    border: '1px solid rgba(216,59,1,0.2)',
    color: '#D83B01',
    fontSize: 14,
  },
  emptyState: {
    padding: 48,
    textAlign: 'center' as const,
    color: '#707070',
    fontSize: 14,
  },
});

/* ---------- Component ---------- */

export default function Datasets() {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // Load departments
  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetService.getDatasets();
      setDepartments(data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load datasets';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Filter departments
  const filtered = useMemo(() => {
    let result = departments;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.department.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Access filter
    if (accessFilter === 'has_access') {
      result = result.filter((d) => d.hasAccess);
    } else if (accessFilter === 'locked') {
      result = result.filter((d) => !d.hasAccess && d.status === 'active');
    }

    return result;
  }, [departments, search, statusFilter, accessFilter]);

  // Count stats
  const activeCount = departments.filter((d) => d.status === 'active').length;
  const comingSoonCount = departments.filter((d) => d.status === 'coming_soon').length;

  // If a department is selected, show detail view
  if (selectedDeptId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <DepartmentDetailView
            departmentId={selectedDeptId}
            onBack={() => setSelectedDeptId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerRow}>
          <Text variant="xxLarge" className={styles.title}>
            Self-Serve Datasets
          </Text>
          <Text variant="medium" className={styles.subtitle}>
            Discover, explore and download governed datasets across council departments.
            Each dataset is classified, owned and access-controlled through Entra ID and role-based permissions.
          </Text>
          <Stack horizontal tokens={{ childrenGap: 10 }} className={styles.chipRow}>
            <span className={styles.chip}>
              <Icon iconName="Lock" /> Entra ID secured
            </span>
            <span className={styles.chip}>
              <Icon iconName="Shield" /> Governed access
            </span>
            <span className={styles.chip}>
              <Icon iconName="Database" /> Fabric Warehouse
            </span>
            <span className={styles.chip}>
              <Icon iconName="Globe" /> Australia East
            </span>
          </Stack>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.loading}>
            <Spinner size={SpinnerSize.large} label="Loading departments..." />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.error}>
            {error}
            <button
              style={{
                marginLeft: 16,
                padding: '4px 12px',
                borderRadius: 4,
                background: '#F5F5F5',
                border: '1px solid #E1E1E1',
                color: '#1A1A1A',
                cursor: 'pointer',
                fontSize: 12,
              }}
              onClick={loadDepartments}
            >
              Retry
            </button>
          </div>
        )}

        {/* Controls & Grid */}
        {!loading && !error && (
          <>
            {/* Search & Filters */}
            <div className={styles.controls}>
              <div className={styles.searchBox}>
                <TextField
                  placeholder="Search departments..."
                  value={search}
                  onChange={(_, v) => setSearch(v || '')}
                  iconProps={{ iconName: 'Search' }}
                  styles={{
                    root: { borderRadius: 4 },
                    fieldGroup: {
                      background: '#FFFFFF',
                      border: '1px solid #E1E1E1',
                      borderRadius: 4,
                      selectors: {
                        ':hover': { borderColor: '#D0D0D0' },
                      },
                    },
                    field: { color: '#1A1A1A', fontSize: 13 },
                  }}
                />
              </div>

              {/* Status filter */}
              <div className={styles.filterGroup}>
                {([
                  { key: 'all', label: `All (${departments.length})` },
                  { key: 'active', label: `Active (${activeCount})` },
                  { key: 'coming_soon', label: `Coming Soon (${comingSoonCount})` },
                ] as { key: StatusFilter; label: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    className={`${styles.filterBtn} ${statusFilter === opt.key ? styles.filterBtnActive : ''}`}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Access filter */}
              <div className={styles.filterGroup}>
                {([
                  { key: 'all', label: 'Any Access' },
                  { key: 'has_access', label: 'My Access' },
                  { key: 'locked', label: 'Locked' },
                ] as { key: AccessFilter; label: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    className={`${styles.filterBtn} ${accessFilter === opt.key ? styles.filterBtnActive : ''}`}
                    onClick={() => setAccessFilter(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result count */}
            <div className={styles.countText}>
              Showing {filtered.length} of {departments.length} departments
            </div>

            {/* Grid of tiles */}
            {filtered.length > 0 ? (
              <div className={styles.grid}>
                {filtered.map((dept) => (
                  <DepartmentTile
                    key={dept.id}
                    dept={dept}
                    onClick={() => setSelectedDeptId(dept.id)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Icon
                  iconName="SearchIssue"
                  styles={{ root: { fontSize: 32, marginBottom: 12, display: 'block' } }}
                />
                No departments match your search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
