import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const NotificationsPage: React.FC<{ onRefreshUnread?: () => void }> = ({ onRefreshUnread }) => {
  const user = getCurrentUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.list();
      setNotifications(res.notifications || []);
      if (onRefreshUnread) onRefreshUnread();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterSeverity === 'ALL'
    ? notifications
    : notifications.filter(n => n.severity === filterSeverity);

  const getIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <AlertTriangle size={18} color="var(--critical-red)" />;
      case 'WARNING':
        return <AlertTriangle size={18} color="var(--warning-amber)" />;
      case 'SUCCESS':
        return <CheckCircle2 size={18} color="var(--success-green)" />;
      default:
        return <Info size={18} color="var(--info-blue)" />;
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '960px' }}>
      <div className="breadcrumb-bar">
        <Link to="/">Portal Home</Link>
        <span>/</span>
        <span>Notifications & Escalation Center</span>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <h1>Approval Alerts & Regulatory Notifications</h1>
          <p>
            Real-time stage transitions, SLA alerts, and clarification notices for {user?.name}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} />
            <span>Mark All as Read</span>
          </button>
          <button className="btn btn-outline btn-sm" onClick={fetchNotifs}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['ALL', 'CRITICAL', 'WARNING', 'INFO', 'SUCCESS'].map(sev => (
          <button
            key={sev}
            className={`btn btn-sm ${filterSeverity === sev ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterSeverity(sev)}
          >
            {sev === 'ALL' ? 'All Alerts' : sev}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading notification records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="gov-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Bell size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, fontSize: '14px' }}>No alerts in this category</div>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              className="gov-card"
              style={{
                marginBottom: 0,
                padding: '16px',
                borderLeft: `4px solid ${
                  notif.severity === 'CRITICAL'
                    ? 'var(--critical-red)'
                    : notif.severity === 'WARNING'
                    ? 'var(--warning-amber)'
                    : notif.severity === 'SUCCESS'
                    ? 'var(--success-green)'
                    : 'var(--info-blue)'
                }`,
                backgroundColor: notif.isRead ? '#ffffff' : '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '2px' }}>{getIcon(notif.severity)}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--aicte-navy)' }}>
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="badge badge-warning" style={{ fontSize: '10px' }}>NEW</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', whiteSpace: 'nowrap' }}>
                  {notif.linkUrl && (
                    <Link to={notif.linkUrl} className="btn btn-outline btn-sm" style={{ fontSize: '11px' }}>
                      <span>View Dossier</span>
                      <ChevronRight size={12} />
                    </Link>
                  )}
                  {!notif.isRead && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleMarkRead(notif.id)}
                      style={{ fontSize: '11px' }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
