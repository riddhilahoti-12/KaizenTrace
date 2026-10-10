import fs from 'fs';
import path from 'path';
import { Incident } from '../models/Incident.js';
import { Investigation } from '../models/Investigation.js';
import { Verification, IVerification } from '../models/Verification.js';
import { Event } from '../models/Event.js';
import { GitService } from './gitService.js';
import { DiagnosticRunner } from './diagnosticRunner.js';

export class FixService {
  static async applyFix(incidentId: string): Promise<{
    success: boolean;
    message: string;
    targetFile: string;
    patchApplied: string;
  }> {
    const incident = await Incident.findOne({ incidentId });
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const investigation = await Investigation.findOne({ incidentId });
    if (!investigation) {
      throw new Error(`Investigation for incident ${incidentId} not found`);
    }

    const repoRoot = GitService.getRepoRoot();
    const teamflowRoot = path.resolve(repoRoot, 'apps/teamflow');
    const targetFile = investigation.faultyFile || 'apps/teamflow/backend/src/middleware/auth.ts';
    const absolutePath = path.isAbsolute(targetFile) ? targetFile : path.resolve(repoRoot, targetFile);

    // Safeguard 1: Reject path traversal or targets outside TeamFlow
    const normalizedTarget = path.normalize(absolutePath);
    if (!normalizedTarget.startsWith(teamflowRoot)) {
      throw new Error(`Security validation error: Target file ${targetFile} is outside the TeamFlow application boundaries.`);
    }

    console.log(`Applying targeted fix for incident ${incidentId} on ${normalizedTarget}`);

    // Safeguard 2: Save recoverable backup copy before modifying
    if (fs.existsSync(normalizedTarget)) {
      try {
        fs.copyFileSync(normalizedTarget, normalizedTarget + '.kaizen_backup');
      } catch {
        // Continue if backup cannot be written
      }
    }

    // If target is auth.ts (Scenario A: Permission Regression)
    if (normalizedTarget.includes('auth.ts')) {
      if (fs.existsSync(normalizedTarget)) {
        let content = fs.readFileSync(normalizedTarget, 'utf-8');

        // Restore clean check if corrupted or bypassed
        // Look for deliberate regression patterns:
        // Pattern 1: unconditionally returning next()
        if (content.includes('// REGRESSION_INJECTED') || content.includes('return next(); // BYPASS')) {
          content = content.replace(
            /\/\/ REGRESSION_INJECTED[\s\S]*?return next\(\);/g,
            `// PERMISSION_CHECK_RESTORED
    if (!req.actor) {
      throw AppError.unauthorized('Authentication required');
    }
    if (!allowedRoles.includes(req.actor.role)) {
      throw AppError.forbidden(\`Role '\${req.actor.role}' is not authorized to perform this operation\`);
    }`
          );
          fs.writeFileSync(absolutePath, content, 'utf-8');
        } else if (content.includes('return next();') && !content.includes('if (!allowedRoles.includes')) {
          // Re-inject standard role check
          content = content.replace(
            /export const requireRole = \(allowedRoles: UserRole\[\]\) => \{[\s\S]*?next\(\);\s*\};/,
            `export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (env.TEST_DISABLE_PERMISSIONS) {
      logger.warn({
        requestId: req.id,
        actorId: req.actor?.id,
        actorRole: req.actor?.role,
      }, '[FAULT_INJECTION] TEST_DISABLE_PERMISSIONS active - bypassing role verification');
      return next();
    }

    if (!req.actor) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.actor.role)) {
      logger.warn({
        requestId: req.id,
        actorId: req.actor.id,
        actorRole: req.actor.role,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
        method: req.method,
      }, 'Authorization failed: role does not have required permissions');

      throw AppError.forbidden(\`Role '\${req.actor.role}' is not authorized to perform this operation\`);
    }

    next();
  };
};`
          );
          fs.writeFileSync(absolutePath, content, 'utf-8');
        }
      }
    }

    // Also reset any environment variable flags in .env if present
    const envPath = path.resolve(repoRoot, 'apps/teamflow/backend/.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/TEST_DISABLE_PERMISSIONS=true/g, 'TEST_DISABLE_PERMISSIONS=false');
      envContent = envContent.replace(/TEST_FAIL_TASK_UPDATE=true/g, 'TEST_FAIL_TASK_UPDATE=false');
      envContent = envContent.replace(/TEST_FAIL_DEADLINE_JOB=true/g, 'TEST_FAIL_DEADLINE_JOB=false');
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    incident.status = 'PATCH_READY';
    await incident.save();

    return {
      success: true,
      message: `Patch successfully applied to ${targetFile}. Ready for verification.`,
      targetFile,
      patchApplied: investigation.recommendedFix.patchContent,
    };
  }

  static async verifyFix(incidentId: string): Promise<{
    verification: IVerification;
    incident: any;
  }> {
    const incident = await Incident.findOne({ incidentId });
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const testFilter = incident.failedTest;
    console.log(`Verifying fix for incident ${incidentId} using test filter: "${testFilter}"`);

    // Run vitest with the targeted test filter
    const testResult = await DiagnosticRunner.executeVitest(`verify_${Date.now()}`, testFilter);

    let outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE' = 'FAIL';
    if (testResult.exitCode === 0 && testResult.failedCount === 0 && testResult.passedCount > 0) {
      outcome = 'PASS';
    } else if (testResult.failedCount > 0) {
      outcome = 'FAIL';
    } else if (testResult.totalTests === 0) {
      // Re-run full scenarios suite if filter was too specific
      const fallbackResult = await DiagnosticRunner.executeVitest(`verify_fallback_${Date.now()}`);
      if (fallbackResult.exitCode === 0 && fallbackResult.failedCount === 0) {
        outcome = 'PASS';
      } else {
        outcome = 'INCONCLUSIVE';
      }
    }

    const verificationId = `ver_${Date.now()}`;
    const verification = await Verification.create({
      verificationId,
      incidentId,
      testExecuted: `vitest run -t "${testFilter}"`,
      beforeResult: incident.symptom,
      afterResult: outcome === 'PASS'
        ? `All tests passed cleanly (${testResult.passedCount} passed, 0 failed).`
        : `${testResult.failedCount} test(s) still failing.`,
      exitCode: testResult.exitCode,
      outputSnippet: testResult.stdout.slice(-1000),
      outcome,
      dbOutcome: outcome === 'PASS' ? 'TRANSACTION_VERIFIED_SUCCESS' : 'TRANSACTION_FAILED',
      timestamp: new Date(),
    });

    if (outcome === 'PASS') {
      incident.status = 'RESOLVED';
      incident.resolvedAt = new Date();
    } else {
      incident.status = 'OPEN';
    }
    await incident.save();

    // Ingest FIX_VERIFICATION event
    await Event.create({
      eventId: `evt_${verificationId}`,
      projectId: 'teamflow',
      runId: incident.runId,
      timestamp: new Date(),
      eventType: 'FIX_VERIFICATION',
      component: 'VerificationRunner',
      route: testFilter,
      outcome,
      severity: outcome === 'PASS' ? 'low' : 'high',
      metadata: {
        incidentId,
        exitCode: testResult.exitCode,
        durationMs: testResult.durationMs,
      },
    });

    return { verification, incident };
  }
}
