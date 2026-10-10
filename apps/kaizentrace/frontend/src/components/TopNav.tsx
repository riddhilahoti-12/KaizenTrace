import React from 'react';
import { Play, RefreshCw, Database, GitCommit, CheckCircle2, Server } from 'lucide-react';
import { HealthStatus, BaselineStatus } from '../types/index.ts';
import { NavTab } from './Sidebar.tsx';

interface TopNavProps {
  currentTab: NavTab;
  health: HealthStatus | null;
  baseline: BaselineStatus | null;
  isRunningDiagnostics: boolean;
  onRunDiagnostics: () => void;
  onRefresh: () => void;
  onSnapshotBaseline: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  health,
  baseline,
  isRunningDiagnostics,
  onRunDiagnostics,
  onRefresh,
  onSnapshotBaseline,
}) => {
  const isAtlas = health?.database.mode === 'atlas';
  const isDbConnected = health?.database.connected ?? false;
  const isTeamFlowOnline = health?.teamflow.status === 'ONLINE';

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Engineering Overview',
      subtitle: 'Monitors diagnostic runs and application regressions.',
    },
    incidents: {
      title: 'Incident Management',
      subtitle: 'Detected test assertions, regressions, and root-cause candidates.',
    },
    investigations: {
      title: 'Root-Cause Investigation',
      subtitle: 'Explainable correlation, source diffs, and patch generation.',
    },
    runs: {
      title: 'Diagnostic Probes',
      subtitle: 'Real-time Vitest execution traces and failure captures.',
    },
    verifications: {
      title: 'Verification History',
      subtitle: 'Recorded post-patch test executions and database status checks.',
    },
    scenarios: {
      title: 'Demo Scenarios',
      subtitle: 'Controlled regression injection and clean baseline restoration.',
    },
  };

  const meta = tabTitles[currentTab] || tabTitles.overview;

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <h1 className="page-title">{meta.title}</h1>
        <div className="page-subtitle">{meta.subtitle}</div>
      </div>

      <div className="top-nav-right">
        {/* Backend Server Port */}
        <div className="status-pill" title="KaizenTrace API Server">
          <Server size={13} style={{ color: 'var(--color-primary)' }} />
          <span>API: <strong>Port 5050</strong></span>
        </div>

        {/* TeamFlow Backend Status */}
        <div className="status-pill" title="Target application status">
          <span className={`status-dot ${isTeamFlowOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
          <span>TeamFlow: <strong>{health?.teamflow.status || 'CHECKING...'}</strong> (Port 5000)</span>
        </div>

        {/* MongoDB Connection Status */}
        <div className="status-pill" title={health?.database.label || 'MongoDB'}>
          <Database size={13} style={{ color: isDbConnected ? 'var(--color-success)' : 'var(--color-error)' }} />
          <span>
            {isAtlas ? 'MongoDB Atlas: Connected' : isDbConnected ? 'MongoDB Local: Connected' : 'MongoDB: Disconnected'}
          </span>
        </div>

        {/* Git Baseline */}
        <div className="status-pill" title={`Baseline commit: ${baseline?.baselineCommit || 'HEAD'}`}>
          <GitCommit size={13} style={{ color: 'var(--color-primary)' }} />
          <span>Baseline: <strong>{baseline?.baselineCommit?.slice(0, 7) || 'HEAD'}</strong></span>
          {baseline?.hasChanges && (
            <span style={{ color: 'var(--color-warning)', fontSize: '0.7rem', fontWeight: 700 }}>
              ({baseline.changedFilesCount} modified)
            </span>
          )}
        </div>

        {/* Refresh Button */}
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          title="Refresh current server data"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>

        {/* Snapshot Baseline Button */}
        <button
          className="btn btn-secondary"
          onClick={onSnapshotBaseline}
          title="Record current repository state as clean baseline"
        >
          <CheckCircle2 size={13} />
          <span>Snapshot Baseline</span>
        </button>

        {/* Run Diagnostics Action */}
        <button
          className="btn btn-primary"
          onClick={onRunDiagnostics}
          disabled={isRunningDiagnostics}
          title="Execute live diagnostics on TeamFlow"
        >
          {isRunningDiagnostics ? (
            <>
              <RefreshCw size={13} className="spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play size={13} />
              <span>Run Diagnostics</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
