import React from 'react';
import {
  Lightbulb,
  FileCode,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  Check,
  Play,
  Clock,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Incident, Investigation, Verification } from '../types/index.ts';
import { CodeDiff } from './CodeDiff.tsx';
import { VerificationView } from './VerificationView.tsx';

interface InvestigationViewProps {
  incident: Incident | null;
  investigation: Investigation | null;
  verifications: Verification[];
  onOpenFixModal: () => void;
  onVerify: () => void;
  isVerifying: boolean;
  onRerunDiagnostics: () => void;
  isRunningDiagnostics: boolean;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  incident,
  investigation,
  verifications,
  onOpenFixModal,
  onVerify,
  isVerifying,
  onRerunDiagnostics,
  isRunningDiagnostics,
}) => {
  if (!incident) {
    return (
      <div className="panel-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Lightbulb size={40} style={{ margin: '0 auto 1rem auto', color: 'var(--color-primary)' }} />
        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          No Incident Selected for Investigation
        </div>
        <div style={{ fontSize: '0.825rem', marginTop: '0.35rem' }}>
          Select an incident from the <strong>Incidents</strong> tab or run diagnostics to detect regressions.
        </div>
      </div>
    );
  }

  const isResolved = incident.status === 'RESOLVED';
  const isPatchReady = incident.status === 'PATCH_READY';

  const statusClass =
    incident.status === 'RESOLVED'
      ? 'badge-resolved'
      : incident.status === 'PATCH_READY'
      ? 'badge-patch-ready'
      : incident.status === 'INVESTIGATING'
      ? 'badge-investigating'
      : 'badge-open';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Investigation Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className={`badge ${statusClass}`}>{incident.status}</span>
            <span className={`badge badge-severity-${incident.severity}`}>{incident.severity}</span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {incident.incidentId}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {incident.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Created: {new Date(incident.createdAt).toLocaleTimeString()}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={12} /> Run ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{incident.runId}</code>
            </span>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onRerunDiagnostics}
          disabled={isRunningDiagnostics}
          title="Rerun probe to re-examine error conditions"
        >
          <Play size={13} />
          <span>{isRunningDiagnostics ? 'Running Probe...' : 'Rerun Diagnostics'}</span>
        </button>
      </div>

      {!investigation ? (
        <div className="panel-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Lightbulb size={32} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--color-primary)' }} />
          <div>Synthesizing telemetry, git diff, and assertion evidence...</div>
        </div>
      ) : (
        /* 2-Column Desktop Grid */
        <div className="investigation-grid">
          {/* Left Column: Diagnostics, Hypotheses & Evidence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Symptom Alert */}
            <div className="symptom-alert">
              <span className="symptom-title">Observed Symptom (Test Assertion / API Error)</span>
              <span className="symptom-desc">{investigation.symptom}</span>
            </div>

            {/* Leading Hypothesis Card */}
            <div className="hypothesis-card">
              <div className="hypothesis-header">
                <span className="hypothesis-title">Leading Root-Cause Hypothesis</span>
                <span className="confidence-pill">
                  Confidence: {investigation.confidenceScore}% (Rule-Based Correlation)
                </span>
              </div>

              <p className="hypothesis-text">
                {investigation.hypothesis}
              </p>

              {investigation.faultyFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#0f766e' }}>Suspected Source:</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.775rem',
                      backgroundColor: '#ccfbf1',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      color: '#0f766e',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <FileCode size={13} />
                    {investigation.faultyFile}
                    {investigation.faultyLine ? `:${investigation.faultyLine}` : ''}
                  </span>
                </div>
              )}

              <div style={{ fontSize: '0.725rem', color: '#115e59', opacity: 0.9, fontStyle: 'italic' }}>
                Correlation Basis: {investigation.confidenceReasoning}
              </div>
            </div>

            {/* Git Diff Viewer */}
            <div className="panel-card">
              <div className="panel-header">
                <span className="panel-title">
                  <FileCode size={15} style={{ color: 'var(--color-primary)' }} />
                  Source Changes vs Known-Good Baseline
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {investigation.faultyFile || 'apps/teamflow/...'}
                </span>
              </div>
              <div style={{ padding: '0.75rem' }}>
                <CodeDiff
                  diffText={investigation.codeDiff}
                  filePath={investigation.faultyFile || 'apps/teamflow/backend/src/...'}
                />
              </div>
            </div>

            {/* Supporting Forensic Evidence Panel */}
            <div className="panel-card">
              <div className="panel-header">
                <span className="panel-title">
                  <ShieldAlert size={15} style={{ color: 'var(--color-primary)' }} />
                  Supporting Evidence ({investigation.supportingEvidence.length})
                </span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {investigation.supportingEvidence.map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
                      <span>{ev.description}</span>
                    </div>
                    {ev.detail && (
                      <pre
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem',
                          fontSize: '0.725rem',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '180px',
                          overflowY: 'auto',
                        }}
                      >
                        {Array.isArray(ev.detail)
                          ? ev.detail.join('\n')
                          : typeof ev.detail === 'object'
                          ? JSON.stringify(ev.detail, null, 2)
                          : ev.detail}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Workflow, Fix Action & Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Triage Progress Card */}
            <div className="panel-card">
              <div className="panel-header">
                <span className="panel-title">
                  <Activity size={15} style={{ color: 'var(--color-primary)' }} />
                  Investigation Triage Progress
                </span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Fault Detected & Correlated</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vitest failure matched with Git delta</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isPatchReady || isResolved ? 'var(--color-success-bg)' : 'var(--color-primary-soft)',
                      color: isPatchReady || isResolved ? 'var(--color-success)' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    {isPatchReady || isResolved ? '✓' : '2'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Safe Fix Patch Synthesized</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Targeted minimal file modification</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isResolved ? 'var(--color-success-bg)' : 'var(--bg-surface)',
                      color: isResolved ? 'var(--color-success)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    {isResolved ? '✓' : '3'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Post-Fix Live Verification</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {isResolved ? 'Verified passing with 0 errors' : 'Awaiting automated verification run'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposed Fix Action Card */}
            <div className="panel-card">
              <div className="panel-header">
                <span className="panel-title">
                  <Wrench size={15} style={{ color: 'var(--color-lavender)' }} />
                  Automated Fix Recommendation
                </span>
                {isResolved && (
                  <span className="badge badge-resolved">
                    <Check size={12} /> Fixed & Verified
                  </span>
                )}
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {investigation.recommendedFix.summary}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {investigation.recommendedFix.explanation}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {!isResolved && (
                    <button
                      className="btn btn-primary"
                      onClick={onOpenFixModal}
                      title="Review proposed patch before applying"
                    >
                      <Wrench size={14} />
                      <span>{isPatchReady ? 'Re-Apply Fix Patch' : 'Review & Apply Fix'}</span>
                    </button>
                  )}

                  <button
                    className="btn btn-success"
                    onClick={onVerify}
                    disabled={isVerifying}
                    title="Rerun targeted Vitest test against TeamFlow"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isVerifying ? 'Running Verification Test...' : isResolved ? 'Re-Verify Recovery' : 'Run Verification Test'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Results Panel */}
            <VerificationView verifications={verifications} />
          </div>
        </div>
      )}
    </div>
  );
};
