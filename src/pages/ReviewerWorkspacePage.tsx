import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Building2, 
  ChevronRight, 
  Users, 
  Send,
  RefreshCw,
  Search
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { KpiCard } from '../components/KpiCard';

export const ReviewerWorkspacePage: React.FC = () => {
  const user = getCurrentUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<'assigned_me' | 'unassigned' | 'overdue' | 'clarification' | 'all'>('assigned_me');
  const [reassignModalApp, setReassignModalApp] = useState<any | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const appRes = await api.applications.list();
      setApplications(appRes.applications || []);

      const accRes = await api.auth.getDemoAccounts();
      const officerAccounts = (accRes.accounts || []).filter(a => a.role === 'SCRUTINY_OFFICER');
      setOfficers(officerAccounts);
      if (officerAccounts.length > 0) {
        setSelectedOfficerId(officerAccounts[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignSubmit = async () => {
    if (!reassignModalApp || !selectedOfficerId) return;
    try {
      await api.workflow.assign(reassignModalApp.id, selectedOfficerId);
      setMsg(`Application ${reassignModalApp.applicationNumber} assigned successfully.`);
      setReassignModalApp(null);
      setTimeout(() => setMsg(''), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign officer');
    }
  };

  // Queue filtering
  const myAssigned = applications.filter(a => a.assignedOfficerId === user?.id);
  const unassigned = applications.filter(a => !a.assignedOfficerId && a.currentStage !== 'DRAFT');
  const overdue = applications.filter(a => a.deadlineMetrics?.isOverdue && a.currentStage !== 'APPROVED' && a.currentStage !== 'REJECTED');
  const clarificationWaiting = applications.filter(a => a.currentStage === 'CLARIFICATION_REQUESTED');

  let currentList = applications;
  if (activeQueue === 'assigned_me') currentList = myAssigned.length > 0 ? myAssigned : applications;
  if (activeQueue === 'unassigned') currentList = unassigned;
  if (activeQueue === 'overdue') currentList = overdue;
  if (activeQueue === 'clarification') currentList = clarificationWaiting;

  return (
    <div className="app-container">
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <span>Scrutiny Committee Desk</span>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Reviewer Workspace & Case Allocation Desk</h1>
          <p>
            Regional Scrutiny Committee • {user?.name} ({user?.designation})
          </p>
        </div>

        <button className="btn btn-outline" onClick={loadData}>
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {msg && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)', border: '1px solid var(--success-border)', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="My Assigned Cases"
          value={myAssigned.length}
          desc="Allocated to your profile"
          variant="info"
          onClick={() => setActiveQueue('assigned_me')}
        />
        <KpiCard
          label="Unassigned Cases"
          value={unassigned.length}
          desc="Awaiting reviewer allocation"
          variant="warning"
          onClick={() => setActiveQueue('unassigned')}
        />
        <KpiCard
          label="Overdue SLA Cases"
          value={overdue.length}
          desc="Turnaround threshold exceeded"
          variant="critical"
          onClick={() => setActiveQueue('overdue')}
        />
        <KpiCard
          label="Clarifications Awaiting"
          value={clarificationWaiting.length}
          desc="Pending institution action"
          variant="default"
          onClick={() => setActiveQueue('clarification')}
        />
      </div>

      {/* Queue Selection Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-button ${activeQueue === 'assigned_me' ? 'active' : ''}`}
          onClick={() => setActiveQueue('assigned_me')}
        >
          <UserCheck size={14} />
          <span>Assigned to Me ({myAssigned.length})</span>
        </button>

        <button
          className={`tab-button ${activeQueue === 'unassigned' ? 'active' : ''}`}
          onClick={() => setActiveQueue('unassigned')}
        >
          <Clock size={14} />
          <span>Unassigned Pool ({unassigned.length})</span>
        </button>

        <button
          className={`tab-button ${activeQueue === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveQueue('overdue')}
        >
          <AlertTriangle size={14} color="var(--critical-red)" />
          <span style={{ color: overdue.length > 0 ? 'var(--critical-red)' : 'inherit' }}>
            Overdue Cases ({overdue.length})
          </span>
        </button>

        <button
          className={`tab-button ${activeQueue === 'clarification' ? 'active' : ''}`}
          onClick={() => setActiveQueue('clarification')}
        >
          <Send size={14} />
          <span>Clarification Pending ({clarificationWaiting.length})</span>
        </button>

        <button
          className={`tab-button ${activeQueue === 'all' ? 'active' : ''}`}
          onClick={() => setActiveQueue('all')}
        >
          <span>All Applications ({applications.length})</span>
        </button>
      </div>

      {/* Case Table */}
      <div className="gov-table-wrapper">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Application Ref</th>
              <th>Institution Details</th>
              <th>Stage</th>
              <th>Assigned Scrutiny Officer</th>
              <th>SLA Dwell Time</th>
              <th>Deficiencies</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading reviewer desk applications...
                </td>
              </tr>
            ) : currentList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No applications found in this queue.
                </td>
              </tr>
            ) : (
              currentList.map(app => {
                const metrics = app.deadlineMetrics;
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--aicte-navy)' }}>{app.applicationNumber}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AY {app.academicYear}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{app.institutionName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        PID: {app.permanentInstituteId} • {app.region} Region
                      </div>
                    </td>

                    <td>
                      <StatusBadge stageOrStatus={app.currentStage} />
                    </td>

                    <td>
                      {app.assignedOfficerName ? (
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>{app.assignedOfficerName}</div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>

                    <td>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: metrics?.isOverdue ? 'var(--critical-red)' : 'var(--text-primary)'
                        }}
                      >
                        {metrics?.isOverdue
                          ? `⚠️ Overdue by ${metrics.overdueDays}d`
                          : `${metrics?.daysRemaining}d remaining`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Dwell: {metrics?.daysInCurrentStage} days
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12.5px' }}>{app.complianceScore}%</span>
                        {app.criticalDeficiencyCount > 0 && (
                          <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                            {app.criticalDeficiencyCount} Critical
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {user?.role === 'ADMIN' && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setReassignModalApp(app)}
                            style={{ fontSize: '11px' }}
                          >
                            Assign / Reassign
                          </button>
                        )}
                        <Link to={`/applications/${app.id}`} className="btn btn-primary btn-sm">
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reviewer Allocation Modal */}
      {reassignModalApp && (
        <div className="modal-overlay" onClick={() => setReassignModalApp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Allocate / Reassign Scrutiny Officer</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Allocate application <strong>{reassignModalApp.applicationNumber}</strong> ({reassignModalApp.institutionName}) to an authorized Scrutiny Committee member.
              </p>

              <div className="form-group">
                <label className="form-label required">Select Scrutiny Officer</label>
                <select
                  className="form-select"
                  value={selectedOfficerId}
                  onChange={e => setSelectedOfficerId(e.target.value)}
                >
                  {officers.map(off => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setReassignModalApp(null)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleAssignSubmit}>
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
