/** Types for the Self-Serve Datasets feature */

export interface DepartmentSummary {
  id: string;
  department: string;
  icon: string;
  color: string;
  classification: string;
  owner: string;
  ownerEmail: string;
  agentId: string | null;
  description: string;
  status: 'active' | 'coming_soon';
  tableCount: number;
  totalRows: number;
  hasAccess: boolean;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
}

export interface TableDetail {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
}

export interface DepartmentDetail {
  id: string;
  department: string;
  icon: string;
  color: string;
  classification: string;
  owner: string;
  ownerEmail: string;
  agentId: string | null;
  description: string;
  status: 'active' | 'coming_soon';
  hasAccess: boolean;
  tables: TableDetail[];
}

export interface PreviewResult {
  table: string;
  rows: Record<string, any>[];
  fields: { name: string; dataType: string | number }[];
  rowCount: number;
}

export interface SampleValuesResult {
  table: string;
  samples: Record<string, any[]>;
}
