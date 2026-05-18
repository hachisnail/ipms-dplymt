import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Directory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function SpecialistDirectory() {
    const [specialists, setSpecialists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSpecialist, setSelectedSpecialist] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpertise, setFilterExpertise] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchSpecialists();
    }, []);

    const fetchSpecialists = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/consultants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSpecialists(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching specialists:', err);
            setError('Failed to load specialists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (specialist) => {
        setSelectedSpecialist(specialist);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSpecialist(null);
    };

    const handleToggleAccess = (specialist) => {
        setUserToToggle(specialist);
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

            setSpecialists(specialists.map(spec => 
                spec.id === userToToggle.id 
                    ? { ...spec, status: newStatus, is_active: newStatus === 'active' }
                    : spec
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

    const expertiseAreas = ['all', ...new Set(specialists.map(s => s.expertise_area || s.specialization || s.ip_category).filter(Boolean))];

    const filteredSpecialists = specialists.filter(specialist => {
        const matchesSearch = 
            specialist.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialist.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialist.contact?.includes(searchTerm) ||
            specialist.expertise_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialist.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialist.ip_category?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesExpertise = filterExpertise === 'all' || 
            specialist.expertise_area === filterExpertise ||
            specialist.specialization === filterExpertise ||
            specialist.ip_category === filterExpertise;
        
        return matchesSearch && matchesExpertise;
    });

    const activeSpecialists = specialists.filter(s => s.status === 'active' || s.is_active).length;

    if (loading) {
        return (
            <div className="directory-container">
                <div className="directory-container-inner">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Specialists...</p>
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
                    <button onClick={fetchSpecialists} className="btn-retry">
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
                        <i className="bi bi-award"></i> Specialist Directory
                    </h2>
                    <p className="subtitle">Complete list of all IP consultants and specialists</p>
                </div>
                <div className="header-right">
                    <button onClick={fetchSpecialists} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            <div className="filters-row">
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search by name, email, contact, or expertise..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-group">
                    <label>
                        <i className="bi bi-funnel"></i>
                        Filter by Expertise:
                    </label>
                    <select
                        value={filterExpertise}
                        onChange={(e) => setFilterExpertise(e.target.value)}
                    >
                        {expertiseAreas.map(area => (
                            <option key={area} value={area}>
                                {area === 'all' ? 'All Expertise' : area}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{specialists.length}</h3>
                        <p>Total Specialists</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{activeSpecialists}</h3>
                        <p>Active Specialists</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon expertise">
                        <i className="bi bi-award-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{expertiseAreas.length - 1}</h3>
                        <p>Expertise Areas</p>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {filteredSpecialists.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>No specialists found</p>
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
                                <th>Expertise Area</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSpecialists.map((specialist, index) => (
                                <tr key={specialist.id || index} className={specialist.status === 'inactive' ? 'inactive-row' : ''}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <img
                                            src={specialist.profile_picture 
                                                ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${specialist.profile_picture}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(specialist.full_name || 'U')}&background=0f766e&color=fff&size=40`
                                            }
                                            alt={specialist.full_name}
                                            className="profile-thumb"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(specialist.full_name || 'U')}&background=0f766e&color=fff&size=40`;
                                            }}
                                        />
                                    </td>
                                    <td>{specialist.full_name || 'N/A'}</td>
                                    <td>{specialist.email || 'N/A'}</td>
                                    <td>
                                        {specialist.contact ? (
                                            <a href={`tel:${specialist.contact}`} className="contact-link">
                                                <i className="bi bi-telephone"></i> {specialist.contact}
                                            </a>
                                        ) : (
                                            <span className="no-data-text">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="user-type-badge consultant">
                                            <i className="bi bi-award"></i>
                                            CONSULTANT
                                        </span>
                                    </td>
                                    <td>
                                        <span className="expertise-badge">
                                            <i className="bi bi-patch-check-fill"></i>
                                            {specialist.expertise_area || specialist.specialization || specialist.ip_category || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        {specialist.created_at 
                                            ? new Date(specialist.created_at).toLocaleDateString('en-US', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                            : 'N/A'
                                        }
                                    </td>
                                    <td>
                                        <span className={`status-badge ${specialist.status === 'active' ? 'active' : 'inactive'}`}>
                                            {specialist.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleViewProfile(specialist)}
                                                className="btn-view"
                                                title="View Profile"
                                            >
                                                <i className="bi bi-eye"></i> View
                                            </button>
                                            <button 
                                                onClick={() => handleToggleAccess(specialist)}
                                                className={`btn-toggle ${specialist.status === 'active' ? 'deactivate' : 'activate'}`}
                                                title={specialist.status === 'active' ? 'Deactivate Access' : 'Activate Access'}
                                            >
                                                <i className={`bi ${specialist.status === 'active' ? 'bi-lock' : 'bi-unlock'}`}></i>
                                                {specialist.status === 'active' ? 'Deactivate' : 'Activate'}
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
            {showModal && selectedSpecialist && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content modern-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="modern-profile-header">
                            <div className="profile-header-bg"></div>
                            <div className="profile-header-content">
                                <img
                                    src={selectedSpecialist.profile_picture 
                                        ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${selectedSpecialist.profile_picture}`
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSpecialist.full_name || 'U')}&background=0f766e&color=fff&size=120`
                                    }
                                    alt={selectedSpecialist.full_name}
                                    className="modern-profile-image"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSpecialist.full_name || 'U')}&background=0f766e&color=fff&size=120`;
                                    }}
                                />
                                <h2>{selectedSpecialist.full_name}</h2>
                                <span className="user-type-badge consultant large">
                                    <i className="bi bi-award"></i>
                                    Consultant
                                </span>
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
                                        <p>{selectedSpecialist.email || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon phone">
                                        <i className="bi bi-telephone-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Contact Number</label>
                                        <p>{selectedSpecialist.contact || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon building">
                                        <i className="bi bi-award-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Expertise Area</label>
                                        <p>{selectedSpecialist.expertise_area || selectedSpecialist.specialization || selectedSpecialist.ip_category || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon briefcase">
                                        <i className="bi bi-briefcase-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>About</label>
                                        <p>{selectedSpecialist.about || 'No information provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card full-width">
                                    <div className="detail-icon location">
                                        <i className="bi bi-geo-alt-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Address</label>
                                        <p>{selectedSpecialist.address || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon calendar">
                                        <i className="bi bi-calendar-event"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Age</label>
                                        <p>{selectedSpecialist.age || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="detail-icon birthday">
                                        <i className="bi bi-gift-fill"></i>
                                    </div>
                                    <div className="detail-content">
                                        <label>Birthdate</label>
                                        <p>
                                            {selectedSpecialist.birthdate
                                                ? new Date(selectedSpecialist.birthdate).toLocaleDateString('en-US', {
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
                                            {selectedSpecialist.created_at
                                                ? new Date(selectedSpecialist.created_at).toLocaleDateString('en-US', {
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
                                        <span className={`status-badge ${selectedSpecialist.status === 'active' ? 'active' : 'inactive'}`}>
                                            {selectedSpecialist.status === 'active' ? (
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

export default SpecialistDirectory;