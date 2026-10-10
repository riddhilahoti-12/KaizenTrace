export interface HealthStatus {
  status: string;
  service: string;
  database: {
    connected: boolean;
    mode: 'atlas' | 'local' | 'memory';
    label: string;
    host: string;
  };
  git: {
    baselineCommit: string;
    currentCommit: string;
  };
  teamflow: {
    status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';
    targetPort: number;
  };
  timestamp: string;
}

export interface BaselineStatus {
  baselineCommit: string;
  hasChanges: boolean;
  changedFilesCount: number;
  changedFiles: string[];
}

export interface Run {
  runId: string;
  projectId: string;
  timestamp: string;
  gitCommit: string;
  isHealthy: boolean;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  summary: string;
  metadata?: {
    exitCode?: number;
    stdoutSnippet?: string;
  };
}

export interface Incident {
  incidentId: string;
  projectId: string;
  runId: string;
  title: string;
  status: 'OPEN' | 'INVESTIGATING' | 'PATCH_READY' | 'RESOLVED';
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptom: string;
  failedTest: string;
  affectedRoute?: string;
  affectedComponent?: string;
  createdAt: string;
  resolvedAt?: string;
  evidenceCount: number;
}

export interface Investigation {
  investigationId: string;
  incidentId: string;
  runId: string;
  symptom: string;
  hypothesis: string;
  confidenceScore: number;
  confidenceReasoning: string;
  faultyFile?: string;
  faultyLine?: number;
  codeDiff?: string;
  supportingEvidence: Array<{
    type: string;
    description: string;
    detail?: any;
  }>;
  counterEvidence?: string;
  recommendedFix: {
    summary: string;
    explanation: string;
    targetFile: string;
    patchContent: string;
    actionType?: 'REVERT_CHANGE' | 'CODE_PATCH' | 'CONFIG_RESET';
  };
  createdAt: string;
}

export interface Verification {
  verificationId: string;
  incidentId: string;
  testExecuted: string;
  beforeResult: string;
  afterResult: string;
  exitCode: number;
  outputSnippet: string;
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  dbOutcome: string;
  timestamp: string;
}

export interface TelemetryEvent {
  eventId: string;
  projectId: string;
  runId?: string;
  timestamp: string;
  eventType: 'APP_ERROR' | 'HTTP_FAILURE' | 'TEST_FAILURE' | 'DB_OPERATION' | 'JOB_FAILURE' | 'GIT_CHANGE' | 'FIX_VERIFICATION';
  requestId?: string;
  component: string;
  route?: string;
  operation?: string;
  errorMessage?: string;
  stackTrace?: string;
  sourceFile?: string;
  sourceLine?: number;
  outcome?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}
