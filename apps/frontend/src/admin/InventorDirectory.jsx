import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Directory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function InventorDirectory() {
    const [inventors, setInventors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInventor, setSelectedInventor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchInventors();
    }, []);

    const fetchInventors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/inventors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventors(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching inventors:', err);
            setError('Failed to load inventors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (inventor) => {
        setSelectedInventor(inventor);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedInventor(null);
    };

    const handleToggleAccess = (inventor) => {
        setUserToToggle(inventor);
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

            // Update local state
            setInventors(inventors.map(inv => 
                inv.id === userToToggle.id 
                    ? { ...inv, status: newStatus, is_active: newStatus === 'active' }
                    : inv
            ));

            setShowDeactivateModal(false);
            setUserToToggle(null);
            alert(`User access ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        } catch (err) {
            console.error('Error toggling access:', err);
            alert('Failed to change user access. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const cancelToggleAccess = () => {
        setShowDeactivateModal(false);
        setUserToToggle(null);
    };

    const filteredInventors = inventors.filter(inventor =>
        inventor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventor.delivery_unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventor.contact?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="directory-container">
                <div className="directory-container-inner">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Inventors...</p>
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
                    <button onClick={fetchInventors} className="btn-retry">
                        Retry
                    </button>
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
                    <h2>
                        <i className="bi bi-people"></i> Inventor Directory
                    </h2>
                    <p className="subtitle">Complete list of all registered inventors</p>
                </div>
                <div className="header-right">
                    <button onClick={fetchInventors} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <i className="bi bi-search"></i>
                <input
                    type="text"
                    placeholder="Search by name, email, delivery unit, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{inventors.length}</h3>
                        <p>Total Inventors</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{inventors.filter(i => i.status === 'active').length}</h3>
                        <p>Active Users</p>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="table-container">
                {filteredInventors.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>No inventors found</p>
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
                                <th>User Type</th>
                                <th>Delivery Unit</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventors.map((inventor, index) => (
                                <tr key={inventor.id || index} className={inventor.status === 'inactive' ? 'inactive-row' : ''}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <img
                                            src={inventor.profile_picture 
                                                ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${inventor.profile_picture}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(inventor.full_name || 'U')}&background=1e3a8a&color=fff&size=40`
                                            }
                                            alt={inventor.full_name}
                                            className="profile-thumb"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(inventor.full_name || 'U')}&background=1e3a8a&color=fff&size=40`;
                                            }}
                                        />
                                    </td>
                                    <td>{inventor.full_name}</td>
                                    <td>{inventor.email}</td>
                                    <td>
                                        {inventor.contact ? (
                                            <a href={`tel:${inventor.contact}`} className="contact-link">
                                                <i className="bi bi-telephone"></i> {inventor.contact}
                                            </a>
                                        ) : (
                                            <span className="no-data-text">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="user-type-badge inventor">
                                            <i className="bi bi-person-fill"></i>
                                            INVENTOR
                                        </span>
                                    </td>
                                    <td>{inventor.delivery_unit || 'N/A'}</td>
                                    <td>
                                        {inventor.created_at 
                                            ? new Date(inventor.created_at).toLocaleDateString('en-US', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                            : 'N/A'
                                        }
                                    </td>
                                    <td>
                                        <span className={`status-badge ${inventor.status === 'active' ? 'active' : 'inactive'}`}>
                                            {inventor.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                onClick={() => handleViewProfile(inventor)}
                                                className="btn-view"
                                                title="View Profile"
                                            >
                                                <i className="bi bi-eye"></i> View
                                            </button>
                                            <button 
                                                onClick={() => handleToggleAccess(inventor)}
                                                className={`btn-toggle ${inventor.status === 'active' ? 'deactivate' : 'activate'}`}
                                                title={inventor.status === 'active' ? 'Deactivate Access' : 'Activate Access'}
                                            >
                                                <i className={`bi ${inventor.status === 'active' ? 'bi-lock' : 'bi-unlock'}`}></i>
                                                {inventor.status === 'active' ? 'Deactivate' : 'Activate'}
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

            {/* Modern Profile Modal */}
            {showModal && selectedInventor && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content modern-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        {/* Modal Header with Gradient */}
                        <div className="modern-profile-header">
                            <div className="profile-header-bg"></div>
                            <div className="profile-header-content">
                                <img
                                    src={selectedInventor.profile_picture 
                                        ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${selectedInventor.profile_picture}`
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInventor.full_name || 'U')}&background=1e3a8a&color=fff&size=120`
                                    }
                                    alt={selectedInventor.full_name}
                                    className="modern-profile-image"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInventor.full_name || 'U')}&background=1e3a8a&color=fff&size=120`;
                                    }}
                                />
                                <h2>{selectedInventor.full_name}</h2>
                                <span className="user-type-badge inventor large">
                                    <i className="bi bi-person-fill"></i>
                                    Inventor
                                </span>
                            </div>
                        </div>

                        {/* Profile Details Grid */}
                        <div className="modern-profile-body">
                            <div className="detail-grid">
                                <div className="detail-card">
                                    <div className="detail-icon email">
                                        <i className="bi bi-envelope-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Email Address</label>
                                        <p>{selectedInventor.email || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon phone">
                                        <i className="bi bi-telephone-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Contact Number</label>
                                        <p>{selectedInventor.contact || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon building">
                                        <i className="bi bi-building"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Delivery Unit</label>
                                        <p>{selectedInventor.delivery_unit || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon briefcase">
                                        <i className="bi bi-briefcase-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Position</label>
                                        <p>{selectedInventor.position || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card full-width">
                                    <div className="detail-icon location">
                                        <i className="bi bi-geo-alt-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Address</label>
                                        <p>{selectedInventor.address || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon calendar">
                                        <i className="bi bi-calendar-event"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Age</label>
                                        <p>{selectedInventor.age || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon birthday">
                                        <i className="bi bi-gift-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Birthdate</label>
                                        <p>{selectedInventor.birthdate 
                                            ? new Date(selectedInventor.birthdate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'Not provided'
                                        }</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon joined">
                                        <i className="bi bi-calendar-plus-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Joined Date</label>
                                        <p>{selectedInventor.created_at 
                                            ? new Date(selectedInventor.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'Not provided'
                                        }</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon status">
                                        <i className="bi bi-activity"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Account Status</label>
                                        <span className={`status-badge ${selectedInventor.status === 'active' ? 'active' : 'inactive'}`}>
                                            {selectedInventor.status === 'active' ? (
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
                                <i className="bi bi-x-circle"></i>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default InventorDirectory;