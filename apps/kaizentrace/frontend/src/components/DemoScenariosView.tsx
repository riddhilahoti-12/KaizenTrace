import React, { useState } from 'react';
import {
  ShieldAlert,
  Database,
  Clock,
  RotateCcw,
  Play,
} from 'lucide-react';

interface DemoScenariosViewProps {
  scenarioStatus: {
    scenarioA: boolean;
    scenarioB: boolean;
    scenarioC: boolean;
  };
  onInject: (scenario: 'A' | 'B' | 'C') => Promise<void>;
  onReset: () => Promise<void>;
  onRunDiagnostics: () => void;
  isRunningDiagnostics: boolean;
}

export const DemoScenariosView: React.FC<DemoScenariosViewProps> = ({
  scenarioStatus,
  onInject,
  onReset,
  onRunDiagnostics,
  isRunningDiagnostics,
}) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  const handleInjectWithConfirmation = async (scenario: 'A' | 'B' | 'C', name: string) => {
    const ok = window.confirm(
      `Are you sure you want to inject Fault ${scenario}: ${name}?\nThis will modify TeamFlow files to simulate a real production regression.`
    );
    if (!ok) return;

    setLoadingScenario(scenario);
    try {
      await onInject(scenario);
    } catch (err: any) {
      alert(`Fault injection failed: ${err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleResetWithConfirmation = async () => {
    const ok = window.confirm(
      'Are you sure you want to reset all fault scenarios to the healthy baseline state?'
    );
    if (!ok) return;

    setLoadingScenario('reset');
    try {
      await onReset();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Controlled Fault Injection Harness
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Inject genuine regressions into TeamFlow source and configuration to test KaizenTrace's evidence-based triage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleResetWithConfirmation}
            disabled={loadingScenario !== null}
            title="Restore TeamFlow to clean baseline"
          >
            <RotateCcw size={14} />
            <span>Reset All Scenarios</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={onRunDiagnostics}
            disabled={isRunningDiagnostics}
            title="Run diagnostics after fault injection"
          >
            <Play size={14} />
            <span>{isRunningDiagnostics ? 'Analyzing...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Scenario A */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <ShieldAlert size={16} style={{ color: 'var(--color-error)' }} />
              Scenario A: Permission Regression
            </span>
            <span className={`badge ${scenarioStatus.scenarioA ? 'badge-open' : 'badge-resolved'}`}>
              {scenarioStatus.scenarioA ? 'FAULT ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <strong>Tested Behavior:</strong> Role-based access control in TeamFlow API.
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <strong>Expected Failure:</strong> Viewer role bypasses 403 Forbidden check in <code>auth.ts</code> and incorrectly performs an update.
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              File: apps/teamflow/backend/src/middleware/auth.ts
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleInjectWithConfirmation('A', 'Permission Regression')}
              disabled={loadingScenario !== null || scenarioStatus.scenarioA}
              style={{ marginTop: '0.5rem' }}
            >
              {loadingScenario === 'A' ? 'Injecting...' : scenarioStatus.scenarioA ? 'Fault Already Active' : 'Inject Scenario A Fault'}
            </button>
          </div>
        </div>

        {/* Scenario B */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <Database size={16} style={{ color: 'var(--color-warning)' }} />
              Scenario B: Persistence Failure
            </span>
            <span className={`badge ${scenarioStatus.scenarioB ? 'badge-open' : 'badge-resolved'}`}>
              {scenarioStatus.scenarioB ? 'FAULT ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <strong>Tested Behavior:</strong> Database task state updates and atomic persistence.
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <strong>Expected Failure:</strong> Task update encounters simulated write drop, returning 500 error instead of 200 OK.
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              Env Flag: TEST_FAIL_TASK_UPDATE=true
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleInjectWithConfirmation('B', 'Database Persistence Failure')}
              disabled={loadingScenario !== null || scenarioStatus.scenarioB}
              style={{ marginTop: '0.5rem' }}
            >
              {loadingScenario === 'B' ? 'Injecting...' : scenarioStatus.scenarioB ? 'Fault Already Active' : 'Inject Scenario B Fault'}
            </button>
          </div>
        </div>

        {/* Scenario C */}
        <div className="panel-card">
          <div className="panel-header">
            <span className="panel-title">
              <Clock size={16} style={{ color: 'var(--color-lavender)' }} />
              Scenario C: Background Job Failure
            </span>
            <span className={`badge ${scenarioStatus.scenarioC ? 'badge-open' : 'badge-resolved'}`}>
              {scenarioStatus.scenarioC ? 'FAULT ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <strong>Tested Behavior:</strong> Scheduled deadline notification processor.
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <strong>Expected Failure:</strong> Cron job crashes during overdue notification batch, emitting APP_ERROR telemetry.
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              Env Flag: TEST_FAIL_DEADLINE_JOB=true
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleInjectWithConfirmation('C', 'Background Job Failure')}
              disabled={loadingScenario !== null || scenarioStatus.scenarioC}
              style={{ marginTop: '0.5rem' }}
            >
              {loadingScenario === 'C' ? 'Injecting...' : scenarioStatus.scenarioC ? 'Fault Already Active' : 'Inject Scenario C Fault'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
