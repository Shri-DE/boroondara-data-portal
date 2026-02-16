import React from 'react';
import {
  Stack,
  Text,
  Icon,
  PrimaryButton,
  DefaultButton,
  Rating,
  mergeStyles,
  TooltipHost,
} from '@fluentui/react';
import { Agent } from '../../types/agent.types';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

interface AgentCardProps {
  agent: Agent;
  onCardClick: () => void;
  onRequestAccess: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onCardClick, onRequestAccess }) => {
  const cardClass = mergeStyles({
    background: '#FFFFFF',
    borderRadius: 4,
    padding: 16,
    border: '1px solid #E1E1E1',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      borderColor: '#00695C',
      background: '#FAFAFA',
    },
  });

  const iconWrapClass = mergeStyles({
    width: 40,
    height: 40,
    borderRadius: 4,
    background: '#E0F2F1',
    border: '1px solid rgba(0,120,212,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const iconClass = mergeStyles({
    fontSize: 18,
    color: '#00695C',
  });

  const chipClass = mergeStyles({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #EDEDED',
    background: '#F5F5F5',
    color: '#505050',
    fontSize: 12,
    lineHeight: '16px',
  });

  const accessPillClass = mergeStyles({
    padding: '8px 12px',
    borderRadius: 4,
    border: '1px solid #EDEDED',
    background: agent.hasAccess ? '#E8F5E9' : '#F5F5F5',
  });

  const getStatusMeta = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return { label: 'Live', dot: '#107C10', bg: '#E8F5E9' };
    if (s === 'beta') return { label: 'Demo', dot: '#00695C', bg: '#E0F2F1' };
    if (s === 'maintenance') return { label: 'Maintenance', dot: '#C8C8C8', bg: '#F5F5F5' };
    return { label: status || 'Unknown', dot: '#C8C8C8', bg: '#F5F5F5' };
  };

  const statusMeta = getStatusMeta(agent.status);

  const getAccessIcon = () => {
    if (agent.hasAccess) {
      return { icon: 'Completed', color: '#107C10', text: 'Access Granted' };
    }
    return { icon: 'Lock', color: '#707070', text: 'Request Access' };
  };

  const accessInfo = getAccessIcon();

  return (
    <div className={cardClass} onClick={onCardClick}>
      <Stack tokens={{ childrenGap: 12 }} styles={{ root: { height: '100%' } }}>
        {/* Header row */}
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
            <div className={iconWrapClass}>
              <Icon iconName={agent.icon || 'ChatBot'} className={iconClass} />
            </div>

            <Stack>
              <Text styles={{ root: { color: '#1A1A1A', fontSize: 16, fontWeight: 800 } }}>
                {agent.name}
              </Text>
              <Text styles={{ root: { color: '#707070', fontSize: 12 } }}>
                {agent.category}
              </Text>
            </Stack>
          </Stack>

          <TooltipHost content={agent.status}>
            <span
              className={chipClass}
              style={{ background: statusMeta.bg }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: statusMeta.dot,
                }}
              />
              {statusMeta.label}
            </span>
          </TooltipHost>
        </Stack>

        {/* Description */}
        <Text
          styles={{
            root: {
              flex: 1,
              minHeight: 56,
              color: '#505050',
              fontSize: 13,
              lineHeight: '18px',
            },
          }}
        >
          {agent.description}
        </Text>

        {/* Rating + usage */}
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Rating rating={agent.rating} max={5} size={1} readOnly />
            <Text styles={{ root: { color: '#707070', fontSize: 12 } }}>
              ({agent.usageCount} uses)
            </Text>
          </Stack>

          {/* Classification chip */}
          <span className={chipClass}>
            <Icon iconName="Shield" styles={{ root: { fontSize: 12, color: '#707070' } }} />
            {agent.dataClassification}
          </span>
        </Stack>

        {/* Access pill */}
        <Stack
          horizontal
          tokens={{ childrenGap: 8 }}
          verticalAlign="center"
          className={accessPillClass}
        >
          <Icon
            iconName={accessInfo.icon}
            styles={{ root: { color: accessInfo.color, fontSize: 14 } }}
          />
          <Text styles={{ root: { color: '#505050', fontWeight: 600, fontSize: 12 } }}>
            {accessInfo.text}
          </Text>
        </Stack>

        {/* Actions */}
        <Stack styles={{ root: { marginTop: 2 } }}>
          {agent.hasAccess ? (
            <PrimaryButton
              text="Open"
              iconProps={{ iconName: 'Rocket' }}
              onClick={(e) => {
                e.stopPropagation();
                onCardClick();
              }}
              styles={{
                root: {
                  borderRadius: 4,
                  background: '#00695C',
                  border: 'none',
                },
                rootHovered: {
                  background: '#004F45',
                },
              }}
            />
          ) : (
            <DefaultButton
              text="Request Access"
              iconProps={{ iconName: 'Mail' }}
              onClick={(e) => {
                e.stopPropagation();
                onRequestAccess();
              }}
              styles={{
                root: {
                  borderRadius: 4,
                  background: 'transparent',
                  border: '1px solid #E1E1E1',
                  color: '#1A1A1A',
                },
                rootHovered: {
                  background: '#F5F5F5',
                },
              }}
            />
          )}
        </Stack>
      </Stack>
    </div>
  );
};

export default AgentCard;
