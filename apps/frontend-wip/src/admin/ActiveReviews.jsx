import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function ActiveReviews() {
    const [activeProjects, setActiveProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchActiveProjects();
    }, []);

    const fetchActiveProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/active-reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveProjects(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching active projects:', err);
            setError('Failed to load active reviews. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (project) => {
        setSelectedProject(project);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProject(null);
    };

    // Filter projects (Fixed Crash Issue here)
    const filteredProjects = activeProjects.filter(project => {
        const title = project.title || '';
        const deliveryUnit = project.delivery_unit || '';
        
        const matchesSearch = 
            title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deliveryUnit.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || project.ip_type === filterType;

        return matchesSearch && matchesType;
    });

    // Group by status
    const underReview = filteredProjects.filter(p => p.status === 'Under Review');
    const needsRevision = filteredProjects.filter(p => p.status === 'Revision Required');

    if (loading) {
        return (
            <div className="project-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Active Reviews...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-container">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchActiveProjects} className="btn-retry">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="project-container">
            {/* Header */}
            <div className="project-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-clipboard-check"></i> Active Project Reviews
                    </h2>
                    <p className="subtitle">Monitor ongoing evaluations</p>
                </div>
                <div className="header-right">
                    <button onClick={fetchActiveProjects} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-row">
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search by title or delivery unit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-group">
                    <label>
                        <i className="bi bi-funnel"></i> IP Type:
                    </label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="ID">Industrial Design</option>
                        <option value="TM">Trademark</option>
                        <option value="CR">Copyright</option>
                        <option value="UM">Utility Model</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{underReview.length}</h3>
                        <p>Under Review</p>
                    </div>
                </div>
                <div className="stat-card revision">
                    <div className="stat-icon">
                        <i className="bi bi-arrow-repeat"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{needsRevision.length}</h3>
                        <p>Needs Revision</p>
                    </div>
                </div>
                <div className="stat-card total">
                    <div className="stat-icon">
                        <i className="bi bi-files"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{filteredProjects.length}</h3>
                        <p>Total Active</p>
                    </div>
                </div>
            </div>

            {/* Projects Table */}
            <div className="table-container">
                {filteredProjects.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>No active reviews found</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>IP Type</th>
                                <th>Title</th>
                                <th>Delivery Unit</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>Days Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map((project, index) => {
                                const statusClass = (project.status || '').toLowerCase().replace(/\s+/g, '-');
                                const typeClass = (project.ip_type || '').toLowerCase();
                                
                                return (
                                    <tr key={project.id || index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <span className={`type-badge ${typeClass}`}>
                                                {project.ip_type}
                                            </span>
                                        </td>
                                        <td className="title-cell">{project.title || 'N/A'}</td>
                                        <td>{project.delivery_unit || 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`}>
                                                {project.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>{project.submission_date ? new Date(project.submission_date).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <span className="days-badge">
                                                {project.days_active || 0} days
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleViewDetails(project)}
                                                className="btn-view"
                                                title="View Details"
                                            >
                                                <i className="bi bi-eye"></i> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Details Modal */}
            {showModal && selectedProject && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content project-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="modal-header">
                            <span className={`type-badge-large ${(selectedProject.ip_type || '').toLowerCase()}`}>
                                {selectedProject.ip_type}
                            </span>
                            <h2>{selectedProject.title || 'Untitled'}</h2>
                            <span className={`status-badge ${(selectedProject.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                                {selectedProject.status}
                            </span>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <h3><i className="bi bi-person"></i> Applicant Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Name:</label>
                                        <p>{selectedProject.applicant_name || 'N/A'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email:</label>
                                        <p>{selectedProject.applicant_email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3><i className="bi bi-clock-history"></i> Timeline</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Submitted:</label>
                                        <p>{selectedProject.submission_date ? new Date(selectedProject.submission_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Assigned:</label>
                                        <p>{selectedProject.assigned_date ? new Date(selectedProject.assigned_date).toLocaleDateString() : 'Not yet assigned'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Days Active:</label>
                                        <p><strong>{selectedProject.days_active || 0} days</strong></p>
                                    </div>
                                </div>
                            </div>

                            {selectedProject.comments && (
                                <div className="detail-section">
                                    <h3><i className="bi bi-chat-left-text"></i> Description</h3>
                                    <div className="comments-box">
                                        {selectedProject.comments}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActiveReviews;