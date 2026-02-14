import React, { useState } from 'react';
import { Stack, useTheme } from '@fluentui/react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Stack
      styles={{
        root: {
          height: '100vh',
          overflow: 'hidden',
          background: theme.semanticColors.bodyBackground,
          color: theme.semanticColors.bodyText,
        },
      }}
    >
      <Header onMenuClick={toggleSidebar} />
      <Stack horizontal styles={{ root: { flex: 1, overflow: 'hidden' } }}>
        {isSidebarOpen && <Sidebar />}
        <Stack.Item
          grow
          styles={{
            root: {
              overflow: 'auto',
              padding: 0,
              backgroundColor: theme.semanticColors.bodyBackground,
            },
          }}
        >
          {children}
        </Stack.Item>
      </Stack>
    </Stack>
  );
};

export default Layout;
