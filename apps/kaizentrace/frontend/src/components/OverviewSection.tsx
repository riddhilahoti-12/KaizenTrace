import React from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { Run, Incident, Verification } from '../types/index.ts';

interface OverviewSectionProps {
  runs: Run[];
  incidents: Incident[];
  verifications: Verification[];
  onSelectIncident: (id: string) => void;
  onSelectRun: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  runs,
  incidents,
  verifications,
  onSelectIncident,
  onSelectRun,
  onNavigateToTab,
}) => {
  const totalRuns = runs.length;
  const openIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED').length;
  const latestVerification = verifications[0] || null;

  const investigatingCount = incidents.filter((i) => i.status === 'INVESTIGATING').length;
  const patchReadyCount = incidents.filter((i) => i.status === 'PATCH_READY').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span>Total Diagnostic Runs</span>
            <div className="metric-icon-box" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="metric-value">{totalRuns}</div>
          <div className="metric-footer">
            <Clock size={12} />
            <span>{runs.length > 0 ? `Latest: ${new Date(runs[0].timestamp).toLocaleTimeString()}` : 'No runs recorded'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Open Incidents</span>
            <div className="metric-icon-box" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: openIncidents > 0 ? 'var(--color-error)' : 'var(--text-primary)' }}>
            {openIncidents}
          </div>
          <div className="metric-footer">
            <span>{incidents.length} total detected regressions</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Resolved Incidents</span>
            <div className="metric-icon-box" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {resolvedIncidents}
          </div>
          <div className="metric-footer">
            <span>Verified fixes with green test runs</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Latest Verification</span>
            <div
              className="metric-icon-box"
              style={{
                backgroundColor:
                  latestVerification?.outcome === 'PASS'
                    ? 'var(--color-success-bg)'
                    : latestVerification?.outcome === 'FAIL'
                    ? 'var(--color-error-bg)'
                    : 'var(--bg-surface)',
                color:
                  latestVerification?.outcome === 'PASS'
                    ? 'var(--color-success)'
                    : latestVerification?.outcome === 'FAIL'
                    ? 'var(--color-error)'
                    : 'var(--text-secondary)',
              }}
            >
              <ShieldCheck size={16} />
            </div>
          </div>
          <div
            className="metric-value"
            style={{
              fontSize: '1.35rem',
              color:
                latestVerification?.outcome === 'PASS'
                  ? 'var(--color-success)'
                  : latestVerification?.outcome === 'FAIL'
                  ? 'var(--color-error)'
                  : 'var(--text-secondary)',
            }}
          >
            {latestVerification ? latestVerification.outcome : 'None'}
          </div>
          <div className="metric-footer">
            <span>
              {latestVerification
                ? `${latestVerification.incidentId} (Exit ${latestVerification.exitCode})`
                : 'No verifications run yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity & Incident Status Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        {/* Left: Diagnostic Activity */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <Activity size={16} style={{ color: 'var(--color-primary)' }} />
              Diagnostic Run History
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Recent probes against TeamFlow
            </span>
          </div>
          <div className="panel-body">
            {runs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No diagnostic probes executed yet. Click "Run Diagnostics" to probe TeamFlow.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                  {runs.slice(0, 14).map((r) => {
                    const isPass = r.isHealthy;
                    return (
                      <div
                        key={r.runId}
                        onClick={() => {
                          onSelectRun(r.runId);
                          onNavigateToTab('runs');
                        }}
                        style={{
                          flex: '0 0 auto',
                          padding: '0.5rem 0.65rem',
                          borderRadius: 'var(--radius-md)',
                          border: isPass ? '1px solid var(--color-success-border)' : '1px solid var(--color-error-border)',
                          backgroundColor: isPass ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                          color: isPass ? 'var(--color-success)' : 'var(--color-error)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem',
                          minWidth: '60px',
                        }}
                        title={`${r.runId} — ${r.summary} (${r.durationMs}ms)`}
                      >
                        {isPass ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{r.runId.slice(-4)}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{r.durationMs}ms</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Showing latest {Math.min(14, runs.length)} of {runs.length} runs</span>
                  <span>Click block to inspect run output</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Incident Status Breakdown */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <AlertCircle size={16} style={{ color: 'var(--color-lavender)' }} />
              Incident Status Breakdown
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Open Regressions</span>
              <span className="badge badge-open">{incidents.filter((i) => i.status === 'OPEN').length}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Under Investigation</span>
              <span className="badge badge-investigating">{investigatingCount}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Fix Patch Proposed</span>
              <span className="badge badge-patch-ready">{patchReadyCount}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Resolved & Verified</span>
              <span className="badge badge-resolved">{resolvedIncidents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Runs & Recent Incidents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Recent Runs Table */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <Terminal size={15} style={{ color: 'var(--color-primary)' }} />
              Recent Diagnostic Runs
            </span>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
              onClick={() => onNavigateToTab('runs')}
            >
              View All
            </button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Failed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                      No runs recorded.
                    </td>
                  </tr>
                ) : (
                  runs.slice(0, 5).map((r) => (
                    <tr key={r.runId}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.runId.slice(-8)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                      <td>
                        <span className={`badge ${r.isHealthy ? 'badge-resolved' : 'badge-open'}`}>
                          {r.isHealthy ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td>{r.failedCount}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => {
                            onSelectRun(r.runId);
                            onNavigateToTab('runs');
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <ShieldAlert size={15} style={{ color: 'var(--color-error)' }} />
              Recent Detected Incidents
            </span>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
              onClick={() => onNavigateToTab('incidents')}
            >
              View All
            </button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title / ID</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                      No incidents detected. System healthy!
                    </td>
                  </tr>
                ) : (
                  incidents.slice(0, 5).map((inc) => {
                    const statusClass =
                      inc.status === 'RESOLVED'
                        ? 'badge-resolved'
                        : inc.status === 'PATCH_READY'
                        ? 'badge-patch-ready'
                        : inc.status === 'INVESTIGATING'
                        ? 'badge-investigating'
                        : 'badge-open';

                    return (
                      <tr key={inc.incidentId}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{inc.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {inc.incidentId}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-severity-${inc.severity}`}>{inc.severity}</span>
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`}>{inc.status}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                            onClick={() => {
                              onSelectIncident(inc.incidentId);
                              onNavigateToTab('investigations');
                            }}
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
