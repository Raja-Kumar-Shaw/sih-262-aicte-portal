import React, { useState, useEffect } from 'react';
import { Shield, Building2, UserCheck, Eye, KeyRound, Check, X, ArrowRight } from 'lucide-react';
import { api, setAuthSession } from '../services/api';

interface DemoRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaSwitched: () => void;
}

export const DemoRoleModal: React.FC<DemoRoleModalProps> = ({ isOpen, onClose, onPersonaSwitched }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      api.auth.getDemoAccounts().then(res => {
        setAccounts(res.accounts || []);
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPersona = async (username: string) => {
    setLoading(true);
    try {
      const res = await api.auth.demoSwitch(undefined, username);
      setAuthSession(res.token, res.user);
      onPersonaSwitched();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to switch demo persona');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'INSTITUTION':
        return <Building2 size={20} color="var(--aicte-navy)" />;
      case 'SCRUTINY_OFFICER':
        return <UserCheck size={20} color="var(--info-blue)" />;
      case 'ADMIN':
        return <Shield size={20} color="var(--aicte-saffron)" />;
      case 'AUDITOR':
        return <Eye size={20} color="var(--success-green)" />;
      default:
        return <KeyRound size={20} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Explore Stakeholder Roles</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Select any role below to experience its dedicated workflow and permissions
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            {accounts.filter(acc => acc.username !== 'dtu_registrar' && acc.username !== 'coep_director').map(acc => (
              <div
                key={acc.id}
                onClick={() => handleSelectPersona(acc.username)}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--aicte-saffron)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getRoleIcon(acc.role)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--aicte-navy)' }}>
                        {acc.name}
                      </span>
                      <span
                        className={`badge ${
                          acc.role === 'ADMIN'
                            ? 'badge-warning'
                            : acc.role === 'SCRUTINY_OFFICER'
                            ? 'badge-info'
                            : acc.role === 'AUDITOR'
                            ? 'badge-success'
                            : 'badge-neutral'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {acc.designation} {acc.institutionName ? `• ${acc.institutionName}` : ''}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Username: <code>{acc.username}</code> • Default Password: <code>{acc.defaultPassword}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--aicte-saffron)' }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              backgroundColor: '#eff6ff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: '#1e40af',
              border: '1px solid #bfdbfe'
            }}
          >
            <strong>Role Switching:</strong> You can switch roles at any point using the top-right "Switch Role" button.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
