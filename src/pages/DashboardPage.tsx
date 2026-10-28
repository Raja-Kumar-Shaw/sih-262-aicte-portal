import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Building2,
  RefreshCw
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.applications.list({
        search: search || undefined,
        stage: stageFilter !== 'ALL' ? stageFilter : undefined,
        applicationType: typeFilter !== 'ALL' ? typeFilter : undefined,
        overdueOnly: overdueOnly || undefined
      });
      setApplications(res.applications || []);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [stageFilter, typeFilter, overdueOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  // KPI Calculations
  const totalCount = applications.length;
  const draftCount = applications.filter(a => a.currentStage === 'DRAFT').length;
  const underReviewCount = applications.filter(a => 
    a.currentStage === 'SUBMITTED' || 
    a.currentStage === 'PRELIMINARY_SCRUTINY' || 
    a.currentStage === 'SCRUTINY_ASSIGNED' || 
    a.currentStage === 'UNDER_SCRUTINY' || 
    a.currentStage === 'TECHNICAL_REVIEW'
  ).length;
  const clarificationCount = applications.filter(a => a.currentStage === 'CLARIFICATION_REQUESTED').length;
  const approvedCount = applications.filter(a => a.currentStage === 'APPROVED').length;
  const overdueCount = applications.filter(a => a.deadlineMetrics?.isOverdue).length;

  return (
    <div className="app-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <span>Institutional Approval Applications</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Approval Applications Dashboard</h1>
          <p>
            {user?.role === 'INSTITUTION' 
              ? `Applications for ${user.institutionName || 'Your Institution'} (PID: ${user.permanentInstituteId || 'N/A'})`
              : user?.role === 'SCRUTINY_OFFICER'
              ? `Regional Scrutiny Committee Dossier — ${user.department || 'Approval Bureau'}`
              : `All AICTE Institutional Applications (Academic Cycle 2025–26)`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {(user?.role === 'INSTITUTION' || user?.role === 'ADMIN') && (
            <Link to="/applications/new" className="btn btn-accent">
              <PlusCircle size={16} />
              <span>New Approval Application</span>
            </Link>
          )}

          <button className="btn btn-outline" onClick={fetchApplications} title="Refresh records">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Applications"
          value={totalCount}
          desc="Registered dossiers"
          variant="default"
          onClick={() => { setStageFilter('ALL'); setOverdueOnly(false); }}
        />
        <KpiCard
          label="Under Scrutiny"
          value={underReviewCount}
          desc="Committee review active"
          variant="info"
          onClick={() => { setStageFilter('UNDER_SCRUTINY'); setOverdueOnly(false); }}
        />
        <KpiCard
          label="Clarification Pending"
          value={clarificationCount}
          desc="Awaiting institution response"
          variant="warning"
          onClick={() => { setStageFilter('CLARIFICATION_REQUESTED'); setOverdueOnly(false); }}
        />
        <KpiCard
          label="Approved (EoA)"
          value={approvedCount}
          desc="Statutory approval granted"
          variant="success"
          onClick={() => { setStageFilter('APPROVED'); setOverdueOnly(false); }}
        />
        <KpiCard
          label="Overdue SLA Cases"
          value={overdueCount}
          desc="Exceeded target window"
          variant="critical"
          onClick={() => setOverdueOnly(!overdueOnly)}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Application No, College Name, or PID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
            >
              <option value="ALL">All Workflow Stages</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PRELIMINARY_SCRUTINY">Preliminary Scrutiny</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="CLARIFICATION_REQUESTED">Clarification Requested</option>
              <option value="TECHNICAL_REVIEW">Technical Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Application Types</option>
              <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA)</option>
              <option value="INCREASE_IN_INTAKE">Increase in Intake</option>
              <option value="NEW_PROGRAMME_COURSE">New Programme / Course</option>
              <option value="NEW_INSTITUTION">New Institution Establishment</option>
              <option value="NRI_OCI_SUPERNUMERARY">NRI/OCI Quota</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
            />
            <span style={{ color: overdueOnly ? 'var(--critical-red)' : 'var(--text-primary)', fontWeight: overdueOnly ? 700 : 500 }}>
              Overdue Cases Only
            </span>
          </label>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Application Table */}
      <div className="gov-table-wrapper">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Application Ref</th>
              <th>Institution Details</th>
              <th>Application Category</th>
              <th>Submission Date</th>
              <th>Current Stage</th>
              <th>Assigned Scrutiny Officer</th>
              <th>Target SLA</th>
              <th>Compliance Score</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading institutional approval records from SQLite database...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                    No matching applications found
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Try clearing your search query or stage filter to see more results.
                  </div>
                </td>
              </tr>
            ) : (
              applications.map(app => {
                const metrics = app.deadlineMetrics;
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--aicte-navy)' }}>
                        {app.applicationNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        AY {app.academicYear}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.institutionName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        PID: <strong>{app.permanentInstituteId}</strong> • {app.region} Region
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>
                        {app.applicationType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      {app.submittedAt ? (
                        <span style={{ fontSize: '12px' }}>
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Unsubmitted Draft</span>
                      )}
                    </td>

                    <td>
                      <StatusBadge stageOrStatus={app.currentStage} />
                    </td>

                    <td>
                      {app.assignedOfficerName ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {app.assignedOfficerName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>

                    <td>
                      {app.targetCompletionDate && app.currentStage !== 'APPROVED' && app.currentStage !== 'REJECTED' ? (
                        <div>
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
                            Target: {new Date(app.targetCompletionDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '13px',
                            color:
                              app.complianceScore >= 80
                                ? 'var(--success-green)'
                                : app.complianceScore >= 60
                                ? 'var(--warning-amber)'
                                : 'var(--critical-red)'
                          }}
                        >
                          {app.complianceScore}%
                        </span>
                        {app.criticalDeficiencyCount > 0 && (
                          <span
                            className="badge badge-critical"
                            style={{ fontSize: '10px', padding: '1px 5px' }}
                            title={`${app.criticalDeficiencyCount} Critical Deficiencies`}
                          >
                            {app.criticalDeficiencyCount} Def.
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/applications/${app.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Dossier</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
