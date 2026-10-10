import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Incident } from '../types/index.ts';

interface IncidentsListProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}) => {
  if (incidents.length === 0) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <span className="panel-title">
            <ShieldAlert size={16} />
            Detected Incidents (0)
          </span>
        </div>
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No Incidents Detected</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Click <strong>Run Diagnostics</strong> or inject a scenario to test detection.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <div className="panel-header">
        <span className="panel-title">
          <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
          Detected Incidents ({incidents.length})
        </span>
      </div>

      <div className="incident-list">
        {incidents.map((inc) => {
          const isSelected = selectedIncidentId === inc.incidentId;
          const statusClass =
            inc.status === 'RESOLVED'
              ? 'badge-resolved'
              : inc.status === 'PATCH_READY'
              ? 'badge-patch-ready'
              : 'badge-open';

          return (
            <div
              key={inc.incidentId}
              className={`incident-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectIncident(inc.incidentId)}
            >
              <div className="incident-header-row">
                <span className={`badge ${statusClass}`}>{inc.status}</span>
                <span className={`badge badge-severity-${inc.severity}`}>{inc.severity}</span>
              </div>

              <div className="incident-title">{inc.title}</div>

              <div className="incident-test" title={inc.failedTest}>
                {inc.failedTest}
              </div>

              <div className="incident-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={11} />
                  {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>•</span>
                <span>{inc.runId.slice(-6)}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Inspect <ArrowRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
