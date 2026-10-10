import { IIncident } from '../models/Incident.js';
import { IRun } from '../models/Run.js';
import { Investigation, IInvestigation } from '../models/Investigation.js';
import { Event } from '../models/Event.js';
import { GitService } from './gitService.js';

export class InvestigationEngine {
  static async investigate(
    incident: IIncident,
    run: IRun,
    failureDetails?: {
      suite: string;
      testName: string;
      errorMessage: string;
      stackTrace: string;
      sourceFile?: string;
      sourceLine?: number;
    }
  ): Promise<IInvestigation> {
    const investigationId = `inv_${Date.now()}`;
    const diffSummary = await GitService.getTeamFlowDiff();

    // Collect related events from MongoDB
    const relatedEvents = await Event.find({
      $or: [
        { runId: run.runId },
        { timestamp: { $gte: new Date(Date.now() - 60000) } },
      ],
    }).sort({ timestamp: -1 }).limit(10).lean();

    const failureMsg = failureDetails?.errorMessage || incident.symptom;
    const stackTrace = failureDetails?.stackTrace || '';
    const testName = incident.failedTest;

    // Analyze evidence and rank hypotheses
    let faultyFile: string = '';
    let faultyLine: number | undefined;
    let confidenceScore = 60;
    const confidenceReasons: string[] = ['Baseline comparison established'];
    const supportingEvidence: Array<{ type: string; description: string; detail?: any }> = [];

    // Evidence 1: Test failure
    supportingEvidence.push({
      type: 'TEST_ASSERTION_FAILURE',
      description: `Test "${testName}" failed`,
      detail: failureMsg,
    });

    // Evidence 2: Git changes in TeamFlow
    if (diffSummary.scopedChanges.length > 0) {
      supportingEvidence.push({
        type: 'GIT_DIFF_DETECTED',
        description: `Found ${diffSummary.scopedChanges.length} modified file(s) in TeamFlow compared to baseline ${diffSummary.baselineCommit.slice(0, 7)}`,
        detail: diffSummary.scopedChanges.map(c => c.relativeFilePath),
      });
      confidenceScore += 15;
      confidenceReasons.push('Code changes detected in TeamFlow since healthy baseline');
    }

    // Evidence 3: Correlate with Git diffs
    let matchedDiff = '';
    let hypothesis = '';
    let recommendedPatch = '';
    let recommendedExplanation = '';
    let actionType: 'REVERT_CHANGE' | 'CODE_PATCH' | 'CONFIG_RESET' = 'CODE_PATCH';

    // Check for Permission Regression (Scenario A)
    if (testName.toLowerCase().includes('viewer') || testName.toLowerCase().includes('permission') || failureMsg.includes('403') || failureMsg.includes('expected: 403') || failureMsg.includes('received: 200')) {
      const authChange = diffSummary.scopedChanges.find(c => c.filePath.includes('auth.ts') || c.filePath.includes('auth'));
      if (authChange) {
        faultyFile = authChange.filePath;
        faultyLine = authChange.modifiedLines[0] || 51;
        matchedDiff = authChange.diff;
        confidenceScore += 20;
        confidenceReasons.push('Direct correlation between failing permission assertion and modified authorization middleware');
      } else {
        faultyFile = 'apps/teamflow/backend/src/middleware/auth.ts';
        faultyLine = 51;
      }

      hypothesis = `Authorization check in ${faultyFile} was modified or bypassed (TEST_DISABLE_PERMISSIONS), allowing unauthorized Viewer requests to return 200 OK instead of the expected 403 Forbidden.`;
      recommendedExplanation = 'Restore the strict requireRole() validation in auth middleware so Viewer actions on protected endpoints are strictly rejected with 403 Forbidden.';
      recommendedPatch = `--- a/apps/teamflow/backend/src/middleware/auth.ts\n+++ b/apps/teamflow/backend/src/middleware/auth.ts\n@@ -50,6 +50,3 @@\n-    if (env.TEST_DISABLE_PERMISSIONS) {\n-      return next();\n-    }\n`;
      actionType = 'CODE_PATCH';
    }
    // Check for Task Update / Persistence Failure (Scenario B)
    else if (testName.toLowerCase().includes('update') || testName.toLowerCase().includes('persistence') || failureMsg.includes('500') || failureMsg.includes('DATABASE_ERROR')) {
      const taskChange = diffSummary.scopedChanges.find(c => c.filePath.includes('taskService.ts') || c.filePath.includes('task'));
      if (taskChange) {
        faultyFile = taskChange.filePath;
        faultyLine = taskChange.modifiedLines[0] || 120;
        matchedDiff = taskChange.diff;
        confidenceScore += 20;
        confidenceReasons.push('Stack trace and diff intersect in taskService persistence logic');
      } else {
        faultyFile = 'apps/teamflow/backend/src/services/taskService.ts';
        faultyLine = 120;
      }

      hypothesis = `Task update transaction in ${faultyFile} failed due to simulated database persistence failure (TEST_FAIL_TASK_UPDATE), causing unhandled 500 DATABASE_ERROR.`;
      recommendedExplanation = 'Ensure task state update properly handles transaction rollback and clears failure flags.';
      recommendedPatch = `--- a/apps/teamflow/backend/src/services/taskService.ts\n+++ b/apps/teamflow/backend/src/services/taskService.ts\n`;
      actionType = 'CONFIG_RESET';
    }
    // Check for Background Job Failure (Scenario C)
    else if (testName.toLowerCase().includes('job') || testName.toLowerCase().includes('deadline') || failureMsg.includes('partition')) {
      faultyFile = 'apps/teamflow/backend/src/jobs/deadlineReminderJob.ts';
      faultyLine = 45;
      hypothesis = `Simulated network partition in DeadlineReminderJob caused batch notification dispatch to abort with status 'failed'.`;
      recommendedExplanation = 'Verify retry mechanism and ensure background worker logs failures gracefully without crashing server process.';
      recommendedPatch = `--- a/apps/teamflow/backend/src/jobs/deadlineReminderJob.ts\n+++ b/apps/teamflow/backend/src/jobs/deadlineReminderJob.ts\n`;
      actionType = 'CODE_PATCH';
    }
    // Fallback general correlation
    else {
      if (diffSummary.scopedChanges.length > 0) {
        const primaryChange = diffSummary.scopedChanges[0];
        faultyFile = primaryChange.filePath;
        faultyLine = primaryChange.modifiedLines[0] || 1;
        matchedDiff = primaryChange.diff;
        hypothesis = `Recent code modification in ${primaryChange.relativeFilePath} coincides with test failure in ${testName}.`;
      } else {
        faultyFile = failureDetails?.sourceFile || 'apps/teamflow/backend/src/app.ts';
        faultyLine = failureDetails?.sourceLine;
        hypothesis = `Unexpected assertion failure in ${testName}: ${failureMsg}`;
      }
      recommendedExplanation = 'Inspect recent modifications and ensure inputs and authorization requirements match test assertions.';
      recommendedPatch = diffSummary.rawDiff || 'No active diff detected.';
    }

    // Add Stack trace evidence
    if (stackTrace) {
      supportingEvidence.push({
        type: 'STACK_TRACE_SNIPPET',
        description: 'Captured call stack frames during failure',
        detail: stackTrace.split('\n').filter(Boolean).slice(0, 4),
      });
      confidenceScore += 10;
      confidenceReasons.push('Stack trace frames captured from live Vitest process');
    }

    // Add Database operations evidence
    const dbEvents = relatedEvents.filter(e => e.eventType === 'DB_OPERATION' || e.eventType === 'APP_ERROR');
    if (dbEvents.length > 0) {
      supportingEvidence.push({
        type: 'DATABASE_TELEMETRY',
        description: `${dbEvents.length} relevant telemetry event(s) recorded in MongoDB`,
        detail: dbEvents.map(e => `${e.eventType}: ${e.errorMessage || e.outcome || 'OK'}`),
      });
    }

    // Cap confidence score between 50 and 95
    confidenceScore = Math.min(95, Math.max(50, confidenceScore));

    const investigation = await Investigation.create({
      investigationId,
      incidentId: incident.incidentId,
      runId: run.runId,
      symptom: failureMsg,
      hypothesis,
      confidenceScore,
      confidenceReasoning: confidenceReasons.join('; '),
      faultyFile,
      faultyLine,
      codeDiff: matchedDiff || diffSummary.rawDiff,
      supportingEvidence,
      counterEvidence: diffSummary.scopedChanges.length === 0
        ? 'No uncommitted working tree diff was detected; failure may be due to environment variables or preexisting commit.'
        : '',
      recommendedFix: {
        summary: `Targeted correction for ${faultyFile}`,
        explanation: recommendedExplanation,
        targetFile: faultyFile,
        patchContent: recommendedPatch,
        actionType,
      },
    });

    return investigation;
  }
}
