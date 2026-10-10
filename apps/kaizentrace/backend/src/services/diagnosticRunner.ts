import { spawn } from 'child_process';
import path from 'path';
import { Run, IRun } from '../models/Run.js';
import { Event } from '../models/Event.js';
import { Incident, IIncident } from '../models/Incident.js';
import { GitService } from './gitService.js';
import { InvestigationEngine } from './investigationEngine.js';

export interface TestExecutionResult {
  runId: string;
  exitCode: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  failures: Array<{
    suite: string;
    testName: string;
    errorMessage: string;
    stackTrace: string;
    sourceFile?: string;
    sourceLine?: number;
  }>;
}

export class DiagnosticRunner {
  static async runDiagnostics(testFilter?: string): Promise<{
    run: IRun;
    incident?: IIncident | null;
    investigation?: any;
  }> {
    const runId = `run_${Date.now()}`;
    const startTime = Date.now();
    const currentCommit = GitService.getCurrentCommit();

    console.log(`Starting TeamFlow diagnostic execution [${runId}]...`);
    const testResult = await this.executeVitest(runId, testFilter);
    const durationMs = Date.now() - startTime;

    const isHealthy = testResult.failedCount === 0 && testResult.exitCode === 0;

    // 1. Record Run
    const run = await Run.create({
      runId,
      projectId: 'teamflow',
      timestamp: new Date(),
      gitCommit: currentCommit,
      isHealthy,
      totalTests: testResult.totalTests,
      passedCount: testResult.passedCount,
      failedCount: testResult.failedCount,
      durationMs,
      summary: isHealthy
        ? `All ${testResult.passedCount} tests passed cleanly in ${durationMs}ms.`
        : `${testResult.failedCount} test failure(s) detected out of ${testResult.totalTests} tests.`,
      metadata: {
        exitCode: testResult.exitCode,
        stdoutSnippet: testResult.stdout.slice(-1500),
      },
    });

    // 2. Ingest failure events
    let incident: IIncident | null = null;
    let investigation: any = null;

    if (!isHealthy && testResult.failures.length > 0) {
      for (const [index, failure] of testResult.failures.entries()) {
        const eventId = `evt_${runId}_${index + 1}`;

        await Event.create({
          eventId,
          projectId: 'teamflow',
          runId,
          timestamp: new Date(),
          eventType: 'TEST_FAILURE',
          component: failure.suite || 'Backend Test Suite',
          route: failure.testName,
          errorMessage: failure.errorMessage,
          stackTrace: failure.stackTrace,
          sourceFile: failure.sourceFile,
          sourceLine: failure.sourceLine,
          outcome: 'FAIL',
          severity: 'high',
          metadata: {
            suite: failure.suite,
            testName: failure.testName,
          },
        });

        // Create incident for the primary failure
        if (!incident) {
          const incidentId = `inc_${Date.now()}`;
          incident = await Incident.create({
            incidentId,
            projectId: 'teamflow',
            runId,
            title: `Regression in ${failure.suite || 'TeamFlow'}: ${failure.testName}`,
            status: 'OPEN',
            severity: 'high',
            symptom: failure.errorMessage || `Assertion failed in ${failure.testName}`,
            failedTest: failure.testName,
            affectedRoute: failure.suite,
            affectedComponent: failure.sourceFile || 'teamflow-backend',
            evidenceCount: testResult.failures.length,
          });

          // Run investigation engine immediately
          investigation = await InvestigationEngine.investigate(incident, run, failure);
        }
      }
    }

    return { run, incident, investigation };
  }

  static async executeVitest(runId: string, testFilter?: string): Promise<TestExecutionResult> {
    const repoRoot = GitService.getRepoRoot();
    const backendDir = path.resolve(repoRoot, 'apps/teamflow/backend');

    return new Promise((resolve) => {
      const startTime = Date.now();
      const args = ['test', '--'];
      if (testFilter) {
        args.push('-t', testFilter);
      }

      console.log(`Executing: npm ${args.join(' ')} in ${backendDir}`);
      const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const child = spawn(cmd, args, {
        cwd: backendDir,
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          CI: 'true',
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d) => {
        stdout += d.toString();
      });

      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      child.on('close', (code) => {
        const durationMs = Date.now() - startTime;
        const parsed = DiagnosticRunner.parseVitestOutput(stdout, stderr);

        resolve({
          runId,
          exitCode: code ?? 0,
          totalTests: parsed.totalTests,
          passedCount: parsed.passedCount,
          failedCount: parsed.failedCount,
          durationMs,
          stdout,
          stderr,
          failures: parsed.failures,
        });
      });
    });
  }

  static parseVitestOutput(stdout: string, stderr: string) {
    const combined = (stdout + '\n' + stderr).replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
    const failures: Array<{
      suite: string;
      testName: string;
      errorMessage: string;
      stackTrace: string;
      sourceFile?: string;
      sourceLine?: number;
    }> = [];

    // Parse test counts e.g. "Tests  1 failed | 10 passed (11)"
    let totalTests = 0;
    let passedCount = 0;
    let failedCount = 0;

    const testsMatch = combined.match(/Tests\s+(?:(\d+)\s+failed)?(?:[^\d]*(\d+)\s+passed)?\s+\((\d+)\)/);
    if (testsMatch) {
      failedCount = testsMatch[1] ? parseInt(testsMatch[1], 10) : 0;
      passedCount = testsMatch[2] ? parseInt(testsMatch[2], 10) : 0;
      totalTests = testsMatch[3] ? parseInt(testsMatch[3], 10) : passedCount + failedCount;
    } else {
      // Check for individual checkmarks
      const passMatches = combined.match(/✓\s+/g);
      passedCount = passMatches ? passMatches.length : 0;
      const failMatches = combined.match(/×\s+|FAIL\s+/g);
      failedCount = failMatches ? failMatches.length : 0;
      totalTests = passedCount + failedCount;
    }

    // Extract failure details e.g. "FAIL src/tests/scenarios.test.ts > KaizenTrace Scenario 1"
    const failureBlocks = combined.split(/FAIL\s+|×\s+/).slice(1);

    for (const block of failureBlocks) {
      const lines = block.split('\n');
      const testLine = lines[0] || '';
      const parts = testLine.split('>');
      const suite = parts[0]?.trim() || 'scenarios.test.ts';
      const testName = (parts.length > 1 ? parts.slice(1).join('>') : parts[0]).trim();

      // Find AssertionError or Error message
      let errorMessage = '';
      let stackTrace = '';
      let sourceFile: string | undefined;
      let sourceLine: number | undefined;

      for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (l.includes('AssertionError:') || l.includes('Error:') || l.includes('expected') || l.includes('received')) {
          if (!errorMessage) {
            errorMessage = l.trim();
          } else {
            errorMessage += ' | ' + l.trim();
          }
        }
        if (l.includes('at ') || l.includes('❯ ')) {
          stackTrace += l + '\n';

          // Extract source file and line if available
          const lineMatch = l.match(/(?:at\s+|❯\s+)(?:.*?\(|)(.+?):(\d+):(\d+)\)?/);
          if (lineMatch && !sourceFile && lineMatch[1].includes('src')) {
            sourceFile = lineMatch[1];
            sourceLine = parseInt(lineMatch[2], 10);
          }
        }
      }

      if (!errorMessage) {
        errorMessage = `Test failed in ${testName}`;
      }

      failures.push({
        suite,
        testName,
        errorMessage: errorMessage.slice(0, 500),
        stackTrace: stackTrace.slice(0, 1500),
        sourceFile,
        sourceLine,
      });
    }

    return { totalTests, passedCount, failedCount, failures };
  }
}
