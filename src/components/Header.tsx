import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShieldCheck, User as UserIcon, RefreshCw, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { getCurrentUser, clearAuthSession, api } from '../services/api';

interface HeaderProps {
  onOpenDemoModal: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemoModal, unreadCount = 0 }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    document.documentElement.classList.remove('font-sm', 'font-md', 'font-lg');
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
    window.location.reload();
  };

  return (
    <header>
      {/* 1. Indian Government Tricolor Ribbon */}
      <div className="gov-tricolor-ribbon">
        <div className="stripe-saffron" />
        <div className="stripe-white" />
        <div className="stripe-green" />
      </div>

      {/* 3. Top Accessibility Toolbar */}
      <div className="top-accessibility-bar">
        <div>
          <span>भारत सरकार | Government of India</span>
          <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
          <span>शिक्षा मंत्रालय | Ministry of Education</span>
        </div>

        <div className="top-accessibility-controls">
          <span>Text Size:</span>
          <button onClick={() => setFontSize('sm')} title="Small Font">A-</button>
          <button onClick={() => setFontSize('md')} title="Standard Font">A</button>
          <button onClick={() => setFontSize('lg')} title="Large Font">A+</button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <button onClick={() => setIsHighContrast(!isHighContrast)} title="Toggle High Contrast">
            {isHighContrast ? 'Normal View' : 'High Contrast'}
          </button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <button onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')} title="Toggle Hindi / English">
            {lang === 'EN' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </div>

      {/* 4. Official AICTE Bilingual Brand Header */}
      <div className="aicte-brand-header">
        <div className="aicte-brand-left">
          {/* Official AICTE Emblem */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div className="emblem-logo">
              <img
                src="/aicte-logo.png"
                alt="AICTE Official Emblem"
                style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <div className="aicte-brand-text">
              <h2>अखिल भारतीय तकनीकी शिक्षा परिषद</h2>
              <h1>ALL INDIA COUNCIL FOR TECHNICAL EDUCATION</h1>
              <p>Statutory Body under Ministry of Education, Government of India</p>
            </div>
          </Link>
        </div>

        {/* User Session & Demo Switcher Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--aicte-navy)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {user.designation} • <strong style={{ color: 'var(--aicte-saffron)' }}>{user.role}</strong>
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={onOpenDemoModal}
                title="Switch Role"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--aicte-saffron)' }}
              >
                <RefreshCw size={13} color="var(--aicte-saffron)" />
                <span>Switch Role</span>
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
                title="Sign Out"
                style={{ padding: '6px' }}
              >
                <LogOut size={14} color="#64748b" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-accent"
                onClick={onOpenDemoModal}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldCheck size={16} />
                <span>Select Stakeholder Role</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
