import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TableView.css'; // Reuse your existing styles

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const Notificationpage = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [typeFilter, setTypeFilter] = useState('all'); // all, Copyright, Trademark, etc.
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setNotifications(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, is_read: true } 
                        : notif
                )
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!window.confirm('Delete this notification?')) return;
        
        try {
            await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT'
            });
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, is_read: true }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        
        const routeMap = {
            'Copyright': 'main2/UnderReviewcr',
            'Trademark': 'main2/UnderReviewtm',
            'Industrial Design': 'main2/UnderReviewid',
            'Utility Model': 'main2/UnderReviewum'
        };
        
        const route = routeMap[notification.submission_type];
        if (route) {
            navigate(`/${route}`);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter notifications
    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread' && notif.is_read) return false;
        if (filter === 'read' && !notif.is_read) return false;
        if (typeFilter !== 'all' && notif.submission_type !== typeFilter) return false;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="Table-container">
                <div className="loader">
                    <p>Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="Table-container">
            <h2>
                <i className="bi bi-bell me-2"></i>
                All Notifications
            </h2>

            {/* Filter Bar */}
            <div style={{
                background: '#fff',
                padding: '15px 20px',
                borderRadius: '10px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#6b7280' }}>Filter:</span>
                    
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: filter === 'all' ? '#2563eb' : '#fff',
                            color: filter === 'all' ? '#fff' : '#374151',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        All ({notifications.length})
                    </button>
                    
                    <button
                        onClick={() => setFilter('unread')}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: filter === 'unread' ? '#2563eb' : '#fff',
                            color: filter === 'unread' ? '#fff' : '#374151',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        Unread ({unreadCount})
                    </button>
                    
                    <button
                        onClick={() => setFilter('read')}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: filter === 'read' ? '#2563eb' : '#fff',
                            color: filter === 'read' ? '#fff' : '#374151',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        Read ({notifications.length - unreadCount})
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#6b7280' }}>Type:</span>
                    
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="Copyright">Copyright</option>
                        <option value="Trademark">Trademark</option>
                        <option value="Industrial Design">Industrial Design</option>
                        <option value="Utility Model">Utility Model</option>
                    </select>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#10b981',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500
                            }}
                        >
                            <i className="bi bi-check-all me-1"></i>
                            Mark All Read
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div style={{
                background: '#fff',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden'
            }}>
                {filteredNotifications.length === 0 ? (
                    <div style={{ 
                        padding: '40px', 
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        <i className="bi bi-inbox" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                        <p>No notifications found</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            style={{
                                padding: '15px 20px',
                                borderBottom: '1px solid #f3f4f6',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '15px',
                                background: !notification.is_read ? '#f0f9ff' : '#fff',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleNotificationClick(notification)}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = !notification.is_read ? '#f0f9ff' : '#fff'}
                        >
                            {/* Icon */}
                            <div style={{ flexShrink: 0, paddingTop: '3px' }}>
                                <i 
                                    className={`${notification.icon} ${notification.icon_color}`}
                                    style={{ fontSize: '28px' }}
                                ></i>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{
                                    margin: '0 0 5px 0',
                                    fontSize: '15px',
                                    fontWeight: !notification.is_read ? 600 : 500,
                                    color: '#1f2937'
                                }}>
                                    {notification.title}
                                    {!notification.is_read && (
                                        <span style={{
                                            display: 'inline-block',
                                            width: '8px',
                                            height: '8px',
                                            background: '#2563eb',
                                            borderRadius: '50%',
                                            marginLeft: '8px'
                                        }}></span>
                                    )}
                                </h4>
                                <p style={{
                                    margin: '0 0 5px 0',
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    lineHeight: '1.5'
                                }}>
                                    {notification.message}
                                </p>
                                <div style={{
                                    display: 'flex',
                                    gap: '15px',
                                    fontSize: '12px',
                                    color: '#9ca3af'
                                }}>
                                    <span>
                                        <i className="bi bi-clock me-1"></i>
                                        {notification.time_ago}
                                    </span>
                                    {notification.submission_type && (
                                        <span>
                                            <i className="bi bi-tag me-1"></i>
                                            {notification.submission_type}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexShrink: 0
                            }}>
                                {!notification.is_read && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        style={{
                                            padding: '6px 10px',
                                            border: '1px solid #2563eb',
                                            borderRadius: '6px',
                                            background: '#fff',
                                            color: '#2563eb',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: 500
                                        }}
                                        title="Mark as read"
                                    >
                                        <i className="bi bi-check"></i>
                                    </button>
                                )}
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #ef4444',
                                        borderRadius: '6px',
                                        background: '#fff',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 500
                                    }}
                                    title="Delete"
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notificationpage;