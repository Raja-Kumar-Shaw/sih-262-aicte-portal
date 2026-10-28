import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Users, 
  Sliders, 
  CheckCircle2, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';
import { KpiCard } from '../components/KpiCard';

const COLORS = ['#002147', '#f37021', '#16a34a', '#d97706', '#2563eb', '#9333ea', '#64748b'];

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const [data, setData] = useState<any>(null);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [msg, setMsg] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, configRes] = await Promise.all([
        api.analytics.getOverview(),
        api.audit.getConfigurations()
      ]);
      setData(analyticsRes);
      setConfigurations(configRes.configurations || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleUpdateConfig = async (key: string) => {
    try {
      await api.audit.updateConfiguration(key, editValue);
      setEditingKey(null);
      setMsg(`Updated configuration ${key} to ${editValue} days. Dwell times and SLA alerts refreshed.`);
      setTimeout(() => setMsg(''), 4000);
      loadAnalytics();
    } catch (err: any) {
      alert(err.message || 'Failed to update configuration');
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px' }}>
        <RefreshCw size={32} className="spin" color="var(--aicte-navy)" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--aicte-navy)' }}>
          Computing Bureau Analytics & Bottleneck Telemetry...
        </div>
      </div>
    );
  }

  const { summary, byStage, byType, byRegion, severityCounts, findingStatusCounts, reviewerWorkload, bottlenecks } = data || {};

  const findingPieData = [
    { name: 'Automated Pass', value: findingStatusCounts?.PASS || 0, color: '#16a34a' },
    { name: 'Automated Fail', value: findingStatusCounts?.FAIL || 0, color: '#dc2626' },
    { name: 'Warnings', value: findingStatusCounts?.WARNING || 0, color: '#d97706' },
    { name: 'Reviewer Overridden', value: findingStatusCounts?.OVERRIDDEN || 0, color: '#2563eb' }
  ];

  return (
    <div className="app-container">
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <span>Administrative Approval Analytics</span>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Approval Bureau Executive Analytics & Intelligence</h1>
          <p>
            Real-Time Processing Velocity, Regional Workload, and Bottleneck Diagnostics
          </p>
        </div>

        <button className="btn btn-outline" onClick={loadAnalytics}>
          <RefreshCw size={14} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {msg && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)', border: '1px solid var(--success-border)', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Dossiers"
          value={summary?.totalApplications || 0}
          desc="Registered 2025-26 applications"
          variant="default"
          onClick={() => navigate('/applications')}
        />
        <KpiCard
          label="Active Under Review"
          value={summary?.underReviewCount || 0}
          desc="Committee scrutiny in progress"
          variant="info"
          onClick={() => navigate('/applications')}
        />
        <KpiCard
          label="Overdue SLA Breaches"
          value={summary?.overdueCount || 0}
          desc="Exceeded stage SLA threshold"
          variant="critical"
          onClick={() => navigate('/applications')}
        />
        <KpiCard
          label="Approved (EoA)"
          value={summary?.approvedCount || 0}
          desc="Statutory approvals issued"
          variant="success"
          onClick={() => navigate('/applications')}
        />
      </div>

      {/* Bottlenecks Diagnostic Section (Differentiating Feature E) */}
      <div className="gov-card" style={{ borderLeft: '4px solid var(--aicte-saffron)' }}>
        <div className="gov-card-header">
          <h3>
            <Zap size={18} color="var(--aicte-saffron)" />
            <span>Application Bottleneck & Latency Detection</span>
          </h3>
          <span className="badge badge-warning">Algorithmic Dwell Analysis</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Identifying workflow stages with high pending case volumes, long average dwell durations, or frequent deficiency loops.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {(bottlenecks || []).map((b: any) => (
            <div
              key={b.stage}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '14px',
                backgroundColor: b.bottleneckSeverity === 'HIGH' ? '#fef2f2' : '#ffffff',
                borderLeft: `4px solid ${b.bottleneckSeverity === 'HIGH' ? 'var(--critical-red)' : 'var(--warning-amber)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--aicte-navy)' }}>
                  {b.stageName}
                </span>
                <span className={`badge ${b.bottleneckSeverity === 'HIGH' ? 'badge-critical' : 'badge-warning'}`}>
                  {b.bottleneckSeverity} BOTTLENECK
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', margin: '8px 0', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Pending: </span>
                  <strong>{b.pendingCount} cases</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Avg Dwell: </span>
                  <strong>{b.averageDaysInStage} days</strong>
                </div>
                {b.overdueCount > 0 && (
                  <div style={{ color: 'var(--critical-red)' }}>
                    <strong>{b.overdueCount} Overdue</strong>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                {b.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Stage Funnel Bar Chart */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>Applications by Approval Workflow Stage</h3>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={byStage} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--aicte-navy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Findings Pie Chart */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>Compliance Findings Breakdown</h3>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={findingPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {findingPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>Regional Application Volume</h3>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={byRegion} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--aicte-saffron)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reviewer Workload Allocation */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>Scrutiny Committee Member Workload</h3>
          </div>
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Designation</th>
                  <th>Active Cases</th>
                  <th>Overdue Cases</th>
                </tr>
              </thead>
              <tbody>
                {(reviewerWorkload || []).map((rw: any) => (
                  <tr key={rw.officerId}>
                    <td style={{ fontWeight: 600 }}>{rw.officerName}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rw.designation}</td>
                    <td style={{ fontWeight: 700 }}>{rw.activePending} Assigned</td>
                    <td>
                      {rw.overdueCount > 0 ? (
                        <span className="badge badge-critical">{rw.overdueCount} Overdue</span>
                      ) : (
                        <span className="badge badge-success">On Schedule</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Configurable SLA Thresholds (Admin Feature) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <h3>
            <Sliders size={18} color="var(--aicte-navy)" />
            <span>Administrative SLA & Deadline Threshold Configurations</span>
          </h3>
          <span className="badge badge-neutral">Live Parameter Tuning</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Tune stage target durations. Updating these values immediately recalculates overdue flags across the entire approval portal.
        </p>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Configuration Key</th>
                <th>Description</th>
                <th>Configured Window (Days)</th>
                <th>Last Updated</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {configurations.map(cfg => (
                <tr key={cfg.id}>
                  <td>
                    <code style={{ fontWeight: 700, backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '3px' }}>
                      {cfg.key}
                    </code>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{cfg.description}</td>
                  <td>
                    {editingKey === cfg.key ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        style={{ width: '80px', display: 'inline-block' }}
                      />
                    ) : (
                      <strong>{cfg.value} Days</strong>
                    )}
                  </td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {new Date(cfg.updatedAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td>
                      {editingKey === cfg.key ? (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleUpdateConfig(cfg.key)}>
                            Save
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingKey(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setEditingKey(cfg.key);
                            setEditValue(cfg.value);
                          }}
                        >
                          Modify Threshold
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
