import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`${API_URL}/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setUser(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                if (error.response?.status === 401) {
                    toast.error('Session expired. Please login again.');
                    localStorage.clear();
                    navigate('/login');
                } else {
                    toast.error('Failed to load profile');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            
            await axios.post(`${API_URL}/auth/logout`, { sessionToken });
            
            localStorage.clear();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            navigate('/login');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loader-container">
                    <div className="spinner-large"></div>
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getRoleBadgeClass = (userType) => {
        switch(userType) {
            case 'INVENTOR': return 'role-badge inventor';
            case 'CONSULTANT': return 'role-badge consultant';
            case 'ADMIN': return 'role-badge admin';
            default: return 'role-badge';
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-background">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>Welcome back, {user.full_name}!</h1>
                        <p>Manage your account and view your profile information</p>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>

                <div className="profile-grid">
                    <div className="profile-card main-card">
                        <div className="profile-header">
                            <div className="profile-image-container">
                                {user.profile_picture ? (
                                    <img
                                        src={`${API_URL.replace('/api', '')}/uploads/${user.profile_picture}`}
                                        alt="Profile"
                                        className="profile-image"
                                    />
                                ) : (
                                    <div className="profile-image-placeholder">
                                        <FaUserCircle />
                                    </div>
                                )}
                            </div>
                            <div className="profile-info">
                                <h2>{user.full_name}</h2>
                                <p className="email">{user.email}</p>
                                <div className={getRoleBadgeClass(user.user_type)}>
                                    {user.user_type === 'INVENTOR' && '🎨 Inventor'}
                                    {user.user_type === 'CONSULTANT' && '👔 Consultant'}
                                    {user.user_type === 'ADMIN' && '🔐 Administrator'}
                                </div>
                            </div>
                        </div>

                        <div className="profile-details">
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <FaUser />
                                </div>
                                <div className="detail-content">
                                    <label>Full Name</label>
                                    <p>{user.full_name}</p>
                                </div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-icon">
                                    <FaEnvelope />
                                </div>
                                <div className="detail-content">
                                    <label>Email Address</label>
                                    <p>{user.email}</p>
                                    {user.is_verified ? (
                                        <span className="verified-badge">✓ Verified</span>
                                    ) : (
                                        <span className="unverified-badge">⚠ Not Verified</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-icon">
                                    <FaMapMarkerAlt />
                                </div>
                                <div className="detail-content">
                                    <label>Address</label>
                                    <p>{user.address || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-icon">
                                    <FaBirthdayCake />
                                </div>
                                <div className="detail-content">
                                    <label>Age & Birthdate</label>
                                    <p>
                                        {user.age} years old
                                        {user.birthdate && ` • ${new Date(user.birthdate).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card role-card">
                        <h3>Role-Specific Information</h3>
                        
                        {user.user_type === 'INVENTOR' && user.delivery_unit && (
                            <div className="role-info">
                                <div className="info-badge">
                                    <strong>Delivery Unit:</strong>
                                    <span className="badge-value">{user.delivery_unit}</span>
                                </div>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <div className="stat-value">{user.total_submissions || 0}</div>
                                        <div className="stat-label">Total Submissions</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{user.approved_submissions || 0}</div>
                                        <div className="stat-label">Approved</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{user.pending_submissions || 0}</div>
                                        <div className="stat-label">Pending</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user.user_type === 'CONSULTANT' && user.ip_category && (
                            <div className="role-info">
                                <div className="info-badge">
                                    <strong>IP Category:</strong>
                                    <span className="badge-value">
                                        {user.ip_category.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <div className="stat-value">{user.total_reviews || 0}</div>
                                        <div className="stat-label">Total Reviews</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{user.approved_reviews || 0}</div>
                                        <div className="stat-label">Approved</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{user.rejected_reviews || 0}</div>
                                        <div className="stat-label">Rejected</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user.user_type === 'ADMIN' && (
                            <div className="role-info">
                                <div className="info-badge">
                                    <strong>Admin Level:</strong>
                                    <span className="badge-value">{user.admin_level || 'ADMIN'}</span>
                                </div>
                                {user.department && (
                                    <div className="info-badge">
                                        <strong>Department:</strong>
                                        <span className="badge-value">{user.department}</span>
                                    </div>
                                )}
                                <div className="admin-note">
                                    <p>🔐 You have full administrative access to the system</p>
                                </div>
                            </div>
                        )}

                        <div className="account-info">
                            <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                            {user.last_login && (
                                <p><strong>Last Login:</strong> {new Date(user.last_login).toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;