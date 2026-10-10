import React from 'react';
import { FileCode } from 'lucide-react';

interface CodeDiffProps {
  diffText?: string;
  filePath?: string;
}

export const CodeDiff: React.FC<CodeDiffProps> = ({ diffText, filePath }) => {
  if (!diffText || !diffText.trim()) {
    return (
      <div className="diff-container">
        <div className="diff-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileCode size={13} />
            {filePath || 'No changes detected'}
          </span>
        </div>
        <div className="diff-line" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
          No modified lines recorded in this diff hunk against baseline.
        </div>
      </div>
    );
  }

  const lines = diffText.split('\n');

  return (
    <div className="diff-container">
      <div className="diff-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <FileCode size={13} />
          {filePath || 'Source Code Inspection'}
        </span>
        <span style={{ fontSize: '0.7rem' }}>Unified Git Diff</span>
      </div>
      <div className="diff-body">
        {lines.map((line, idx) => {
          let lineClass = 'diff-line';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineClass += ' diff-line-add';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineClass += ' diff-line-del';
          }

          return (
            <div key={idx} className={lineClass}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
