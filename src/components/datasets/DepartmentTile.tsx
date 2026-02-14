import React from 'react';
import { Icon, mergeStyleSets } from '@fluentui/react';
import type { DepartmentSummary } from '../../types/dataset.types';

interface Props {
  dept: DepartmentSummary;
  onClick: () => void;
}

const styles = mergeStyleSets({
  tile: {
    borderRadius: 4,
    padding: 22,
    background: '#FFFFFF',
    border: '1px solid #E1E1E1',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden',
    selectors: {
      ':hover': {
        background: '#FAFAFA',
        borderColor: '#D0D0D0',
        transform: 'translateY(-2px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  tileDisabled: {
    opacity: 0.5,
    cursor: 'default',
    selectors: {
      ':hover': {
        background: '#FFFFFF',
        borderColor: '#E1E1E1',
        transform: 'none',
        boxShadow: 'none',
      },
    },
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: '1.3',
  },
  desc: {
    fontSize: 12.5,
    color: '#505050',
    lineHeight: '1.6',
    marginBottom: 12,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
    border: '1px solid #EDEDED',
    background: '#F5F5F5',
    color: '#707070',
  },
  accessBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
  },
  statChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: '#707070',
  },
  comingSoonBanner: {
    position: 'absolute' as const,
    top: 12,
    right: -28,
    transform: 'rotate(45deg)',
    background: '#F5F5F5',
    padding: '2px 32px',
    fontSize: 9,
    fontWeight: 700,
    color: '#707070',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
  },
});

export default function DepartmentTile({ dept, onClick }: Props) {
  const isComingSoon = dept.status === 'coming_soon';
  const colorFaded = dept.color + '20'; // 12% alpha

  return (
    <div
      className={`${styles.tile} ${isComingSoon ? styles.tileDisabled : ''}`}
      onClick={isComingSoon ? undefined : onClick}
      role={isComingSoon ? undefined : 'button'}
      tabIndex={isComingSoon ? undefined : 0}
      onKeyDown={isComingSoon ? undefined : (e) => { if (e.key === 'Enter') onClick(); }}
    >
      {isComingSoon && <div className={styles.comingSoonBanner}>Soon</div>}

      <div
        className={styles.iconWrap}
        style={{ background: colorFaded, border: `1px solid ${dept.color}30` }}
      >
        <Icon
          iconName={dept.icon}
          styles={{ root: { color: dept.color, fontSize: 18 } }}
        />
      </div>

      <div className={styles.name}>{dept.department}</div>
      <div className={styles.desc}>{dept.description}</div>

      <div className={styles.footer}>
        {/* Classification badge */}
        <span className={styles.badge}>{dept.classification}</span>

        {/* Table count */}
        {dept.tableCount > 0 && (
          <span className={styles.statChip}>
            <Icon iconName="Table" styles={{ root: { fontSize: 11 } }} />
            {dept.tableCount} table{dept.tableCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Row count */}
        {dept.totalRows > 0 && (
          <span className={styles.statChip}>
            {dept.totalRows.toLocaleString()} rows
          </span>
        )}

        {/* Access pill */}
        {!isComingSoon && (
          <span
            className={styles.accessBadge}
            style={
              dept.hasAccess
                ? {
                    background: '#E8F5E9',
                    border: '1px solid rgba(16,124,16,0.3)',
                    color: '#107C10',
                  }
                : {
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    color: '#9A7B00',
                  }
            }
          >
            <Icon
              iconName={dept.hasAccess ? 'LockSolid' : 'Lock'}
              styles={{ root: { fontSize: 10 } }}
            />
            {dept.hasAccess ? 'Access' : 'Locked'}
          </span>
        )}
      </div>
    </div>
  );
}
