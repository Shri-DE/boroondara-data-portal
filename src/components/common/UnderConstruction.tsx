import React from 'react';
import { Stack, Text, mergeStyleSets } from '@fluentui/react';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

const styles = mergeStyleSets({
  page: {
    padding: 24,
    minHeight: 'calc(100vh - 60px)',
  },
  title: {
    color: '#1A1A1A',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#505050',
    maxWidth: 720,
    lineHeight: 1.6,
  },
  panel: {
    marginTop: 8,
    padding: 20,
    borderRadius: 4,
    background: '#FFFFFF',
    border: '1px solid #E1E1E1',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  hint: {
    color: '#707070',
    marginTop: 10,
  },
});

export default function UnderConstruction({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Stack className={styles.page} tokens={{ childrenGap: 14 }}>
      <Text variant="xxLarge" className={styles.title}>
        {title}
      </Text>
      <Text variant="medium" className={styles.subtitle}>
        {description}
      </Text>

      <Stack className={styles.panel} tokens={{ childrenGap: 6 }}>
        <Text styles={{ root: { color: '#1A1A1A' } }}>
          This area is being polished for the demo.
        </Text>
        <Text className={styles.hint}>
          Next: dashboard cards, filters, and exportable insights.
        </Text>
      </Stack>
    </Stack>
  );
}
