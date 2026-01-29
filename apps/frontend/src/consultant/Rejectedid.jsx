import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TableView.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const RejectedRow = ({ project }) => {
    return (
        <tr>
            <td data-label="ID">{project.id}</td>
            <td data-label="Title">{project.title}</td>
            <td data-label="Description">{project.description}</td>
            <td data-label="Status">
                <span className="status-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                    {project.status}
                </span>
            </td>
            <td data-label="Design Type">{project.design_type || 'N/A'}</td>
            <td data-label="Rejection Date">
                {project.approval_date ? new Date(project.approval_date).toLocaleDateString() : 'N/A'}
            </td>
            <td data-label="Rejection Reason">
                <span style={{ color: '#dc2626', fontSize: '13px' }}>
                    {project.rejection_reason || 'No reason provided'}
                </span>
            </td>
            <td data-label="Image">
                {project.design_image_path ? (
                    <img
                        src={`${API_BASE_URL.replace('/api', '')}/uploads/${project.design_image_path}`}
                        alt="Design"
                        className="table-image"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/54?text=No+Image';
                        }}
                    />
                ) : (
                    <span className="no-data">No image</span>
                )}
            </td>
            <td data-label="PDF File">
                {project.official_form_path ? (
                    <a
                        href={`${API_BASE_URL.replace('/api', '')}/uploads/${project.official_form_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-link"
                        download
                    >
                        <i className="bi bi-file-earmark-pdf me-1"></i>View PDF
                    </a>
                ) : (
                    <span className="no-data">No file</span>
                )}
            </td>
        </tr>
    );
};

const Rejectedid = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubmissions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/id-submissions-rejected`);
            console.log('✅ Fetched Rejected ID submissions:', response.data);
            setSubmissions(response.data);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError('Failed to fetch Rejected Industrial Design submissions.');
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const safeFetchSubmissions = async () => {
            if (isMounted) {
                await fetchSubmissions();
            }
        };
        safeFetchSubmissions();
        const interval = setInterval(safeFetchSubmissions, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (loading) {
        return (
            <div className="Table-container">
                <div className="loader">
                    <div className="spinner"></div>
                    <p>Loading submissions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="Table-container">
                <div className="error-message">❌ {error}</div>
            </div>
        );
    }

    return (
        <div className="Table-container">
            <h2>
                <i className="bi bi-x-circle me-2" aria-hidden="true" style={{ color: '#dc2626' }}></i>
                Rejected Submissions - Industrial Design
            </h2>

            {submissions.length === 0 ? (
                <div className="error-message" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <i className="bi bi-check-circle me-2"></i>
                    No rejected Industrial Design submissions found. All submissions are in good standing!
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="responsive-table">
                            <thead>
                                <tr>
                                    <th><i className="bi bi-hash me-1" aria-hidden="true"></i>ID</th>
                                    <th><i className="bi bi-envelope me-1" aria-hidden="true"></i>TITLE</th>
                                    <th><i className="bi bi-file-text me-1" aria-hidden="true"></i>DESCRIPTION</th>
                                    <th><i className="bi bi-tag me-1" aria-hidden="true"></i>STATUS</th>
                                    <th><i className="bi bi-brush me-1" aria-hidden="true"></i>DESIGN TYPE</th>
                                    <th><i className="bi bi-calendar me-1" aria-hidden="true"></i>REJECTION DATE</th>
                                    <th><i className="bi bi-chat-dots me-1" aria-hidden="true"></i>REJECTION REASON</th>
                                    <th><i className="bi bi-image me-1" aria-hidden="true"></i>IMAGE</th>
                                    <th><i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>PDF FILE</th>
                                </tr>
                            </thead>

                            <tbody>
                                {submissions.map((project) => (
                                    <RejectedRow
                                        key={project.id}
                                        project={project}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Rejectedid;