import React from 'react';
import { X, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';
import { Investigation } from '../types/index.ts';
import { CodeDiff } from './CodeDiff.tsx';

interface ApplyFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isApplying: boolean;
  investigation: Investigation | null;
}

export const ApplyFixModal: React.FC<ApplyFixModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isApplying,
  investigation,
}) => {
  if (!isOpen || !investigation) return null;

  const fix = investigation.recommendedFix;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Review & Approve Fix Patch</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Target File
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              <FileCode size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{fix.targetFile}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Root Cause & Proposed Correction
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
              {fix.explanation}
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Patch Preview
            </div>
            <CodeDiff diffText={fix.patchContent} filePath={fix.targetFile} />
          </div>

          <div style={{ backgroundColor: 'var(--color-primary-soft)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
            Applying this fix will safely update the target file and trigger regression verification. A backup is automatically retained.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isApplying}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={onConfirm} disabled={isApplying}>
            {isApplying ? (
              <span>Applying Patch...</span>
            ) : (
              <>
                <CheckCircle size={15} />
                <span>Confirm & Apply Fix</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
