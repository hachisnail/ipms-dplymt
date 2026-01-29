import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function FinalizedProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDeliveryUnit, setFilterDeliveryUnit] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchFinalizedProjects();
    }, []);

    const fetchFinalizedProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/finalized-projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching finalized projects:', err);
            setError('Failed to load finalized projects. Please try again.');
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

    const handleExport = () => {
        const csvData = filteredProjects.map(p => ({
            'IP Type': p.ip_type,
            'Title': p.title,
            'Delivery Unit': p.delivery_unit || 'N/A',
            'Applicant': p.applicant_name,
            'Status': p.status,
            'Finalized Date': p.finalized_date ? new Date(p.finalized_date).toLocaleDateString() : 'N/A',
            'Result': p.final_result,
            'Duration': `${p.duration_days || 0} days`
        }));

        const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finalized-projects-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Get unique delivery units for filter
    const deliveryUnits = ['all', ...new Set(projects.map(p => p.delivery_unit).filter(Boolean))];

    // Filter projects
    const filteredProjects = projects.filter(project => {
        const matchesSearch = 
            project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.delivery_unit?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || project.ip_type === filterType;
        const matchesStatus = filterStatus === 'all' || project.final_result === filterStatus;
        const matchesDeliveryUnit = filterDeliveryUnit === 'all' || project.delivery_unit === filterDeliveryUnit;

        let matchesDate = true;
        if (dateRange.start && project.finalized_date) {
            matchesDate = matchesDate && new Date(project.finalized_date) >= new Date(dateRange.start);
        }
        if (dateRange.end && project.finalized_date) {
            matchesDate = matchesDate && new Date(project.finalized_date) <= new Date(dateRange.end);
        }

        return matchesSearch && matchesType && matchesStatus && matchesDeliveryUnit && matchesDate;
    });

    // Group by result
    const approved = filteredProjects.filter(p => p.final_result === 'Approved');
    const rejected = filteredProjects.filter(p => p.final_result === 'Rejected');

    // Group by delivery unit
    const projectsByUnit = filteredProjects.reduce((acc, project) => {
        const unit = project.delivery_unit || 'Not Specified';
        if (!acc[unit]) acc[unit] = 0;
        acc[unit]++;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="project-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Finalized Projects...</p>
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
                    <button onClick={fetchFinalizedProjects} className="btn-retry">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="project-container">
            <div className="project-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-check-circle"></i> Finalized Projects
                    </h2>
                    <p className="subtitle">Review all completed IP applications</p>
                </div>
                <div className="header-right">
                    <button onClick={handleExport} className="btn-export">
                        <i className="bi bi-download"></i> Export CSV
                    </button>
                    <button onClick={fetchFinalizedProjects} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-container">
                <div className="filters-row">
                    <div className="search-bar">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by title, applicant, or delivery unit..."
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

                    <div className="filter-group">
                        <label>
                            <i className="bi bi-building"></i> Delivery Unit:
                        </label>
                        <select value={filterDeliveryUnit} onChange={(e) => setFilterDeliveryUnit(e.target.value)}>
                            <option value="all">All Units</option>
                            {deliveryUnits.filter(u => u !== 'all').map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>
                            <i className="bi bi-check-circle"></i> Result:
                        </label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Results</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="date-filter-row">
                    <div className="filter-group">
                        <label>
                            <i className="bi bi-calendar"></i> From Date:
                        </label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label>
                            <i className="bi bi-calendar"></i> To Date:
                        </label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    {(dateRange.start || dateRange.end) && (
                        <button 
                            className="btn-clear-dates"
                            onClick={() => setDateRange({ start: '', end: '' })}
                        >
                            <i className="bi bi-x-circle"></i> Clear Dates
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card approved">
                    <div className="stat-icon">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{approved.length}</h3>
                        <p>Approved</p>
                    </div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-icon">
                        <i className="bi bi-x-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{rejected.length}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
                <div className="stat-card total">
                    <div className="stat-icon">
                        <i className="bi bi-files"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{filteredProjects.length}</h3>
                        <p>Total Finalized</p>
                    </div>
                </div>
                <div className="stat-card rate">
                    <div className="stat-icon">
                        <i className="bi bi-percent"></i>
                    </div>
                    <div className="stat-content">
                        <h3>
                            {filteredProjects.length > 0 
                                ? Math.round((approved.length / filteredProjects.length) * 100) 
                                : 0}%
                        </h3>
                        <p>Approval Rate</p>
                    </div>
                </div>
            </div>

            {/* Projects Table */}
            <div className="table-container">
                {filteredProjects.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>No finalized projects found</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>IP Type</th>
                                <th>Title</th>
                                <th>Applicant</th>
                                <th>Delivery Unit</th>
                                <th>Result</th>
                                <th>Finalized Date</th>
                                <th>Duration</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map((project, index) => (
                                <tr key={project.id || index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <span className={`type-badge ${project.ip_type?.toLowerCase()}`}>
                                            {project.ip_type}
                                        </span>
                                    </td>
                                    <td className="title-cell">{project.title || 'N/A'}</td>
                                    <td>{project.applicant_name || 'N/A'}</td>
                                    <td>
                                        <span className="delivery-unit-badge">
                                            <i className="bi bi-building"></i>
                                            {project.delivery_unit || 'Not Specified'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`result-badge ${project.final_result?.toLowerCase()}`}>
                                            {project.final_result === 'Approved' && <i className="bi bi-check-circle"></i>}
                                            {project.final_result === 'Rejected' && <i className="bi bi-x-circle"></i>}
                                            {project.final_result}
                                        </span>
                                    </td>
                                    <td>{project.finalized_date ? new Date(project.finalized_date).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <span className="duration-badge">
                                            <i className="bi bi-clock-history"></i>
                                            {project.duration_days || 0} days
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
                            ))}
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
                            <div className="modal-header-badges">
                                <span className={`type-badge-large ${selectedProject.ip_type?.toLowerCase()}`}>
                                    {selectedProject.ip_type}
                                </span>
                                <span className="delivery-unit-badge-large">
                                    <i className="bi bi-building"></i>
                                    {selectedProject.delivery_unit || 'Not Specified'}
                                </span>
                            </div>
                            <h2>{selectedProject.title}</h2>
                            <span className={`result-badge-large ${selectedProject.final_result?.toLowerCase()}`}>
                                {selectedProject.final_result === 'Approved' && <i className="bi bi-check-circle-fill"></i>}
                                {selectedProject.final_result === 'Rejected' && <i className="bi bi-x-circle-fill"></i>}
                                {selectedProject.final_result}
                            </span>
                        </div>

                        <div className="modal-body">
                            {/* Project Origin Section - NEW */}
                            <div className="detail-section origin-section">
                                <h3><i className="bi bi-geo-alt-fill"></i> Project Origin</h3>
                                <div className="origin-card">
                                    <div className="origin-icon">
                                        <i className="bi bi-building"></i>
                                    </div>
                                    <div className="origin-content">
                                        <label>Delivery Unit / Department</label>
                                        <h4>{selectedProject.delivery_unit || 'Not Specified'}</h4>
                                        <p>This project originated from the {selectedProject.delivery_unit || 'specified department'}</p>
                                    </div>
                                </div>
                            </div>

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
                                        <label>Finalized:</label>
                                        <p>{selectedProject.finalized_date ? new Date(selectedProject.finalized_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Total Duration:</label>
                                        <p><strong>{selectedProject.duration_days || 0} days</strong></p>
                                    </div>
                                </div>
                            </div>

                            {selectedProject.final_comments && (
                                <div className="detail-section">
                                    <h3><i className="bi bi-chat-left-text"></i> Final Comments</h3>
                                    <div className="comments-box">
                                        {selectedProject.final_comments}
                                    </div>
                                </div>
                            )}

                            {selectedProject.rejection_reason && (
                                <div className="detail-section rejection">
                                    <h3><i className="bi bi-exclamation-triangle"></i> Rejection Reason</h3>
                                    <div className="rejection-box">
                                        {selectedProject.rejection_reason}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-secondary">
                                <i className="bi bi-x-circle"></i>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FinalizedProjects;