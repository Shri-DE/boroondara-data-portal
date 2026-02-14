import React from 'react';
import {
  Stack,
  Text,
  IconButton,
  Persona,
  PersonaSize,
  IContextualMenuProps,
  useTheme,
} from '@fluentui/react';
import { useAuth } from '../../hooks/useAuth';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const { user, logout, isAuthenticated } = useAuth();

  // ✅ Safe fallback values (prevents TypeScript errors)
  const userDisplayName =
    user?.name || user?.displayName || 'Demo User';

  const userInitials =
    userDisplayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  const userMenuProps: IContextualMenuProps = {
    items: [
      {
        key: 'profile',
        text: 'Profile',
        iconProps: { iconName: 'Contact' },
      },
      {
        key: 'preferences',
        text: 'Preferences',
        iconProps: { iconName: 'Settings' },
      },
      {
        key: 'divider',
        itemType: 1,
      },
      {
        key: 'logout',
        text: 'Sign Out',
        iconProps: { iconName: 'SignOut' },
        onClick: () => {
          void logout();
      },
    },
    ],
  };

  return (
    <Stack
      horizontal
      verticalAlign="center"
      styles={{
        root: {
          height: '60px',
          padding: '0 24px',
          background: '#FFFFFF',
          color: '#1A1A1A',
          borderBottom: '1px solid #E1E1E1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      }}
    >
      {/* ☰ Sidebar toggle */}
      <IconButton
        iconProps={{ iconName: 'GlobalNavButton' }}
        onClick={onMenuClick}
        styles={{
          root: { color: '#1A1A1A' },
          rootHovered: { backgroundColor: '#F5F5F5' },
        }}
      />

      {/* Title */}
      <Stack.Item grow>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <Stack
            horizontal
            verticalAlign="center"
            tokens={{ childrenGap: 12 }}
            styles={{ root: { marginLeft: 12 } }}
          >
            <Stack
              styles={{
                root: {
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F5F5F5',
                  border: '1px solid #E1E1E1',
                },
              }}
            >
              <Text styles={{ root: { fontWeight: 800, letterSpacing: '-0.02em', color: '#00695C' } }}>
                B
              </Text>
            </Stack>

            <Stack>
              <Text
                styles={{
                  root: {
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontSize: 14,
                    color: '#1A1A1A',
                  },
                }}
              >
                Enterprise Data Portal
              </Text>
              <Text
                styles={{
                  root: {
                    marginTop: 2,
                    fontSize: 12,
                    color: '#707070',
                  },
                }}
              >
                City of Boroondara
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Stack.Item>

      {/* User */}
      {isAuthenticated && user && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Persona
            text={userDisplayName}
            size={PersonaSize.size32}
            imageInitials={userInitials}
            styles={{
              root: { cursor: 'default', color: '#1A1A1A' },
            }}
          />

          <IconButton
            iconProps={{ iconName: 'ChevronDown' }}
            menuProps={userMenuProps}
            styles={{
              root: { color: '#1A1A1A' },
              rootHovered: { backgroundColor: '#F5F5F5' },
            }}
          />
        </Stack>
      )}
    </Stack>
  );
};

export default Header;
