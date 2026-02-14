import * as React from 'react';
import { Nav, INavStyles, INavLinkGroup } from '@fluentui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

const navGroups: INavLinkGroup[] = [
  {
    links: [
      { name: 'Home', url: '/', key: 'home', icon: 'Home' },
      { name: 'Agents', url: '/agents', key: 'agents', icon: 'ChatBot' },
      { name: 'Datasets', url: '/datasets', key: 'datasets', icon: 'Database' },
      { name: 'Dashboards', url: '/dashboards', key: 'dashboards', icon: 'BarChart4' },
      { name: 'Reports', url: '/reports', key: 'reports', icon: 'ReportDocument' },
      { name: 'Geospatial', url: '/geospatial', key: 'geospatial', icon: 'Globe' },
      { name: 'Admin', url: '/admin', key: 'admin', icon: 'Shield' },
    ],
  },
];

const navStyles: Partial<INavStyles> = {
  root: {
    width: 260,
    boxSizing: 'border-box',
    borderRight: '1px solid #E1E1E1',
    overflowY: 'auto',
    backgroundColor: '#FAFAFA',
  },
  navItems: {
    paddingTop: 10,
  },
  link: {
    color: '#1A1A1A',
    borderRadius: 4,
    margin: '2px 10px',
    selectors: {
      ':hover': {
        background: '#F0F0F0',
        color: '#1A1A1A',
      },
      '&.is-selected': {
        background: '#E8F0FE',
        color: '#0078D4',
      },
      '&.is-selected:hover': {
        background: '#D6E4F9',
        color: '#0078D4',
      },
    },
  },
  groupContent: {
    marginBottom: 12,
  },
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey =
    navGroups[0].links.find((l) => l.url === location.pathname)?.key || 'home';

  return (
    <Nav
      styles={navStyles}
      groups={navGroups}
      selectedKey={selectedKey}
      onLinkClick={(ev, item) => {
        ev?.preventDefault();
        if (item?.url) navigate(item.url);
      }}
    />
  );
};

export default Sidebar;
