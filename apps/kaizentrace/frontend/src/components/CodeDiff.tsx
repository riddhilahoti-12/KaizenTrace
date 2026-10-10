import React from 'react';
import { FileCode } from 'lucide-react';

interface CodeDiffProps {
  diffText?: string;
  filePath?: string;
}

export const CodeDiff: React.FC<CodeDiffProps> = ({ diffText, filePath }) => {
  if (!diffText || !diffText.trim()) {
    return (
      <div className="diff-box">
        <div className="diff-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileCode size={14} />
            {filePath || 'No changes detected'}
          </span>
        </div>
        <div className="diff-line" style={{ color: 'var(--text-muted)', padding: '1rem' }}>
          No modified lines recorded in this diff hunk against baseline.
        </div>
      </div>
    );
  }

  const lines = diffText.split('\n');

  return (
    <div className="diff-box">
      <div className="diff-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <FileCode size={14} />
          {filePath || 'Source Code Inspection'}
        </span>
        <span>Unified Git Diff</span>
      </div>
      <div style={{ maxHeight: '280px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
        {lines.map((line, idx) => {
          let lineClass = 'diff-line';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineClass += ' diff-add';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineClass += ' diff-remove';
          } else if (line.startsWith('@@')) {
            lineClass += ' diff-hunk';
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
