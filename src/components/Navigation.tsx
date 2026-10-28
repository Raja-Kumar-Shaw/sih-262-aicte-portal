import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  PlusCircle, 
  CheckSquare, 
  BarChart3, 
  ShieldAlert, 
  History, 
  Bell, 
  Users 
} from 'lucide-react';
import { getCurrentUser } from '../services/api';

interface NavigationProps {
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ unreadCount = 0 }) => {
  const user = getCurrentUser();
  const role = user?.role;

  return (
    <nav className="aicte-main-nav">
      <ul className="nav-links">
        <li className="nav-link-item">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <Home size={15} />
            <span>Home</span>
          </NavLink>
        </li>

        <li className="nav-link-item">
          <NavLink to="/applications" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <FileText size={15} />
            <span>Applications</span>
          </NavLink>
        </li>

        {/* Institution can create application */}
        {(role === 'INSTITUTION' || role === 'ADMIN') && (
          <li className="nav-link-item">
            <NavLink to="/applications/new" className={({ isActive }) => (isActive ? 'active' : '')}>
              <PlusCircle size={15} />
              <span>New Application</span>
            </NavLink>
          </li>
        )}

        {/* Scrutiny officer & Admin workspace */}
        {(role === 'SCRUTINY_OFFICER' || role === 'ADMIN') && (
          <li className="nav-link-item">
            <NavLink to="/reviewer-workspace" className={({ isActive }) => (isActive ? 'active' : '')}>
              <CheckSquare size={15} />
              <span>Reviewer Desk</span>
            </NavLink>
          </li>
        )}

        {/* Compliance rulebook & deficiency engine */}
        <li className="nav-link-item">
          <NavLink to="/compliance" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ShieldAlert size={15} />
            <span>Compliance Norms (APH)</span>
          </NavLink>
        </li>

        {/* Admin & Auditor analytics */}
        {(role === 'ADMIN' || role === 'AUDITOR') && (
          <li className="nav-link-item">
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>
              <BarChart3 size={15} />
              <span>Approval Analytics</span>
            </NavLink>
          </li>
        )}

        {/* Audit trail */}
        {(role === 'AUDITOR' || role === 'ADMIN') && (
          <li className="nav-link-item">
            <NavLink to="/audit" className={({ isActive }) => (isActive ? 'active' : '')}>
              <History size={15} />
              <span>Audit Ledger (SHA-256)</span>
            </NavLink>
          </li>
        )}

        {/* Alert Center */}
        <li className="nav-link-item">
          <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'active' : '')}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={15} />
              <span>Alerts</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--aicte-saffron)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '10px'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
          </NavLink>
        </li>
      </ul>

      {/* Role Pill */}
      {user && (
        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Current Role:</span>
          <span
            style={{
              backgroundColor: 'rgba(243, 112, 33, 0.2)',
              color: '#f37021',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            {user.role}
          </span>
        </div>
      )}
    </nav>
  );
};
