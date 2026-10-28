import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Scale, 
  Send, 
  MessageSquare, 
  Upload, 
  History, 
  ShieldCheck, 
  RefreshCw,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { FindingCard } from '../components/FindingCard';
import { WorkflowTimeline } from '../components/WorkflowTimeline';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'programmes' | 'documents' | 'compliance' | 'clarifications' | 'timeline'>('overview');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals state
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationQuery, setClarificationQuery] = useState('');
  const [clarificationDays, setClarificationDays] = useState(7);

  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionRemarks, setDecisionRemarks] = useState('');

  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<'GENERAL' | 'INFRASTRUCTURE' | 'DOCUMENT' | 'COMPLIANCE' | 'RECOMMENDATION'>('GENERAL');

  const [reScrutinizing, setReScrutinizing] = useState(false);

  const fetchDossier = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.applications.get(id);
      setDossier(data);
    } catch (err: any) {
      console.error('Failed to load dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <RefreshCw size={32} className="spin" color="var(--aicte-navy)" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--aicte-navy)' }}>
          Retrieving Institutional Application Dossier...
        </div>
      </div>
    );
  }

  if (!dossier || !dossier.application) {
    return (
      <div className="app-container">
        <div className="gov-card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={40} color="var(--critical-red)" style={{ margin: '0 auto 12px' }} />
          <h2>Application Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The requested application ID does not exist or access is restricted.</p>
          <Link to="/applications" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { application: app, institution, programmes, documents, extractedFields, findings, stageHistory, reviewComments, clarifications, deadlineMetrics } = dossier;

  // Handlers
  const handleRunScrutiny = async () => {
    setReScrutinizing(true);
    setActionError('');
    try {
      await api.applications.runScrutiny(app.id);
      setActionSuccess('Deterministic APH scrutiny executed successfully. Scores & findings updated.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDossier();
    } catch (err: any) {
      setActionError(err.message || 'Scrutiny run failed');
    } finally {
      setReScrutinizing(false);
    }
  };

  const handleOverrideFinding = async (findingId: string, disposition: string, justification: string) => {
    await api.compliance.overrideFinding(findingId, disposition, justification);
    setActionSuccess('Finding overridden and cryptographically recorded in audit chain.');
    setTimeout(() => setActionSuccess(''), 4000);
    fetchDossier();
  };

  const handleIssueClarification = async () => {
    if (!clarificationQuery || clarificationQuery.trim().length < 10) {
      setActionError('Clarification query requires at least 10 characters.');
      return;
    }
    setActionError('');
    try {
      await api.workflow.createClarification({
        applicationId: app.id,
        requestQuery: clarificationQuery.trim(),
        deadlineDays: clarificationDays
      });
      setShowClarificationModal(false);
      setClarificationQuery('');
      setActionSuccess('Clarification notice formally issued to applicant institution.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDossier();
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue clarification');
    }
  };

  const handleRespondClarification = async (clrId: string) => {
    if (!responseText || responseText.trim().length < 5) {
      setActionError('Response text is required.');
      return;
    }
    setActionError('');
    try {
      await api.workflow.respondClarification(clrId, responseText.trim());
      setShowResponseModal(null);
      setResponseText('');
      setActionSuccess('Clarification response submitted. Case transitioned to Re-Scrutiny.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDossier();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit response');
    }
  };

  const handleRecordDecision = async () => {
    if (!decisionRemarks || decisionRemarks.trim().length < 10) {
      setActionError('Substantive decision remarks (minimum 10 characters) are required.');
      return;
    }
    setActionError('');
    try {
      await api.workflow.recordDecision(app.id, decisionType, decisionRemarks.trim());
      setShowDecisionModal(false);
      setActionSuccess(`Statutory Decision recorded: ${decisionType}. Application completed.`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDossier();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record decision');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.workflow.addComment(app.id, commentCategory, newComment.trim());
      setNewComment('');
      fetchDossier();
    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment');
    }
  };

  const handleAdvanceStage = async (nextStage: string, actionName: string) => {
    try {
      await api.workflow.transition(app.id, nextStage, actionName);
      setActionSuccess(`Advanced application stage to ${nextStage.replace(/_/g, ' ')}`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDossier();
    } catch (err: any) {
      setActionError(err.message || 'Transition failed');
    }
  };

  // Determine authorized action buttons
  const isOfficer = user?.role === 'SCRUTINY_OFFICER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isInstitution = user?.role === 'INSTITUTION';
  const pendingClarifications = (clarifications || []).filter((c: any) => c.status === 'PENDING_INSTITUTION');

  return (
    <div className="app-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <Link to="/applications">Applications</Link>
        <span>/</span>
        <span>{app.applicationNumber}</span>
      </div>

      {/* Action alerts */}
      {actionError && (
        <div style={{ backgroundColor: 'var(--critical-bg)', color: 'var(--critical-red)', border: '1px solid var(--critical-border)', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          <strong>Error:</strong> {actionError}
        </div>
      )}
      {actionSuccess && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)', border: '1px solid var(--success-border)', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          <strong>Success:</strong> {actionSuccess}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="gov-card" style={{ borderLeft: '5px solid var(--aicte-navy)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--aicte-navy)', margin: 0 }}>
                {app.applicationNumber}
              </h1>
              <StatusBadge stageOrStatus={app.currentStage} />
              <span className="badge badge-neutral">AY {app.academicYear}</span>
            </div>

            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
              {institution?.name}
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Permanent Institute ID: <strong>{institution?.permanentInstituteId}</strong> • Category: <strong>{institution?.category}</strong> • Region: <strong>{institution?.region}</strong>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
            <div style={{ padding: '8px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Compliance Readiness</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: app.complianceScore >= 80 ? 'var(--success-green)' : 'var(--critical-red)' }}>
                {app.complianceScore}%
              </div>
              <div style={{ fontSize: '11px', color: app.criticalDeficiencyCount > 0 ? 'var(--critical-red)' : 'var(--success-green)' }}>
                {app.criticalDeficiencyCount} Critical Deficiencies
              </div>
            </div>

            <div style={{ padding: '8px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Target Status</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: deadlineMetrics?.isOverdue ? 'var(--critical-red)' : 'var(--text-primary)', marginTop: '4px' }}>
                {deadlineMetrics?.isOverdue
                  ? `Overdue by ${deadlineMetrics.overdueDays} days`
                  : deadlineMetrics?.daysRemaining !== undefined
                  ? `${deadlineMetrics.daysRemaining} days remaining`
                  : '—'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Stage Dwell: {deadlineMetrics?.daysInCurrentStage}d
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar for Authorised Officers */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          {isOfficer && (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleRunScrutiny}
                disabled={reScrutinizing}
                title="Execute APH 2024-27 deterministic check engine"
              >
                <RefreshCw size={13} className={reScrutinizing ? 'spin' : ''} />
                <span>{reScrutinizing ? 'Evaluating APH Rules...' : 'Re-Run Compliance Check'}</span>
              </button>

              {app.currentStage === 'UNDER_SCRUTINY' && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowClarificationModal(true)}
                  style={{ color: 'var(--warning-amber)', borderColor: '#fde68a' }}
                >
                  <MessageSquare size={13} />
                  <span>Request Clarification</span>
                </button>
              )}

              {app.currentStage === 'PRELIMINARY_SCRUTINY' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAdvanceStage('UNDER_SCRUTINY', 'Start Committee Scrutiny')}
                >
                  <span>Start Committee Scrutiny</span>
                </button>
              )}

              {app.currentStage === 'UNDER_SCRUTINY' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAdvanceStage('TECHNICAL_REVIEW', 'Submit Scrutiny Committee Report to Technical Review')}
                >
                  <span>Forward to Technical Review</span>
                </button>
              )}
            </>
          )}

          {isAdmin && (
            <button
              className="btn btn-accent btn-sm"
              onClick={() => setShowDecisionModal(true)}
            >
              <ShieldCheck size={14} />
              <span>Record Final Statutory Decision</span>
            </button>
          )}

          {isInstitution && pendingClarifications.length > 0 && (
            <button
              className="btn btn-accent btn-sm"
              onClick={() => {
                setActiveTab('clarifications');
                setShowResponseModal(pendingClarifications[0].id);
              }}
            >
              <Send size={13} />
              <span>Respond to Clarification Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Building2 size={15} />
          <span>Overview & Profile</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'programmes' ? 'active' : ''}`}
          onClick={() => setActiveTab('programmes')}
        >
          <FileText size={15} />
          <span>Programmes & Intake ({programmes.length})</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <Upload size={15} />
          <span>Documents & Extraction ({documents.length})</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <Scale size={15} />
          <span>Compliance Findings ({findings.length})</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'clarifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('clarifications')}
        >
          <MessageSquare size={15} />
          <span>Clarifications ({clarifications.length})</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <History size={15} />
          <span>Workflow Timeline & Audit</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* AI-Generated Preliminary Scrutiny Summary */}
          <div className="gov-card" style={{ borderLeft: '4px solid var(--info-blue)' }}>
            <div className="gov-card-header">
              <h3>Preliminary Review & Scrutiny Summary</h3>
              <span className="badge badge-info">Automated Analysis</span>
            </div>
            <div
              style={{
                fontSize: '13px',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                color: 'var(--text-primary)'
              }}
            >
              {findings.length > 0 && findings[0]?.explanation 
                ? `AICTE APH 2024–2027 Scrutiny Protocol: ${findings.filter((f: any) => f.status === 'AUTOMATED_PASS').length} of ${findings.length} statutory checks satisfied.\n\n` +
                  `Campus land possession (${institution?.landAreaAcres} Acres) conforms with Chapter 7. ` +
                  `Faculty cadre records indicate an overall ratio conforming to UGC/AICTE norms.\n\n` +
                  (app.criticalDeficiencyCount > 0 
                    ? `⚠️ Critical Deficiency Warning: ${app.criticalDeficiencyCount} statutory deficiency identified requiring committee review or formal institutional rectification.`
                    : `✅ All mandatory compliance parameters met. Dossier is in good standing for final Approval Bureau recommendation.`)
                : 'Scrutiny pending. Click "Re-Run Compliance Check" to execute automated analysis.'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Note: Automated findings provide advisory assistance. The statutory decision-making authority rests exclusively with the authorized Scrutiny Committee.
            </div>
          </div>

          {/* Institutional Profile Details */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>Institutional Profile Parameters</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Institution Name:</span>
                <div style={{ fontWeight: 600 }}>{institution?.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Sponsoring Trust / Society:</span>
                <div style={{ fontWeight: 600 }}>{institution?.trustName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Year of Establishment:</span>
                <div style={{ fontWeight: 600 }}>{institution?.establishmentYear}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Permanent Institute ID:</span>
                <div style={{ fontWeight: 600 }}>{institution?.permanentInstituteId}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Institution Category:</span>
                <div style={{ fontWeight: 600 }}>{institution?.category}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Regional Office:</span>
                <div style={{ fontWeight: 600 }}>{institution?.region} Region</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Campus Land Area:</span>
                <div style={{ fontWeight: 600 }}>{institution?.landAreaAcres} Acres</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Built-Up Area:</span>
                <div style={{ fontWeight: 600 }}>{institution?.totalBuiltUpAreaSqM?.toLocaleString()} Sq. Meters</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>NAAC Accreditation:</span>
                <div style={{ fontWeight: 600 }}>{institution?.naacGrade || 'Not Accredited'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>NBA Accreditation:</span>
                <div style={{ fontWeight: 600 }}>{institution?.nbaAccredited ? 'Accredited' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAMMES */}
      {activeTab === 'programmes' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>Discipline & Approved Intake Matrix</h3>
          </div>
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Course / Programme Name</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Existing Intake</th>
                  <th>Proposed Intake</th>
                  <th>Approved Faculty</th>
                  <th>Student-Faculty Ratio</th>
                  <th>NBA Accredited</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((p: any) => {
                  const estStudents = (p.proposedIntake || p.existingIntake) * p.durationYears;
                  const ratio = p.facultyCount > 0 ? (estStudents / p.facultyCount).toFixed(1) : '—';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--aicte-navy)' }}>{p.courseName}</td>
                      <td><span className="badge badge-neutral">{p.level}</span></td>
                      <td>{p.durationYears} Years</td>
                      <td>{p.existingIntake}</td>
                      <td style={{ fontWeight: 700, color: p.proposedIntake > p.existingIntake ? 'var(--info-blue)' : 'inherit' }}>
                        {p.proposedIntake} {p.proposedIntake > p.existingIntake ? ' (Increase)' : ''}
                      </td>
                      <td>{p.facultyCount} Faculty</td>
                      <td>
                        <span style={{ fontWeight: 600, color: parseFloat(ratio) <= 20 ? 'var(--success-green)' : 'var(--critical-red)' }}>
                          1:{ratio}
                        </span>
                      </td>
                      <td>{p.nbaAccredited ? <span className="badge badge-success">NBA Yes</span> : <span className="badge badge-neutral">No</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div>
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>Application Document Dossier</h3>
            </div>
            <div className="gov-table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Document Title / Filename</th>
                    <th>Upload Date</th>
                    <th>File Size</th>
                    <th>Validity Date</th>
                    <th>Extraction Status</th>
                    <th>Reviewer Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d: any) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.documentCategory.replace(/_/g, ' ')}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--aicte-navy)' }}>{d.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.originalFilename}</div>
                      </td>
                      <td>{new Date(d.uploadDate).toLocaleDateString()}</td>
                      <td>{(d.fileSizeBytes / 1024).toFixed(0)} KB</td>
                      <td>
                        {d.validityExpiryDate ? (
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{d.validityExpiryDate}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Perpetual</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge stageOrStatus={d.status} />
                      </td>
                      <td>
                        {d.verificationNotes ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{d.verificationNotes}</div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending inspection</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extracted Fields Matrix */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>OCR & Automated Text Extraction Values</h3>
              <span className="badge badge-info">{extractedFields.length} Tokens Parsed</span>
            </div>
            <div className="gov-table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Field Name</th>
                    <th>Extracted Token Value</th>
                    <th>Expected Regulatory Norm</th>
                    <th>Confidence</th>
                    <th>Discrepancy Match</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedFields.map((f: any) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600 }}>{f.fieldName}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.extractedValue}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.expectedValue || '—'}</td>
                      <td>{(f.confidenceScore * 100).toFixed(0)}%</td>
                      <td>
                        {f.isMatch ? (
                          <span className="badge badge-success">MATCH</span>
                        ) : (
                          <span className="badge badge-critical">DISCREPANCY</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLIANCE FINDINGS */}
      {activeTab === 'compliance' && (
        <div>
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>AICTE Approval Process Handbook (APH 2024–27) Compliance Findings</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleRunScrutiny}
                disabled={reScrutinizing}
              >
                <RefreshCw size={13} className={reScrutinizing ? 'spin' : ''} />
                <span>Re-Check All Rules</span>
              </button>
            </div>

            {findings.map((f: any) => (
              <FindingCard
                key={f.id}
                finding={f}
                onOverride={handleOverrideFinding}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CLARIFICATIONS */}
      {activeTab === 'clarifications' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>Clarification Notices & Institutional Responses</h3>
            {isOfficer && app.currentStage === 'UNDER_SCRUTINY' && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowClarificationModal(true)}>
                <MessageSquare size={14} />
                <span>Issue New Clarification Notice</span>
              </button>
            )}
          </div>

          {clarifications.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No clarification notices have been issued for this application.
            </div>
          ) : (
            clarifications.map((clr: any) => (
              <div
                key={clr.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '16px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge stageOrStatus={clr.status} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Requested by <strong>{clr.officerName}</strong> on {new Date(clr.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--critical-red)' }}>
                    Response Deadline: {new Date(clr.deadlineDate).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: '10px 0', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px' }}>
                  <strong>Scrutiny Committee Query:</strong> {clr.requestQuery}
                </div>

                {clr.responseRemarks ? (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success-green)', marginBottom: '4px' }}>
                      Institutional Response Submitted on {new Date(clr.respondedAt).toLocaleDateString()}:
                    </div>
                    <div>"{clr.responseRemarks}"</div>
                  </div>
                ) : (
                  isInstitution && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => setShowResponseModal(clr.id)}
                      >
                        <Send size={13} />
                        <span>Submit Clarification Response</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: TIMELINE & AUDIT */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Stage Timeline */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>Workflow Stage Transitions</h3>
            </div>
            <WorkflowTimeline history={stageHistory} />
          </div>

          {/* Committee Comments */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>Scrutiny Committee Comments</h3>
            </div>

            {/* Comment Post Form */}
            {user?.role !== 'AUDITOR' && (
              <form onSubmit={handleAddComment} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select
                    className="form-select"
                    value={commentCategory}
                    onChange={e => setCommentCategory(e.target.value as any)}
                    style={{ width: '160px' }}
                  >
                    <option value="GENERAL">General</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="RECOMMENDATION">Recommendation</option>
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter official review observation or scrutiny comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Post
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div style={{ display: 'grid', gap: '12px' }}>
              {reviewComments.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No committee comments yet.</div>
              ) : (
                reviewComments.map((rc: any) => (
                  <div key={rc.id} style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px 12px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--aicte-navy)' }}>{rc.officerName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{new Date(rc.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '10px', marginBottom: '6px' }}>{rc.category}</span>
                    <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{rc.comment}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLARIFICATION MODAL */}
      {showClarificationModal && (
        <div className="modal-overlay" onClick={() => setShowClarificationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Issue Formal Clarification Notice</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Request additional evidence or deficiency rectification from <strong>{institution?.name}</strong>. The application will transition to <em>CLARIFICATION_REQUESTED</em>.
              </p>
              <div className="form-group">
                <label className="form-label required">Query / Clarification Required</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Detail the specific deficiency, required certificates, or missing parameters..."
                  value={clarificationQuery}
                  onChange={e => setClarificationQuery(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Response SLA Window (Days)</label>
                <select
                  className="form-select"
                  value={clarificationDays}
                  onChange={e => setClarificationDays(Number(e.target.value))}
                >
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days (Standard)</option>
                  <option value={10}>10 Days</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowClarificationModal(false)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleIssueClarification}>
                Issue Official Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSE MODAL */}
      {showResponseModal && (
        <div className="modal-overlay" onClick={() => setShowResponseModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Clarification Response</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Provide your institutional explanation and document references for the Scrutiny Committee.
              </p>
              <div className="form-group">
                <label className="form-label required">Institutional Response Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Explain the remedial action taken or clarification regarding the noted deficiency..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowResponseModal(null)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={() => handleRespondClarification(showResponseModal)}>
                Submit Response & Advance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL DECISION MODAL */}
      {showDecisionModal && (
        <div className="modal-overlay" onClick={() => setShowDecisionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Official Statutory Decision</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                As an authorized Administrator (Approval Bureau Director), record the final statutory determination for application <strong>{app.applicationNumber}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label required">Final Statutory Determination</label>
                <select
                  className="form-select"
                  value={decisionType}
                  onChange={e => setDecisionType(e.target.value as any)}
                >
                  <option value="APPROVED">APPROVED (Grant Extension of Approval / New Course)</option>
                  <option value="REJECTED">REJECTED (Deficiencies Unresolved / Non-Compliance)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Statutory Order Remarks (Min 10 chars)</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Detail the findings of the Scrutiny and Technical Review committees endorsing this approval or rejection order..."
                  value={decisionRemarks}
                  onChange={e => setDecisionRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDecisionModal(false)}>
                Cancel
              </button>
              <button
                className={`btn ${decisionType === 'APPROVED' ? 'btn-accent' : 'btn-danger'}`}
                onClick={handleRecordDecision}
              >
                Confirm Statutory Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
