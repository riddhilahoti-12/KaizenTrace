import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { TopNav } from './components/TopNav.tsx';
import { OverviewSection } from './components/OverviewSection.tsx';
import { IncidentsView } from './components/IncidentsView.tsx';
import { InvestigationView } from './components/InvestigationView.tsx';
import { DiagnosticRunsView } from './components/DiagnosticRunsView.tsx';
import { VerificationHistoryView } from './components/VerificationHistoryView.tsx';
import { DemoScenariosView } from './components/DemoScenariosView.tsx';
import { ApplyFixModal } from './components/ApplyFixModal.tsx';
import {
  fetchHealth,
  fetchBaseline,
  setBaseline,
  fetchRuns,
  fetchIncidents,
  fetchIncidentDetails,
  fetchVerifications,
  fetchScenarioStatus,
  runDiagnostics,
  applyFix,
  verifyFix,
  injectScenario,
  resetScenarios,
} from './api.ts';
import { HealthStatus, BaselineStatus, Run, Incident, Investigation, Verification } from './types/index.ts';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [baseline, setBaselineState] = useState<BaselineStatus | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [allVerifications, setAllVerifications] = useState<Verification[]>([]);
  const [scenarioStatus, setScenarioStatus] = useState<{
    scenarioA: boolean;
    scenarioB: boolean;
    scenarioC: boolean;
  }>({ scenarioA: false, scenarioB: false, scenarioC: false });

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  const [activeVerifications, setActiveVerifications] = useState<Verification[]>([]);

  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [isFixModalOpen, setIsFixModalOpen] = useState<boolean>(false);
  const [isApplyingFix, setIsApplyingFix] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Load Initial State
  const loadInitialData = useCallback(async () => {
    try {
      const [h, b, r, incs, verifs, scStatus] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchBaseline().catch(() => null),
        fetchRuns().catch(() => []),
        fetchIncidents().catch(() => []),
        fetchVerifications().catch(() => []),
        fetchScenarioStatus().catch(() => ({ scenarioA: false, scenarioB: false, scenarioC: false })),
      ]);

      if (h) setHealth(h);
      if (b) setBaselineState(b);
      setRuns(r);
      setIncidents(incs);
      setAllVerifications(verifs);
      setScenarioStatus(scStatus);

      if (incs.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incs[0].incidentId);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadInitialData, 10000);
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
        setCurrentTab('investigations');
      }
    } catch (err: any) {
      alert(`Diagnostic probe failed: ${err.message}`);
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
      alert('Current repository state recorded as clean baseline.');
    } catch (err: any) {
      alert(`Failed to snapshot baseline: ${err.message}`);
    }
  };

  const currentIncident = incidents.find((i) => i.incidentId === selectedIncidentId) || null;
  const openIncidentsCount = incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        openIncidentsCount={openIncidentsCount}
        health={health}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        <TopNav
          currentTab={currentTab}
          health={health}
          baseline={baseline}
          isRunningDiagnostics={isRunningDiagnostics}
          onRunDiagnostics={handleRunDiagnostics}
          onRefresh={loadInitialData}
          onSnapshotBaseline={handleSnapshotBaseline}
        />

        <main className="page-container">
          {currentTab === 'overview' && (
            <OverviewSection
              runs={runs}
              incidents={incidents}
              verifications={allVerifications}
              onSelectIncident={(id) => {
                setSelectedIncidentId(id);
                setCurrentTab('investigations');
              }}
              onSelectRun={(id) => {
                setSelectedRunId(id);
                setCurrentTab('runs');
              }}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              onNavigateToInvestigation={() => setCurrentTab('investigations')}
            />
          )}

          {currentTab === 'investigations' && (
            <InvestigationView
              incident={currentIncident}
              investigation={activeInvestigation}
              verifications={activeVerifications}
              onOpenFixModal={() => setIsFixModalOpen(true)}
              onVerify={handleVerifyFix}
              isVerifying={isVerifying}
              onRerunDiagnostics={handleRunDiagnostics}
              isRunningDiagnostics={isRunningDiagnostics}
            />
          )}

          {currentTab === 'runs' && (
            <DiagnosticRunsView
              runs={runs}
              incidents={incidents}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
              onSelectIncident={setSelectedIncidentId}
              onNavigateToInvestigation={() => setCurrentTab('investigations')}
            />
          )}

          {currentTab === 'verifications' && (
            <VerificationHistoryView
              verifications={allVerifications}
              onSelectIncident={setSelectedIncidentId}
              onNavigateToInvestigation={() => setCurrentTab('investigations')}
            />
          )}

          {currentTab === 'scenarios' && (
            <DemoScenariosView
              scenarioStatus={scenarioStatus}
              onInject={handleInjectScenario}
              onReset={handleResetScenarios}
              onRunDiagnostics={handleRunDiagnostics}
              isRunningDiagnostics={isRunningDiagnostics}
            />
          )}
        </main>
      </div>

      {/* Review & Apply Fix Modal */}
      <ApplyFixModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        onConfirm={handleConfirmApplyFix}
        isApplying={isApplyingFix}
        investigation={activeInvestigation}
      />
    </div>
  );
};
