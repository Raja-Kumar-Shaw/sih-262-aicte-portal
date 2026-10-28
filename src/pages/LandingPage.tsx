import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Scale, 
  Clock, 
  Lock, 
  Cpu, 
  BarChart, 
  HelpCircle,
  Building,
  UserCheck,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { getCurrentUser } from '../services/api';
import aicteLogo from '../assets/aicte-logo.png';

interface LandingPageProps {
  onOpenDemoModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenDemoModal }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: '#002147',
          color: '#ffffff',
          padding: '48px 24px',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(243, 112, 33, 0.15) 0%, transparent 60%)',
          borderBottom: '4px solid var(--aicte-saffron)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '20px', width: 'fit-content' }}>
            <img
              src={aicteLogo}
              alt="AICTE"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '12.5px', color: '#e2e8f0', fontWeight: 600 }}>
              AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System
            </span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.2, maxWidth: '850px' }}>
            Transforming Institutional Technical Approvals with Explainable Intelligence & Auditable Workflows
          </h1>

          <p style={{ fontSize: '16px', color: '#cbd5e1', maxWidth: '780px', lineHeight: 1.6 }}>
            Enabling AICTE approval processing, document scrutiny, APH 2024–27 statutory compliance, committee reviewer allocation, and SLA deadline monitoring with complete transparency, efficiency, and statutory accountability.
          </p>

          <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent"
              style={{ padding: '12px 24px', fontSize: '15px' }}
              onClick={onOpenDemoModal}
            >
              <ShieldCheck size={18} />
              <span>Explore Stakeholder Roles</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '32px', marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f37021' }}>100%</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Deterministic Rule Verification</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>SHA-256</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Cryptographic Tamper-Proof Audit</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f37021' }}>7-Day SLA</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Configurable Pendency Intelligence</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>Zero PII</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Synthetic Indian Institutional Data</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="app-container">
        {/* Four Distinct Roles */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--aicte-navy)' }}>
              Four Dedicated Role-Based Workflows
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Enforcing backend role authorization and tailored workspaces for each stakeholder
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {/* Institution */}
            <div className="gov-card" style={{ borderTop: '4px solid var(--aicte-navy)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Building size={22} color="var(--aicte-navy)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aicte-navy)', margin: 0 }}>
                  Institution Applicant
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Create application drafts, upload statutory certificates, inspect preliminary validation results, respond to committee clarifications, and track real-time approval milestones.
              </p>
              <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--aicte-navy)', fontWeight: 600 }}>
                Institutional Authorized Representative
              </div>
            </div>

            {/* Scrutiny Officer */}
            <div className="gov-card" style={{ borderTop: '4px solid var(--info-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <UserCheck size={22} color="var(--info-blue)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--info-blue)', margin: 0 }}>
                  Scrutiny Officer
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Inspect assigned dossiers, review extracted fields, evaluate evidence-linked findings, record signed overrides with mandatory justifications, and issue clarification notices.
              </p>
              <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--info-blue)', fontWeight: 600 }}>
                Scrutiny Committee Member
              </div>
            </div>

            {/* Administrator */}
            <div className="gov-card" style={{ borderTop: '4px solid var(--aicte-saffron)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldCheck size={22} color="var(--aicte-saffron)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aicte-saffron)', margin: 0 }}>
                  AICTE Administrator
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Bureau-wide oversight, reviewer allocation, regional analytics, SLA threshold tuning, bottleneck monitoring, and recording final statutory approval or rejection decisions.
              </p>
              <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--aicte-saffron)', fontWeight: 600 }}>
                Approval Bureau Directorate
              </div>
            </div>

            {/* Auditor */}
            <div className="gov-card" style={{ borderTop: '4px solid var(--success-green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Eye size={22} color="var(--success-green)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-green)', margin: 0 }}>
                  Vigilance Auditor
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Read-only oversight of all historical decisions, reviewer overrides, and evidence references. Cryptographically verify ledger integrity across all SHA-256 blocks with zero decision tampering.
              </p>
              <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--success-green)', fontWeight: 600 }}>
                Central Vigilance Oversight
              </div>
            </div>
          </div>
        </section>

        {/* Complete End-to-End Workflow Diagram */}
        <section className="gov-card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--aicte-navy)' }}>
              End-to-End Approval Lifecycle Architecture
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              How automation accelerates processing while keeping authorized statutory officers in control
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              textAlign: 'center'
            }}
          >
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--aicte-saffron)', marginBottom: '4px' }}>STEP 1</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--aicte-navy)' }}>Application Creation</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Multi-step wizard with draft saves and doc checklist</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--aicte-saffron)', marginBottom: '4px' }}>STEP 2</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--aicte-navy)' }}>Document OCR & Parsing</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Automated extraction of land, fire NOC, and building data</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--aicte-saffron)', marginBottom: '4px' }}>STEP 3</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--aicte-navy)' }}>APH Rules Engine</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Deterministic checks against APH 2024–27 clauses</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--aicte-saffron)', marginBottom: '4px' }}>STEP 4</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--aicte-navy)' }}>Scrutiny Committee</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Officer inspects findings, requests clarification, signs override</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--aicte-saffron)', marginBottom: '4px' }}>STEP 5</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--aicte-navy)' }}>Statutory Decision</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Approval recorded & permanently sealed in audit ledger</div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="gov-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aicte-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--aicte-saffron)" />
              <span>Evidence-Linked Explainability</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              Unlike opaque AI models, every compliance deficiency generated cites the exact regulatory clause (e.g. APH Clause 7.1.3), the source document examined, and the exact token discrepancy.
            </p>
          </div>

          <div className="gov-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aicte-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="var(--info-blue)" />
              <span>Human Reviewer Overrides</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              Authorized committee members can overrule automated findings by providing an official signed justification. The original automated check and override reasoning are both permanently preserved.
            </p>
          </div>

          <div className="gov-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aicte-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--warning-amber)" />
              <span>Configurable Pendency Intelligence</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              Automatic SLA tracking monitors time spent in each stage. Cases exceeding administrative thresholds are flagged with automated alerts to regional officers and bureau directors.
            </p>
          </div>

          <div className="gov-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aicte-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--success-green)" />
              <span>SHA-256 Tamper-Evident Ledger</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              All actions, stage changes, document uploads, and reviewer overrides form a cryptographic hash-linked ledger. Auditors and statutory officers can verify entire chain integrity with one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
