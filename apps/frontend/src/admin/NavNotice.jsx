import React, { useState, useEffect } from 'react';
import './Notification.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function NavNotice() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch notifications
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

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`);
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
                method: 'PUT'
            });
            // Update local state
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, is_read: true } 
                        : notif
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
                method: 'PUT'
            });
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Handle notification click - navigate to submission
    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        
        // Navigate based on submission type using window.location
        const routeMap = {
            'Copyright': '/main2/UnderReviewcr',
            'Trademark': '/main2/UnderReviewtm',
            'Industrial Design': '/main2/UnderReviewid',
            'Utility Model': '/main2/UnderReviewum'
        };
        
        const route = routeMap[notification.submission_type];
        if (route) {
            // Use window.location for navigation (works without react-router)
            window.location.href = route;
        }
    };

    // Handle "Show all notifications" click
    const handleShowAll = (e) => {
        e.preventDefault();
        window.location.href = '/main2/all-notifications';
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        
        // Poll every 10 seconds for new notifications
        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 10000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <li className="nav-item dropdown">
            <a 
                className="nav-link nav-icon" 
                href="#" 
                data-bs-toggle="dropdown"
                style={{ position: 'relative' }}
            >
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && (
                    <span className="badge bg-primary badge-number">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </a>
     
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                <li className="dropdown-header">
                    You have {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                    <a 
                        href="#" 
                        onClick={(e) => {
                            e.preventDefault();
                            markAllAsRead();
                        }}
                    >
                        <span className="badge rounded-pill bg-primary p-2 ms-2">
                            Mark all read
                        </span>
                    </a>
                </li>
                
                <li>
                    <hr className="dropdown-divider"/>
                </li>

                {loading ? (
                    <li className="notification-item">
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <i className="bi bi-hourglass-split"></i> Loading...
                        </div>
                    </li>
                ) : notifications.length === 0 ? (
                    <li className="notification-item">
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                            <i className="bi bi-inbox"></i> No notifications
                        </div>
                    </li>
                ) : (
                    notifications.slice(0, 10).map((notification, index) => (
                        <React.Fragment key={notification.id}>
                            <li 
                                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                                style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: !notification.is_read ? '#f0f8ff' : 'transparent',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <i className={`${notification.icon} ${notification.icon_color}`}></i>
                                <div>
                                    <h4>
                                        {notification.title}
                                        {!notification.is_read && (
                                            <span 
                                                className="badge bg-danger ms-2" 
                                                style={{ fontSize: '8px', padding: '2px 6px' }}
                                            >
                                                NEW
                                            </span>
                                        )}
                                    </h4>
                                    <p>{notification.message}</p>
                                    <p style={{ fontSize: '11px', color: '#6c757d' }}>
                                        {notification.time_ago}
                                    </p>
                                </div>
                            </li>
                            
                            {index < notifications.slice(0, 10).length - 1 && (
                                <li>
                                    <hr className="dropdown-divider"/>
                                </li>
                            )}
                        </React.Fragment>
                    ))
                )}

                {notifications.length > 10 && (
                    <>
                        <li>
                            <hr className="dropdown-divider"/>
                        </li>
                        <li className="dropdown-footer">
                            <a 
                                href="#" 
                                onClick={handleShowAll}
                            >
                                Show all notifications ({notifications.length})
                            </a>
                        </li>
                    </>
                )}
            </ul>
        </li>
    );
}

export default NavNotice;