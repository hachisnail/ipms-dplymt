import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Directory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function AdminDirectory() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/users/approved`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only ADMIN users from the approved users list
            const allApproved = response.data.data || [];
            const adminUsers = allApproved.filter(user => user.user_type === 'ADMIN');
            setAdmins(adminUsers);
            setError(null);
        } catch (err) {
            console.error('Error fetching admins:', err);
            setError('Failed to load administrators. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (admin) => {
        setSelectedAdmin(admin);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAdmin(null);
    };

    const handleToggleAccess = (admin) => {
        setUserToToggle(admin);
        setShowDeactivateModal(true);
    };

    const confirmToggleAccess = async () => {
        if (!userToToggle) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const newStatus = userToToggle.status === 'active' ? 'inactive' : 'active';
            
            await axios.put(
                `${API_URL}/admin/users/${userToToggle.id}/toggle-access`,
                { is_active: newStatus === 'active' },
                { headers: { Authorization: `Bearer ${token}` }}
            );

            setAdmins(admins.map(admin => 
                admin.id === userToToggle.id 
                    ? { ...admin, status: newStatus, is_active: newStatus === 'active' }
                    : admin
            ));

            setShowDeactivateModal(false);
            setUserToToggle(null);
            alert(`User access ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        } catch (err) {
            console.error('Error toggling access:', err);
            alert(err.response?.data?.message || 'Failed to change user access. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const cancelToggleAccess = () => {
        setShowDeactivateModal(false);
        setUserToToggle(null);
    };

    const adminLevels = ['all', ...new Set(admins.map(a => a.admin_level).filter(Boolean))];

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch =
            admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.admin_level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.contact?.includes(searchTerm);

        const matchesLevel = filterLevel === 'all' || admin.admin_level === filterLevel;

        return matchesSearch && matchesLevel;
    });

    if (loading) {
        return (
            <div className="directory-container">
                <div className="directory-container-inner">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Administrators...</p>
                </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="directory-container">
                <div className="directory-container-inner">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchAdmins} className="btn-retry">Retry</button>
                </div>
                </div>
            </div>
        );
    }

    return (
        <div className="directory-container">
            <div className="directory-container-inner">
            <div className="directory-header">
                <div className="header-left">
                    <h2><i className="bi bi-shield-lock-fill"></i> Admin Directory</h2>
                    <p className="subtitle">Complete list of all registered administrators</p>
                </div>
                <div className="header-right">
                    <button onClick={fetchAdmins} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            <div className="filters-row">
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label><i className="bi bi-funnel"></i> Filter by Level:</label>
                    <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                        {adminLevels.map(level => (
                            <option key={level} value={level}>
                                {level === 'all' ? 'All Levels' : level}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon admin-icon">
                        <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{admins.length}</h3>
                        <p>Total Admins</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{admins.filter(a => a.status === 'active').length}</h3>
                        <p>Active Admins</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon admin-levels-icon">
                        <i className="bi bi-shield-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{adminLevels.length - 1 || 0}</h3>
                        <p>Admin Levels</p>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {filteredAdmins.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>No administrators found</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Profile</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Contact</th>
                                <th>Admin Level</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.map((admin, index) => (
                                <tr key={admin.id || index} className={admin.status === 'inactive' ? 'inactive-row' : ''}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <img
                                            src={admin.profile_picture 
                                                ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${admin.profile_picture}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.full_name || 'A')}&background=800020&color=fff&size=40`
                                            }
                                            alt={admin.full_name}
                                            className="profile-thumb"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.full_name || 'A')}&background=800020&color=fff&size=40`;
                                            }}
                                        />
                                    </td>
                                    <td>{admin.full_name}</td>
                                    <td>{admin.email}</td>
                                    <td>
                                        {admin.contact ? (
                                            <a href={`tel:${admin.contact}`} className="contact-link">
                                                <i className="bi bi-telephone"></i> {admin.contact}
                                            </a>
                                        ) : (
                                            <span className="no-data-text">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="level-badge">
                                            <i className="bi bi-shield-fill"></i> {admin.admin_level || 'ADMIN'}
                                        </span>
                                    </td>
                                    <td>
                                        {admin.created_at 
                                            ? new Date(admin.created_at).toLocaleDateString('en-US', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                            : 'N/A'
                                        }
                                    </td>
                                    <td>
                                        <span className={`status-badge ${admin.status === 'active' ? 'active' : 'inactive'}`}>
                                            {admin.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                onClick={() => handleViewProfile(admin)}
                                                className="btn-view"
                                                title="View Profile"
                                            >
                                                <i className="bi bi-eye"></i> View
                                            </button>
                                            <button 
                                                onClick={() => handleToggleAccess(admin)}
                                                className={`btn-toggle ${admin.status === 'active' ? 'deactivate' : 'activate'}`}
                                                title={admin.status === 'active' ? 'Deactivate Access' : 'Activate Access'}
                                            >
                                                <i className={`bi ${admin.status === 'active' ? 'bi-lock' : 'bi-unlock'}`}></i>
                                                {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Deactivate/Activate Confirmation Modal */}
            {showDeactivateModal && userToToggle && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <div className="logout-modal-icon">
                            <i className={`bi ${userToToggle.status === 'active' ? 'bi-lock-fill' : 'bi-unlock-fill'}`}></i>
                        </div>
                        <h3>
                            {userToToggle.status === 'active' ? 'Deactivate User Access' : 'Activate User Access'}
                        </h3>
                        <p>
                            Are you sure you want to {userToToggle.status === 'active' ? 'deactivate' : 'activate'} access for <strong>{userToToggle.full_name}</strong>?
                            <br/>
                            {userToToggle.status === 'active' 
                                ? 'The user will not be able to log in, but their data will remain in the system.' 
                                : 'The user will be able to log in and access the system again.'}
                        </p>
                        <div className="logout-modal-buttons">
                            <button 
                                className="btn-cancel"
                                onClick={cancelToggleAccess}
                                disabled={actionLoading}
                            >
                                No, Cancel
                            </button>
                            <button 
                                className={`btn-confirm ${userToToggle.status === 'active' ? 'deactivate' : 'activate'}`}
                                onClick={confirmToggleAccess}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : `Yes, ${userToToggle.status === 'active' ? 'Deactivate' : 'Activate'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showModal && selectedAdmin && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content modern-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="modern-profile-header">
                            <div className="profile-header-bg"></div>
                            <div className="profile-header-content">
                                <img
                                    src={selectedAdmin.profile_picture 
                                        ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${selectedAdmin.profile_picture}`
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAdmin.full_name || 'A')}&background=800020&color=fff&size=120`
                                    }
                                    alt={selectedAdmin.full_name}
                                    className="modern-profile-image"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAdmin.full_name || 'A')}&background=800020&color=fff&size=120`;
                                    }}
                                />
                                <h2>{selectedAdmin.full_name}</h2>
                                <span className="user-type-badge admin large">
                                    <i className="bi bi-shield-lock-fill"></i>
                                    Administrator
                                </span>
                                {selectedAdmin.admin_level && (
                                    <span className="level-badge large">
                                        <i className="bi bi-patch-check-fill"></i>
                                        {selectedAdmin.admin_level}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="modern-profile-body">
                            <div className="detail-grid">
                                <div className="detail-card">
                                    <div className="detail-icon email">
                                        <i className="bi bi-envelope-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Email Address</label>
                                        <p>{selectedAdmin.email || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon phone">
                                        <i className="bi bi-telephone-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Contact Number</label>
                                        <p>{selectedAdmin.contact || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon admin-level">
                                        <i className="bi bi-shield-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Admin Level</label>
                                        <p>{selectedAdmin.admin_level || 'Not specified'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon building">
                                        <i className="bi bi-building"></i>
                                    </div>
                                </div>

                                <div className="detail-card full-width">
                                    <div className="detail-icon location">
                                        <i className="bi bi-geo-alt-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Address</label>
                                        <p>{selectedAdmin.address || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon calendar">
                                        <i className="bi bi-calendar-event"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Age</label>
                                        <p>{selectedAdmin.age || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon birthday">
                                        <i className="bi bi-gift-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Birthdate</label>
                                        <p>
                                            {selectedAdmin.birthdate
                                                ? new Date(selectedAdmin.birthdate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon joined">
                                        <i className="bi bi-calendar-plus-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Joined Date</label>
                                        <p>
                                            {selectedAdmin.created_at
                                                ? new Date(selectedAdmin.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon status">
                                        <i className="bi bi-activity"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Account Status</label>
                                        <span className={`status-badge ${selectedAdmin.status === 'active' ? 'active' : 'inactive'}`}>
                                            {selectedAdmin.status === 'active' ? (
                                                <><i className="bi bi-check-circle-fill"></i> Active</>
                                            ) : (
                                                <><i className="bi bi-x-circle-fill"></i> Inactive</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-close-modal">
                                <i className="bi bi-x-circle"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default AdminDirectory;