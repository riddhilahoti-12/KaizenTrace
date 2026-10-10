import React from 'react';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Verification } from '../types/index.ts';

interface VerificationHistoryViewProps {
  verifications: Verification[];
  onSelectIncident: (incidentId: string) => void;
  onNavigateToInvestigation: () => void;
}

export const VerificationHistoryView: React.FC<VerificationHistoryViewProps> = ({
  verifications,
  onSelectIncident,
  onNavigateToInvestigation,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="panel-card">
        <div className="panel-header">
          <span className="panel-title">
            <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
            Verification History ({verifications.length} Executions)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Real automated verification tests executed on backend
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Outcome</th>
                <th>Incident ID</th>
                <th>Test Target Suite</th>
                <th>Exit Code</th>
                <th>Before Result</th>
                <th>After Result</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No fix verifications executed yet. Run a fix and verify it from the Investigation view.
                  </td>
                </tr>
              ) : (
                verifications.map((v) => {
                  const isPass = v.outcome === 'PASS';
                  return (
                    <tr key={v.verificationId}>
                      <td>
                        <span
                          className={`badge ${isPass ? 'badge-resolved' : 'badge-open'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {isPass ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {v.outcome}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {v.incidentId}
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.775rem',
                            fontFamily: 'var(--font-mono)',
                          }}
                          title={v.testExecuted}
                        >
                          {v.testExecuted}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: isPass ? 'var(--color-success)' : 'var(--color-error)',
                          }}
                        >
                          {v.exitCode}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: '#991b1b', fontFamily: 'var(--font-mono)' }}>
                          {v.beforeResult}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: '#047857', fontFamily: 'var(--font-mono)' }}>
                          {v.afterResult}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                          onClick={() => {
                            onSelectIncident(v.incidentId);
                            onNavigateToInvestigation();
                          }}
                        >
                          Inspect <ArrowRight size={11} />
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
  );
};
