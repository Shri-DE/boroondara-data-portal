import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Stack,
  Text,
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  DefaultButton,
  DetailsList,
  IColumn,
  DetailsListLayoutMode,
  SelectionMode,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Icon,
  mergeStyleSets,
} from "@fluentui/react";
import { boroondaraPalette } from "../theme/boroondaraTheme";
import { accessService } from "../services/accessService";
import { datasetService } from "../services/datasetService";
import type {
  DepartmentSummary,
  DepartmentDetail,
  TableDetail,
  ColumnInfo,
} from "../types/dataset.types";

/* ── Types ── */

interface ReportResult {
  rows: Record<string, any>[];
  fields: { name: string; dataType: string | number }[];
  rowCount: number;
}

/* ── Numeric types for aggregation filter ── */

const NUMERIC_TYPES = [
  "integer",
  "bigint",
  "numeric",
  "decimal",
  "real",
  "double precision",
  "smallint",
];

const AGGREGATION_OPTIONS: IDropdownOption[] = [
  { key: "COUNT", text: "COUNT" },
  { key: "SUM", text: "SUM" },
  { key: "AVG", text: "AVG" },
];

/* ── Styles ── */

const styles = mergeStyleSets({
  page: {
    padding: 32,
    minHeight: "calc(100vh - 52px)",
    background: "#F5F5F5",
    "@media (max-width: 768px)": {
      padding: 16,
    },
  } as any,
  container: { maxWidth: 1240, margin: "0 auto" },
  headerRow: { marginBottom: 28 },
  title: {
    color: boroondaraPalette.text,
    fontWeight: 800 as any,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: boroondaraPalette.text2,
    marginTop: 6,
    maxWidth: 720,
    lineHeight: "1.6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: 16,
    marginTop: 0,
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
  } as any,
  card: {
    border: `1px solid ${boroondaraPalette.border}`,
    background: "#FFFFFF",
    borderRadius: 4,
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    "@media (max-width: 768px)": {
      padding: 14,
    },
  } as any,
  cardTitle: {
    fontSize: 16,
    fontWeight: 650 as any,
    color: boroondaraPalette.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: boroondaraPalette.text3,
    marginBottom: 14,
  },
  resultFooter: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  muted: {
    color: boroondaraPalette.text3,
    fontSize: 12,
  },
  detailsRoot: {
    selectors: {
      ".ms-DetailsHeader": {
        background: "#FAFAFA",
        borderBottom: `1px solid ${boroondaraPalette.borderSoft}`,
      },
      ".ms-DetailsHeader-cellTitle": {
        color: boroondaraPalette.text2,
        fontWeight: 600,
      },
      ".ms-DetailsRow": {
        background: "#FFFFFF",
        borderBottom: `1px solid ${boroondaraPalette.borderSoft}`,
      },
      ".ms-DetailsRow:hover": {
        background: "#F0F6FF",
      },
      ".ms-DetailsRow-cell": {
        color: boroondaraPalette.text,
        fontSize: 13,
      },
    },
  },
  tableWrap: {
    marginTop: 12,
    border: `1px solid ${boroondaraPalette.borderSoft}`,
    borderRadius: 4,
    overflow: "auto",
    maxHeight: "calc(100vh - 240px)",
    background: "#FFFFFF",
  },
  centerWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    color: boroondaraPalette.text3,
    textAlign: "center" as const,
  },
  accessDenied: {
    padding: 40,
    textAlign: "center" as const,
  },
});

/* ── Component ── */

export default function Reports() {
  /* Access guard */
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  /* Datasets */
  const [datasets, setDatasets] = useState<DepartmentSummary[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  /* Selected dataset detail */
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [datasetDetail, setDatasetDetail] = useState<DepartmentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* Table + column selections */
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [aggregation, setAggregation] = useState<string>("");
  const [aggregationColumn, setAggregationColumn] = useState<string>("");

  /* Results */
  const [result, setResult] = useState<ReportResult | null>(null);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Check access ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await accessService.get<{
          canAccessReports?: boolean;
          role?: string;
        }>("/me");
        if (!alive) return;
        const d = res.data;
        if (d.role === "admin") {
          setHasAccess(true);
        } else {
          setHasAccess(d.canAccessReports !== false);
        }
      } catch {
        // Default to allowing access if /api/me fails
        if (alive) setHasAccess(true);
      } finally {
        if (alive) setAccessChecked(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ── Load datasets ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await datasetService.getDatasets();
        if (alive) setDatasets(data);
      } catch (e) {
        console.error("Failed to load datasets:", e);
      } finally {
        if (alive) setLoadingDatasets(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ── Load dataset detail when selected ── */
  useEffect(() => {
    if (!selectedDatasetId) {
      setDatasetDetail(null);
      setSelectedTable("");
      setSelectedColumns([]);
      setGroupBy("");
      setAggregation("");
      setAggregationColumn("");
      return;
    }

    let alive = true;
    (async () => {
      setLoadingDetail(true);
      try {
        const detail = await datasetService.getDataset(selectedDatasetId);
        if (alive) {
          setDatasetDetail(detail);
          setSelectedTable("");
          setSelectedColumns([]);
          setGroupBy("");
          setAggregation("");
          setAggregationColumn("");
        }
      } catch (e: any) {
        console.error("Failed to load dataset detail:", e);
        if (alive) setDatasetDetail(null);
      } finally {
        if (alive) setLoadingDetail(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedDatasetId]);

  /* ── Reset columns when table changes ── */
  useEffect(() => {
    setSelectedColumns([]);
    setGroupBy("");
    setAggregation("");
    setAggregationColumn("");
  }, [selectedTable]);

  /* ── Derived data ── */

  const datasetOptions: IDropdownOption[] = useMemo(
    () =>
      datasets
        .filter((d) => d.status === "active" && d.hasAccess)
        .map((d) => ({ key: d.id, text: d.department })),
    [datasets]
  );

  const currentTable: TableDetail | null = useMemo(() => {
    if (!datasetDetail || !selectedTable) return null;
    return datasetDetail.tables.find((t) => t.name === selectedTable) || null;
  }, [datasetDetail, selectedTable]);

  const tableOptions: IDropdownOption[] = useMemo(() => {
    if (!datasetDetail) return [];
    return datasetDetail.tables.map((t) => ({
      key: t.name,
      text: `${t.name} (${t.rowCount.toLocaleString()} rows)`,
    }));
  }, [datasetDetail]);

  const columnOptions: IDropdownOption[] = useMemo(() => {
    if (!currentTable) return [];
    return currentTable.columns.map((c) => ({
      key: c.name,
      text: `${c.name} (${c.dataType})`,
    }));
  }, [currentTable]);

  const groupByOptions: IDropdownOption[] = useMemo(() => {
    if (selectedColumns.length === 0) return [];
    return [
      { key: "", text: "None" },
      ...selectedColumns.map((c) => ({ key: c, text: c })),
    ];
  }, [selectedColumns]);

  const numericColumns: ColumnInfo[] = useMemo(() => {
    if (!currentTable) return [];
    return currentTable.columns.filter((c) =>
      NUMERIC_TYPES.includes(c.dataType)
    );
  }, [currentTable]);

  const aggregationColumnOptions: IDropdownOption[] = useMemo(() => {
    return numericColumns.map((c) => ({
      key: c.name,
      text: `${c.name} (${c.dataType})`,
    }));
  }, [numericColumns]);

  /* ── Result columns for DetailsList ── */
  const resultColumns: IColumn[] = useMemo(() => {
    if (!result || !result.fields) return [];
    return result.fields.map((f) => ({
      key: f.name,
      name: f.name,
      fieldName: f.name,
      minWidth: 100,
      maxWidth: 250,
      isResizable: true,
      onRender: (item: Record<string, any>) => {
        const val = item[f.name];
        if (val === null || val === undefined) return <span style={{ color: "#AAA" }}>null</span>;
        if (typeof val === "number") return <span>{val.toLocaleString()}</span>;
        return <span>{String(val)}</span>;
      },
    }));
  }, [result]);

  /* ── Actions ── */

  const canRun = useMemo(() => {
    return (
      !!selectedDatasetId &&
      !!selectedTable &&
      selectedColumns.length > 0 &&
      !running
    );
  }, [selectedDatasetId, selectedTable, selectedColumns, running]);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {
      datasetId: selectedDatasetId,
      table: selectedTable,
      columns: selectedColumns.join(","),
    };
    if (groupBy) params.groupBy = groupBy;
    if (aggregation && groupBy) params.aggregation = aggregation;
    if (aggregationColumn && aggregation && groupBy) params.aggregationColumn = aggregationColumn;
    return params;
  }, [selectedDatasetId, selectedTable, selectedColumns, groupBy, aggregation, aggregationColumn]);

  const runReport = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await accessService.get<ReportResult>("/reports/query", {
        params: buildParams(),
      });
      setResult(res.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error || e?.message || "Failed to run report";
      setError(String(msg));
    } finally {
      setRunning(false);
    }
  }, [buildParams]);

  const exportCSV = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await accessService.get("/reports/export", {
        params: buildParams(),
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${selectedTable}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error || e?.message || "Failed to export report";
      setError(String(msg));
    } finally {
      setExporting(false);
    }
  }, [buildParams, selectedTable]);

  const clearAll = useCallback(() => {
    setSelectedDatasetId("");
    setDatasetDetail(null);
    setSelectedTable("");
    setSelectedColumns([]);
    setGroupBy("");
    setAggregation("");
    setAggregationColumn("");
    setResult(null);
    setError(null);
  }, []);

  /* ── Access check loading ── */
  if (!accessChecked) {
    return (
      <div className={styles.page}>
        <div className={styles.centerWrap}>
          <Spinner size={SpinnerSize.large} label="Checking access..." />
        </div>
      </div>
    );
  }

  /* ── Access denied ── */
  if (!hasAccess) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.accessDenied}>
            <MessageBar messageBarType={MessageBarType.blocked} isMultiline={false}>
              You do not have access to Reports. Contact your administrator to request access.
            </MessageBar>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerRow}>
          <Text variant="xxLarge" className={styles.title}>
            Report Builder
          </Text>
          <Text variant="medium" className={styles.subtitle}>
            Build custom reports from your datasets. Select a dataset, table, and columns — then
            run queries with optional grouping and aggregation. Export results to CSV.
          </Text>
        </div>

        <div className={styles.grid}>
          {/* ── LEFT: Report configuration ── */}
          <div className={styles.card}>
            <Text className={styles.cardTitle}>Configure Report</Text>
            <Text className={styles.cardSub}>
              Choose your data source and select the columns to include.
            </Text>

            <Stack tokens={{ childrenGap: 14 }}>
              {/* Dataset */}
              <Dropdown
                label="Dataset"
                placeholder={
                  loadingDatasets
                    ? "Loading datasets..."
                    : "Select a dataset..."
                }
                selectedKey={selectedDatasetId || undefined}
                options={datasetOptions}
                onChange={(_, opt) => setSelectedDatasetId(String(opt?.key || ""))}
                disabled={loadingDatasets}
              />

              {/* Table */}
              <Dropdown
                label="Table"
                placeholder={
                  loadingDetail
                    ? "Loading tables..."
                    : !selectedDatasetId
                    ? "Select a dataset first"
                    : "Select a table..."
                }
                selectedKey={selectedTable || undefined}
                options={tableOptions}
                onChange={(_, opt) => setSelectedTable(String(opt?.key || ""))}
                disabled={!selectedDatasetId || loadingDetail}
              />

              {/* Columns (multi-select) */}
              <Dropdown
                label="Columns"
                placeholder={
                  !selectedTable ? "Select a table first" : "Select columns..."
                }
                multiSelect
                selectedKeys={selectedColumns}
                options={columnOptions}
                onChange={(_, opt) => {
                  if (!opt) return;
                  const key = String(opt.key);
                  if (opt.selected) {
                    setSelectedColumns((prev) => [...prev, key]);
                  } else {
                    setSelectedColumns((prev) => prev.filter((c) => c !== key));
                    // Clear groupBy if deselected column was groupBy
                    if (groupBy === key) setGroupBy("");
                  }
                }}
                disabled={!selectedTable}
              />

              {/* Group By */}
              <Dropdown
                label="Group By (optional)"
                placeholder={
                  selectedColumns.length === 0
                    ? "Select columns first"
                    : "None"
                }
                selectedKey={groupBy || undefined}
                options={groupByOptions}
                onChange={(_, opt) => {
                  const key = String(opt?.key || "");
                  setGroupBy(key);
                  if (!key) {
                    setAggregation("");
                    setAggregationColumn("");
                  }
                }}
                disabled={selectedColumns.length === 0}
              />

              {/* Aggregation */}
              {groupBy && (
                <Dropdown
                  label="Aggregation"
                  placeholder="Select aggregation..."
                  selectedKey={aggregation || undefined}
                  options={AGGREGATION_OPTIONS}
                  onChange={(_, opt) => {
                    const key = String(opt?.key || "");
                    setAggregation(key);
                    if (key === "COUNT") setAggregationColumn("");
                  }}
                />
              )}

              {/* Aggregation Column — only for SUM/AVG */}
              {groupBy &&
                aggregation &&
                aggregation !== "COUNT" && (
                  <Dropdown
                    label="Aggregate Column"
                    placeholder={
                      aggregationColumnOptions.length === 0
                        ? "No numeric columns available"
                        : "Select numeric column..."
                    }
                    selectedKey={aggregationColumn || undefined}
                    options={aggregationColumnOptions}
                    onChange={(_, opt) =>
                      setAggregationColumn(String(opt?.key || ""))
                    }
                    disabled={aggregationColumnOptions.length === 0}
                  />
                )}

              {/* Action buttons */}
              <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 4 } }}>
                <PrimaryButton
                  text={running ? "Running..." : "Run Report"}
                  iconProps={{ iconName: "Play" }}
                  onClick={runReport}
                  disabled={!canRun}
                />
                <DefaultButton
                  text={exporting ? "Exporting..." : "Export CSV"}
                  iconProps={{ iconName: "Download" }}
                  onClick={exportCSV}
                  disabled={!canRun || exporting}
                />
                <DefaultButton
                  text="Clear"
                  iconProps={{ iconName: "EraseTool" }}
                  onClick={clearAll}
                />
              </Stack>
            </Stack>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className={styles.card}>
            <Text className={styles.cardTitle}>Results</Text>

            {error && (
              <MessageBar
                messageBarType={MessageBarType.error}
                isMultiline={false}
                styles={{ root: { marginBottom: 12 } }}
                onDismiss={() => setError(null)}
              >
                {error}
              </MessageBar>
            )}

            {running && (
              <div className={styles.centerWrap}>
                <Spinner size={SpinnerSize.large} label="Running report..." />
              </div>
            )}

            {!running && !result && !error && (
              <div className={styles.emptyState}>
                <Icon
                  iconName="ReportDocument"
                  styles={{
                    root: {
                      fontSize: 48,
                      color: boroondaraPalette.borderSoft,
                      marginBottom: 16,
                    },
                  }}
                />
                <Text styles={{ root: { color: boroondaraPalette.text3, fontSize: 14 } }}>
                  Configure your report on the left and click "Run Report" to see results here.
                </Text>
              </div>
            )}

            {!running && result && (
              <>
                <div className={styles.tableWrap}>
                  <div className={styles.detailsRoot}>
                    <DetailsList
                      items={result.rows}
                      columns={resultColumns}
                      selectionMode={SelectionMode.none}
                      layoutMode={DetailsListLayoutMode.justified}
                      compact
                    />
                  </div>
                </div>
                <div className={styles.resultFooter}>
                  <Text className={styles.muted}>
                    {result.rowCount.toLocaleString()} row
                    {result.rowCount !== 1 ? "s" : ""} returned
                  </Text>
                  <DefaultButton
                    text="Export CSV"
                    iconProps={{ iconName: "Download" }}
                    onClick={exportCSV}
                    disabled={exporting}
                    styles={{
                      root: {
                        height: 28,
                        fontSize: 12,
                        borderColor: boroondaraPalette.borderSoft,
                      },
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
