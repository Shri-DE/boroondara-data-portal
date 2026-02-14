import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';
import type { ChartData } from '../../types/agent.types';

const COLORS = ['#7C7CFF', '#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#A8A2FF'];

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E1E1E1',
  borderRadius: 4,
  color: '#1A1A1A',
  fontSize: 12,
};

interface ChartPanelProps {
  data: ChartData;
  chartType: 'bar' | 'pie' | 'line';
}

// Column names containing these hints make good chart labels
const LABEL_HINTS = [
  'name', 'code', 'type', 'status', 'category', 'department',
  'classification', 'period', 'source', 'method', 'priority',
  'label', 'title', 'description',
];

// UUID pattern for detecting UUID values in data
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Detect which columns are numeric vs categorical by inspecting actual row values.
 * Skips UUID columns and _id columns so they never appear on charts.
 */
function classifyColumns(data: ChartData) {
  const { fields, rows } = data;
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];

  for (const field of fields) {
    const name = field.name;

    // Skip columns ending in _id or named "id" (foreign/primary keys)
    if (name.endsWith('_id') || name === 'id') continue;

    const sampleValues = rows.slice(0, 10).map((r) => r[name]);
    const nonNull = sampleValues.filter((v) => v !== null && v !== undefined && v !== '');

    // Skip columns where all values look like UUIDs
    if (nonNull.length > 0 && nonNull.every((v) => UUID_RE.test(String(v)))) continue;

    const isNumeric =
      nonNull.length > 0 &&
      nonNull.every((v) => {
        if (typeof v === 'number') return true;
        const cleaned = String(v).replace(/[$,]/g, '');
        return !isNaN(Number(cleaned)) && cleaned !== '';
      });

    if (isNumeric) {
      numericCols.push(name);
    } else {
      categoricalCols.push(name);
    }
  }

  return { numericCols, categoricalCols };
}

/**
 * Pick the best label column: prefer columns whose name contains a
 * meaningful hint (name, code, type, status, category, etc.).
 */
function pickLabelCol(categoricalCols: string[], fallback: string): string {
  if (categoricalCols.length === 0) return fallback;

  const hinted = categoricalCols.find((c) =>
    LABEL_HINTS.some((h) => c.toLowerCase().includes(h))
  );
  return hinted || categoricalCols[0];
}

/**
 * Detect if a column contains currency values (starts with $ or has $ in most values).
 */
function isCurrencyColumn(rows: Record<string, any>[], colName: string): boolean {
  const samples = rows.slice(0, 10).map((r) => r[colName]);
  const withDollar = samples.filter(
    (v) => v !== null && v !== undefined && String(v).includes('$')
  );
  return withDollar.length > samples.length * 0.3;
}

/**
 * Make a human-readable axis label from a column name.
 * "Total Spend" stays as is, "total_spend" → "Total Spend"
 */
function humanLabel(col: string): string {
  // Already has spaces and mixed case — keep it
  if (/[A-Z]/.test(col) && col.includes(' ')) return col;
  // Convert snake_case or lowercase to Title Case
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Prepare chart-ready data: ensure numeric values are actual numbers,
 * and truncate long category labels.
 */
function prepareData(
  rows: Record<string, any>[],
  labelCol: string,
  numericCols: string[]
) {
  return rows.map((row) => {
    const entry: Record<string, any> = {};
    const raw = row[labelCol] ?? '';
    const label = String(raw);
    entry[labelCol] = label.length > 28 ? label.slice(0, 26) + '..' : label;

    for (const col of numericCols) {
      const val = row[col];
      if (typeof val === 'number') {
        entry[col] = val;
      } else {
        const cleaned = String(val ?? '').replace(/[$,]/g, '');
        entry[col] = isNaN(Number(cleaned)) ? 0 : Number(cleaned);
      }
    }
    return entry;
  });
}

/**
 * Format large numbers with K/M suffixes for axis ticks.
 */
function formatAxisValue(value: number, isCurrency: boolean): string {
  const prefix = isCurrency ? '$' : '';
  if (Math.abs(value) >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${prefix}${(value / 1_000).toFixed(0)}K`;
  return `${prefix}${value}`;
}

/**
 * Format tooltip values with comma separators and optional currency.
 */
function formatTooltipValue(value: number, isCurrency: boolean): string {
  if (isCurrency) {
    return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ChartPanel({ data, chartType }: ChartPanelProps) {
  const { numericCols, categoricalCols } = useMemo(() => classifyColumns(data), [data]);

  const labelCol = pickLabelCol(categoricalCols, data.fields[0]?.name || 'label');
  const valueCols = useMemo(
    () => (numericCols.length > 0 ? numericCols : [data.fields[1]?.name || 'value']),
    [numericCols, data.fields]
  );

  // Detect if primary value column is currency
  const primaryIsCurrency = useMemo(
    () => valueCols.length > 0 && isCurrencyColumn(data.rows, valueCols[0]),
    [data.rows, valueCols]
  );

  const chartData = useMemo(
    () => prepareData(data.rows, labelCol, valueCols),
    [data.rows, labelCol, valueCols]
  );

  // Human-readable axis labels
  const xLabel = humanLabel(labelCol);
  const yLabel = valueCols.length === 1 ? humanLabel(valueCols[0]) : '';

  if (!chartData.length || valueCols.length === 0) {
    return (
      <div style={panelStyle}>
        <span style={{ color: '#707070', fontSize: 13 }}>
          No numeric data available to chart.
        </span>
      </div>
    );
  }

  const yTickFormatter = (v: number) => formatAxisValue(v, primaryIsCurrency);
  const tooltipFormatter = (value: number, name: string) => [
    formatTooltipValue(value, primaryIsCurrency),
    humanLabel(name),
  ];

  return (
    <div style={panelStyle}>
      <ResponsiveContainer width="100%" height={360}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
            <XAxis
              dataKey={labelCol}
              tick={{ fill: '#707070', fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              height={70}
              interval={0}
            >
              <Label
                value={xLabel}
                position="insideBottom"
                offset={-5}
                style={{ fill: '#A0A0A0', fontSize: 11, fontWeight: 500 }}
              />
            </XAxis>
            <YAxis
              tick={{ fill: '#707070', fontSize: 11 }}
              tickFormatter={yTickFormatter}
              width={70}
            >
              {yLabel && (
                <Label
                  value={yLabel}
                  angle={-90}
                  position="insideLeft"
                  offset={0}
                  style={{ fill: '#A0A0A0', fontSize: 11, fontWeight: 500, textAnchor: 'middle' }}
                />
              )}
            </YAxis>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
              labelStyle={{ color: '#1A1A1A', fontWeight: 600 }}
            />
            {valueCols.length > 1 && (
              <Legend
                wrapperStyle={{ color: '#1A1A1A', fontSize: 12 }}
                formatter={(value) => humanLabel(value)}
              />
            )}
            {valueCols.map((col, i) => (
              <Bar
                key={col}
                dataKey={col}
                name={humanLabel(col)}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
            <XAxis
              dataKey={labelCol}
              tick={{ fill: '#707070', fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              height={70}
              interval={0}
            >
              <Label
                value={xLabel}
                position="insideBottom"
                offset={-5}
                style={{ fill: '#A0A0A0', fontSize: 11, fontWeight: 500 }}
              />
            </XAxis>
            <YAxis
              tick={{ fill: '#707070', fontSize: 11 }}
              tickFormatter={yTickFormatter}
              width={70}
            >
              {yLabel && (
                <Label
                  value={yLabel}
                  angle={-90}
                  position="insideLeft"
                  offset={0}
                  style={{ fill: '#A0A0A0', fontSize: 11, fontWeight: 500, textAnchor: 'middle' }}
                />
              )}
            </YAxis>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
              labelStyle={{ color: '#1A1A1A', fontWeight: 600 }}
            />
            {valueCols.length > 1 && (
              <Legend
                wrapperStyle={{ color: '#1A1A1A', fontSize: 12 }}
                formatter={(value) => humanLabel(value)}
              />
            )}
            {valueCols.map((col, i) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                name={humanLabel(col)}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          /* Pie chart — uses first numeric column only */
          <PieChart>
            <Pie
              data={chartData}
              dataKey={valueCols[0]}
              nameKey={labelCol}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, value }) => {
                const formatted = primaryIsCurrency
                  ? '$' + (value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toLocaleString())
                  : value.toLocaleString();
                return `${name}: ${formatted}`;
              }}
              labelLine={{ stroke: '#A0A0A0' }}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatTooltipValue(value, primaryIsCurrency)]}
            />
            <Legend
              wrapperStyle={{ color: '#1A1A1A', fontSize: 12 }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '16px 8px 8px 8px',
  borderRadius: 4,
  background: '#FAFAFA',
  border: '1px solid #EDEDED',
};
