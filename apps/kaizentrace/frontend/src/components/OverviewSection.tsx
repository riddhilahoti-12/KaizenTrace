import React from 'react';
import { Activity, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Run, Incident } from '../types/index.ts';

interface OverviewSectionProps {
  runs: Run[];
  incidents: Incident[];
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  selectedProject: string;
  onSelectProject: (projectId: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  runs,
  incidents,
  selectedRunId,
  onSelectRun,
  selectedProject,
  onSelectProject,
}) => {
  const totalRuns = runs.length;
  const healthyRuns = runs.filter(r => r.isHealthy).length;
  const passRate = totalRuns > 0 ? Math.round((healthyRuns / totalRuns) * 100) : 100;
  const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED').length;

  const latestRun = runs[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls Bar: Project & Run Selection */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-card)', padding: '0.85rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Target Project:
          </span>
          <select
            value={selectedProject}
            onChange={(e) => onSelectProject(e.target.value)}
            style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 500, backgroundColor: 'var(--bg-card-subtle)', color: 'var(--text-primary)' }}
          >
            <option value="teamflow">TeamFlow Project Management</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Diagnostic Run:
          </span>
          <select
            value={selectedRunId || ''}
            onChange={(e) => onSelectRun(e.target.value)}
            style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 500, backgroundColor: 'var(--bg-card-subtle)', color: 'var(--text-primary)', maxWidth: '280px' }}
          >
            <option value="">All Diagnostic Runs ({totalRuns})</option>
            {runs.map((r) => (
              <option key={r.runId} value={r.runId}>
                {r.runId} — {r.isHealthy ? 'PASS' : `FAIL (${r.failedCount})`} ({new Date(r.timestamp).toLocaleTimeString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Diagnostic Runs</div>
          <div className="stat-value">{totalRuns}</div>
          <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity size={13} style={{ color: 'var(--color-primary)' }} />
            <span>Latest: {latestRun ? (latestRun.isHealthy ? 'Healthy PASS' : 'Regression FAIL') : 'No runs yet'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">System Pass Rate</div>
          <div className="stat-value" style={{ color: passRate >= 80 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {passRate}%
          </div>
          <div className="stat-sub">
            {healthyRuns} healthy / {totalRuns} total runs
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Open Incidents</div>
          <div className="stat-value" style={{ color: openIncidents > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {openIncidents}
          </div>
          <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertCircle size={13} style={{ color: openIncidents > 0 ? 'var(--color-danger)' : 'var(--color-success)' }} />
            <span>{incidents.length} total detected</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Verified Auto-Fixes</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {resolvedIncidents}
          </div>
          <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={13} style={{ color: 'var(--color-success)' }} />
            <span>Targeted regression recoveries</span>
          </div>
        </div>
      </div>

      {/* Runs Timeline Strip */}
      {runs.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recent Diagnostic Timeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
            {runs.slice(0, 10).map((r) => (
              <div
                key={r.runId}
                onClick={() => onSelectRun(r.runId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedRunId === r.runId ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  backgroundColor: r.isHealthy ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                  color: r.isHealthy ? 'var(--color-success)' : 'var(--color-danger)',
                }}
                title={`${r.runId}: ${r.summary}`}
              >
                {r.isHealthy ? <CheckCircle size={12} /> : <ShieldAlert size={12} />}
                <span>{r.runId.slice(-6)}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({r.durationMs}ms)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
