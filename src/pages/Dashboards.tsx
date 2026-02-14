import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Icon,
  mergeStyleSets,
} from '@fluentui/react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { keyframes } from '@fluentui/react';
import { boroondaraPalette } from '../theme/boroondaraTheme';
import { accessService } from '../services/accessService';

const spinAnimation = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

// ── Types ───────────────────────────────────────────────
interface DashboardKpis {
  totalBudget: number;
  totalRevenueBudget: number;
  totalExpenseBudget: number;
  outstandingAP: number;
  openAPInvoices: number;
  totalAssets: number;
  totalEmployees: number;
  openServiceRequests: number;
  totalProjects: number;
}

interface DashboardCharts {
  revenueVsExpenditure: { account_type: string; ytd_total: number }[];
  assetConditions: { condition_label: string; count: number }[];
  projectStatus: { status: string; project_count: number; total_budget: number; total_actual: number }[];
  serviceRequestsByStatus: { status: string; count: number }[];
  topExpenseCategories: { account_classification: string; ytd_amount: number }[];
  employeesByDepartment: { department: string; headcount: number }[];
}

interface DashboardData {
  kpis: DashboardKpis;
  charts: DashboardCharts;
  generatedAt: string;
}

// ── Constants ───────────────────────────────────────────
const COLORS = ['#7C7CFF', '#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#A8A2FF'];

const CONDITION_COLORS: Record<string, string> = {
  Excellent: '#34D399',
  Good: '#38BDF8',
  Fair: '#FBBF24',
  Poor: '#F472B6',
  'Very Poor': '#7C7CFF',
};

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E1E1E1',
  borderRadius: 4,
  color: '#1A1A1A',
  fontSize: 12,
};

// ── Helpers ─────────────────────────────────────────────
function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(value) >= 1_000) return '$' + (value / 1_000).toFixed(0) + 'K';
  return '$' + value.toLocaleString();
}

function fmtAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(0) + 'K';
  return String(value);
}

function truncLabel(label: string, max: number = 20): string {
  return label.length > max ? label.slice(0, max) + '...' : label;
}

// ── Styles ──────────────────────────────────────────────
const styles = mergeStyleSets({
  page: {
    padding: 32,
    minHeight: 'calc(100vh - 52px)',
    background: '#F5F5F5',
    '@media (max-width: 768px)': {
      padding: 16,
    },
  } as any,
  container: { maxWidth: 1240, margin: '0 auto' },
  headerRow: { marginBottom: 28 },
  title: {
    color: boroondaraPalette.text,
    fontWeight: 800 as any,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: boroondaraPalette.text2,
    marginTop: 6,
    maxWidth: 720,
    lineHeight: '1.6',
  },
  timestamp: {
    color: boroondaraPalette.text3,
    fontSize: 12,
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  // KPI row
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 28,
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
    },
  } as any,
  kpiCard: {
    padding: 22,
    '@media (max-width: 768px)': {
      padding: 14,
    },
    borderRadius: 4,
    background: '#FFFFFF',
    border: '1px solid #E1E1E1',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    color: boroondaraPalette.text3,
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as any,
    fontWeight: 600 as any,
    marginBottom: 8,
  },
  kpiValue: {
    color: boroondaraPalette.text,
    fontWeight: 700 as any,
    fontSize: 28,
    lineHeight: '36px',
    letterSpacing: '-0.02em',
    marginBottom: 4,
    '@media (max-width: 768px)': {
      fontSize: 22,
      lineHeight: '28px',
    },
  } as any,
  kpiHint: { color: boroondaraPalette.text3, fontSize: 12 },
  // Charts
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
    marginBottom: 20,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  } as any,
  chartCard: {
    padding: 24,
    borderRadius: 4,
    background: '#FFFFFF',
    border: '1px solid #EDEDED',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    '@media (max-width: 768px)': {
      padding: 14,
    },
  } as any,
  chartTitle: {
    color: boroondaraPalette.text,
    fontWeight: 600 as any,
    fontSize: 15,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  // Loading / Error
  centerWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  noData: {
    color: boroondaraPalette.text3,
    fontSize: 13,
    textAlign: 'center' as any,
    padding: 40,
  },
  refreshBtn: {
    marginLeft: 4,
    color: boroondaraPalette.primary,
    fontSize: 12,
    fontWeight: 600 as any,
    height: 28,
    padding: '0 10px',
    borderRadius: 4,
    border: `1px solid ${boroondaraPalette.borderSoft}`,
    background: '#FFFFFF',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
    selectors: {
      ':hover': { background: '#F0F6FF', borderColor: boroondaraPalette.primary },
      ':disabled': { opacity: 0.6, cursor: 'default' },
    },
  } as any,
  spinning: {
    animationName: spinAnimation,
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
    display: 'inline-block',
  },
});

// ── KPI Card Component ──────────────────────────────────
interface KpiDef {
  icon: string;
  color: string;
  bg: string;
  label: string;
  value: string;
  hint: string;
}

function KpiCard({ icon, color, bg, label, value, hint }: KpiDef) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIconWrap} style={{ background: bg, border: `1px solid ${color}30` }}>
        <Icon iconName={icon} styles={{ root: { color, fontSize: 16 } }} />
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiHint}>{hint}</div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────
export default function Dashboards() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  // Check access
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await accessService.get<{
          canAccessDashboard?: boolean;
          role?: string;
        }>('/me');
        if (!alive) return;
        const d = res.data;
        if (d.role === 'admin') {
          setHasAccess(true);
        } else {
          setHasAccess(d.canAccessDashboard !== false);
        }
      } catch {
        if (alive) setHasAccess(true);
      } finally {
        if (alive) setAccessChecked(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await accessService.get<DashboardData>('/dashboard/summary');
      setData(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load dashboard';
      setError(String(msg));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (accessChecked && hasAccess) {
      loadDashboard(false);
    }
  }, [loadDashboard, accessChecked, hasAccess]);

  // ── Access check loading ──
  if (!accessChecked) {
    return (
      <div className={styles.page}>
        <div className={styles.centerWrap}>
          <Spinner size={SpinnerSize.large} label="Checking access..." />
        </div>
      </div>
    );
  }

  // ── Access denied ──
  if (!hasAccess) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <MessageBar messageBarType={MessageBarType.blocked} isMultiline={false}>
              You do not have access to Dashboards. Contact your administrator to request access.
            </MessageBar>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.centerWrap}>
          <Spinner size={SpinnerSize.large} label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error || 'No data available'}
          </MessageBar>
        </div>
      </div>
    );
  }

  const { kpis, charts } = data;

  // Build KPI definitions
  const kpiCards: KpiDef[] = [
    {
      icon: 'Money',
      color: '#7C7CFF',
      bg: 'rgba(124,124,255,0.12)',
      label: 'TOTAL BUDGET FY2025',
      value: fmtCurrency(kpis.totalBudget),
      hint: 'Operating + Capital',
    },
    {
      icon: 'TrendingUp',
      color: '#34D399',
      bg: 'rgba(52,211,153,0.12)',
      label: 'REVENUE YTD',
      value: fmtCurrency(
        charts.revenueVsExpenditure.find((r) => r.account_type === 'Revenue')?.ytd_total || 0
      ),
      hint: 'General Ledger',
    },
    {
      icon: 'PaymentCard',
      color: '#F472B6',
      bg: 'rgba(244,114,182,0.12)',
      label: 'OUTSTANDING AP',
      value: fmtCurrency(kpis.outstandingAP),
      hint: `${kpis.openAPInvoices} invoices`,
    },
    {
      icon: 'Manufacturing',
      color: '#38BDF8',
      bg: 'rgba(56,189,248,0.12)',
      label: 'ACTIVE ASSETS',
      value: kpis.totalAssets.toLocaleString(),
      hint: 'Tracked in register',
    },
    {
      icon: 'Ringer',
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.12)',
      label: 'OPEN REQUESTS',
      value: kpis.openServiceRequests.toLocaleString(),
      hint: 'Customer service',
    },
  ];

  const updatedAt = new Date(data.generatedAt).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header ── */}
        <div className={styles.headerRow}>
          <Text variant="xxLarge" className={styles.title}>
            Council Dashboard
          </Text>
          <Text variant="medium" className={styles.subtitle}>
            Live overview of key metrics across finance, assets, projects, customer service and
            workforce — powered by real-time data from the council database.
          </Text>
          <div className={styles.timestamp}>
            <Icon iconName="Clock" styles={{ root: { fontSize: 12, color: boroondaraPalette.text3 } }} />
            Last updated: {updatedAt}
            <button
              className={styles.refreshBtn}
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <Icon
                iconName="Sync"
                className={refreshing ? styles.spinning : undefined}
                styles={{ root: { fontSize: 12 } }}
              />
              {refreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className={styles.kpiRow}>
          {kpiCards.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* ── Row 1: Finance charts ── */}
        <div className={styles.chartsRow}>
          {/* Top Expense Categories — horizontal bar */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Icon iconName="BarChartVertical" styles={{ root: { color: '#7C7CFF', fontSize: 16 } }} />
              Top Expense Categories
            </div>
            {charts.topExpenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={charts.topExpenseCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEDED" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#707070' }} />
                  <YAxis
                    type="category"
                    dataKey="account_classification"
                    width={120}
                    tick={{ fontSize: 11, fill: '#505050' }}
                    tickFormatter={(v: string) => truncLabel(v, 18)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [fmtCurrency(value), 'YTD Amount']}
                  />
                  <Bar dataKey="ytd_amount" fill="#7C7CFF" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No expense data available</div>
            )}
          </div>

          {/* Revenue vs Expenditure — bar */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Icon iconName="Money" styles={{ root: { color: '#34D399', fontSize: 16 } }} />
              Revenue vs Expenditure
            </div>
            {charts.revenueVsExpenditure.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.revenueVsExpenditure} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEDED" />
                  <XAxis dataKey="account_type" tick={{ fontSize: 12, fill: '#505050' }} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#707070' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [fmtCurrency(value), 'YTD Total']}
                  />
                  <Bar dataKey="ytd_total" radius={[4, 4, 0, 0]} barSize={60}>
                    {charts.revenueVsExpenditure.map((entry, idx) => (
                      <Cell
                        key={entry.account_type}
                        fill={entry.account_type === 'Revenue' ? '#34D399' : entry.account_type === 'Expense' ? '#7C7CFF' : COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No GL data available</div>
            )}
          </div>
        </div>

        {/* ── Row 2: Operations charts ── */}
        <div className={styles.chartsRow}>
          {/* Asset Condition — donut */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Icon iconName="Manufacturing" styles={{ root: { color: '#38BDF8', fontSize: 16 } }} />
              Asset Condition Distribution
            </div>
            {charts.assetConditions.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.assetConditions}
                    dataKey="count"
                    nameKey="condition_label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    label={({ condition_label, percent }) =>
                      `${condition_label} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {charts.assetConditions.map((entry) => (
                      <Cell
                        key={entry.condition_label}
                        fill={CONDITION_COLORS[entry.condition_label] || COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No condition data available</div>
            )}
          </div>

          {/* Service Requests by Status — donut */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Icon iconName="Ringer" styles={{ root: { color: '#FBBF24', fontSize: 16 } }} />
              Service Requests by Status
            </div>
            {charts.serviceRequestsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.serviceRequestsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    label={({ status, percent }) =>
                      `${status} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {charts.serviceRequestsByStatus.map((entry, idx) => (
                      <Cell key={entry.status} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No service request data available</div>
            )}
          </div>
        </div>

        {/* ── Row 3: Projects & People ── */}
        <div className={styles.chartsRow}>
          {/* Capital Projects — grouped bar */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Icon iconName="TaskManager" styles={{ root: { color: '#FBBF24', fontSize: 16 } }} />
              Capital Projects: Budget vs Actual
            </div>
            {charts.projectStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.projectStatus} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEDED" />
                  <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#505050' }} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#707070' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      fmtCurrency(value),
                      name === 'total_budget' ? 'Budget' : 'Actual',
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => (value === 'total_budget' ? 'Budget' : 'Actual')}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="total_budget" fill="#38BDF8" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="total_actual" fill="#7C7CFF" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No project data available</div>
            )}
          </div>

          {/* Staff by Department — horizontal bar */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              <Icon iconName="People" styles={{ root: { color: '#F472B6', fontSize: 16 } }} />
              Staff by Department
            </div>
            {charts.employeesByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={charts.employeesByDepartment}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEDED" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#707070' }} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={130}
                    tick={{ fontSize: 11, fill: '#505050' }}
                    tickFormatter={(v: string) => truncLabel(v, 20)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [value, 'Headcount']}
                  />
                  <Bar dataKey="headcount" fill="#F472B6" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No employee data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
