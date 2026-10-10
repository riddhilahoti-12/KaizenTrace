import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { OverviewSection } from './components/OverviewSection.tsx';
import { IncidentsList } from './components/IncidentsList.tsx';
import { InvestigationView } from './components/InvestigationView.tsx';
import { VerificationView } from './components/VerificationView.tsx';
import { ApplyFixModal } from './components/ApplyFixModal.tsx';
import { ScenarioDrawer } from './components/ScenarioDrawer.tsx';
import {
  fetchHealth,
  fetchBaseline,
  setBaseline,
  fetchRuns,
  fetchIncidents,
  fetchIncidentDetails,
  runDiagnostics,
  applyFix,
  verifyFix,
  injectScenario,
  resetScenarios,
} from './api.ts';
import { HealthStatus, BaselineStatus, Run, Incident, Investigation, Verification } from './types/index.ts';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [baseline, setBaselineState] = useState<BaselineStatus | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [selectedProject, setSelectedProject] = useState<string>('teamflow');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  const [activeVerifications, setActiveVerifications] = useState<Verification[]>([]);

  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [isFixModalOpen, setIsFixModalOpen] = useState<boolean>(false);
  const [isApplyingFix, setIsApplyingFix] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isScenarioDrawerOpen, setIsScenarioDrawerOpen] = useState<boolean>(false);

  // Load Initial State
  const loadInitialData = useCallback(async () => {
    try {
      const [h, b, r, incs] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchBaseline().catch(() => null),
        fetchRuns().catch(() => []),
        fetchIncidents().catch(() => []),
      ]);

      if (h) setHealth(h);
      if (b) setBaselineState(b);
      setRuns(r);
      setIncidents(incs);

      if (incs.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incs[0].incidentId);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadInitialData, 12000);
    return () => clearInterval(interval);
  }, [loadInitialData]);

  // Load details when selected incident changes
  useEffect(() => {
    if (!selectedIncidentId) {
      setActiveInvestigation(null);
      setActiveVerifications([]);
      return;
    }

    fetchIncidentDetails(selectedIncidentId)
      .then((data) => {
        setActiveInvestigation(data.investigation || null);
        setActiveVerifications(data.verifications || []);
      })
      .catch((err) => {
        console.error('Failed to fetch incident details:', err);
      });
  }, [selectedIncidentId]);

  // Run Diagnostics Live
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const result = await runDiagnostics();
      await loadInitialData();

      if (result.incident) {
        setSelectedIncidentId(result.incident.incidentId);
      }
    } catch (err: any) {
      alert(`Diagnostic run failed: ${err.message}`);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Apply Fix
  const handleConfirmApplyFix = async () => {
    if (!selectedIncidentId) return;
    setIsApplyingFix(true);
    try {
      await applyFix(selectedIncidentId);
      setIsFixModalOpen(false);

      // Refresh incident details
      const details = await fetchIncidentDetails(selectedIncidentId);
      setActiveInvestigation(details.investigation || null);
      setActiveVerifications(details.verifications || []);
      await loadInitialData();
    } catch (err: any) {
      alert(`Failed to apply fix: ${err.message}`);
    } finally {
      setIsApplyingFix(false);
    }
  };

  // Verify Fix
  const handleVerifyFix = async () => {
    if (!selectedIncidentId) return;
    setIsVerifying(true);
    try {
      await verifyFix(selectedIncidentId);

      // Refresh incident details and history
      const details = await fetchIncidentDetails(selectedIncidentId);
      setActiveInvestigation(details.investigation || null);
      setActiveVerifications(details.verifications || []);
      await loadInitialData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Inject Scenario
  const handleInjectScenario = async (scenario: 'A' | 'B' | 'C') => {
    await injectScenario(scenario);
    await loadInitialData();
  };

  // Reset Scenarios
  const handleResetScenarios = async () => {
    await resetScenarios();
    await loadInitialData();
  };

  // Snapshot Baseline
  const handleSnapshotBaseline = async () => {
    try {
      await setBaseline();
      const b = await fetchBaseline();
      setBaselineState(b);
      alert('Current repository state recorded as healthy baseline.');
    } catch (err: any) {
      alert(`Failed to snapshot baseline: ${err.message}`);
    }
  };

  // Filtered incidents based on selected run
  const displayedIncidents = selectedRunId
    ? incidents.filter((i) => i.runId === selectedRunId)
    : incidents;

  const currentIncident = incidents.find((i) => i.incidentId === selectedIncidentId) || null;

  return (
    <div className="app-container">
      <Header
        health={health}
        baseline={baseline}
        isRunningDiagnostics={isRunningDiagnostics}
        onRunDiagnostics={handleRunDiagnostics}
        onOpenScenarios={() => setIsScenarioDrawerOpen(true)}
        onResetBaseline={handleSnapshotBaseline}
      />

      <main className="main-content">
        {/* Section A: Overview */}
        <OverviewSection
          runs={runs}
          incidents={incidents}
          selectedRunId={selectedRunId}
          onSelectRun={(runId) => setSelectedRunId(runId || null)}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />

        {/* Section B & C & D: Incidents, Investigation & Verification Split View */}
        <div className="dashboard-grid">
          {/* Column 1: Incidents List */}
          <IncidentsList
            incidents={displayedIncidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => setSelectedIncidentId(id)}
          />

          {/* Column 2: Investigation & Verification Detail */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">
                <ShieldAlert size={16} style={{ color: 'var(--color-primary)' }} />
                {currentIncident
                  ? `Root-Cause Investigation: ${currentIncident.incidentId}`
                  : 'Investigation Workspace'}
              </span>
              {currentIncident && (
                <span className={`badge ${currentIncident.status === 'RESOLVED' ? 'badge-resolved' : 'badge-open'}`}>
                  {currentIncident.status}
                </span>
              )}
            </div>

            <div className="panel-body">
              {currentIncident ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <InvestigationView
                    incident={currentIncident}
                    investigation={activeInvestigation}
                    onOpenFixModal={() => setIsFixModalOpen(true)}
                    onVerify={handleVerifyFix}
                    isVerifying={isVerifying}
                  />

                  {/* Section D: Verification History */}
                  <VerificationView verifications={activeVerifications} />
                </div>
              ) : (
                <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--color-teal)', margin: '0 auto 1rem auto' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    All Systems Operational
                  </div>
                  <div style={{ fontSize: '0.825rem', marginTop: '0.3rem' }}>
                    Select an incident on the left or click <strong>Run Diagnostics</strong> to execute test probes against TeamFlow.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Review & Apply Fix Modal */}
      <ApplyFixModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        onConfirm={handleConfirmApplyFix}
        isApplying={isApplyingFix}
        investigation={activeInvestigation}
      />

      {/* Fault Injection Scenarios Drawer */}
      <ScenarioDrawer
        isOpen={isScenarioDrawerOpen}
        onClose={() => setIsScenarioDrawerOpen(false)}
        onInject={handleInjectScenario}
        onReset={handleResetScenarios}
      />
    </div>
  );
};
