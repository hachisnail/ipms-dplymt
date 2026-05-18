import React, { useState, useEffect } from 'react';
import './InventorNotification.css';

// ── URL normalizer ─────────────────────────────────────────────────────────────
// Handles VITE_API_URL with OR without /api suffix — prevents double /api
const _RAW     = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API_BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;

// Auth header helper — required for all inventor notification endpoints
const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
    submission_received: {
        icon : 'bi bi-check-circle-fill',
        color: 'text-success',
        label: 'Received',
    },
    consultant_assigned: {
        icon : 'bi bi-person-check-fill',
        color: 'text-primary',
        label: 'Consultant Assigned',
    },
    resubmission_required: {
        icon : 'bi bi-exclamation-triangle-fill',
        color: 'text-warning',
        label: 'Action Required',
    },
    status_update: {
        icon : 'bi bi-arrow-repeat',
        color: 'text-info',
        label: 'Status Update',
    },
    approved: {
        icon : 'bi bi-patch-check-fill',
        color: 'text-success',
        label: 'Approved',
    },
    rejected: {
        icon : 'bi bi-x-circle-fill',
        color: 'text-danger',
        label: 'Rejected',
    },
};

const FILTER_TABS = [
    { key: 'all',                  label: 'All'          },
    { key: 'submission_received',  label: 'Received'     },
    { key: 'consultant_assigned',  label: 'Assigned'     },
    { key: 'resubmission_required',label: 'Action Needed'},
    { key: 'approved',             label: 'Approved'     },
];

// ── Component ──────────────────────────────────────────────────────────────────
function NavNotice() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const [loading,       setLoading]       = useState(true);
    const [showDropdown,  setShowDropdown]  = useState(false);
    const [activeFilter,  setActiveFilter]  = useState('all');

    // ── Fetch all ────────────────────────────────────────────────
    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/inventor/notifications`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching inventor notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch unread count ───────────────────────────────────────
    const fetchUnreadCount = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/inventor/notifications/unread-count`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setUnreadCount(data.count ?? 0);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    // ── Mark single as read ──────────────────────────────────────
    const markAsRead = async (id) => {
        try {
            await fetch(`${API_BASE}/api/inventor/notifications/${id}/read`, {
                method : 'PUT',
                headers: authHeaders(),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    // ── Mark all as read ─────────────────────────────────────────
    const markAllAsRead = async () => {
        try {
            await fetch(`${API_BASE}/api/inventor/notifications/read-all`, {
                method : 'PUT',
                headers: authHeaders(),
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    // ── Clear all ────────────────────────────────────────────────
    const clearAllNotifications = async () => {
        if (!window.confirm(
            'Are you sure you want to clear all notifications?\n\nThis removes notifications only. Your projects are not affected.'
        )) return;

        try {
            const res = await fetch(`${API_BASE}/api/inventor/notifications/clear-all`, {
                method : 'DELETE',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`Server responded ${res.status}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Unknown error');
            setNotifications([]);
            setUnreadCount(0);
            setShowDropdown(false);
        } catch (err) {
            console.error('Error clearing notifications:', err);
            alert('Failed to clear notifications. Please try again.');
        }
    };

    // ── Navigate on click ────────────────────────────────────────
    const handleNotificationClick = (notification) => {
        if (!notification.is_read) markAsRead(notification.id);
        if (notification.submission_prefix && notification.submission_id) {
            const prefixRouteMap = {
                umid: `/main/tracker?id=${notification.submission_id}`,
                tm  : `/main/tracker?id=${notification.submission_id}`,
                cr  : `/main/tracker?id=${notification.submission_id}`,
            };
            const route = prefixRouteMap[notification.submission_prefix];
            if (route) window.location.href = route;
        }
    };

    // ── Polling every 10 s ───────────────────────────────────────
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        const iv = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 10000);
        return () => clearInterval(iv);
    }, []);

    // ── Close on outside click ───────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (showDropdown && !e.target.closest('.nav-item.dropdown')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [showDropdown]);

    // ── Derived lists ────────────────────────────────────────────
    const filteredNotifs = activeFilter === 'all'
        ? notifications
        : notifications.filter(n => n.type === activeFilter);

    const visibleList = filteredNotifs.slice(0, 10);

    // Urgent count — unread resubmission_required items
    const urgentCount = notifications.filter(
        n => n.type === 'resubmission_required' && !n.is_read
    ).length;

    // ── Render ───────────────────────────────────────────────────
    return (
        <li className="nav-item dropdown">

            {/* Bell button */}
            <a
                className="nav-link nav-icon"
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    setShowDropdown(prev => !prev);
                }}
                style={{ position: 'relative' }}
            >
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && (
                    <span className={`badge badge-number ${urgentCount > 0 ? 'bg-danger' : 'bg-primary'}`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </a>

            {/* Dropdown panel */}
            {showDropdown && (
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications show inventor-notifications">

                    {/* ── Header ── */}
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
                                    <button
                                        className="btn-mark-read"
                                        onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                                        title="Mark all as read"
                                    >
                                        <i className="bi bi-check-all"></i> Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        className="btn-clear-all"
                                        onClick={(e) => { e.preventDefault(); clearAllNotifications(); }}
                                        title="Clear all"
                                    >
                                        <i className="bi bi-trash"></i> Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Urgent resubmission banner */}
                        {urgentCount > 0 && (
                            <div className="urgent-banner">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {urgentCount} submission{urgentCount !== 1 ? 's' : ''} require your attention
                            </div>
                        )}
                    </li>

                    {/* ── Filter tabs ── */}
                    <li className="notification-filter-tabs">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveFilter(tab.key)}
                            >
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

                    {/* ── Notifications list ── */}
                    <li className="notifications-list-wrap"><ul className="notifications-list" style={{padding:0,margin:0,listStyle:'none'}}>
                        {loading ? (
                            <li className="notification-item">
                                <div className="notification-loading">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <span className="ms-2">Loading notifications...</span>
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
                            visibleList.map((notification, index) => {
                                const cfg = CATEGORY_CONFIG[notification.type] || {
                                    icon : 'bi bi-bell-fill',
                                    color: 'text-primary',
                                    label: 'Update',
                                };
                                const isUrgent = notification.type === 'resubmission_required';

                                return (
                                    <React.Fragment key={notification.id}>
                                        <li
                                            className={`notification-item ${!notification.is_read ? 'unread' : ''} ${isUrgent && !notification.is_read ? 'urgent' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {/* Icon */}
                                            <div className="notification-icon-wrapper">
                                                <i className={`${cfg.icon} ${cfg.color}`}></i>
                                            </div>

                                            {/* Content */}
                                            <div className="notification-content">
                                                <div className="notif-meta">
                                                    <span className={`notif-category-badge badge-${notification.type}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {!notification.is_read && (
                                                        <span className="badge-new">NEW</span>
                                                    )}
                                                    {isUrgent && (
                                                        <span className="badge-urgent">
                                                            <i className="bi bi-exclamation-circle-fill"></i> Action Required
                                                        </span>
                                                    )}
                                                </div>
                                                <h4>{notification.title}</h4>
                                                <p className="notification-message">
                                                    {notification.message}
                                                </p>
                                                {notification.consultant_name && (
                                                    <p className="notification-consultant">
                                                        <i className="bi bi-person-badge-fill"></i>{' '}
                                                        Consultant: <strong>{notification.consultant_name}</strong>
                                                    </p>
                                                )}
                                                <p className="notification-time">
                                                    <i className="bi bi-clock"></i>{' '}
                                                    {notification.time_ago}
                                                </p>
                                            </div>

                                            {/* Mark single read */}
                                            {!notification.is_read && (
                                                <button
                                                    className="btn-mark-single"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    title="Mark as read"
                                                >
                                                    <i className="bi bi-check"></i>
                                                </button>
                                            )}
                                        </li>

                                        {index < visibleList.length - 1 && (
                                            <li><hr className="dropdown-divider" /></li>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </ul></li>

                    {/* ── Footer — only shown when truncated ── */}
                    {filteredNotifs.length > 10 && (
                        <>
                            <li><hr className="dropdown-divider" /></li>
                            <li className="dropdown-footer">
                                <span className="notification-count">
                                    Showing 10 of {filteredNotifs.length} notifications
                                </span>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </li>
    );
}

export default NavNotice;