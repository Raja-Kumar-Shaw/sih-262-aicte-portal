import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const ComplianceCenterPage: React.FC = () => {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [msg, setMsg] = useState('');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.compliance.getRules();
      setRules(res.rules || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (rule: any) => {
    if (!isAdmin) return;
    try {
      await api.compliance.updateRule(rule.id, { isActive: !rule.isActive });
      setMsg(`Rule ${rule.ruleCode} status updated.`);
      setTimeout(() => setMsg(''), 3000);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to update rule');
    }
  };

  const filteredRules = categoryFilter === 'ALL' 
    ? rules 
    : rules.filter(r => r.category === categoryFilter);

  return (
    <div className="app-container">
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <span>Statutory Compliance Norms (APH 2024–2027)</span>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <h1>AICTE Approval Process Handbook (APH) Statutory Rulebook</h1>
          <p>
            Deterministic Compliance Verification Standards • Approval Process Handbook 2024–2027 Clauses
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchRules}>
          <RefreshCw size={14} />
          <span>Refresh Rules</span>
        </button>
      </div>

      {msg && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)', border: '1px solid var(--success-border)', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      {/* Explanatory Banner */}
      <div
        className="gov-card"
        style={{
          borderLeft: '4px solid var(--aicte-saffron)',
          backgroundColor: '#fffcf9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--aicte-navy)' }}>
          <Scale size={18} color="var(--aicte-saffron)" />
          <span>Deterministic Compliance Architecture</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
          All compliance outcomes are evaluated deterministically against statutory formulas and clause parameters defined in the <strong>AICTE Approval Process Handbook (APH 2024–2027)</strong>. No stochastic LLM hallucination is permitted to make statutory approval or deficiency determinations. Authorised officers may disagree with automated findings only by providing a signed, mandatory justification sealed in the SHA-256 audit ledger.
        </p>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Regulatory Categories' },
          { key: 'REGULATORY_NOC', label: 'Regulatory & Fire NOCs' },
          { key: 'INFRASTRUCTURE', label: 'Land & Infrastructure' },
          { key: 'FACULTY_RATIO', label: 'Faculty Cadre & Ratio' },
          { key: 'STATUTORY_DECLARATION', label: 'Statutory Declarations' },
          { key: 'ACADEMIC_ACCREDITATION', label: 'NBA / NAAC Accreditations' }
        ].map(cat => (
          <button
            key={cat.key}
            className={`btn btn-sm ${categoryFilter === cat.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCategoryFilter(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading statutory compliance rules...
          </div>
        ) : (
          filteredRules.map(rule => (
            <div
              key={rule.id}
              className="gov-card"
              style={{
                marginBottom: 0,
                borderLeft: `4px solid ${
                  rule.severity === 'CRITICAL'
                    ? 'var(--critical-red)'
                    : rule.severity === 'HIGH'
                    ? 'var(--warning-amber)'
                    : 'var(--info-blue)'
                }`,
                opacity: rule.isActive ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <code style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      {rule.ruleCode}
                    </code>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--aicte-navy)' }}>
                      {rule.name}
                    </span>
                    <span
                      className={`badge ${
                        rule.severity === 'CRITICAL'
                          ? 'badge-critical'
                          : rule.severity === 'HIGH'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}
                    >
                      {rule.severity}
                    </span>
                    <span className="badge badge-neutral">{rule.category.replace(/_/g, ' ')}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Statutory Source: <strong>{rule.aphClauseRef}</strong>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    className={`btn btn-sm ${rule.isActive ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => handleToggleRule(rule)}
                    style={{ fontSize: '11.5px' }}
                  >
                    {rule.isActive ? 'Deactivate Rule' : 'Activate Rule'}
                  </button>
                )}
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '12px 0 8px', lineHeight: 1.5 }}>
                {rule.description}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Required Evidentiary Certificate: <strong>{rule.requiredEvidenceDoc}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
