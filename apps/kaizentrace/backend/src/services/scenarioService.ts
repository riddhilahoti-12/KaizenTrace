import fs from 'fs';
import path from 'path';
import { GitService } from './gitService.js';

export class ScenarioService {
  static getBackendDir(): string {
    return path.resolve(GitService.getRepoRoot(), 'apps/teamflow/backend');
  }

  static injectPermissionRegression(): { success: boolean; message: string; modifiedFile: string } {
    const filePath = path.resolve(this.getBackendDir(), 'src/middleware/auth.ts');
    let content = fs.readFileSync(filePath, 'utf-8');

    // Inject bypass into requireRole middleware
    if (!content.includes('// REGRESSION_INJECTED')) {
      content = content.replace(
        /export const requireRole = \(allowedRoles: UserRole\[\]\) => \{[\s\S]*?return \(req: Request, _res: Response, next: NextFunction\): void => \{/,
        `export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // REGRESSION_INJECTED: Authorization check bypassed for testing
    return next(); // BYPASS`
      );
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    return {
      success: true,
      message: 'Deliberate permission regression injected into auth.ts: Viewer role check bypassed.',
      modifiedFile: 'apps/teamflow/backend/src/middleware/auth.ts',
    };
  }

  static injectTaskPersistenceFailure(): { success: boolean; message: string; modifiedFile: string } {
    const envPath = path.resolve(this.getBackendDir(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    envContent = envContent.replace(/TEST_FAIL_TASK_UPDATE=(?:false|true)/, 'TEST_FAIL_TASK_UPDATE=true');
    if (!envContent.includes('TEST_FAIL_TASK_UPDATE')) {
      envContent += '\nTEST_FAIL_TASK_UPDATE=true\n';
    }
    fs.writeFileSync(envPath, envContent, 'utf-8');

    return {
      success: true,
      message: 'Persistence failure flag enabled (TEST_FAIL_TASK_UPDATE=true).',
      modifiedFile: 'apps/teamflow/backend/.env',
    };
  }

  static injectDeadlineJobFailure(): { success: boolean; message: string; modifiedFile: string } {
    const envPath = path.resolve(this.getBackendDir(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    envContent = envContent.replace(/TEST_FAIL_DEADLINE_JOB=(?:false|true)/, 'TEST_FAIL_DEADLINE_JOB=true');
    if (!envContent.includes('TEST_FAIL_DEADLINE_JOB')) {
      envContent += '\nTEST_FAIL_DEADLINE_JOB=true\n';
    }
    fs.writeFileSync(envPath, envContent, 'utf-8');

    return {
      success: true,
      message: 'Deadline job failure flag enabled (TEST_FAIL_DEADLINE_JOB=true).',
      modifiedFile: 'apps/teamflow/backend/.env',
    };
  }

  static getScenarioStatus(): { scenarioA: boolean; scenarioB: boolean; scenarioC: boolean } {
    const backendDir = this.getBackendDir();
    const authPath = path.resolve(backendDir, 'src/middleware/auth.ts');
    let scenarioA = false;
    if (fs.existsSync(authPath)) {
      const content = fs.readFileSync(authPath, 'utf-8');
      scenarioA = content.includes('// REGRESSION_INJECTED');
    }

    const envPath = path.resolve(backendDir, '.env');
    let scenarioB = false;
    let scenarioC = false;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('TEST_DISABLE_PERMISSIONS=true')) scenarioA = true;
      if (envContent.includes('TEST_FAIL_TASK_UPDATE=true')) scenarioB = true;
      if (envContent.includes('TEST_FAIL_DEADLINE_JOB=true')) scenarioC = true;
    }

    return { scenarioA, scenarioB, scenarioC };
  }

  static resetAllScenarios(): { success: boolean; message: string } {
    const backendDir = this.getBackendDir();

    // 1. Restore auth.ts
    const authPath = path.resolve(backendDir, 'src/middleware/auth.ts');
    if (fs.existsSync(authPath)) {
      let content = fs.readFileSync(authPath, 'utf-8');
      if (content.includes('// REGRESSION_INJECTED')) {
        content = content.replace(
          /\/\/ REGRESSION_INJECTED[\s\S]*?return next\(\); \/\/ BYPASS/g,
          `if (env.TEST_DISABLE_PERMISSIONS) {
      logger.warn({
        requestId: req.id,
        actorId: req.actor?.id,
        actorRole: req.actor?.role,
      }, '[FAULT_INJECTION] TEST_DISABLE_PERMISSIONS active - bypassing role verification');
      return next();
    }`
        );
        fs.writeFileSync(authPath, content, 'utf-8');
      }
    }

    // 2. Restore .env
    const envPath = path.resolve(backendDir, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/TEST_DISABLE_PERMISSIONS=true/g, 'TEST_DISABLE_PERMISSIONS=false');
      envContent = envContent.replace(/TEST_FAIL_TASK_UPDATE=true/g, 'TEST_FAIL_TASK_UPDATE=false');
      envContent = envContent.replace(/TEST_FAIL_DEADLINE_JOB=true/g, 'TEST_FAIL_DEADLINE_JOB=false');
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    return {
      success: true,
      message: 'All scenarios reset to healthy baseline state.',
    };
  }
}
