import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Search, 
  RefreshCw, 
  Key, 
  FileCheck 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const AuditTrailPage: React.FC = () => {
  const user = getCurrentUser();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.audit.getLogs({
        search: search || undefined,
        entityType: entityFilter !== 'ALL' ? entityFilter : undefined
      });
      setLogs(res.auditLogs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.audit.verifyChain();
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ isValid: false, message: err.message || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="app-container">
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <span>Cryptographic Audit Ledger</span>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Append-Only Cryptographic Audit Ledger (SHA-256)</h1>
          <p>
            Vigilance Oversight • Immutable Sequential Block Chaining of Approval Actions & Overrides
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-accent"
            onClick={handleVerifyChain}
            disabled={verifying}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldCheck size={16} />
            <span>{verifying ? 'Verifying Block Hashes...' : 'Verify Audit Chain Integrity'}</span>
          </button>

          <button className="btn btn-outline" onClick={fetchLogs} title="Refresh audit logs">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          style={{
            backgroundColor: verificationResult.isValid ? 'var(--success-bg)' : 'var(--critical-bg)',
            color: verificationResult.isValid ? 'var(--success-green)' : 'var(--critical-red)',
            border: `1px solid ${verificationResult.isValid ? 'var(--success-border)' : 'var(--critical-border)'}`,
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '15px' }}>
            {verificationResult.isValid ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span>
              {verificationResult.isValid
                ? 'Cryptographic Verification Passed: Zero Tampering Detected'
                : 'Cryptographic Checksum Failure: Tampered Blocks Detected'}
            </span>
          </div>

          <div style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
            {verificationResult.message}
          </div>

          {verificationResult.isValid && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '10px', fontSize: '12px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px' }}>
              <div>Checked Blocks: <strong>{verificationResult.checkedBlocks}</strong></div>
              <div>Genesis Hash: <code>{verificationResult.genesisHash}</code></div>
              <div>Latest Block Hash: <code>{verificationResult.latestBlockHash}</code></div>
            </div>
          )}
        </div>
      )}

      {/* Explanation Banner */}
      <div className="gov-card" style={{ borderLeft: '4px solid var(--aicte-navy)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--aicte-navy)' }}>
          <Lock size={16} color="var(--aicte-navy)" />
          <span>How AICTE Audit Block Chaining Works</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
          Each administrative decision, stage advance, document verification, and reviewer override creates an immutable block. The current block's SHA-256 hash mathematically incorporates the preceding block's hash link: <code>Hash_n = SHA256(Block_n + Hash_n-1)</code>. Any unauthorized modification to an earlier application or override justification invalidates all subsequent block digests.
        </p>
      </div>

      {/* Filters */}
      <div className="gov-card" style={{ padding: '12px 18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by action, actor, or details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <select
            className="form-select"
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="ALL">All Entity Types</option>
            <option value="APPLICATION">Application Stage Actions</option>
            <option value="COMPLIANCE_FINDING">Compliance & Overrides</option>
            <option value="DOCUMENT">Document Uploads</option>
            <option value="SYSTEM_CONFIG">SLA Configurations</option>
            <option value="AUTH">Authentication Events</option>
          </select>

          <button className="btn btn-primary btn-sm" onClick={fetchLogs}>
            Filter Logs
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="gov-table-wrapper">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Block #</th>
              <th>Timestamp</th>
              <th>Actor & Role</th>
              <th>Action Name</th>
              <th>Details & Official Justification</th>
              <th>Block Digest (SHA-256)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading cryptographic audit ledger...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No audit entries found matching the filter.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--aicte-navy)' }}>#{log.index}</span>
                  </td>

                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, fontSize: '12.5px' }}>{log.actorName}</div>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{log.actorRole}</span>
                  </td>

                  <td>
                    <code style={{ fontSize: '11px', fontWeight: 700, color: 'var(--aicte-navy)' }}>
                      {log.action}
                    </code>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.entityType} ({log.entityId})
                    </div>
                  </td>

                  <td style={{ maxWidth: '340px' }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{log.details}</div>
                    {log.justification && (
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '11.5px',
                          backgroundColor: '#f1f5f9',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          borderLeft: '3px solid var(--info-blue)'
                        }}
                      >
                        <strong>Justification:</strong> {log.justification}
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      <div><strong>Current:</strong> {log.hash.substring(0, 16)}...</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>Prev:</strong> {log.previousHash.substring(0, 16)}...
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
