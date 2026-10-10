import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Terminal, Database } from 'lucide-react';
import { Verification } from '../types/index.ts';

interface VerificationViewProps {
  verifications: Verification[];
}

export const VerificationView: React.FC<VerificationViewProps> = ({ verifications }) => {
  if (verifications.length === 0) {
    return null;
  }

  const latest = verifications[0];
  const isPass = latest.outcome === 'PASS';
  const isFail = latest.outcome === 'FAIL';

  const bannerClass = isPass
    ? 'verification-pass'
    : isFail
    ? 'verification-fail'
    : 'verification-inconclusive';

  return (
    <div className="verification-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Automated Fix Verification History
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date(latest.timestamp).toLocaleString()}
        </span>
      </div>

      <div className={`verification-status-banner ${bannerClass}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isPass ? (
            <CheckCircle size={22} style={{ color: 'var(--color-success)' }} />
          ) : isFail ? (
            <XCircle size={22} style={{ color: 'var(--color-danger)' }} />
          ) : (
            <AlertCircle size={22} style={{ color: 'var(--color-warning)' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Outcome: {latest.outcome} (Exit Code: {latest.exitCode})
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              {isPass
                ? 'Regression test successfully verified. Incident state transition: RESOLVED.'
                : 'Verification test executed but did not satisfy assertion expectations.'}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
            Before Fix (Regression State)
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            {latest.beforeResult}
          </div>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '6px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
            After Fix (Post-Patch Verification)
          </div>
          <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            {latest.afterResult}
          </div>
        </div>
      </div>

      {/* DB & Command Details */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Terminal size={14} style={{ color: 'var(--color-primary)' }} />
          <span>Executed: <code>{latest.testExecuted}</code></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Database size={14} style={{ color: 'var(--color-teal)' }} />
          <span>Database Outcome: <strong>{latest.dbOutcome}</strong></span>
        </div>
      </div>

      {latest.outputSnippet && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
            Verification Vitest Output Log
          </div>
          <pre
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.725rem',
              fontFamily: 'var(--font-mono)',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {latest.outputSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
