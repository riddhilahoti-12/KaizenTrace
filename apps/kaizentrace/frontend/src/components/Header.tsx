import React from 'react';
import { ShieldCheck, Play, RefreshCw, SlidersHorizontal, Database, GitCommit, CheckCircle2 } from 'lucide-react';
import { HealthStatus, BaselineStatus } from '../types/index.ts';

interface HeaderProps {
  health: HealthStatus | null;
  baseline: BaselineStatus | null;
  isRunningDiagnostics: boolean;
  onRunDiagnostics: () => void;
  onOpenScenarios: () => void;
  onResetBaseline: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  baseline,
  isRunningDiagnostics,
  onRunDiagnostics,
  onOpenScenarios,
  onResetBaseline,
}) => {
  const isAtlas = health?.database.mode === 'atlas';
  const isDbConnected = health?.database.connected ?? false;
  const isTeamFlowOnline = health?.teamflow.status === 'ONLINE';

  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <ShieldCheck size={20} />
        </div>
        <div>
          <span className="brand-title">KaizenTrace</span>
          <span className="brand-badge">Evidence-Based RCA</span>
        </div>
      </div>

      <div className="header-status-group">
        {/* TeamFlow Backend Status */}
        <div className="status-pill" title="Target application status">
          <span className={`status-indicator ${isTeamFlowOnline ? 'status-online' : 'status-offline'}`} />
          <span>TeamFlow: <strong>{health?.teamflow.status || 'CHECKING...'}</strong> (Port 5000)</span>
        </div>

        {/* MongoDB Connection Status */}
        <div className="status-pill" title={health?.database.label || 'MongoDB'}>
          <Database size={13} style={{ color: isDbConnected ? 'var(--color-success)' : 'var(--color-danger)' }} />
          <span>{isAtlas ? 'MongoDB Atlas' : (health?.database.label || 'MongoDB Memory')}</span>
        </div>

        {/* Git Baseline */}
        <div className="status-pill" title={`Baseline commit: ${baseline?.baselineCommit || 'HEAD'}`}>
          <GitCommit size={13} style={{ color: 'var(--color-primary)' }} />
          <span>Baseline: <strong>{baseline?.baselineCommit?.slice(0, 7) || 'HEAD'}</strong></span>
          {baseline?.hasChanges && (
            <span style={{ color: 'var(--color-warning)', fontSize: '0.7rem', fontWeight: 700 }} title="Changes detected vs baseline">
              ({baseline.changedFilesCount} modified)
            </span>
          )}
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-secondary"
          onClick={onOpenScenarios}
          title="Open Fault Injection Scenarios Drawer"
        >
          <SlidersHorizontal size={14} />
          <span>Demo Scenarios</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onResetBaseline}
          title="Snapshot current git state as clean baseline"
        >
          <CheckCircle2 size={14} />
          <span>Snapshot Baseline</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={onRunDiagnostics}
          disabled={isRunningDiagnostics}
          title="Execute live diagnostics on TeamFlow"
        >
          {isRunningDiagnostics ? (
            <>
              <RefreshCw size={14} className="spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Run Diagnostics</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
