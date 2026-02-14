import React from 'react';
import { Icon, mergeStyleSets } from '@fluentui/react';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

interface Props {
  agentName?: string;
}

const styles = mergeStyleSets({
  row: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${boroondaraPalette.primary}, #5856D6)`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 18px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid rgba(255,255,255,0.06)`,
  },
  dots: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: boroondaraPalette.text3,
  },
});

export default function TypingIndicator({ agentName }: Props) {
  return (
    <div className={styles.row}>
      <div className={styles.avatar}>
        <Icon iconName="ChatBot" style={{ fontSize: 15 }} />
      </div>
      <div className={styles.bubble}>
        <div className={styles.dots}>
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
        <span className={styles.label}>
          {agentName ? `${agentName} is thinking...` : 'Thinking...'}
        </span>
      </div>
    </div>
  );
}
