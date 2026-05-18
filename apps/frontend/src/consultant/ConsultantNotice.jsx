import React, { useState, useEffect } from 'react';
import './Notification.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3006/api').replace(/\/$/, '');

// Auth header helper — mirrors ConsultantSideBar.jsx
const hdrs = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

function NavNotice() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, { headers: hdrs() });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setNotifications(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers: hdrs() });
            if (!response.ok) throw new Error('Failed to fetch count');
            const data = await response.json();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: hdrs(),
            });
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, is_read: true } : notif
                )
            );
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: hdrs(),
            });
            setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Clear all notifications — ONLY touches the notifications table.
    // Projects / submissions are never affected by this function.
    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?\n\nThis removes notifications only. Your projects are not affected.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...hdrs() },
            });

            if (!response.ok) throw new Error(`Server responded ${response.status}`);

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Unknown error from server');

            console.log(`✅ Cleared ${data.cleared} notification(s)`);
            setNotifications([]);
            setUnreadCount(0);
            setShowDropdown(false);
        } catch (error) {
            console.error('Error clearing notifications:', error);
            alert('Failed to clear notifications. Please try again.');
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.nav-item.dropdown')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    return (
        <li className="nav-item dropdown">
            <a
                className="nav-link nav-icon"
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    setShowDropdown(!showDropdown);
                }}
                style={{ position: 'relative' }}
            >
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && (
                    <span className="badge bg-primary badge-number">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </a>

            {showDropdown && (
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications show">
                    <li className="dropdown-header">
                        <div className="notification-header-content">
                            <span className="notification-title">
                                <i className="bi bi-bell-fill"></i>
                                You have {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                            </span>
                            <div className="notification-actions">
                                {unreadCount > 0 && (
                                    <button
                                        className="btn-mark-read"
                                        onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                                        title="Mark all as read"
                                    >
                                        <i className="bi bi-check-all"></i>
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        className="btn-clear-all"
                                        onClick={(e) => { e.preventDefault(); clearAllNotifications(); }}
                                        title="Clear all notifications"
                                    >
                                        <i className="bi bi-trash"></i>
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>
                    </li>

                    <li><hr className="dropdown-divider" /></li>

                    <div className="notifications-list">
                        {loading ? (
                            <li className="notification-item">
                                <div className="notification-loading">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <span className="ms-2">Loading notifications...</span>
                                </div>
                            </li>
                        ) : notifications.length === 0 ? (
                            <li className="notification-item">
                                <div className="notification-empty">
                                    <i className="bi bi-inbox"></i>
                                    <p>No notifications</p>
                                    <span>You're all caught up!</span>
                                </div>
                            </li>
                        ) : (
                            notifications.slice(0, 10).map((notification, index) => (
                                <React.Fragment key={notification.id}>
                                    <li className={`notification-item ${!notification.is_read ? 'unread' : ''}`}>
                                        <div className="notification-icon-wrapper">
                                            <i className={`${notification.icon} ${notification.icon_color}`}></i>
                                        </div>
                                        <div className="notification-content">
                                            <h4>
                                                {notification.title}
                                                {!notification.is_read && (
                                                    <span className="badge-new">NEW</span>
                                                )}
                                            </h4>
                                            <p className="notification-message">{notification.message}</p>
                                            <p className="notification-time">
                                                <i className="bi bi-clock"></i>
                                                {notification.time_ago}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <button
                                                className="btn-mark-single"
                                                onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                title="Mark as read"
                                            >
                                                <i className="bi bi-check"></i>
                                            </button>
                                        )}
                                    </li>
                                    {index < notifications.slice(0, 10).length - 1 && (
                                        <li><hr className="dropdown-divider" /></li>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </div>

                    {notifications.length > 10 && (
                        <>
                            <li><hr className="dropdown-divider" /></li>
                            <li className="dropdown-footer">
                                <span className="notification-count">
                                    Showing 10 of {notifications.length} notifications
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