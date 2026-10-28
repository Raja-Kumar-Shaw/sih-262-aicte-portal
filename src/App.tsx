import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { NoticeTicker } from './components/NoticeTicker';
import { DemoRoleModal } from './components/DemoRoleModal';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationWizardPage } from './pages/ApplicationWizardPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { ReviewerWorkspacePage } from './pages/ReviewerWorkspacePage';
import { ComplianceCenterPage } from './pages/ComplianceCenterPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { NotificationsPage } from './pages/NotificationsPage';

import { getCurrentUser, api, setAuthSession } from './services/api';

export const App: React.FC = () => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [sessionKey, setSessionKey] = useState(0);

  // Auto-login default persona on first visit if none exists
  useEffect(() => {
    const existing = getCurrentUser();
    if (!existing) {
      api.auth.demoSwitch('ADMIN', 'aicte_admin').then(res => {
        setAuthSession(res.token, res.user);
        setSessionKey(prev => prev + 1);
      }).catch(err => console.warn('Auto-login notice:', err));
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.notifications.list();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [sessionKey]);

  const handlePersonaSwitched = () => {
    setSessionKey(prev => prev + 1);
    fetchUnreadCount();
  };

  return (
    <div key={sessionKey} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onOpenDemoModal={() => setShowDemoModal(true)} unreadCount={unreadCount} />
      <Navigation unreadCount={unreadCount} />
      <NoticeTicker />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage onOpenDemoModal={() => setShowDemoModal(true)} />} />
          <Route path="/applications" element={<DashboardPage />} />
          <Route path="/applications/new" element={<ApplicationWizardPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/reviewer-workspace" element={<ReviewerWorkspacePage />} />
          <Route path="/compliance" element={<ComplianceCenterPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/audit" element={<AuditTrailPage />} />
          <Route path="/notifications" element={<NotificationsPage onRefreshUnread={fetchUnreadCount} />} />
        </Routes>
      </main>

      {/* Official Government Portal Footer */}
      <footer className="official-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>All India Council for Technical Education</h4>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070<br />
              EPBAX: +91-11-26131576-78, 80<br />
              Email: approval@aicte-india.org
            </p>
          </div>

          <div className="footer-col">
            <h4>Approval Process Guidelines</h4>
            <ul>
              <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">Approval Process Handbook 2024–27</a></li>
              <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">Mandatory Document Checklist Annexures</a></li>
              <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">Faculty Cadre & Ratio Norms (Chapter 7)</a></li>
              <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">Anti-Ragging Regulations 2009</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>National Portals & Initiatives</h4>
            <ul>
              <li><a href="https://www.education.gov.in" target="_blank" rel="noreferrer">Ministry of Education (Govt. of India)</a></li>
              <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">AICTE Official Portal</a></li>
              <li><a href="https://swayam.gov.in" target="_blank" rel="noreferrer">SWAYAM Online Education</a></li>
              <li><a href="https://www.nba-india.org" target="_blank" rel="noreferrer">National Board of Accreditation (NBA)</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Approval Bureau Notice</h4>
            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
              AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.<br />
              Secure, transparent, and auditable institutional compliance processing.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 All India Council for Technical Education. Designed in accordance with Guidelines for Indian Government Websites (GIGW).</p>
        </div>
      </footer>

      {/* Demo Role Switcher Modal */}
      <DemoRoleModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onPersonaSwitched={handlePersonaSwitched}
      />
    </div>
  );
};
