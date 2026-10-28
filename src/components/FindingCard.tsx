import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  UserCheck, 
  Scale, 
  CornerDownRight 
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { getCurrentUser } from '../services/api';

interface FindingCardProps {
  finding: any;
  onOverride: (findingId: string, disposition: string, justification: string) => Promise<void>;
  onViewEvidence?: (docId?: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onOverride, onViewEvidence }) => {
  const user = getCurrentUser();
  const canOverride = (user?.role === 'SCRUTINY_OFFICER' || user?.role === 'ADMIN');

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState<'ACCEPTED_WITH_EXCEPTION' | 'CONFIRMED_DEFICIENCY'>('ACCEPTED_WITH_EXCEPTION');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSaveOverride = async () => {
    if (!justification || justification.trim().length < 15) {
      setError('A substantive official justification (minimum 15 characters) is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onOverride(finding.id, selectedDisposition, justification);
      setShowOverrideModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit override');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '14px',
        backgroundColor: '#ffffff',
        borderLeft: `4px solid ${
          finding.severity === 'CRITICAL'
            ? 'var(--critical-red)'
            : finding.severity === 'HIGH'
            ? 'var(--warning-amber)'
            : 'var(--info-blue)'
        }`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--aicte-navy)' }}>
              {finding.ruleName}
            </span>
            <code style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '3px' }}>
              {finding.ruleCode}
            </code>
            <span
              className={`badge ${
                finding.severity === 'CRITICAL'
                  ? 'badge-critical'
                  : finding.severity === 'HIGH'
                  ? 'badge-warning'
                  : 'badge-neutral'
              }`}
            >
              {finding.severity}
            </span>
            <StatusBadge stageOrStatus={finding.status} />
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Statutory Reference: <strong>{finding.aphClauseRef}</strong>
          </div>
        </div>

        {canOverride && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowOverrideModal(true)}
            style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Scale size={13} color="var(--aicte-navy)" />
            <span>Reviewer Override</span>
          </button>
        )}
      </div>

      {/* Explanation */}
      <div style={{ margin: '10px 0', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {finding.explanation}
      </div>

      {/* Evidence Citation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '6px 12px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}
      >
        <FileText size={14} color="var(--aicte-navy)" />
        <span style={{ fontWeight: 600 }}>Evidence Examined:</span>
        <span>{finding.evidenceSource}</span>
        {finding.confidenceScore && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
            Confidence: {(finding.confidenceScore * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Recommended Action */}
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CornerDownRight size={13} />
        <span><strong>Recommended Next Step:</strong> {finding.recommendedAction}</span>
      </div>

      {/* Override Banner if present */}
      {finding.reviewerDisposition && finding.reviewerDisposition !== 'PENDING' && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--info-blue)' }}>
            <UserCheck size={14} />
            <span>Human Reviewer Disposition: {finding.reviewerDisposition.replace(/_/g, ' ')}</span>
            {finding.overriddenAt && (
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {new Date(finding.overriddenAt).toLocaleString()}
              </span>
            )}
          </div>
          {finding.reviewerOverrideReason && (
            <div style={{ marginTop: '4px', color: '#1e293b' }}>
              <strong>Official Justification:</strong> {finding.reviewerOverrideReason}
            </div>
          )}
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Reviewer Override & Disposition</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                You are overriding automated finding for <strong>{finding.ruleName}</strong> [{finding.ruleCode}]. In accordance with AICTE audit standards, a signed mandatory justification will be permanently sealed in the tamper-evident audit ledger.
              </p>

              <div className="form-group">
                <label className="form-label required">Reviewer Decision / Disposition</label>
                <select
                  className="form-select"
                  value={selectedDisposition}
                  onChange={e => setSelectedDisposition(e.target.value as any)}
                >
                  <option value="ACCEPTED_WITH_EXCEPTION">Accept with Exception / Executive Waiver</option>
                  <option value="CONFIRMED_DEFICIENCY">Confirm Deficiency (Enforce Rectification)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Official Mandatory Justification (Min 15 chars)</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="e.g. State Government Directorate of Technical Education granted 90-day extension vide order #DTE-2024/782; fire safety equipment installed and verified on site."
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ color: 'var(--critical-red)', fontSize: '12px', marginTop: '6px' }}>
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowOverrideModal(false)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleSaveOverride} disabled={isSubmitting}>
                {isSubmitting ? 'Recording in Audit Chain...' : 'Confirm & Sign Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
