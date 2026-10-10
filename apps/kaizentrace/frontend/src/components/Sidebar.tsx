import React from 'react';
import {
  LayoutDashboard,
  AlertCircle,
  Search,
  PlayCircle,
  CheckCircle2,
  SlidersHorizontal,
  ShieldCheck,
  Database,
  ExternalLink,
} from 'lucide-react';
import { HealthStatus } from '../types/index.ts';

export type NavTab = 'overview' | 'incidents' | 'investigations' | 'runs' | 'verifications' | 'scenarios';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openIncidentsCount: number;
  health: HealthStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openIncidentsCount,
  health,
}) => {
  const isAtlas = health?.database.mode === 'atlas';
  const isConnected = health?.database.connected ?? false;

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'incidents' as NavTab,
      label: 'Incidents',
      icon: AlertCircle,
      badge: openIncidentsCount > 0 ? openIncidentsCount : null,
    },
    {
      id: 'investigations' as NavTab,
      label: 'Investigations',
      icon: Search,
      badge: null,
    },
    {
      id: 'runs' as NavTab,
      label: 'Diagnostic Runs',
      icon: PlayCircle,
      badge: null,
    },
    {
      id: 'verifications' as NavTab,
      label: 'Verification History',
      icon: CheckCircle2,
      badge: null,
    },
    {
      id: 'scenarios' as NavTab,
      label: 'Demo Scenarios',
      icon: SlidersHorizontal,
      badge: null,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon-box">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="brand-title">KaizenTrace</div>
          <div className="brand-subtitle">Incident Investigation</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== null && (
                <span
                  style={{
                    backgroundColor: 'var(--color-error-bg)',
                    color: 'var(--color-error)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Database size={13} style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-error)' }} />
          <span>{isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Target: TeamFlow (Port 5000)
        </div>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontSize: '0.7rem',
            fontWeight: 600,
            marginTop: '0.2rem',
          }}
        >
          Open TeamFlow UI <ExternalLink size={10} />
        </a>
      </div>
    </aside>
  );
};
