import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Stack,
  Text,
  TextField,
  DefaultButton,
  PrimaryButton,
  DetailsList,
  IColumn,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Dropdown,
  IDropdownOption,
  Toggle,
  mergeStyleSets,
  DetailsListLayoutMode,
  SelectionMode,
  Pivot,
  PivotItem,
  Callout,
  DirectionalHint,
  Icon,
  IconButton,
  Dialog,
  DialogFooter,
  DialogType,
} from "@fluentui/react";

import { accessService } from "../services/accessService";
import { agentService } from "../services/agentService";
import { datasetService } from "../services/datasetService";
import { graphService, type GraphSearchResult } from "../services/graphService";
import type { Agent } from "../types/agent.types";
import type { DepartmentSummary } from "../types/dataset.types";

/* ---------- Types ---------- */

type PortalUser = {
  upn: string;
  role: "admin" | "user";
  isActive: boolean;
  allowedAgents?: string[];
  allowedDatasets?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Azure AD enrichment
  type?: "user" | "group";
  displayName?: string;
  objectId?: string;
  // Page access toggles
  canAccessDashboard?: boolean;
  canAccessReports?: boolean;
};

type CatalogueDataset = {
  id: string;
  department: string;
  icon: string;
  color: string;
  classification: string;
  owner: string;
  ownerEmail: string;
  agentId: string | null;
  description: string;
  tables: string[];
  status: "active" | "coming_soon";
};

/* ---------- Styles ---------- */

const styles = mergeStyleSets({
  page: {
    padding: "32px",
    background: "#F5F5F5",
    minHeight: "calc(100vh - 60px)",
    color: "#1A1A1A",
    "@media (max-width: 768px)": {
      padding: "16px",
    },
  } as any,
  container: {
    maxWidth: 1240,
    margin: "0 auto",
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: -0.2,
    "@media (max-width: 768px)": {
      fontSize: 22,
    },
  } as any,
  subtitle: {
    marginTop: 6,
    color: "#505050",
    fontSize: 13,
    maxWidth: 900,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 460px",
    gap: 16,
    marginTop: 18,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  } as any,

  card: {
    border: "1px solid #E1E1E1",
    background: "#FFFFFF",
    borderRadius: 4,
    padding: 16,
    "@media (max-width: 768px)": {
      padding: 12,
    },
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 650,
    color: "#1A1A1A",
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#707070",
  },

  toolbar: {
    marginTop: 12,
  },

  tableWrap: {
    marginTop: 12,
    border: "1px solid #EDEDED",
    borderRadius: 4,
    overflow: "auto",
    background: "#FFFFFF",
    "-webkit-overflow-scrolling": "touch",
  } as any,

  detailsRoot: {
    selectors: {
      ".ms-DetailsHeader": {
        background: "#FAFAFA",
        borderBottom: "1px solid #EDEDED",
      },
      ".ms-DetailsHeader-cellTitle": {
        color: "#505050",
        fontWeight: 600,
      },
      ".ms-DetailsRow": {
        background: "#FFFFFF",
        borderBottom: "1px solid #EDEDED",
        cursor: "pointer",
      },
      ".ms-DetailsRow:hover": {
        background: "#F0F6FF",
      },
      ".ms-DetailsRow-cell": {
        color: "#1A1A1A",
      },
    },
  },

  pill: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #EDEDED",
    background: "#F5F5F5",
    color: "#505050",
  },

  groupPill: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    border: "1px solid #80CBC4",
    background: "#E0F2F1",
    color: "#00695C",
    marginLeft: 6,
  },

  agentPill: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid #EDEDED",
    background: "#E0F2F1",
    color: "#1A1A1A",
    marginRight: 4,
    marginBottom: 4,
  },

  datasetPill: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid rgba(16,124,16,0.3)",
    background: "#E8F5E9",
    color: "#107C10",
    marginRight: 4,
    marginBottom: 4,
  },

  muted: {
    color: "#707070",
    fontSize: 12,
  },

  formActions: {
    marginTop: 10,
  },

  /* Azure AD search results callout */
  searchResultItem: {
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #EDEDED",
    transition: "background 0.15s",
    selectors: {
      ":hover": {
        background: "#F5F5F5",
      },
    },
  },
  searchResultName: {
    fontWeight: 600,
    color: "#1A1A1A",
    fontSize: 13,
  },
  searchResultSub: {
    fontSize: 11,
    color: "#707070",
    marginTop: 2,
  },

  /* Selected entity chip */
  selectedChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#E0F2F1",
    border: "1px solid rgba(0,120,212,0.25)",
    padding: "8px 14px",
    borderRadius: 4,
    marginTop: 8,
  },
  selectedChipName: {
    fontWeight: 600,
    color: "#1A1A1A",
    fontSize: 13,
  },
  selectedChipSub: {
    color: "#707070",
    fontSize: 11,
  },

  editBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#E0F2F1",
    border: "1px solid rgba(0,120,212,0.25)",
    padding: "8px 12px",
    borderRadius: 4,
    marginBottom: 8,
  },
  editBannerText: {
    fontWeight: 600,
    color: "#00695C",
    fontSize: 13,
    flex: 1,
  },

  tablePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    border: "1px solid #EDEDED",
    background: "#F5F5F5",
    color: "#1A1A1A",
  },
  tableList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
    marginBottom: 10,
  },
});

/* ---------- Constants ---------- */

const roleOptions: IDropdownOption[] = [
  { key: "user", text: "User" },
  { key: "admin", text: "Admin" },
];

/* ---------- API helpers ---------- */

async function apiGetUsers(): Promise<PortalUser[]> {
  const res = await accessService.get<PortalUser[]>("/admin/users");
  return res.data;
}

async function apiUpsertUser(payload: {
  upn: string;
  role: "admin" | "user";
  isActive: boolean;
  allowedAgents?: string[];
  allowedDatasets?: string[];
  type?: "user" | "group";
  displayName?: string;
  objectId?: string;
  canAccessDashboard?: boolean;
  canAccessReports?: boolean;
}): Promise<PortalUser> {
  const res = await accessService.post<PortalUser>("/admin/users", payload);
  return res.data;
}

async function apiDeleteUser(identifier: string): Promise<void> {
  await accessService.delete(`/admin/users/${encodeURIComponent(identifier)}`);
}

async function apiGetAdminDatasets(): Promise<CatalogueDataset[]> {
  const res = await accessService.get<CatalogueDataset[]>("/admin/datasets");
  return res.data;
}

async function apiUpsertDataset(payload: CatalogueDataset): Promise<CatalogueDataset> {
  const res = await accessService.post<CatalogueDataset>("/admin/datasets", payload);
  return res.data;
}

async function apiDeleteDataset(id: string): Promise<void> {
  await accessService.delete(`/admin/datasets/${encodeURIComponent(id)}`);
}

async function apiGetAvailableTables(): Promise<string[]> {
  const res = await accessService.get<string[]>("/admin/tables");
  return res.data;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ========== Component ========== */

export default function Admin() {
  /* --- top-level tab --- */
  const [activeTab, setActiveTab] = useState<"users" | "datasets">("users");

  /* --- data --- */
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [datasets, setDatasets] = useState<DepartmentSummary[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  /* --- dataset management state --- */
  const [adminDatasets, setAdminDatasets] = useState<CatalogueDataset[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [editingDataset, setEditingDataset] = useState<CatalogueDataset | null>(null);
  const [dsId, setDsId] = useState("");
  const [dsDepartment, setDsDepartment] = useState("");
  const [dsDescription, setDsDescription] = useState("");
  const [dsOwner, setDsOwner] = useState("");
  const [dsOwnerEmail, setDsOwnerEmail] = useState("");
  const [dsIcon, setDsIcon] = useState("Database");
  const [dsColor, setDsColor] = useState("#6366F1");
  const [dsClassification, setDsClassification] = useState("OFFICIAL");
  const [dsAgentId, setDsAgentId] = useState("");
  const [dsStatus, setDsStatus] = useState<"active" | "coming_soon">("coming_soon");
  const [dsTables, setDsTables] = useState<string[]>([]);
  const [savingDs, setSavingDs] = useState(false);
  const [showDeleteDsDialog, setShowDeleteDsDialog] = useState(false);
  const [deletingDs, setDeletingDs] = useState(false);

  /* --- form state --- */
  const [entityType, setEntityType] = useState<"user" | "group">("user");
  const [upn, setUpn] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isActive, setIsActive] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [canAccessDashboard, setCanAccessDashboard] = useState(true);
  const [canAccessReports, setCanAccessReports] = useState(true);

  /* --- Azure AD search state --- */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GraphSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [graphError, setGraphError] = useState<string | null>(null);

  /* --- edit mode state --- */
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  /* --- load agents --- */
  useEffect(() => {
    (async () => {
      try {
        const data = await agentService.getAgents();
        setAgents(data);
      } catch (e) {
        console.error("Failed to load agents:", e);
      } finally {
        setLoadingAgents(false);
      }
    })();
  }, []);

  const agentOptions: IDropdownOption[] = useMemo(
    () => agents.map((a) => ({ key: a.id, text: a.name })),
    [agents]
  );

  /* --- load datasets --- */
  useEffect(() => {
    (async () => {
      try {
        const data = await datasetService.getDatasets();
        setDatasets(data);
      } catch (e) {
        console.error("Failed to load datasets:", e);
      } finally {
        setLoadingDatasets(false);
      }
    })();
  }, []);

  const datasetOptions: IDropdownOption[] = useMemo(
    () =>
      datasets
        .filter((d) => d.status === "active")
        .map((d) => ({ key: d.id, text: d.department })),
    [datasets]
  );

  /* --- load users --- */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const data = await apiGetUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to load users";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* --- debounced Azure AD search --- */
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setGraphError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setGraphError(null);
      try {
        const results = await graphService.search(
          searchQuery,
          entityType === "group" ? "group" : "user"
        );
        setSearchResults(results);
        setShowResults(true);
      } catch (err: any) {
        console.error("Azure AD search failed:", err);
        const msg = err?.message || "Search failed";
        if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Authorization")) {
          setGraphError(
            "Azure AD search permissions not configured. Please add User.Read.All and Group.Read.All delegated permissions in the Azure app registration and grant admin consent."
          );
        } else if (msg.includes("Redirecting")) {
          // Consent redirect in progress — do nothing
        } else {
          setGraphError(msg);
        }
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, entityType]);

  /* --- select search result --- */
  const handleSelectResult = useCallback((result: GraphSearchResult) => {
    if (result.type === "user") {
      const u = result.data;
      setUpn(u.userPrincipalName);
      setSelectedDisplayName(u.displayName);
      setSelectedObjectId(u.id);
      setSearchQuery(u.displayName);
    } else {
      const g = result.data;
      setUpn(g.mail || "");
      setSelectedDisplayName(g.displayName);
      setSelectedObjectId(g.id);
      setSearchQuery(g.displayName);
    }
    setShowResults(false);
  }, []);

  /* --- click row to edit --- */
  const handleRowClick = useCallback((user: PortalUser) => {
    setEditingUser(user);
    setEntityType(user.type || "user");
    setUpn(user.upn || "");
    setSelectedDisplayName(user.displayName || user.upn || "");
    setSelectedObjectId(user.objectId || "");
    setRole(user.role || "user");
    setIsActive(user.isActive);
    setSelectedAgents(user.allowedAgents || []);
    setSelectedDatasets(user.allowedDatasets || []);
    setCanAccessDashboard(user.canAccessDashboard !== undefined ? user.canAccessDashboard : true);
    setCanAccessReports(user.canAccessReports !== undefined ? user.canAccessReports : true);
    setSearchQuery(user.displayName || user.upn || "");
    setSearchResults([]);
    setShowResults(false);
    setGraphError(null);
    setError(null);
    setInfo(null);
  }, []);

  /* --- cancel edit --- */
  const cancelEdit = useCallback(() => {
    setEditingUser(null);
    setUpn("");
    setRole("user");
    setIsActive(true);
    setSelectedAgents([]);
    setSelectedDatasets([]);
    setCanAccessDashboard(true);
    setCanAccessReports(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedDisplayName("");
    setSelectedObjectId("");
    setGraphError(null);
    setError(null);
    setInfo(null);
  }, []);

  /* --- reset form --- */
  const resetForm = useCallback(() => {
    setEditingUser(null);
    setUpn("");
    setRole("user");
    setIsActive(true);
    setSelectedAgents([]);
    setSelectedDatasets([]);
    setCanAccessDashboard(true);
    setCanAccessReports(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedDisplayName("");
    setSelectedObjectId("");
    setGraphError(null);
    setError(null);
    setInfo(null);
  }, []);

  /* --- save user/group --- */
  const saveUser = useCallback(async () => {
    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      await apiUpsertUser({
        upn: upn.trim(),
        role,
        isActive,
        allowedAgents: selectedAgents,
        allowedDatasets: selectedDatasets,
        type: entityType,
        displayName: selectedDisplayName || upn.trim(),
        objectId: selectedObjectId || undefined,
        canAccessDashboard,
        canAccessReports,
      });
      setInfo(
        editingUser
          ? (entityType === "group" ? "Group updated." : "User updated.")
          : (entityType === "group" ? "Security group saved." : "User saved.")
      );
      resetForm();
      setRole("user");
      setIsActive(true);
      await loadUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to save";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  }, [
    upn,
    role,
    isActive,
    selectedAgents,
    selectedDatasets,
    canAccessDashboard,
    canAccessReports,
    entityType,
    selectedDisplayName,
    selectedObjectId,
    editingUser,
    loadUsers,
    resetForm,
  ]);

  /* --- delete user/group --- */
  const deleteUser = useCallback(async () => {
    if (!editingUser) return;
    setDeleting(true);
    setError(null);
    setInfo(null);
    try {
      const identifier =
        editingUser.type === "group" && editingUser.objectId
          ? editingUser.objectId
          : editingUser.upn;
      await apiDeleteUser(identifier);
      setInfo(
        editingUser.type === "group"
          ? "Security group deleted."
          : "User deleted."
      );
      resetForm();
      await loadUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to delete";
      setError(String(msg));
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [editingUser, loadUsers, resetForm]);

  /* --- canSave --- */
  const canSave = useMemo(() => {
    if (saving) return false;
    if (entityType === "user") return upn.trim().includes("@");
    return !!selectedObjectId; // groups need objectId
  }, [saving, entityType, upn, selectedObjectId]);

  /* --- load admin datasets when switching to datasets tab --- */
  const loadAdminDatasets = useCallback(async () => {
    try {
      const data = await apiGetAdminDatasets();
      setAdminDatasets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to load datasets";
      setError(String(msg));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "datasets") {
      loadAdminDatasets();
    }
  }, [activeTab, loadAdminDatasets]);

  /* --- load available tables when datasets tab is active --- */
  const loadAvailableTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const data = await apiGetAvailableTables();
      setAvailableTables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load available tables:", e);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "datasets") {
      loadAvailableTables();
    }
  }, [activeTab, loadAvailableTables]);

  /* --- dataset form handlers --- */
  const handleDatasetRowClick = useCallback((ds: CatalogueDataset) => {
    setEditingDataset(ds);
    setDsId(ds.id);
    setDsDepartment(ds.department);
    setDsDescription(ds.description);
    setDsOwner(ds.owner);
    setDsOwnerEmail(ds.ownerEmail);
    setDsIcon(ds.icon);
    setDsColor(ds.color);
    setDsClassification(ds.classification);
    setDsAgentId(ds.agentId || "");
    setDsStatus(ds.status);
    setDsTables(ds.tables || []);
    setError(null);
    setInfo(null);
  }, []);

  const resetDatasetForm = useCallback(() => {
    setEditingDataset(null);
    setDsId("");
    setDsDepartment("");
    setDsDescription("");
    setDsOwner("");
    setDsOwnerEmail("");
    setDsIcon("Database");
    setDsColor("#6366F1");
    setDsClassification("OFFICIAL");
    setDsAgentId("");
    setDsStatus("coming_soon");
    setDsTables([]);
  }, []);

  const cancelDatasetEdit = useCallback(() => {
    resetDatasetForm();
    setError(null);
    setInfo(null);
  }, [resetDatasetForm]);

  const saveDataset = useCallback(async () => {
    setSavingDs(true);
    setError(null);
    setInfo(null);
    try {
      const payload: CatalogueDataset = {
        id: dsId,
        department: dsDepartment,
        icon: dsIcon,
        color: dsColor,
        classification: dsClassification,
        owner: dsOwner,
        ownerEmail: dsOwnerEmail,
        agentId: dsAgentId || null,
        description: dsDescription,
        tables: dsTables,
        status: dsStatus,
      };
      await apiUpsertDataset(payload);
      setInfo(editingDataset ? "Dataset updated." : "Dataset created.");
      resetDatasetForm();
      await loadAdminDatasets();
      // Refresh the datasets state used by Users tab's Dataset Access dropdown
      try {
        const refreshed = await datasetService.getDatasets();
        setDatasets(refreshed);
      } catch (_) {
        /* best-effort refresh */
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to save dataset";
      setError(String(msg));
    } finally {
      setSavingDs(false);
    }
  }, [
    dsId, dsDepartment, dsIcon, dsColor, dsClassification, dsOwner,
    dsOwnerEmail, dsAgentId, dsDescription, dsTables, dsStatus,
    editingDataset, resetDatasetForm, loadAdminDatasets,
  ]);

  const deleteDataset = useCallback(async () => {
    if (!editingDataset) return;
    setDeletingDs(true);
    setError(null);
    setInfo(null);
    try {
      await apiDeleteDataset(editingDataset.id);
      setInfo("Dataset deleted.");
      resetDatasetForm();
      await loadAdminDatasets();
      // Refresh the datasets state used by Users tab
      try {
        const refreshed = await datasetService.getDatasets();
        setDatasets(refreshed);
      } catch (_) {
        /* best-effort refresh */
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to delete dataset";
      setError(String(msg));
    } finally {
      setDeletingDs(false);
      setShowDeleteDsDialog(false);
    }
  }, [editingDataset, loadAdminDatasets, resetDatasetForm]);

  const canSaveDs = useMemo(() => {
    if (savingDs) return false;
    return dsDepartment.trim().length > 0 && dsId.trim().length > 0;
  }, [savingDs, dsDepartment, dsId]);

  /* --- dataset columns --- */
  const classificationOptions: IDropdownOption[] = [
    { key: "OFFICIAL", text: "OFFICIAL" },
    { key: "OFFICIAL: Sensitive", text: "OFFICIAL: Sensitive" },
    { key: "PROTECTED", text: "PROTECTED" },
  ];

  const statusOptions: IDropdownOption[] = [
    { key: "active", text: "Active" },
    { key: "coming_soon", text: "Coming Soon" },
  ];

  const dsAgentOptions: IDropdownOption[] = useMemo(
    () => [
      { key: "", text: "None" },
      ...agents.map((a) => ({ key: a.id, text: a.name })),
    ],
    [agents]
  );

  const addTableOptions: IDropdownOption[] = useMemo(
    () =>
      availableTables
        .filter((t) => !dsTables.includes(t))
        .map((t) => ({ key: t, text: t })),
    [availableTables, dsTables]
  );

  const datasetColumns: IColumn[] = useMemo(
    () => [
      {
        key: "icon",
        name: "Icon",
        minWidth: 32,
        maxWidth: 32,
        onRender: (ds: CatalogueDataset) => (
          <Icon
            iconName={ds.icon || "Database"}
            styles={{ root: { fontSize: 16, color: ds.color || "#505050" } }}
          />
        ),
      },
      {
        key: "department",
        name: "Department",
        minWidth: 160,
        isResizable: true,
        onRender: (ds: CatalogueDataset) => (
          <div>
            <span style={{ fontWeight: 600 }}>{ds.department}</span>
            <div style={{ fontSize: 11, color: "#707070" }}>{ds.id}</div>
          </div>
        ),
      },
      {
        key: "tables",
        name: "Tables",
        minWidth: 70,
        maxWidth: 80,
        onRender: (ds: CatalogueDataset) => (
          <span className={styles.pill}>
            {(ds.tables || []).length} table{(ds.tables || []).length !== 1 ? "s" : ""}
          </span>
        ),
      },
      {
        key: "status",
        name: "Status",
        minWidth: 100,
        maxWidth: 110,
        onRender: (ds: CatalogueDataset) => (
          <span
            className={styles.pill}
            style={
              ds.status === "active"
                ? { background: "#E8F5E9", color: "#107C10", borderColor: "rgba(16,124,16,0.3)" }
                : { background: "#FFF4CE", color: "#797400", borderColor: "#E5CC00" }
            }
          >
            {ds.status === "active" ? "Active" : "Coming Soon"}
          </span>
        ),
      },
      {
        key: "agent",
        name: "Agent",
        minWidth: 120,
        isResizable: true,
        onRender: (ds: CatalogueDataset) => {
          if (!ds.agentId) return <span className={styles.muted}>None</span>;
          const agent = agents.find((a) => a.id === ds.agentId);
          return <span className={styles.agentPill}>{agent?.name || ds.agentId}</span>;
        },
      },
      {
        key: "classification",
        name: "Classification",
        minWidth: 120,
        onRender: (ds: CatalogueDataset) => (
          <span className={styles.pill}>{ds.classification}</span>
        ),
      },
    ],
    [agents]
  );

  /* --- columns --- */
  const columns: IColumn[] = useMemo(
    () => [
      {
        key: "type",
        name: "Type",
        minWidth: 44,
        maxWidth: 44,
        onRender: (u: PortalUser) => (
          <Icon
            iconName={(u.type || "user") === "group" ? "Group" : "Contact"}
            title={(u.type || "user") === "group" ? "Security Group" : "User"}
            styles={{ root: { fontSize: 16, color: "#505050" } }}
          />
        ),
      },
      {
        key: "upn",
        name: "Name / UPN",
        fieldName: "upn",
        minWidth: 220,
        isResizable: true,
        onRender: (u: PortalUser) => {
          const name = u.displayName || u.upn;
          const showSub = u.displayName && u.displayName !== u.upn && u.upn;
          return (
            <div>
              <span style={{ fontWeight: 600 }}>
                {name}
              </span>
              {(u.type || "user") === "group" && (
                <span className={styles.groupPill}>GROUP</span>
              )}
              {showSub && (
                <div style={{ fontSize: 11, color: "#707070" }}>
                  {u.upn}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "role",
        name: "Role",
        minWidth: 90,
        onRender: (u: PortalUser) => (
          <span className={styles.pill}>{u.role?.toUpperCase()}</span>
        ),
      },
      {
        key: "agents",
        name: "Agent Access",
        minWidth: 200,
        isResizable: true,
        onRender: (u: PortalUser) => {
          if (u.role === "admin") {
            return <span className={styles.muted}>All Agents</span>;
          }
          if (!u.allowedAgents || u.allowedAgents.length === 0) {
            return <span className={styles.muted}>No agents</span>;
          }
          return (
            <div>
              {u.allowedAgents.map((agentId) => {
                const agent = agents.find((a) => a.id === agentId);
                return (
                  <span key={agentId} className={styles.agentPill}>
                    {agent?.name || agentId}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: "datasets",
        name: "Dataset Access",
        minWidth: 180,
        isResizable: true,
        onRender: (u: PortalUser) => {
          if (u.role === "admin") {
            return <span className={styles.muted}>All Datasets</span>;
          }
          if (!u.allowedDatasets || u.allowedDatasets.length === 0) {
            return <span className={styles.muted}>No datasets</span>;
          }
          return (
            <div>
              {u.allowedDatasets.map((dsId) => {
                const ds = datasets.find((d) => d.id === dsId);
                return (
                  <span key={dsId} className={styles.datasetPill}>
                    {ds?.department || dsId}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: "status",
        name: "Status",
        minWidth: 90,
        onRender: (u: PortalUser) => (
          <span className={styles.pill}>
            {u.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "updatedAt",
        name: "Updated",
        minWidth: 140,
        onRender: (u: PortalUser) => (
          <span className={styles.muted}>
            {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "\u2014"}
          </span>
        ),
      },
    ],
    [agents, datasets]
  );

  /* ========== Render ========== */

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Stack className={styles.header}>
          <Text className={styles.title}>Admin</Text>
          <Text className={styles.subtitle}>
            Manage portal users, security groups, and access roles.
          </Text>
        </Stack>

        {/* Top-level tab pivot */}
        <Pivot
          selectedKey={activeTab}
          onLinkClick={(item) => {
            if (item) {
              const key = item.props.itemKey as "users" | "datasets";
              setActiveTab(key);
              setError(null);
              setInfo(null);
            }
          }}
          styles={{
            root: { marginBottom: 12 },
            link: { color: "#505050", fontSize: 14 },
            linkIsSelected: { color: "#00695C", fontWeight: 600 },
          }}
        >
          <PivotItem headerText="Users & Groups" itemKey="users" itemIcon="People" />
          <PivotItem headerText="Datasets" itemKey="datasets" itemIcon="Database" />
        </Pivot>

        {(error || info || graphError) && (
          <Stack
            tokens={{ childrenGap: 10 }}
            styles={{ root: { marginBottom: 12 } }}
          >
            {error && (
              <MessageBar
                messageBarType={MessageBarType.error}
                isMultiline={false}
              >
                {error}
              </MessageBar>
            )}
            {graphError && (
              <MessageBar
                messageBarType={MessageBarType.warning}
                isMultiline
              >
                {graphError}
              </MessageBar>
            )}
            {info && (
              <MessageBar
                messageBarType={MessageBarType.success}
                isMultiline={false}
              >
                {info}
              </MessageBar>
            )}
          </Stack>
        )}

        {activeTab === "users" && (
        <div className={styles.grid}>
          {/* ========== LEFT: Users & Groups list ========== */}
          <div className={styles.card}>
            <Text className={styles.cardTitle}>Users &amp; Groups</Text>
            <Text className={styles.cardSub}>
              Portal users and security groups with their assigned roles.
            </Text>

            <Stack
              horizontal
              tokens={{ childrenGap: 10 }}
              className={styles.toolbar}
            >
              <DefaultButton
                text="Refresh"
                onClick={loadUsers}
                disabled={loading}
              />
            </Stack>

            <div className={styles.tableWrap}>
              {loading ? (
                <Stack
                  horizontal
                  tokens={{ childrenGap: 10 }}
                  verticalAlign="center"
                  styles={{ root: { padding: 14 } }}
                >
                  <Spinner size={SpinnerSize.medium} />
                  <Text>Loading users…</Text>
                </Stack>
              ) : (
                <div className={styles.detailsRoot}>
                  <DetailsList
                    items={users}
                    columns={columns}
                    selectionMode={SelectionMode.none}
                    layoutMode={DetailsListLayoutMode.justified}
                    onRenderRow={(props, defaultRender) => {
                      if (!props || !defaultRender) return null;
                      const isEditing =
                        editingUser &&
                        props.item.upn === editingUser.upn;
                      return (
                        <div
                          onClick={() =>
                            handleRowClick(props.item as PortalUser)
                          }
                          style={
                            isEditing
                              ? { background: "#E0F2F1" }
                              : undefined
                          }
                        >
                          {defaultRender(props)}
                        </div>
                      );
                    }}
                  />
                  {users.length === 0 && (
                    <Text
                      styles={{ root: { padding: 14 } }}
                      className={styles.muted}
                    >
                      No users yet. Add one on the right.
                    </Text>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========== RIGHT: Add / Update form ========== */}
          <div className={styles.card}>
            {/* Edit mode banner */}
            {editingUser && (
              <div className={styles.editBanner}>
                <Icon
                  iconName="Edit"
                  styles={{ root: { fontSize: 16, color: "#00695C" } }}
                />
                <span className={styles.editBannerText}>
                  Editing: {editingUser.displayName || editingUser.upn}
                </span>
                <IconButton
                  iconProps={{ iconName: "Cancel" }}
                  title="Cancel editing"
                  onClick={cancelEdit}
                  styles={{
                    root: { color: "#505050", height: 28, width: 28 },
                    rootHovered: {
                      color: "#1A1A1A",
                      background: "rgba(0,0,0,0.05)",
                    },
                  }}
                />
              </div>
            )}

            {/* Type Pivot */}
            <Pivot
              selectedKey={entityType}
              onLinkClick={(item) => {
                if (editingUser) return;
                if (item) {
                  const key = item.props.itemKey as "user" | "group";
                  setEntityType(key);
                  // Reset search when switching type
                  setSearchQuery("");
                  setSearchResults([]);
                  setUpn("");
                  setSelectedDisplayName("");
                  setSelectedObjectId("");
                  setGraphError(null);
                }
              }}
              styles={{
                root: {
                  marginBottom: 4,
                  opacity: editingUser ? 0.5 : 1,
                  pointerEvents: editingUser ? "none" : "auto",
                },
                link: { color: "#505050", fontSize: 14 },
                linkIsSelected: { color: "#00695C", fontWeight: 600 },
              }}
            >
              <PivotItem headerText="User" itemKey="user" itemIcon="Contact" />
              <PivotItem headerText="Security Group" itemKey="group" itemIcon="Group" />
            </Pivot>

            <Text className={styles.cardSub}>
              {editingUser
                ? `Modify role, agent access, or dataset access for this ${entityType}.`
                : entityType === "user"
                ? "Search Azure AD for a user, then set role and agent access."
                : "Search Azure AD for a security group, then set role and agent access."}
            </Text>

            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 14 } }}>
              {editingUser ? (
                /* Read-only display of the selected entity in edit mode */
                <div className={styles.selectedChip}>
                  <Icon
                    iconName={
                      (editingUser.type || "user") === "group"
                        ? "Group"
                        : "Contact"
                    }
                    styles={{
                      root: { fontSize: 18, color: "#00695C" },
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className={styles.selectedChipName}>
                      {editingUser.displayName || editingUser.upn}
                      {(editingUser.type || "user") === "group" && (
                        <span className={styles.groupPill}>GROUP</span>
                      )}
                    </div>
                    {editingUser.upn && (
                      <div className={styles.selectedChipSub}>
                        {editingUser.upn}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Azure AD Search */}
                  <div ref={searchBoxRef}>
                    <TextField
                      label={
                        entityType === "user"
                          ? "Search User"
                          : "Search Security Group"
                      }
                      placeholder={
                        entityType === "user"
                          ? "Type name or email to search Azure AD..."
                          : "Type group name to search Azure AD..."
                      }
                      value={searchQuery}
                      onChange={(_, v) => {
                        setSearchQuery(v || "");
                        if (!v) {
                          setUpn("");
                          setSelectedDisplayName("");
                          setSelectedObjectId("");
                        }
                      }}
                      iconProps={{ iconName: "Search" }}
                      autoComplete="off"
                    />
                    {searching && (
                      <Spinner
                        size={SpinnerSize.xSmall}
                        label="Searching Azure AD..."
                        styles={{ root: { marginTop: 6 } }}
                      />
                    )}
                  </div>

                  {/* Search results callout */}
                  {showResults && searchBoxRef.current && (
                    <Callout
                      target={searchBoxRef.current}
                      isBeakVisible={false}
                      directionalHint={DirectionalHint.bottomLeftEdge}
                      onDismiss={() => setShowResults(false)}
                      calloutWidth={searchBoxRef.current.offsetWidth}
                      styles={{
                        root: {
                          background: "#FFFFFF",
                          border: "1px solid #E1E1E1",
                          borderRadius: 4,
                          maxHeight: 320,
                          overflowY: "auto",
                        },
                      }}
                    >
                      {searchResults.length === 0 && !searching && (
                        <div style={{ padding: "12px 14px", color: "#707070", fontSize: 12 }}>
                          No results found in Azure AD.
                        </div>
                      )}
                      {searchResults.map((result) => {
                        if (result.type === "user") {
                          const u = result.data;
                          return (
                            <div
                              key={u.id}
                              className={styles.searchResultItem}
                              onClick={() => handleSelectResult(result)}
                            >
                              <div className={styles.searchResultName}>
                                <Icon
                                  iconName="Contact"
                                  styles={{
                                    root: { marginRight: 6, fontSize: 13, color: "#00695C" },
                                  }}
                                />
                                {u.displayName}
                              </div>
                              <div className={styles.searchResultSub}>
                                {u.userPrincipalName}
                                {u.jobTitle ? ` \u2022 ${u.jobTitle}` : ""}
                                {u.department ? ` \u2022 ${u.department}` : ""}
                              </div>
                            </div>
                          );
                        } else {
                          const g = result.data;
                          return (
                            <div
                              key={g.id}
                              className={styles.searchResultItem}
                              onClick={() => handleSelectResult(result)}
                            >
                              <div className={styles.searchResultName}>
                                <Icon
                                  iconName="Group"
                                  styles={{
                                    root: { marginRight: 6, fontSize: 13, color: "#00695C" },
                                  }}
                                />
                                {g.displayName}
                                <span className={styles.groupPill}>
                                  SECURITY GROUP
                                </span>
                              </div>
                              <div className={styles.searchResultSub}>
                                {g.description || "No description"}
                                {g.mail ? ` \u2022 ${g.mail}` : ""}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </Callout>
                  )}

                  {/* Selected entity chip */}
                  {selectedDisplayName && (
                    <div className={styles.selectedChip}>
                      <Icon
                        iconName={entityType === "group" ? "Group" : "Contact"}
                        styles={{
                          root: {
                            fontSize: 18,
                            color: "#00695C",
                          },
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className={styles.selectedChipName}>
                          {selectedDisplayName}
                          {entityType === "group" && (
                            <span className={styles.groupPill}>GROUP</span>
                          )}
                        </div>
                        {upn && (
                          <div className={styles.selectedChipSub}>{upn}</div>
                        )}
                      </div>
                      <DefaultButton
                        text="Clear"
                        onClick={() => {
                          setSearchQuery("");
                          setUpn("");
                          setSelectedDisplayName("");
                          setSelectedObjectId("");
                          setSearchResults([]);
                        }}
                        styles={{
                          root: {
                            minWidth: 0,
                            padding: "0 10px",
                            height: 28,
                            borderColor: "#EDEDED",
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* Hint text */}
                  {!selectedDisplayName && searchQuery.length < 2 && (
                    <Text className={styles.muted}>
                      Type at least 2 characters to search Azure Active Directory.
                    </Text>
                  )}
                </>
              )}

              <Dropdown
                label="Role"
                selectedKey={role}
                options={roleOptions}
                onChange={(_, opt) => setRole((opt?.key as any) || "user")}
              />

              <Dropdown
                label="Agent Access"
                placeholder={
                  role === "admin"
                    ? "Admin has access to all agents"
                    : "Select agents..."
                }
                multiSelect
                selectedKeys={selectedAgents}
                options={agentOptions}
                onChange={(_, opt) => {
                  if (!opt) return;
                  const key = String(opt.key);
                  if (opt.selected) {
                    setSelectedAgents([...selectedAgents, key]);
                  } else {
                    setSelectedAgents(selectedAgents.filter((id) => id !== key));
                  }
                }}
                disabled={role === "admin" || loadingAgents}
                styles={{
                  root: { opacity: role === "admin" ? 0.5 : 1 },
                }}
              />

              <Dropdown
                label="Dataset Access"
                placeholder={
                  role === "admin"
                    ? "Admin has access to all datasets"
                    : "Select departments..."
                }
                multiSelect
                selectedKeys={selectedDatasets}
                options={datasetOptions}
                onChange={(_, opt) => {
                  if (!opt) return;
                  const key = String(opt.key);
                  if (opt.selected) {
                    setSelectedDatasets([...selectedDatasets, key]);
                  } else {
                    setSelectedDatasets(selectedDatasets.filter((id) => id !== key));
                  }
                }}
                disabled={role === "admin" || loadingDatasets}
                styles={{
                  root: { opacity: role === "admin" ? 0.5 : 1 },
                }}
              />

              <Toggle
                label="Dashboard Access"
                checked={canAccessDashboard}
                onChange={(_, checked) => setCanAccessDashboard(!!checked)}
                disabled={role === "admin"}
                onText="Enabled"
                offText="Disabled"
                styles={{
                  root: { opacity: role === "admin" ? 0.5 : 1 },
                }}
              />

              <Toggle
                label="Reports Access"
                checked={canAccessReports}
                onChange={(_, checked) => setCanAccessReports(!!checked)}
                disabled={role === "admin"}
                onText="Enabled"
                offText="Disabled"
                styles={{
                  root: { opacity: role === "admin" ? 0.5 : 1 },
                }}
              />

              <Toggle
                label="Active"
                checked={isActive}
                onChange={(_, checked) => setIsActive(!!checked)}
              />

              <Stack
                horizontal
                tokens={{ childrenGap: 10 }}
                className={styles.formActions}
                verticalAlign="center"
              >
                <PrimaryButton
                  text={
                    saving
                      ? "Saving..."
                      : editingUser
                      ? "Update"
                      : "Save"
                  }
                  onClick={saveUser}
                  disabled={!canSave}
                />
                {editingUser ? (
                  <>
                    <DefaultButton
                      text="Cancel"
                      onClick={cancelEdit}
                      disabled={saving}
                    />
                    <IconButton
                      iconProps={{ iconName: "Delete" }}
                      title="Delete user"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={saving || deleting}
                      styles={{
                        root: {
                          color: "#D13438",
                          border: "1px solid #D13438",
                          borderRadius: 4,
                          height: 32,
                          width: 32,
                        },
                        rootHovered: {
                          color: "#FFFFFF",
                          background: "#D13438",
                        },
                      }}
                    />
                  </>
                ) : (
                  <DefaultButton
                    text="Clear"
                    onClick={resetForm}
                    disabled={saving}
                  />
                )}
              </Stack>

              <Text className={styles.muted}>
                Tip: <strong>Admins</strong> automatically have access to all
                agents and datasets. <strong>Users</strong> only see agents and
                datasets you assign them.
                {entityType === "group" && (
                  <>
                    {" "}
                    <strong>Security Groups</strong> grant the assigned role,
                    agent and dataset access to all group members.
                  </>
                )}
              </Text>
            </Stack>
          </div>
        </div>
        )}

        {activeTab === "datasets" && (
        <div className={styles.grid}>
          {/* ========== LEFT: Datasets list ========== */}
          <div className={styles.card}>
            <Text className={styles.cardTitle}>Datasets</Text>
            <Text className={styles.cardSub}>
              Manage department datasets, table assignments, and agent mapping.
            </Text>

            <Stack
              horizontal
              tokens={{ childrenGap: 10 }}
              className={styles.toolbar}
            >
              <DefaultButton
                text="Refresh"
                onClick={loadAdminDatasets}
              />
            </Stack>

            <div className={styles.tableWrap}>
              {adminDatasets.length === 0 ? (
                <Text
                  styles={{ root: { padding: 14 } }}
                  className={styles.muted}
                >
                  No datasets yet. Add one on the right.
                </Text>
              ) : (
                <div className={styles.detailsRoot}>
                  <DetailsList
                    items={adminDatasets}
                    columns={datasetColumns}
                    selectionMode={SelectionMode.none}
                    layoutMode={DetailsListLayoutMode.justified}
                    onRenderRow={(props, defaultRender) => {
                      if (!props || !defaultRender) return null;
                      const isEditing =
                        editingDataset &&
                        props.item.id === editingDataset.id;
                      return (
                        <div
                          onClick={() =>
                            handleDatasetRowClick(props.item as CatalogueDataset)
                          }
                          style={
                            isEditing
                              ? { background: "#E0F2F1" }
                              : undefined
                          }
                        >
                          {defaultRender(props)}
                        </div>
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ========== RIGHT: Dataset form ========== */}
          <div className={styles.card}>
            {/* Edit mode banner */}
            {editingDataset && (
              <div className={styles.editBanner}>
                <Icon
                  iconName="Edit"
                  styles={{ root: { fontSize: 16, color: "#00695C" } }}
                />
                <span className={styles.editBannerText}>
                  Editing: {editingDataset.department}
                </span>
                <IconButton
                  iconProps={{ iconName: "Cancel" }}
                  title="Cancel editing"
                  onClick={cancelDatasetEdit}
                  styles={{
                    root: { color: "#505050", height: 28, width: 28 },
                    rootHovered: {
                      color: "#1A1A1A",
                      background: "rgba(0,0,0,0.05)",
                    },
                  }}
                />
              </div>
            )}

            <Text className={styles.cardTitle}>
              {editingDataset ? "Update Dataset" : "Add Dataset"}
            </Text>
            <Text className={styles.cardSub}>
              {editingDataset
                ? "Modify this dataset's configuration and table assignments."
                : "Create a new department dataset and assign tables."}
            </Text>

            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 14 } }}>
              <TextField
                label="Department Name"
                required
                value={dsDepartment}
                onChange={(_, v) => {
                  setDsDepartment(v || "");
                  if (!editingDataset) {
                    setDsId(slugify(v || ""));
                  }
                }}
              />

              <TextField
                label="Dataset ID"
                value={dsId}
                readOnly={!!editingDataset}
                onChange={(_, v) => {
                  if (!editingDataset) setDsId(v || "");
                }}
                styles={{
                  root: { opacity: editingDataset ? 0.6 : 1 },
                }}
              />

              <TextField
                label="Description"
                multiline
                rows={3}
                value={dsDescription}
                onChange={(_, v) => setDsDescription(v || "")}
              />

              <TextField
                label="Owner"
                value={dsOwner}
                onChange={(_, v) => setDsOwner(v || "")}
              />

              <TextField
                label="Owner Email"
                value={dsOwnerEmail}
                onChange={(_, v) => setDsOwnerEmail(v || "")}
              />

              <TextField
                label="Icon"
                placeholder='e.g. "Money", "Database"'
                value={dsIcon}
                onChange={(_, v) => setDsIcon(v || "")}
              />

              <TextField
                label="Color"
                placeholder='e.g. "#7C7CFF"'
                value={dsColor}
                onChange={(_, v) => setDsColor(v || "")}
              />

              <Dropdown
                label="Classification"
                selectedKey={dsClassification}
                options={classificationOptions}
                onChange={(_, opt) => setDsClassification(String(opt?.key || "OFFICIAL"))}
              />

              <Dropdown
                label="Agent"
                selectedKey={dsAgentId}
                options={dsAgentOptions}
                onChange={(_, opt) => setDsAgentId(String(opt?.key ?? ""))}
              />

              <Dropdown
                label="Status"
                selectedKey={dsStatus}
                options={statusOptions}
                onChange={(_, opt) =>
                  setDsStatus((opt?.key as "active" | "coming_soon") || "coming_soon")
                }
              />

              {/* Assigned Tables */}
              <div>
                <Text
                  styles={{
                    root: { fontWeight: 600, fontSize: 14, color: "#323130", display: "block", marginBottom: 6 },
                  }}
                >
                  Assigned Tables ({dsTables.length})
                </Text>
                <div className={styles.tableList}>
                  {dsTables.map((table) => (
                    <span key={table} className={styles.tablePill}>
                      {table}
                      <IconButton
                        iconProps={{ iconName: "Cancel" }}
                        title={`Remove ${table}`}
                        onClick={() => setDsTables(dsTables.filter((t) => t !== table))}
                        styles={{
                          root: { height: 18, width: 18, color: "#707070" },
                          icon: { fontSize: 10 },
                          rootHovered: { color: "#D13438", background: "transparent" },
                        }}
                      />
                    </span>
                  ))}
                  {dsTables.length === 0 && (
                    <Text className={styles.muted}>No tables assigned.</Text>
                  )}
                </div>
                <Dropdown
                  placeholder={
                    loadingTables
                      ? "Loading tables from database..."
                      : addTableOptions.length === 0
                        ? "All tables assigned"
                        : `Add table (${addTableOptions.length} available)...`
                  }
                  options={addTableOptions}
                  selectedKey={null}
                  onChange={(_, opt) => {
                    if (opt) {
                      setDsTables([...dsTables, String(opt.key)]);
                    }
                  }}
                  disabled={loadingTables || addTableOptions.length === 0}
                />
              </div>

              {/* Form actions */}
              <Stack
                horizontal
                tokens={{ childrenGap: 10 }}
                className={styles.formActions}
                verticalAlign="center"
              >
                <PrimaryButton
                  text={
                    savingDs
                      ? "Saving..."
                      : editingDataset
                      ? "Update"
                      : "Save"
                  }
                  onClick={saveDataset}
                  disabled={!canSaveDs}
                />
                {editingDataset ? (
                  <>
                    <DefaultButton
                      text="Cancel"
                      onClick={cancelDatasetEdit}
                      disabled={savingDs}
                    />
                    <IconButton
                      iconProps={{ iconName: "Delete" }}
                      title="Delete dataset"
                      onClick={() => setShowDeleteDsDialog(true)}
                      disabled={savingDs || deletingDs}
                      styles={{
                        root: {
                          color: "#D13438",
                          border: "1px solid #D13438",
                          borderRadius: 4,
                          height: 32,
                          width: 32,
                        },
                        rootHovered: {
                          color: "#FFFFFF",
                          background: "#D13438",
                        },
                      }}
                    />
                  </>
                ) : (
                  <DefaultButton
                    text="Clear"
                    onClick={resetDatasetForm}
                    disabled={savingDs}
                  />
                )}
              </Stack>
            </Stack>
          </div>
        </div>
        )}

      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        hidden={!showDeleteDialog}
        onDismiss={() => setShowDeleteDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Delete User",
          subText: editingUser
            ? `Are you sure you want to delete "${
                editingUser.displayName || editingUser.upn
              }"? This action cannot be undone.`
            : "",
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton
            text={deleting ? "Deleting..." : "Delete"}
            onClick={deleteUser}
            disabled={deleting}
            styles={{
              root: { background: "#D13438", borderColor: "#D13438" },
              rootHovered: { background: "#A4262C", borderColor: "#A4262C" },
            }}
          />
          <DefaultButton
            text="Cancel"
            onClick={() => setShowDeleteDialog(false)}
            disabled={deleting}
          />
        </DialogFooter>
      </Dialog>

      {/* Delete dataset confirmation dialog */}
      <Dialog
        hidden={!showDeleteDsDialog}
        onDismiss={() => setShowDeleteDsDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Delete Dataset",
          subText: editingDataset
            ? `Are you sure you want to delete "${editingDataset.department}"? This action cannot be undone.`
            : "",
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton
            text={deletingDs ? "Deleting..." : "Delete"}
            onClick={deleteDataset}
            disabled={deletingDs}
            styles={{
              root: { background: "#D13438", borderColor: "#D13438" },
              rootHovered: { background: "#A4262C", borderColor: "#A4262C" },
            }}
          />
          <DefaultButton
            text="Cancel"
            onClick={() => setShowDeleteDsDialog(false)}
            disabled={deletingDs}
          />
        </DialogFooter>
      </Dialog>
    </div>
  );
}
