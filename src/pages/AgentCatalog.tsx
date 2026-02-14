import React, { useEffect, useMemo, useState } from 'react';
import {
  Stack,
  Text,
  SearchBox,
  Dropdown,
  IDropdownOption,
  Spinner,
  SpinnerSize,
  mergeStyleSets,
} from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

import { agentService } from '../services/agentService';
import type { Agent } from '../types/agent.types';
import { boroondaraPalette } from '../theme/boroondaraTheme';
import AgentCard from '../components/agents/AgentCard';

const styles = mergeStyleSets({
  page: {
    padding: 24,
    minHeight: 'calc(100vh - 60px)',
    background: boroondaraPalette.bg,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerText: {
    maxWidth: 820,
  },
  title: {
    color: boroondaraPalette.text,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: boroondaraPalette.text2,
    marginTop: 6,
  },
  count: {
    color: boroondaraPalette.text3,
    fontSize: 12,
    paddingBottom: 4,
  },
  filterBar: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    border: `1px solid ${boroondaraPalette.borderSoft}`,
    background: boroondaraPalette.panel,
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  search: {
    minWidth: 280,
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 14,
    marginTop: 18,
  },
  empty: {
    marginTop: 18,
    padding: 20,
    borderRadius: 16,
    border: `1px solid ${boroondaraPalette.borderSoft}`,
    background: boroondaraPalette.panel,
  },
});

const AgentCatalog: React.FC = () => {
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await agentService.getAgents();
        if (mounted) setAgents(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const domainOptions: IDropdownOption[] = useMemo(() => {
    const cats = Array.from(new Set(agents.map((a) => a.category))).sort();
    return [{ key: 'all', text: 'All domains' }, ...cats.map((c) => ({ key: c, text: c }))];
  }, [agents]);

  const statusOptions: IDropdownOption[] = useMemo(
    () => [
      { key: 'all', text: 'All statuses' },
      { key: 'active', text: 'Live' },
      { key: 'beta', text: 'Demo' },
      { key: 'maintenance', text: 'Maintenance' },
    ],
    []
  );

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return agents.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q);

      const matchesDomain = domain === 'all' || a.category === domain;
      const matchesStatus = status === 'all' || (a.status || '').toLowerCase() === status;

      return matchesQuery && matchesDomain && matchesStatus;
    });
  }, [agents, query, domain, status]);

  const onRequestAccess = (agent: Agent) => {
    // Demo-safe: no dead ends.
    // Later: route to Request Access workflow / PIM / approvals.
    alert(`Request access is coming soon.\n\nAgent: ${agent.name}`);
  };

  return (
    <Stack className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <Text variant="xxLarge" className={styles.title}>
            Agent Catalog
          </Text>
          <Text variant="medium" className={styles.subtitle}>
            Browse council-grade AI agents by domain, readiness and access. Designed for secure, enterprise use.
          </Text>
        </div>

        {!loading && (
          <div className={styles.count}>
            Showing {filteredAgents.length} of {agents.length}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <SearchBox
          className={styles.search}
          placeholder="Search agents (name, domain, description)…"
          value={query}
          onChange={(_, v) => setQuery(v ?? '')}
          styles={{
            root: {
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${boroondaraPalette.borderSoft}`,
              borderRadius: 12,
            },
            field: { background: 'transparent', color: boroondaraPalette.text },
            icon: { color: boroondaraPalette.text3 },
          }}
        />

        <Dropdown
          selectedKey={domain}
          options={domainOptions}
          onChange={(_, opt) => setDomain(String(opt?.key ?? 'all'))}
          styles={{
            root: { width: 220 },
            title: {
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${boroondaraPalette.borderSoft}`,
              borderRadius: 12,
              color: boroondaraPalette.text,
            },
            dropdownItemSelected: { background: 'rgba(124,124,255,0.14)' },
          }}
        />

        <Dropdown
          selectedKey={status}
          options={statusOptions}
          onChange={(_, opt) => setStatus(String(opt?.key ?? 'all'))}
          styles={{
            root: { width: 200 },
            title: {
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${boroondaraPalette.borderSoft}`,
              borderRadius: 12,
              color: boroondaraPalette.text,
            },
            dropdownItemSelected: { background: 'rgba(124,124,255,0.14)' },
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <Spinner size={SpinnerSize.large} label="Loading agents…" />
      ) : filteredAgents.length === 0 ? (
        <div className={styles.empty}>
          <Text styles={{ root: { color: boroondaraPalette.text, fontWeight: 700 } }}>
            No agents match your filters
          </Text>
          <Text styles={{ root: { color: boroondaraPalette.text2, marginTop: 6 } }}>
            Try clearing filters or searching by a domain (e.g., Finance).
          </Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onCardClick={() => navigate(`/agents/${agent.id}`)}
              onRequestAccess={() => onRequestAccess(agent)}
            />
          ))}
        </div>
      )}
    </Stack>
  );
};

export default AgentCatalog;
