import React, { useState } from 'react';
import { PlayCircle, Terminal, ArrowRight } from 'lucide-react';
import { Run, Incident } from '../types/index.ts';

interface DiagnosticRunsViewProps {
  runs: Run[];
  incidents: Incident[];
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  onSelectIncident: (incidentId: string) => void;
  onNavigateToInvestigation: () => void;
}

export const DiagnosticRunsView: React.FC<DiagnosticRunsViewProps> = ({
  runs,
  incidents,
  selectedRunId,
  onSelectRun,
  onSelectIncident,
  onNavigateToInvestigation,
}) => {
  const [activeRunId, setActiveRunId] = useState<string | null>(selectedRunId || (runs[0]?.runId ?? null));

  const currentRun = runs.find((r) => r.runId === activeRunId) || runs[0] || null;
  const relatedIncidents = incidents.filter((i) => i.runId === currentRun?.runId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '1.25rem' }}>
        {/* Runs List Table */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <PlayCircle size={16} style={{ color: 'var(--color-primary)' }} />
              Diagnostic Runs ({runs.length})
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Run ID</th>
                  <th>Passed / Failed</th>
                  <th>Duration</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => {
                    const isSelected = (currentRun?.runId === r.runId);
                    return (
                      <tr
                        key={r.runId}
                        style={{
                          backgroundColor: isSelected ? 'var(--color-primary-soft)' : undefined,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setActiveRunId(r.runId);
                          onSelectRun(r.runId);
                        }}
                      >
                        <td>
                          <span className={`badge ${r.isHealthy ? 'badge-resolved' : 'badge-open'}`}>
                            {r.isHealthy ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          {r.runId.slice(-8)}
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{r.passedCount}</span>
                          <span style={{ color: 'var(--text-secondary)' }}> / </span>
                          <span style={{ color: r.failedCount > 0 ? 'var(--color-error)' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {r.failedCount}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.durationMs}ms</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Run Details Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <Terminal size={16} style={{ color: 'var(--color-primary)' }} />
              Run Inspection: {currentRun ? currentRun.runId : 'Select a run'}
            </span>
            {currentRun && (
              <span className={`badge ${currentRun.isHealthy ? 'badge-resolved' : 'badge-open'}`}>
                {currentRun.isHealthy ? 'HEALTHY PASS' : 'REGRESSION DETECTED'}
              </span>
            )}
          </div>

          <div className="panel-body">
            {!currentRun ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Select a diagnostic probe to view test results and raw output.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Metrics Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Suite</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentRun.testFilter || 'All Suites'}</div>
                  </div>
                  <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Exit Code</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: currentRun.exitCode === 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {currentRun.exitCode}
                    </div>
                  </div>
                  <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Duration</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentRun.durationMs}ms</div>
                  </div>
                  <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recorded At</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{new Date(currentRun.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Summary: <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{currentRun.summary}</span>
                </div>

                {/* Associated Incidents */}
                {relatedIncidents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase' }}>
                      Associated Incidents Generated ({relatedIncidents.length})
                    </div>
                    {relatedIncidents.map((inc) => (
                      <div
                        key={inc.incidentId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          backgroundColor: 'var(--color-error-bg)',
                          border: '1px solid var(--color-error-border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#991b1b' }}>{inc.title}</div>
                          <div style={{ fontSize: '0.725rem', color: '#7f1d1d', fontFamily: 'var(--font-mono)' }}>{inc.failedTest}</div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.725rem' }}
                          onClick={() => {
                            onSelectIncident(inc.incidentId);
                            onNavigateToInvestigation();
                          }}
                        >
                          View RCA <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Raw Vitest Output Snippet */}
                {currentRun.outputSnippet && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Vitest Execution Probe Output
                    </div>
                    <pre
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        fontSize: '0.725rem',
                        fontFamily: 'var(--font-mono)',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {currentRun.outputSnippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
