import React, { useState } from 'react';
import { X, ShieldAlert, Database, Clock, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (scenario: 'A' | 'B' | 'C') => Promise<void>;
  onReset: () => Promise<void>;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  onClose,
  onInject,
  onReset,
}) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInject = async (scenario: 'A' | 'B' | 'C', name: string) => {
    setLoadingScenario(scenario);
    setStatusMessage(null);
    try {
      await onInject(scenario);
      setStatusMessage(`Scenario ${scenario} (${name}) activated successfully.`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleReset = async () => {
    setLoadingScenario('reset');
    setStatusMessage(null);
    try {
      await onReset();
      setStatusMessage('All scenarios successfully reset to clean baseline.');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Live Demonstration Scenarios</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Activate real fault injections to reproduce software regressions in TeamFlow and demonstrate KaizenTrace root-cause analysis and auto-recovery.
          </p>

          {statusMessage && (
            <div style={{ padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Scenario A */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
              <strong style={{ fontSize: '0.875rem' }}>Scenario A: Permission Regression</strong>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Disables role verification in <code>auth.ts</code>. A Viewer is able to update tasks instead of receiving 403 Forbidden.
            </p>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.4rem 0.8rem', alignSelf: 'flex-start' }}
              onClick={() => handleInject('A', 'Permission Regression')}
              disabled={loadingScenario !== null}
            >
              {loadingScenario === 'A' ? 'Injecting...' : 'Inject Permission Bypass'}
            </button>
          </div>

          {/* Scenario B */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} style={{ color: 'var(--color-warning)' }} />
              <strong style={{ fontSize: '0.875rem' }}>Scenario B: DB Persistence Failure</strong>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Simulates a write error during task state transaction, triggering 500 DATABASE_ERROR and aborting without fake audits.
            </p>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.4rem 0.8rem', alignSelf: 'flex-start' }}
              onClick={() => handleInject('B', 'Persistence Failure')}
              disabled={loadingScenario !== null}
            >
              {loadingScenario === 'B' ? 'Injecting...' : 'Inject Persistence Failure'}
            </button>
          </div>

          {/* Scenario C */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--color-primary)' }} />
              <strong style={{ fontSize: '0.875rem' }}>Scenario C: Background Job Failure</strong>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Simulates network partition during deadline reminder background execution, recording failed job run.
            </p>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.4rem 0.8rem', alignSelf: 'flex-start' }}
              onClick={() => handleInject('C', 'Background Job Failure')}
              disabled={loadingScenario !== null}
            >
              {loadingScenario === 'C' ? 'Injecting...' : 'Inject Job Failure'}
            </button>
          </div>

          {/* Reset Action */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleReset}
              disabled={loadingScenario !== null}
            >
              <RotateCcw size={14} />
              <span>Reset All to Clean Baseline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
