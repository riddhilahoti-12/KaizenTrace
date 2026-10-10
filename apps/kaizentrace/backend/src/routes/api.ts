import { Router, Request, Response } from 'express';
import { getDbStatus } from '../config/database.js';
import { GitService } from '../services/gitService.js';
import { DiagnosticRunner } from '../services/diagnosticRunner.js';
import { FixService } from '../services/fixService.js';
import { ScenarioService } from '../services/scenarioService.js';
import { Event } from '../models/Event.js';
import { Run } from '../models/Run.js';
import { Incident } from '../models/Incident.js';
import { Investigation } from '../models/Investigation.js';
import { Verification } from '../models/Verification.js';

const router = Router();

// Health Endpoint
router.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();
  const baseline = await GitService.getBaselineCommit();
  const currentCommit = GitService.getCurrentCommit();

  // Test TeamFlow availability
  let teamflowStatus = 'UNKNOWN';
  try {
    const tfRes = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(1500) });
    teamflowStatus = tfRes.ok ? 'ONLINE' : 'DEGRADED';
  } catch {
    teamflowStatus = 'OFFLINE';
  }

  res.json({
    status: 'ok',
    service: 'kaizentrace-backend',
    database: dbStatus,
    git: {
      baselineCommit: baseline,
      currentCommit,
    },
    teamflow: {
      status: teamflowStatus,
      targetPort: 5000,
    },
    timestamp: new Date().toISOString(),
  });
});

// Projects
router.get('/projects', async (_req: Request, res: Response) => {
  res.json({
    projects: [
      { id: 'teamflow', name: 'TeamFlow Project Management', description: 'Target Demo Application' },
    ],
  });
});

// Baseline
router.get('/baseline', async (_req: Request, res: Response) => {
  const baseline = await GitService.getBaselineCommit();
  const diffSummary = await GitService.getTeamFlowDiff(baseline);
  res.json({
    baselineCommit: baseline,
    hasChanges: diffSummary.hasChanges,
    changedFilesCount: diffSummary.scopedChanges.length,
    changedFiles: diffSummary.scopedChanges.map(c => c.relativeFilePath),
  });
});

router.post('/baseline', async (req: Request, res: Response) => {
  const commit = req.body.commitHash || GitService.getCurrentCommit();
  const baseline = await GitService.setBaselineCommit(commit, req.body.notes || 'User-set baseline');
  res.json({ success: true, baseline });
});

// Ingest Events
router.post('/events', async (req: Request, res: Response) => {
  try {
    const raw = req.body;
    const eventsToInsert = Array.isArray(raw) ? raw : [raw];
    const inserted = [];

    for (const item of eventsToInsert) {
      if (!item.component) continue;
      const eventId = item.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Deduplicate by eventId
      const existing = await Event.findOne({ eventId });
      if (!existing) {
        const ev = await Event.create({
          eventId,
          projectId: item.projectId || 'teamflow',
          runId: item.runId,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          eventType: item.eventType || 'APP_ERROR',
          requestId: item.requestId,
          component: item.component,
          route: item.route,
          operation: item.operation,
          errorMessage: item.errorMessage,
          stackTrace: item.stackTrace,
          sourceFile: item.sourceFile,
          sourceLine: item.sourceLine,
          outcome: item.outcome,
          severity: item.severity || 'medium',
          metadata: item.metadata,
        });
        inserted.push(ev);
      }
    }

    res.json({ success: true, count: inserted.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List Events
router.get('/events', async (req: Request, res: Response) => {
  const filter: any = {};
  if (req.query.runId) filter.runId = req.query.runId;
  if (req.query.eventType) filter.eventType = req.query.eventType;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  const events = await Event.find(filter).sort({ timestamp: -1 }).limit(limit).lean();
  res.json({ events });
});

// Runs
router.get('/runs', async (_req: Request, res: Response) => {
  const runs = await Run.find().sort({ timestamp: -1 }).limit(50).lean();
  res.json({ runs });
});

router.get('/runs/:id', async (req: Request, res: Response) => {
  const run = await Run.findOne({ runId: req.params.id }).lean();
  if (!run) return res.status(404).json({ error: 'Run not found' });
  const incidents = await Incident.find({ runId: req.params.id }).lean();
  res.json({ run, incidents });
});

// Incidents
router.get('/incidents', async (_req: Request, res: Response) => {
  const incidents = await Incident.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({ incidents });
});

router.get('/incidents/:id', async (req: Request, res: Response) => {
  const incident = await Incident.findOne({ incidentId: req.params.id }).lean();
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  const investigation = await Investigation.findOne({ incidentId: req.params.id }).lean();
  const verifications = await Verification.find({ incidentId: req.params.id }).sort({ timestamp: -1 }).lean();
  res.json({ incident, investigation, verifications });
});

// Investigations
router.get('/investigations/:incidentId', async (req: Request, res: Response) => {
  const investigation = await Investigation.findOne({ incidentId: req.params.incidentId }).lean();
  if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
  res.json({ investigation });
});

// Apply Fix
router.post('/incidents/:id/apply-fix', async (req: Request, res: Response) => {
  try {
    const result = await FixService.applyFix(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Fix
router.post('/incidents/:id/verify', async (req: Request, res: Response) => {
  try {
    const result = await FixService.verifyFix(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verifications
router.get('/verifications', async (_req: Request, res: Response) => {
  const verifications = await Verification.find().sort({ timestamp: -1 }).limit(50).lean();
  res.json({ verifications });
});

// Run Diagnostics
router.post('/diagnostics/run', async (req: Request, res: Response) => {
  try {
    const filter = req.body.testFilter as string | undefined;
    const result = await DiagnosticRunner.runDiagnostics(filter);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scenario controls
router.get('/scenarios/status', async (_req: Request, res: Response) => {
  const status = ScenarioService.getScenarioStatus();
  res.json(status);
});

router.post('/scenarios/inject', async (req: Request, res: Response) => {
  const { scenario } = req.body;
  let result: any;
  if (scenario === 'A' || scenario === 'permission') {
    result = ScenarioService.injectPermissionRegression();
  } else if (scenario === 'B' || scenario === 'persistence') {
    result = ScenarioService.injectTaskPersistenceFailure();
  } else if (scenario === 'C' || scenario === 'job') {
    result = ScenarioService.injectDeadlineJobFailure();
  } else {
    return res.status(400).json({ error: 'Unknown scenario. Choose A, B, or C' });
  }
  res.json(result);
});

router.post('/scenarios/reset', async (_req: Request, res: Response) => {
  const result = ScenarioService.resetAllScenarios();
  res.json(result);
});

export default router;
