import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  FileCheck, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Send,
  Save
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const ApplicationWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [appNumber, setAppNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Step 1: Institution
  const [institutionId, setInstitutionId] = useState<string>(user?.institutionId || 'inst_dtu');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [applicationType, setApplicationType] = useState('EXTENSION_OF_APPROVAL');

  // Step 3: Programmes
  const [programmes, setProgrammes] = useState([
    {
      courseName: 'Computer Science and Engineering',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY',
      level: 'UG',
      durationYears: 4,
      existingIntake: 180,
      proposedIntake: 180,
      nbaAccredited: true,
      facultyCount: 12
    }
  ]);

  // Step 4: Documents state
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [selectedFileCategory, setSelectedFileCategory] = useState('LAND_TITLE_DEED');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Step 5: Statutory declarations
  const [declFire, setDeclFire] = useState(false);
  const [declLand, setDeclLand] = useState(false);
  const [declRagging, setDeclRagging] = useState(false);

  // Create initial draft when entering Step 2 or if not created
  const ensureDraftCreated = async () => {
    if (createdAppId) return createdAppId;

    try {
      const res = await api.applications.create({
        institutionId,
        academicYear,
        applicationType,
        programmes
      });
      setCreatedAppId(res.application.id);
      setAppNumber(res.application.applicationNumber);
      return res.application.id;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize draft');
      return null;
    }
  };

  const handleNext = async () => {
    setError('');
    if (currentStep === 1) {
      const id = await ensureDraftCreated();
      if (!id) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (programmes.length === 0) {
        setError('At least one academic programme must be configured.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Check mandatory docs
      const categories = new Set(uploadedDocs.map(d => d.documentCategory));
      const mandatory = ['LAND_TITLE_DEED', 'FIRE_SAFETY_NOC', 'BUILDING_OCCUPANCY_CERTIFICATE'];
      const missing = mandatory.filter(m => !categories.has(m));

      if (missing.length > 0) {
        setError(`Mandatory statutory documents missing: ${missing.join(', ')}. Please upload before final submission.`);
        return;
      }
      setCurrentStep(5);
    }
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleAddProgramme = () => {
    setProgrammes([
      ...programmes,
      {
        courseName: 'Artificial Intelligence and Machine Learning',
        programmeType: 'ENGINEERING_AND_TECHNOLOGY',
        level: 'UG',
        durationYears: 4,
        existingIntake: 60,
        proposedIntake: 60,
        nbaAccredited: false,
        facultyCount: 4
      }
    ]);
  };

  const handleRemoveProgramme = (idx: number) => {
    setProgrammes(programmes.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      setError('Please choose a file to upload');
      return;
    }
    if (!createdAppId) {
      setError('Application draft not created yet');
      return;
    }

    setUploadLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('applicationId', createdAppId);
      formData.append('documentCategory', selectedFileCategory);
      formData.append('title', fileToUpload.name);
      formData.append('file', fileToUpload);

      const res = await api.documents.upload(formData);
      setUploadedDocs([...uploadedDocs, res.document]);
      setFileToUpload(null);
      setSuccessMsg(`Document ${res.document.originalFilename} uploaded and parsed successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!declFire || !declLand || !declRagging) {
      setError('You must accept all statutory declarations before formal submission.');
      return;
    }
    if (!createdAppId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.applications.submit(createdAppId);
      navigate(`/applications/${createdAppId}?submitted=true`);
    } catch (err: any) {
      setError(err.message || 'Application submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Category & Year' },
    { num: 2, title: 'Institution Info' },
    { num: 3, title: 'Programmes & Intake' },
    { num: 4, title: 'Document Uploads' },
    { num: 5, title: 'Declarations & Submit' }
  ];

  return (
    <div className="app-container" style={{ maxWidth: '960px' }}>
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <Link to="/applications">Applications</Link>
        <span>/</span>
        <span>New Approval Application Wizard</span>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <h1>New Institutional Approval Application</h1>
          <p>
            Academic Year 2025–26 • AICTE Approval Process Handbook (APH 2024–2027) Chapter I & II
          </p>
        </div>

        {appNumber && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Draft Reference:</span>
            <div style={{ fontWeight: 800, color: 'var(--aicte-navy)', fontSize: '15px' }}>{appNumber}</div>
          </div>
        )}
      </div>

      {/* Stepper Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '28px',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '14px',
          overflowX: 'auto',
          gap: '10px'
        }}
      >
        {steps.map(s => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <div
              key={s.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isActive ? 'var(--aicte-navy)' : isDone ? 'var(--success-green)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--aicte-navy)' : isDone ? 'var(--success-green)' : '#e2e8f0',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {isDone ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span>{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Error or Success notification */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--critical-bg)',
            color: 'var(--critical-red)',
            border: '1px solid var(--critical-border)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success-green)',
            border: '1px solid var(--success-border)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="gov-card">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div>
            <div className="gov-card-header">
              <h2>Step 1: Application Category & Academic Year</h2>
            </div>

            <div className="form-group">
              <label className="form-label required">Application Category</label>
              <select
                className="form-select"
                value={applicationType}
                onChange={e => setApplicationType(e.target.value)}
              >
                <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA) for Existing Institutions</option>
                <option value="INCREASE_IN_INTAKE">Increase in Intake in Existing Course(s)</option>
                <option value="NEW_PROGRAMME_COURSE">Introduction of New Programme / Course</option>
                <option value="NEW_INSTITUTION">Establishment of New Technical Institution</option>
                <option value="NRI_OCI_SUPERNUMERARY">Supernumerary Seats for NRI / OCI / Foreign Nationals</option>
              </select>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Governed under AICTE Approval Process Handbook (APH 2024–2027), Chapter II Norms.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label required">Academic Year Cycle</label>
              <select
                className="form-select"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
              >
                <option value="2025-26">Academic Year 2025–26 (Active Scrutiny Cycle)</option>
                <option value="2026-27">Academic Year 2026–27 (Advance Registration)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div>
            <div className="gov-card-header">
              <h2>Step 2: Institutional Basic Profile Verification</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Permanent Institute ID (PID)</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.permanentInstituteId || '1-10974531201'}
                  disabled
                  style={{ backgroundColor: '#f8fafc' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institution Legal Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.institutionName || 'Delhi Technological University (DTU)'}
                  disabled
                  style={{ backgroundColor: '#f8fafc' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registered Sponsoring Body / Trust</label>
                <input
                  type="text"
                  className="form-input"
                  value="Delhi Technological University Trust"
                  disabled
                  style={{ backgroundColor: '#f8fafc' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Campus Land Area</label>
                <input
                  type="text"
                  className="form-input"
                  value="164.00 Contiguous Acres"
                  disabled
                  style={{ backgroundColor: '#f8fafc' }}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f1f5f9',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            >
              <strong>Notice:</strong> Permanent institutional parameters are linked to your AICTE Central Master Profile. To request changes in trust name, site relocation, or campus area, apply under Chapter II Clause 2.14 (Change of Site/Trust).
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div>
            <div className="gov-card-header">
              <h2>Step 3: Academic Programmes and Approved Intake</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleAddProgramme}>
                <Plus size={14} />
                <span>Add Programme</span>
              </button>
            </div>

            <div className="gov-table-wrapper" style={{ marginBottom: '16px' }}>
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Programme / Discipline</th>
                    <th>Level</th>
                    <th>Existing Intake</th>
                    <th>Proposed Intake</th>
                    <th>Faculty Count</th>
                    <th>NBA Accr.</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          value={p.courseName}
                          onChange={e => {
                            const updated = [...programmes];
                            updated[idx].courseName = e.target.value;
                            setProgrammes(updated);
                          }}
                          style={{ minWidth: '220px' }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={p.level}
                          onChange={e => {
                            const updated = [...programmes];
                            updated[idx].level = e.target.value as any;
                            setProgrammes(updated);
                          }}
                        >
                          <option value="UG">UG (B.Tech)</option>
                          <option value="PG">PG (M.Tech)</option>
                          <option value="DIPLOMA">Diploma</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={p.existingIntake}
                          onChange={e => {
                            const updated = [...programmes];
                            updated[idx].existingIntake = Number(e.target.value);
                            setProgrammes(updated);
                          }}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={p.proposedIntake}
                          onChange={e => {
                            const updated = [...programmes];
                            updated[idx].proposedIntake = Number(e.target.value);
                            setProgrammes(updated);
                          }}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={p.facultyCount}
                          onChange={e => {
                            const updated = [...programmes];
                            updated[idx].facultyCount = Number(e.target.value);
                            setProgrammes(updated);
                          }}
                          style={{ width: '70px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={p.nbaAccredited}
                          onChange={e => {
                            const updated = [...programmes];
                            updated[idx].nbaAccredited = e.target.checked;
                            setProgrammes(updated);
                          }}
                        />
                      </td>
                      <td>
                        {programmes.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRemoveProgramme(idx)}
                            style={{ color: 'var(--critical-red)', borderColor: '#fecaca' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div>
            <div className="gov-card-header">
              <h2>Step 4: Statutory Document Upload Checklist</h2>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Upload authentic copies of all required statutory certificates in <strong>PDF, PNG, or JPG</strong> format (Max 10MB per file). The system will automatically execute OCR text extraction and field validation upon upload.
            </p>

            {/* Upload Box */}
            <form
              onSubmit={handleFileUpload}
              style={{
                backgroundColor: '#f8fafc',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label required">Document Category</label>
                  <select
                    className="form-select"
                    value={selectedFileCategory}
                    onChange={e => setSelectedFileCategory(e.target.value)}
                  >
                    <option value="LAND_TITLE_DEED">Land Title Deed / Registered Sale Deed</option>
                    <option value="FIRE_SAFETY_NOC">Fire & Life Safety NOC (State Fire Services)</option>
                    <option value="BUILDING_OCCUPANCY_CERTIFICATE">Building Occupancy Certificate (Municipal)</option>
                    <option value="FACULTY_CADRE_DECLARATION">Faculty Cadre List & Aadhaar Verification</option>
                    <option value="ANTI_RAGGING_AFFIDAVIT">Anti-Ragging Undertaking (AICTE 2009)</option>
                    <option value="BARRIER_FREE_ACCESSIBILITY_CERT">Barrier-Free Divyangjan Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="form-label required">Select Document File</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                  />
                </div>

                <div>
                  <button type="submit" className="btn btn-accent" disabled={uploadLoading || !fileToUpload}>
                    <Upload size={14} />
                    <span>{uploadLoading ? 'Extracting Text...' : 'Upload & Scrutinize'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Uploaded Documents List */}
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--aicte-navy)', marginBottom: '10px' }}>
              Uploaded Dossier Files ({uploadedDocs.length})
            </div>

            {uploadedDocs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No files uploaded yet for this draft application. Please upload at least Land Title, Fire NOC, and Building Occupancy certificates.
              </div>
            ) : (
              <div className="gov-table-wrapper">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Extraction Status</th>
                      <th>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedDocs.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.documentCategory.replace(/_/g, ' ')}</td>
                        <td>{d.originalFilename}</td>
                        <td>{(d.fileSizeBytes / 1024).toFixed(0)} KB</td>
                        <td>
                          <span className="badge badge-success">EXTRACTED</span>
                        </td>
                        <td>
                          <span className="badge badge-info">{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <div>
            <div className="gov-card-header">
              <h2>Step 5: Institutional Declarations & Final Submission</h2>
            </div>

            <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={declFire}
                  onChange={e => setDeclFire(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  <strong>Fire & Life Safety Undertaking:</strong> We certify that the institution campus possesses a valid Fire Safety Certificate issued by State Fire Services, compliant with National Building Code Part 4.
                </span>
              </label>

              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={declLand}
                  onChange={e => setDeclLand(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  <strong>Land Ownership & Encumbrance Undertaking:</strong> We affirm that the institution campus land is contiguous, registered in the name of the sponsoring Trust/Society, and free from any legal encumbrances.
                </span>
              </label>

              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={declRagging}
                  onChange={e => setDeclRagging(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  <strong>Anti-Ragging Compliance Undertaking:</strong> We affirm that the institution has strictly established an Anti-Ragging Committee and Squad in compliance with AICTE Regulations 2009.
                </span>
              </label>
            </div>

            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                color: '#92400e',
                marginBottom: '20px'
              }}
            >
              <strong>Important Notice:</strong> Upon clicking "Submit Formal Application", this dossier will be locked against direct editing and routed into the AICTE Preliminary Scrutiny pipeline. Any subsequent changes will require formal clarification response or committee revision permission.
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft size={14} />
            <span>Previous Step</span>
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-accent"
              onClick={handleSubmitFinal}
              disabled={isSubmitting}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Submitting & Scrutinizing...' : 'Submit Formal Application'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
