import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Incident } from '../types/index.ts';

interface IncidentsViewProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onNavigateToInvestigation: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onNavigateToInvestigation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incidentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.failedTest.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || inc.status === statusFilter;

    const matchesSeverity =
      severityFilter === 'ALL' || inc.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search and Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by incident title, test assertion, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.75rem',
              fontSize: '0.825rem',
              outline: 'none',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">All Statuses ({incidents.length})</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="PATCH_READY">Patch Ready</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table Panel */}
      <div className="panel-card">
        <div className="panel-header">
          <span className="panel-title">
            <ShieldAlert size={16} style={{ color: 'var(--color-primary)' }} />
            Incidents ({filtered.length} of {incidents.length})
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Severity</th>
                <th>Incident ID & Title</th>
                <th>Failed Assertion / Test</th>
                <th>Diagnostic Run</th>
                <th>Created Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={36} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem auto' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      No matching incidents found
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      All tests are passing or the search filter returned 0 results.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => {
                  const statusClass =
                    inc.status === 'RESOLVED'
                      ? 'badge-resolved'
                      : inc.status === 'PATCH_READY'
                      ? 'badge-patch-ready'
                      : inc.status === 'INVESTIGATING'
                      ? 'badge-investigating'
                      : 'badge-open';

                  const isSelected = selectedIncidentId === inc.incidentId;

                  return (
                    <tr
                      key={inc.incidentId}
                      style={{
                        backgroundColor: isSelected ? 'var(--color-primary-soft)' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => onSelectIncident(inc.incidentId)}
                    >
                      <td>
                        <span className={`badge ${statusClass}`}>{inc.status}</span>
                      </td>
                      <td>
                        <span className={`badge badge-severity-${inc.severity}`}>{inc.severity}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{inc.title}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {inc.incidentId}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }} title={inc.failedTest}>
                          {inc.failedTest}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {inc.runId.slice(-8)}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          <Clock size={12} />
                          {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(inc.incidentId);
                            onNavigateToInvestigation();
                          }}
                        >
                          Investigate <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
