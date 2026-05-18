import React, { useState, useEffect, useRef } from 'react';
import './AdminNotification.css';

const _RAW     = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API_BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const CATEGORY_CONFIG = {
  new_submission: { icon: 'bi bi-file-earmark-plus-fill',  color: 'text-primary',   label: 'New Submission' },
  new_user:       { icon: 'bi bi-person-fill-add',         color: 'text-success',   label: 'New User'       },
  role_change:    { icon: 'bi bi-shield-fill-exclamation', color: 'text-warning',   label: 'Role / Permission' },
  pas_report:     { icon: 'bi bi-file-earmark-check-fill', color: 'text-info',      label: 'PAS Report'     },
  assignment:     { icon: 'bi bi-person-lines-fill',       color: 'text-secondary', label: 'Assignment'     },
  communication:  { icon: 'bi bi-envelope-fill',           color: 'text-danger',    label: 'Communication'  },
};

const FILTER_TABS = [
  { key: 'all',            label: 'All'        },
  { key: 'new_submission', label: 'Submissions' },
  { key: 'new_user',       label: 'Users'       },
  { key: 'pas_report',     label: 'PAS'         },
  { key: 'communication',  label: 'Letters'     },
];

const ROUTE_MAP = {
  new_submission: {
    Copyright:          '/main2/UnderReviewcr',
    Trademark:          '/main2/UnderReviewtm',
    'Industrial Design':'/main2/UnderReviewid',
    'Utility Model':    '/main2/UnderReviewum',
  },
  new_user:      '/main2/users-pending',
  role_change:   '/main2/role-permissions',
  pas_report:    '/main2/pas-reports',
  assignment:    '/main2/pending-submissions',
  communication: '/main2/communication',
};

function NavNotice() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [activeFilter,  setActiveFilter]  = useState('all');
  const wrapperRef = useRef(null);

  /* ── Fetch ── */
  const fetchNotifications = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/admin/notifications`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : (data.data || []));
    } catch (err) { console.error('Error fetching admin notifications:', err); }
    finally { setLoading(false); }
  };

  const fetchUnreadCount = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/admin/notifications/unread-count`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch (err) { console.error('Error fetching unread count:', err); }
  };

  /* ── Actions ── */
  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/admin/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) { console.error('Error marking as read:', err); }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/notifications/read-all`, { method: 'PUT', headers: authHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error('Error marking all as read:', err); }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/admin/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(c => {
        const wasUnread = notifications.find(n => n.id === id && !n.is_read);
        return wasUnread ? Math.max(0, c - 1) : c;
      });
    } catch (err) { console.error('Error deleting notification:', err); }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Clear all admin notifications?\n\nThis removes notifications only. No data is affected.')) return;
    try {
      const res  = await fetch(`${API_BASE}/api/admin/notifications/clear-all`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Unknown error');
      setNotifications([]); setUnreadCount(0); setShowDropdown(false);
    } catch (err) { console.error('Error clearing:', err); alert('Failed to clear notifications.'); }
  };

  /* ── Navigate on click ── */
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    const typeRoutes = ROUTE_MAP[notification.type];
    if (!typeRoutes) return;
    if (typeof typeRoutes === 'string') { window.location.href = typeRoutes; return; }
    const route = typeRoutes[notification.submission_type];
    if (route) window.location.href = route;
  };

  /* ── Polling ── */
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const iv = setInterval(() => { fetchNotifications(); fetchUnreadCount(); }, 10000);
    return () => clearInterval(iv);
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredNotifs = activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter);
  const visibleList    = filteredNotifs.slice(0, 10);

  return (
    <li className="nav-item dropdown" ref={wrapperRef}>

      {/* ── Bell button ── */}
      <a className="nav-link nav-icon" href="#"
        onClick={e => { e.preventDefault(); setShowDropdown(prev => !prev); }}
        style={{ position: 'relative' }}>
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="badge bg-danger badge-number">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </a>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications show admin-notifications">

          {/* Header */}
          <li className="dropdown-header">
            <div className="notification-header-content">
              <span className="notification-title">
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0
                  ? `${unreadCount} new notification${unreadCount !== 1 ? 's' : ''}`
                  : 'Notifications'}
              </span>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button className="btn-mark-read" onClick={e => { e.preventDefault(); markAllAsRead(); }} title="Mark all as read">
                    <i className="bi bi-check-all"></i> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button className="btn-clear-all" onClick={e => { e.preventDefault(); clearAllNotifications(); }} title="Clear all">
                    <i className="bi bi-trash"></i> Clear all
                  </button>
                )}
              </div>
            </div>
          </li>

          {/* Filter tabs */}
          <li className="notification-filter-tabs">
            {FILTER_TABS.map(tab => (
              <button key={tab.key} className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab.key)}>
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="tab-count">
                    {notifications.filter(n => n.type === tab.key && !n.is_read).length || ''}
                  </span>
                )}
              </button>
            ))}
          </li>

          <li><hr className="dropdown-divider" /></li>

          {/* List */}
          <div className="notifications-list">
            {loading ? (
              <li className="notification-item">
                <div className="notification-loading">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading…</span>
                </div>
              </li>
            ) : visibleList.length === 0 ? (
              <li className="notification-item">
                <div className="notification-empty">
                  <i className="bi bi-inbox"></i>
                  <p>No notifications</p>
                  <span>
                    {activeFilter === 'all'
                      ? "You're all caught up!"
                      : `No ${FILTER_TABS.find(t => t.key === activeFilter)?.label} notifications`}
                  </span>
                </div>
              </li>
            ) : (
              visibleList.map((notif, index) => {
                const cfg = CATEGORY_CONFIG[notif.type] || { icon: 'bi bi-bell-fill', color: 'text-primary', label: 'Notification' };
                return (
                  <React.Fragment key={notif.id}>
                    <li className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                      style={{ cursor: 'pointer' }}>

                      {/* Icon */}
                      <div className="notification-icon-wrapper">
                        <i className={`${cfg.icon} ${cfg.color}`}></i>
                      </div>

                      {/* Content */}
                      <div className="notification-content">
                        <div className="notif-meta">
                          <span className={`notif-category-badge badge-${notif.type}`}>{cfg.label}</span>
                          {!notif.is_read && <span className="badge-new">NEW</span>}
                        </div>
                        <h4>{notif.title}</h4>
                        <p className="notification-message">{notif.message}</p>
                        <p className="notification-time">
                          <i className="bi bi-clock"></i> {notif.time_ago}
                        </p>
                      </div>

                      {/* Actions: mark read + delete */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        {!notif.is_read && (
                          <button className="btn-mark-single"
                            onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                            title="Mark as read">
                            <i className="bi bi-check"></i>
                          </button>
                        )}
                        <button className="btn-mark-single"
                          style={{ background: '#fff1f2', borderColor: '#fecaca' }}
                          onClick={e => deleteNotification(e, notif.id)}
                          title="Delete">
                          <i className="bi bi-trash" style={{ fontSize: 12, color: '#dc2626' }}></i>
                        </button>
                      </div>

                    </li>
                    {index < visibleList.length - 1 && <li><hr className="dropdown-divider" /></li>}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filteredNotifs.length > 10 && (
            <>
              <li><hr className="dropdown-divider" /></li>
              <li className="dropdown-footer">
                <span className="notification-count">Showing 10 of {filteredNotifs.length}</span>
                <a href="/main2/all-notifications" className="view-all-link">
                  View all <i className="bi bi-arrow-right"></i>
                </a>
              </li>
            </>
          )}

        </ul>
      )}
    </li>
  );
}

export default NavNotice;