import { HealthStatus, BaselineStatus, Run, Incident, Investigation, Verification, TelemetryEvent } from './types/index.ts';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchBaseline(): Promise<BaselineStatus> {
  const res = await fetch(`${API_BASE}/baseline`);
  if (!res.ok) throw new Error('Failed to fetch baseline');
  return res.json();
}

export async function setBaseline(commitHash?: string): Promise<{ success: boolean; baseline: any }> {
  const res = await fetch(`${API_BASE}/baseline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commitHash }),
  });
  if (!res.ok) throw new Error('Failed to set baseline');
  return res.json();
}

export async function fetchRuns(): Promise<Run[]> {
  const res = await fetch(`${API_BASE}/runs`);
  if (!res.ok) throw new Error('Failed to fetch runs');
  const data = await res.json();
  return data.runs || [];
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  const data = await res.json();
  return data.incidents || [];
}

export async function fetchIncidentDetails(id: string): Promise<{
  incident: Incident;
  investigation?: Investigation;
  verifications?: Verification[];
}> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident details');
  return res.json();
}

export async function fetchInvestigation(incidentId: string): Promise<Investigation | null> {
  const res = await fetch(`${API_BASE}/investigations/${incidentId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.investigation || null;
}

export async function runDiagnostics(testFilter?: string): Promise<{
  run: Run;
  incident?: Incident | null;
  investigation?: Investigation | null;
}> {
  const res = await fetch(`${API_BASE}/diagnostics/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testFilter }),
  });
  if (!res.ok) throw new Error('Diagnostics run failed');
  return res.json();
}

export async function applyFix(incidentId: string): Promise<{
  success: boolean;
  message: string;
  targetFile: string;
  patchApplied: string;
}> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/apply-fix`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to apply fix');
  return res.json();
}

export async function verifyFix(incidentId: string): Promise<{
  verification: Verification;
  incident: Incident;
}> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/verify`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Verification execution failed');
  return res.json();
}

export async function injectScenario(scenario: 'A' | 'B' | 'C'): Promise<{
  success: boolean;
  message: string;
  modifiedFile: string;
}> {
  const res = await fetch(`${API_BASE}/scenarios/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error('Failed to inject scenario');
  return res.json();
}

export async function resetScenarios(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/scenarios/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset scenarios');
  return res.json();
}

export async function fetchEvents(runId?: string): Promise<TelemetryEvent[]> {
  const url = runId ? `${API_BASE}/events?runId=${encodeURIComponent(runId)}` : `${API_BASE}/events`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.events || [];
}
