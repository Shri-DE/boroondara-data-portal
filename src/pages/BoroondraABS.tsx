import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Icon,
  Dropdown,
  IDropdownOption,
  mergeStyleSets,
} from "@fluentui/react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { boroondaraPalette } from "../theme/boroondaraTheme";
import { accessService } from "../services/accessService";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────
interface Sa2Area { sa2_code: string; sa2_name: string; area_sqkm: number }

interface Kpis {
  total_population: number;
  avg_median_age: number;
  avg_median_household_income: number;
  avg_median_personal_income: number;
  total_dwellings: number;
  avg_median_rent: number;
  avg_median_mortgage: number;
  avg_unemployment_rate: number;
  pct_bachelor_or_higher: number;
  pct_born_overseas: number;
  sa2_count: number;
  census_year: number;
}

type Topic = "demographics" | "housing" | "income" | "education" | "employment" | "diversity";

// ── Constants ─────────────────────────────────────────
const COLORS = ["#7C7CFF","#38BDF8","#34D399","#FBBF24","#F472B6","#A78BFA","#FB923C","#06B6D4","#E11D48","#8B5CF6","#10B981","#F59E0B","#14B8A6","#D946EF"];

const TOPIC_OPTIONS: IDropdownOption[] = [
  { key: "demographics", text: "Demographics" },
  { key: "housing", text: "Housing" },
  { key: "income", text: "Income" },
  { key: "education", text: "Education" },
  { key: "employment", text: "Employment" },
  { key: "diversity", text: "Cultural Diversity" },
];

const YEAR_OPTIONS: IDropdownOption[] = [
  { key: "2021", text: "2021 Census" },
  { key: "2016", text: "2016 Census" },
];

const tooltipStyle = { backgroundColor: "#fff", border: "1px solid #E1E1E1", borderRadius: 4, color: "#1A1A1A", fontSize: 12 };

// Metric definitions per topic for the bar chart
const TOPIC_METRICS: Record<Topic, { key: string; label: string }[]> = {
  demographics: [
    { key: "population_total", label: "Population" },
    { key: "median_age", label: "Median Age" },
    { key: "persons_65_plus", label: "Persons 65+" },
  ],
  housing: [
    { key: "total_dwellings", label: "Total Dwellings" },
    { key: "median_rent_weekly", label: "Median Weekly Rent ($)" },
    { key: "median_mortgage_monthly", label: "Median Monthly Mortgage ($)" },
  ],
  income: [
    { key: "median_household_weekly", label: "Median HH Income ($/wk)" },
    { key: "median_personal_weekly", label: "Median Personal Income ($/wk)" },
    { key: "hh_income_3000_plus", label: "HH $3000+/wk" },
  ],
  education: [
    { key: "bachelor_or_higher", label: "Bachelor or Higher" },
    { key: "attending_university", label: "Attending University" },
    { key: "diploma_cert", label: "Diploma/Certificate" },
  ],
  employment: [
    { key: "unemployment_rate", label: "Unemployment Rate (%)" },
    { key: "work_from_home", label: "Work from Home" },
    { key: "commute_public_transport", label: "Public Transport" },
  ],
  diversity: [
    { key: "born_overseas", label: "Born Overseas" },
    { key: "speaks_other_language", label: "Speaks Other Language" },
    { key: "born_australia", label: "Born in Australia" },
  ],
};

// Pie chart breakdown configs
const PIE_CONFIGS: Record<Topic, { fields: { key: string; label: string }[] }> = {
  demographics: { fields: [
    { key: "persons_0_14", label: "0-14" }, { key: "persons_15_24", label: "15-24" },
    { key: "persons_25_44", label: "25-44" }, { key: "persons_45_64", label: "45-64" },
    { key: "persons_65_plus", label: "65+" },
  ]},
  housing: { fields: [
    { key: "separate_houses", label: "Separate Houses" }, { key: "semi_detached", label: "Semi-detached" },
    { key: "apartments", label: "Apartments" },
  ]},
  income: { fields: [
    { key: "hh_income_0_649", label: "$0-$649" }, { key: "hh_income_650_1249", label: "$650-$1249" },
    { key: "hh_income_1250_1999", label: "$1250-$1999" }, { key: "hh_income_2000_2999", label: "$2000-$2999" },
    { key: "hh_income_3000_plus", label: "$3000+" },
  ]},
  education: { fields: [
    { key: "bachelor_or_higher", label: "Bachelor+" }, { key: "diploma_cert", label: "Diploma/Cert" },
    { key: "year_12_or_equiv", label: "Year 12" }, { key: "below_year_12", label: "Below Year 12" },
  ]},
  employment: { fields: [
    { key: "employed_full_time", label: "Full-time" }, { key: "employed_part_time", label: "Part-time" },
    { key: "unemployed", label: "Unemployed" }, { key: "not_in_labour_force", label: "Not in LF" },
  ]},
  diversity: { fields: [
    { key: "born_australia", label: "Born Australia" }, { key: "born_overseas", label: "Born Overseas" },
  ]},
};

// ── Helpers ───────────────────────────────────────────
function fmtNum(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("en-AU");
}
function fmtCurrency(v: number | null | undefined): string {
  if (v == null) return "-";
  return "$" + v.toLocaleString("en-AU");
}
function fmtPct(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toFixed(1) + "%";
}
function truncLabel(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

// ── Styles ───────────────────────────────────────────
const p = boroondaraPalette;
const styles = mergeStyleSets({
  page: { padding: 32, minHeight: "calc(100vh - 52px)", background: "#F5F5F5", "@media (max-width: 768px)": { padding: 16 } } as any,
  container: { maxWidth: 1280, margin: "0 auto" },
  headerRow: { marginBottom: 24 },
  title: { color: p.text, fontWeight: 800 as any, fontSize: 28, letterSpacing: "-0.02em" },
  subtitle: { color: p.text2, marginTop: 6, maxWidth: 780, lineHeight: "1.6", fontSize: 14 },
  chipRow: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" } as any,
  chip: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "#fff", border: "1px solid #E1E1E1", borderRadius: 16,
    padding: "4px 12px", fontSize: 12, color: p.text2,
  },
  filterRow: {
    display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end",
    background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  } as any,
  filterLabel: { fontSize: 12, fontWeight: 600, color: p.text2, marginBottom: 4 },
  kpiGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, marginBottom: 28,
    "@media (max-width: 768px)": { gridTemplateColumns: "repeat(2, 1fr)" },
  } as any,
  kpiCard: {
    background: "#fff", borderRadius: 10, padding: "20px 18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 4,
  } as any,
  kpiLabel: { fontSize: 12, color: p.text2, fontWeight: 600 },
  kpiValue: { fontSize: 24, fontWeight: 800 as any, color: p.text },
  kpiSub: { fontSize: 11, color: p.text3 },
  chartsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28,
    "@media (max-width: 900px)": { gridTemplateColumns: "1fr" },
  } as any,
  chartCard: {
    background: "#fff", borderRadius: 10, padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  chartTitle: { fontSize: 14, fontWeight: 700, color: p.text, marginBottom: 12 },
  tableWrap: {
    background: "#fff", borderRadius: 10, padding: 20, marginBottom: 28,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflowX: "auto",
  } as any,
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 } as any,
  th: { textAlign: "left" as any, padding: "8px 10px", borderBottom: "2px solid #E1E1E1", color: p.text2, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" as any },
  td: { padding: "7px 10px", borderBottom: "1px solid #F0F0F0", color: p.text, whiteSpace: "nowrap" as any },
  agentCta: {
    background: "linear-gradient(135deg, #00695C, #00897B)", borderRadius: 12, padding: "24px 28px",
    display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
    transition: "transform 0.15s ease", ":hover": { transform: "translateY(-2px)" },
  } as any,
  agentCtaText: { color: "#fff" },
  agentCtaTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  agentCtaSub: { fontSize: 13, opacity: 0.85 },
  agentCtaIcon: { fontSize: 32, color: "#fff", opacity: 0.9 },
  error: { marginBottom: 20 },
});

// ══════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════
export default function BoroondraABS() {
  const nav = useNavigate();

  // ── State ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [sa2Areas, setSa2Areas] = useState<Sa2Area[]>([]);
  const [topicData, setTopicData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const [year, setYear] = useState("2021");
  const [topic, setTopic] = useState<Topic>("demographics");
  const [sa2, setSa2] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("population_total");

  // ── Fetch KPIs + SA2 areas on mount & year change ──
  const fetchBase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpiRes, sa2Res] = await Promise.all([
        accessService.get(`/abs/kpis?year=${year}`),
        accessService.get("/abs/sa2-areas"),
      ]);
      setKpis(kpiRes.data);
      setSa2Areas(sa2Res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load ABS data");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  // ── Fetch topic data on topic/year/sa2 change ──
  const fetchTopicData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("year", year);
      if (sa2 !== "all") params.set("sa2", sa2);

      const endpoint = topic === "diversity" ? "diversity" : topic;
      const res = await accessService.get(`/abs/${endpoint}?${params}`);
      setTopicData(res.data);
    } catch (err: any) {
      console.error("Topic data error:", err);
    }
  }, [topic, year, sa2]);

  useEffect(() => { fetchTopicData(); }, [fetchTopicData]);

  // ── Fetch comparison data for bar chart ──
  const fetchComparison = useCallback(async () => {
    try {
      const res = await accessService.get(`/abs/comparison?topic=${topic}&metric=${selectedMetric}&year=${year}`);
      setComparisonData(res.data);
    } catch (err: any) {
      console.error("Comparison error:", err);
    }
  }, [topic, selectedMetric, year]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  // ── Update selected metric when topic changes ──
  useEffect(() => {
    const metrics = TOPIC_METRICS[topic];
    if (metrics && metrics.length > 0) {
      setSelectedMetric(metrics[0].key);
    }
  }, [topic]);

  // ── SA2 dropdown options ──
  const sa2Options: IDropdownOption[] = useMemo(() => [
    { key: "all", text: "All SA2 Areas" },
    ...sa2Areas.map(a => ({ key: a.sa2_code, text: a.sa2_name })),
  ], [sa2Areas]);

  // ── Metric dropdown options ──
  const metricOptions: IDropdownOption[] = useMemo(() =>
    (TOPIC_METRICS[topic] || []).map(m => ({ key: m.key, text: m.label })),
  [topic]);

  // ── Pie data from topic data ──
  const pieData = useMemo(() => {
    const config = PIE_CONFIGS[topic];
    if (!config || topicData.length === 0) return [];

    // Aggregate across all rows if "all" selected, or use first row
    const aggregated: Record<string, number> = {};
    config.fields.forEach(f => { aggregated[f.key] = 0; });

    topicData.forEach(row => {
      config.fields.forEach(f => {
        aggregated[f.key] += Number(row[f.key]) || 0;
      });
    });

    return config.fields.map(f => ({
      name: f.label,
      value: aggregated[f.key],
    })).filter(d => d.value > 0);
  }, [topicData, topic]);

  // ── Table columns for current topic ──
  const tableColumns = useMemo(() => {
    if (topicData.length === 0) return [];
    return Object.keys(topicData[0]).filter(k => k !== "sa2_code");
  }, [topicData]);

  // ── KPI card configs ──
  const kpiCards = useMemo(() => {
    if (!kpis) return [];
    return [
      { icon: "People", color: "#7C7CFF", label: "Total Population", value: fmtNum(kpis.total_population), sub: `${kpis.census_year} Census` },
      { icon: "Calendar", color: "#38BDF8", label: "Avg Median Age", value: kpis.avg_median_age?.toFixed(1) || "-", sub: "years" },
      { icon: "Money", color: "#34D399", label: "Avg HH Income", value: fmtCurrency(kpis.avg_median_household_income), sub: "per week" },
      { icon: "Home", color: "#FBBF24", label: "Total Dwellings", value: fmtNum(kpis.total_dwellings), sub: "across all SA2s" },
      { icon: "Education", color: "#F472B6", label: "Bachelor+", value: fmtPct(kpis.pct_bachelor_or_higher), sub: "of adult population" },
      { icon: "Globe", color: "#A78BFA", label: "Born Overseas", value: fmtPct(kpis.pct_born_overseas), sub: "cultural diversity" },
    ];
  }, [kpis]);

  // ══════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════
  if (loading && !kpis) {
    return (
      <div className={styles.page}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 120 }}>
          <Spinner size={SpinnerSize.large} label="Loading ABS Census data..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header ── */}
        <div className={styles.headerRow}>
          <div className={styles.title}>Boroondara ABS Census</div>
          <div className={styles.subtitle}>
            Australian Bureau of Statistics Census data for the City of Boroondara (LGA 20310).
            Explore demographics, housing, income, education, employment and cultural diversity
            across {sa2Areas.length} SA2 statistical areas.
          </div>
          <div className={styles.chipRow}>
            <span className={styles.chip}><Icon iconName="BarChart4" styles={{ root: { fontSize: 12 } }} /> ABS Census</span>
            <span className={styles.chip}><Icon iconName="Globe" styles={{ root: { fontSize: 12 } }} /> {sa2Areas.length} SA2 Areas</span>
            <span className={styles.chip}><Icon iconName="People" styles={{ root: { fontSize: 12 } }} /> {kpis ? fmtNum(kpis.total_population) : "..."} Residents</span>
            <span className={styles.chip}><Icon iconName="Info" styles={{ root: { fontSize: 12 } }} /> Source: ABS Census 2016 & 2021</span>
          </div>
        </div>

        {error && (
          <MessageBar messageBarType={MessageBarType.error} className={styles.error}>{error}</MessageBar>
        )}

        {/* ── Filters ── */}
        <div className={styles.filterRow}>
          <div>
            <div className={styles.filterLabel}>Census Year</div>
            <Dropdown
              selectedKey={year}
              options={YEAR_OPTIONS}
              onChange={(_, opt) => opt && setYear(String(opt.key))}
              styles={{ root: { width: 160 } }}
            />
          </div>
          <div>
            <div className={styles.filterLabel}>SA2 Area</div>
            <Dropdown
              selectedKey={sa2}
              options={sa2Options}
              onChange={(_, opt) => opt && setSa2(String(opt.key))}
              styles={{ root: { width: 220 } }}
            />
          </div>
          <div>
            <div className={styles.filterLabel}>Topic</div>
            <Dropdown
              selectedKey={topic}
              options={TOPIC_OPTIONS}
              onChange={(_, opt) => opt && setTopic(opt.key as Topic)}
              styles={{ root: { width: 200 } }}
            />
          </div>
          <div>
            <div className={styles.filterLabel}>Chart Metric</div>
            <Dropdown
              selectedKey={selectedMetric}
              options={metricOptions}
              onChange={(_, opt) => opt && setSelectedMetric(String(opt.key))}
              styles={{ root: { width: 240 } }}
            />
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className={styles.kpiGrid}>
          {kpiCards.map((kpi, i) => (
            <div key={i} className={styles.kpiCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon iconName={kpi.icon} styles={{ root: { fontSize: 16, color: kpi.color } }} />
                <span className={styles.kpiLabel}>{kpi.label}</span>
              </div>
              <div className={styles.kpiValue} style={{ color: kpi.color }}>{kpi.value}</div>
              <div className={styles.kpiSub}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className={styles.chartsRow}>
          {/* Bar chart: comparison across SA2 areas */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              {metricOptions.find(m => m.key === selectedMetric)?.text || selectedMetric} by SA2 Area
            </div>
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="sa2_name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0}
                    tickFormatter={(v: string) => truncLabel(v, 14)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {comparisonData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", color: p.text3 }}>
                No comparison data available
              </div>
            )}
          </div>

          {/* Pie chart: breakdown for current topic */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              {TOPIC_OPTIONS.find(t => t.key === topic)?.text} Breakdown {sa2 !== "all" ? `- ${sa2Options.find(o => o.key === sa2)?.text}` : "- All Areas"}
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true} fontSize={11}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtNum(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", color: p.text3 }}>
                No breakdown data available
              </div>
            )}
          </div>
        </div>

        {/* ── Data Table ── */}
        <div className={styles.tableWrap}>
          <div className={styles.chartTitle}>
            {TOPIC_OPTIONS.find(t => t.key === topic)?.text} Data — {year} Census
            {sa2 !== "all" && ` — ${sa2Options.find(o => o.key === sa2)?.text}`}
          </div>
          {topicData.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableColumns.map(col => (
                    <th key={col} className={styles.th}>
                      {col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topicData.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#FAFAFA" : "#fff" }}>
                    {tableColumns.map(col => (
                      <td key={col} className={styles.td}>
                        {typeof row[col] === "number" ? fmtNum(row[col]) : String(row[col] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: p.text3 }}>
              No data available for the selected filters.
            </div>
          )}
        </div>

        {/* ── Agent CTA ── */}
        <div className={styles.agentCta} onClick={() => nav("/chat")} role="button" tabIndex={0}>
          <div className={styles.agentCtaText}>
            <div className={styles.agentCtaTitle}>Ask the Council ABS Agent</div>
            <div className={styles.agentCtaSub}>
              Get instant answers about Boroondara census data — population trends, income comparisons, housing statistics and more.
            </div>
          </div>
          <Icon iconName="ChatBot" className={styles.agentCtaIcon} />
        </div>
      </div>
    </div>
  );
}
