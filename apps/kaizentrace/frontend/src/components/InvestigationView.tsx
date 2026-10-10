import React from 'react';
import { Lightbulb, FileCode, CheckCircle2, Wrench, ShieldAlert, Check } from 'lucide-react';
import { Incident, Investigation } from '../types/index.ts';
import { CodeDiff } from './CodeDiff.tsx';

interface InvestigationViewProps {
  incident: Incident;
  investigation: Investigation | null;
  onOpenFixModal: () => void;
  onVerify: () => void;
  isVerifying: boolean;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  incident,
  investigation,
  onOpenFixModal,
  onVerify,
  isVerifying,
}) => {
  if (!investigation) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Lightbulb size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--color-primary)' }} />
        <div>Investigating incident evidence and diffs...</div>
      </div>
    );
  }

  const isResolved = incident.status === 'RESOLVED';
  const isPatchReady = incident.status === 'PATCH_READY';

  return (
    <div className="investigation-container">
      {/* 1. Observed Symptom Alert */}
      <div className="symptom-alert">
        <span className="symptom-title">Observed Symptom (Assertion / Server Error)</span>
        <span className="symptom-desc">{investigation.symptom}</span>
      </div>

      {/* 2. Leading Hypothesis Card */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f766e' }}>Target Suspect:</span>
            <span className="hypothesis-source-link">
              <FileCode size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {investigation.faultyFile}
              {investigation.faultyLine ? `:${investigation.faultyLine}` : ''}
            </span>
          </div>
        )}

        <div style={{ fontSize: '0.75rem', color: '#115e59', opacity: 0.85, fontStyle: 'italic' }}>
          Basis: {investigation.confidenceReasoning}
        </div>
      </div>

      {/* 3. Code Diff (Before vs After baseline) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          TeamFlow Working Code Changes vs Known-Good Baseline
        </div>
        <CodeDiff
          diffText={investigation.codeDiff}
          filePath={investigation.faultyFile || 'apps/teamflow/backend/src/...'}
        />
      </div>

      {/* 4. Supporting Evidence Drawer */}
      <div className="evidence-section">
        <div className="evidence-header">Supporting Forensic Evidence ({investigation.supportingEvidence.length})</div>
        {investigation.supportingEvidence.map((ev, idx) => (
          <div key={idx} className="evidence-card">
            <div className="evidence-title">
              <ShieldAlert size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{ev.description}</span>
            </div>
            {ev.detail && (
              <div className="evidence-content">
                {Array.isArray(ev.detail) ? ev.detail.join('\n') : typeof ev.detail === 'object' ? JSON.stringify(ev.detail, null, 2) : ev.detail}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Counterevidence or uncertainty if any */}
      {investigation.counterEvidence && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#92400e' }}>
          <strong>Uncertainty / Caveat:</strong> {investigation.counterEvidence}
        </div>
      )}

      {/* 5. Recommended Fix & Action */}
      <div className="fix-recommendation-card">
        <div className="fix-header">
          <span className="fix-title">{investigation.recommendedFix.summary}</span>
          {isResolved && (
            <span className="badge badge-resolved" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Check size={12} /> Fixed & Verified
            </span>
          )}
        </div>

        <p className="fix-explanation">
          {investigation.recommendedFix.explanation}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          {!isResolved && (
            <button
              className="btn btn-primary"
              onClick={onOpenFixModal}
              title="Review proposed patch before applying"
            >
              <Wrench size={14} />
              <span>{isPatchReady ? 'Re-apply Fix Patch' : 'Review & Apply Fix'}</span>
            </button>
          )}

          <button
            className="btn btn-success"
            onClick={onVerify}
            disabled={isVerifying}
            title="Rerun regression test against TeamFlow"
          >
            <CheckCircle2 size={14} />
            <span>{isVerifying ? 'Running Verification Test...' : isResolved ? 'Re-verify Recovery' : 'Run Verification Test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
