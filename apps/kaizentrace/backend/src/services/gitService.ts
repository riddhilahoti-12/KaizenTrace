import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Baseline } from '../models/Baseline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findRepoRoot(startDir: string): string {
  let curr = startDir;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(curr, 'apps', 'teamflow')) && fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd();
}

const REPO_ROOT = findRepoRoot(__dirname);

export interface ChangedFileDiff {
  filePath: string;
  relativeFilePath: string;
  status: 'modified' | 'added' | 'deleted';
  diff: string;
  modifiedLines: number[];
  addedLines: string[];
  removedLines: string[];
}

export interface GitDiffSummary {
  baselineCommit: string;
  currentCommit: string;
  hasChanges: boolean;
  scopedChanges: ChangedFileDiff[];
  rawDiff: string;
}

export class GitService {
  static getRepoRoot(): string {
    return REPO_ROOT;
  }

  static getCurrentCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  static async getBaselineCommit(projectId = 'teamflow'): Promise<string> {
    const recorded = await Baseline.findOne({ projectId });
    if (recorded && recorded.commitHash) {
      return recorded.commitHash;
    }
    const current = this.getCurrentCommit();
    if (current && current !== 'unknown') {
      await Baseline.findOneAndUpdate(
        { projectId },
        { commitHash: current, recordedAt: new Date(), status: 'HEALTHY' },
        { upsert: true, new: true }
      );
      return current;
    }
    return 'HEAD';
  }

  static async setBaselineCommit(commitHash: string, notes = 'Healthy baseline', projectId = 'teamflow') {
    return await Baseline.findOneAndUpdate(
      { projectId },
      { commitHash, recordedAt: new Date(), status: 'HEALTHY', notes },
      { upsert: true, new: true }
    );
  }

  static async getTeamFlowDiff(baselineOverride?: string): Promise<GitDiffSummary> {
    const baseline = baselineOverride || (await this.getBaselineCommit());
    const current = this.getCurrentCommit();

    let rawDiff = '';
    try {
      // Diff against working directory (includes uncommitted + committed changes since baseline)
      rawDiff = execSync(`git diff ${baseline} -- apps/teamflow`, {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
      });
    } catch (err: any) {
      // If baseline commit is invalid or not found, diff against HEAD
      try {
        rawDiff = execSync('git diff HEAD -- apps/teamflow', {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
        });
      } catch {
        rawDiff = '';
      }
    }

    const scopedChanges = this.parseDiff(rawDiff);

    return {
      baselineCommit: baseline,
      currentCommit: current,
      hasChanges: scopedChanges.length > 0 || rawDiff.trim().length > 0,
      scopedChanges,
      rawDiff,
    };
  }

  static parseDiff(rawDiff: string): ChangedFileDiff[] {
    if (!rawDiff || !rawDiff.trim()) return [];

    const fileChunks = rawDiff.split(/^diff --git /m).filter(Boolean);
    const results: ChangedFileDiff[] = [];

    for (const chunk of fileChunks) {
      const lines = chunk.split('\n');
      const headerLine = lines[0] || '';
      // Matches a/path b/path
      const match = headerLine.match(/a\/(.+?)\s+b\/(.+)/);
      const filePath = match ? match[2] : headerLine.split(' ')[1] || 'unknown';

      // Only scope to TeamFlow
      if (!filePath.includes('apps/teamflow') && !filePath.includes('apps\\teamflow')) {
        continue;
      }

      const addedLines: string[] = [];
      const removedLines: string[] = [];
      const modifiedLines: number[] = [];

      let currentLineNumber = 0;

      for (const line of lines) {
        if (line.startsWith('@@')) {
          // Parse hunk header: @@ -start,count +start,count @@
          const hunkMatch = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
          if (hunkMatch) {
            currentLineNumber = parseInt(hunkMatch[1], 10);
          }
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          addedLines.push(line.substring(1));
          modifiedLines.push(currentLineNumber);
          currentLineNumber++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          removedLines.push(line.substring(1));
        } else if (!line.startsWith('---') && !line.startsWith('+++')) {
          currentLineNumber++;
        }
      }

      results.push({
        filePath,
        relativeFilePath: filePath.replace(/^apps[/\\]teamflow[/\\]/, ''),
        status: lines.some(l => l.startsWith('new file')) ? 'added' : 'modified',
        diff: 'diff --git ' + chunk,
        modifiedLines,
        addedLines,
        removedLines,
      });
    }

    return results;
  }
}
