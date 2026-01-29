import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Row from './UnderRow'; 
import './TableView.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

// Reusable component for the popup modal
const ReviewPopup = ({ project, onClose, onFinalAction, onChecklistUpdate }) => {
    // Local state to manage the Triage Checklist and Notes
    const [checklist, setChecklist] = useState({
        inventor_identified: !!project.inventor_identified,
        design_views_complete: !!project.design_views_complete,
        description_clear: !!project.description_clear,
    });
    // State for Triage Notes / Rejection Reason (pre-populates with existing data)
    const [rejectionComment, setRejectionComment] = useState(project.rejection_reason || '');
    const [isSaving, setIsSaving] = useState(false);
    const [pdfError, setPdfError] = useState(false);
    
    // Derived State: Check if all checklist items are true
    const isChecklistComplete = Object.values(checklist).every(Boolean);

    // Define the checklist keys and their user-friendly labels
    const checklistLabels = {
        inventor_identified: 'Inventor contact details verified.',
        design_views_complete: 'Visuals are clear and all required views are present.',
        description_clear: 'Written description clearly identifies ornamental features.',
    };

    // Handler to save the checklist status and notes
    const handleChecklistSave = async () => {
        setIsSaving(true);
        try {
            // Pass the current state up to the parent component's handler
            await onChecklistUpdate(project.id, {
                ...checklist,
                rejection_comment: rejectionComment
            });
            alert('Checklist status and notes saved successfully!');
        } catch (error) {
            console.error('Error saving checklist:', error);
            alert('Failed to save checklist status. Check console.');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Handler for final decision (Approve/Reject)
    const handleFinalDecision = (action) => {
        if (action === 'Rejected' && (!rejectionComment || rejectionComment.trim() === '')) {
            alert('A comment is MANDATORY when rejecting a submission. Please add the rejection reason to the notes box.');
            return;
        }

        // Pass the latest action and the final comment/reason to the parent handler
        onFinalAction(project.id, action, rejectionComment);
    };

    // Handler for viewing files in new tab
    const handleViewFile = (filePath) => {
        if (filePath) {
            const fileUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${filePath}`;
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-card" onClick={(e) => e.stopPropagation()}>
                <button
                    className="close-btn"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <i className="bi bi-x-lg"></i>
                </button>

                <h3>
                    <i className="bi bi-journal-text me-2" aria-hidden="true"></i>
                    Triage & Review: {project.title || 'Untitled Submission'}
                </h3>

                <div className="popup-details">
                    <p><i className="bi bi-hash me-1" aria-hidden="true"></i><strong>ID:</strong> {project.id}</p>
                    <p><i className="bi bi-tag me-1" aria-hidden="true"></i><strong>Current Status:</strong> <span className={`status-badge ${isChecklistComplete ? 'complete-application' : 'under-review'}`}>{project.status || 'Under Review'}</span></p>
                    <p><i className="bi bi-calendar me-1" aria-hidden="true"></i><strong>Filing Date:</strong> {project.filing_date ? new Date(project.filing_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                
                {/* --- NEW: Completeness Checklist (Triage Gate) --- */}
                <div className="checklist-section">
                    <h4><i className="bi bi-list-check me-2"></i>Completeness Checklist (Triage)</h4>
                    <p className="triage-status">
                        Triage Status: 
                        {isChecklistComplete ? (
                            <span style={{ color: '#2ecc71', fontWeight: 'bold' }}> COMPLETE (Ready for Final Review)</span>
                        ) : (
                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}> INCOMPLETE</span>
                        )}
                    </p>
                    <div className="checklist-items">
                        {Object.keys(checklist).map(key => (
                            <div key={key} className="checklist-item">
                                <input
                                    type="checkbox"
                                    id={key}
                                    checked={checklist[key]}
                                    // Update local state when checkbox is toggled
                                    onChange={() => setChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                                />
                                <label htmlFor={key}>{checklistLabels[key]}</label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- NEW: Triage Notes / Rejection Comment --- */}
                <div className="rejection-comment-section">
                    <h4><i className="bi bi-chat-dots me-2"></i>Triage Notes / Final Action Comment</h4>
                    <textarea
                        rows="3"
                        placeholder="Enter Triage notes here. (MANDATORY if rejecting the submission.)"
                        value={rejectionComment}
                        onChange={(e) => setRejectionComment(e.target.value)}
                    ></textarea>
                </div>
                
                {/* Save Button for Triage and Notes */}
                <button 
                    className="save-triage-btn" 
                    onClick={handleChecklistSave}
                    disabled={isSaving}
                    style={{ marginBottom: '20px' }}
                >
                    <i className="bi bi-save me-1"></i> {isSaving ? 'Saving...' : 'Save Triage Progress'}
                </button>
                
                {/* File Previews Section */}
                <div className="preview-section">
                    <h4><i className="bi bi-image me-2" aria-hidden="true"></i>Utility Model Drawing/Illustration</h4>
                    {project.design_image_path ? (
                        <>
                            {/* Check if it's an image or document */}
                            {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(project.design_image_path) ? (
                                <img
                                    src={`${API_BASE_URL.replace('/api', '')}/uploads/${project.design_image_path}`}
                                    alt="Design"
                                    className="preview-image"
                                    onClick={() => handleViewFile(project.design_image_path)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view full size"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                                    }}
                                />
                            ) : (
                                /* If it's a document file (PDF, DOCX, etc.) */
                                <div className="document-preview">
                                    <div className="document-icon" style={{ textAlign: 'center', padding: '20px' }}>
                                        <i className="bi bi-file-earmark-text" style={{ fontSize: '48px', color: '#6366f1' }}></i>
                                        <p style={{ marginTop: '10px', fontWeight: '600' }}>
                                            Document File: {project.design_image_path.split('-').pop()}
                                        </p>
                                    </div>
                                    <button 
                                        className="view-btn" 
                                        onClick={() => handleViewFile(project.design_image_path)}
                                        style={{ marginTop: '10px' }}
                                    >
                                        <i className="bi bi-eye me-1"></i>View File
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="no-data">No drawing/illustration submitted.</p>
                    )}
                </div>

                <div className="preview-section">
                    <h4><i className="bi bi-file-earmark-pdf me-2" aria-hidden="true"></i>Official Form</h4>
                    {project.official_form_path ? (
                        <>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                <button 
                                    className="view-btn"
                                    onClick={() => handleViewFile(project.official_form_path)}
                                >
                                    <i className="bi bi-eye me-1"></i>View in New Tab
                                </button>
                                <a
                                    href={`${API_BASE_URL.replace('/api', '')}/uploads/${project.official_form_path}`}
                                    download
                                    className="download-all-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <i className="bi bi-download me-1"></i>Download
                                </a>
                            </div>
                            
                            {/* PDF Preview with error handling */}
                            {!pdfError ? (
                                <iframe
                                    src={`${API_BASE_URL.replace('/api', '')}/uploads/${project.official_form_path}#toolbar=1`}
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        marginTop: '10px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                    title="PDF Preview"
                                    onError={() => {
                                        console.error('PDF preview failed');
                                        setPdfError(true);
                                    }}
                                />
                            ) : (
                                <div className="pdf-error" style={{
                                    padding: '20px',
                                    background: '#fee2e2',
                                    border: '2px solid #fecaca',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    marginTop: '10px'
                                }}>
                                    <i className="bi bi-exclamation-triangle" style={{ fontSize: '32px', color: '#dc2626' }}></i>
                                    <p style={{ marginTop: '10px', color: '#991b1b', fontWeight: '600' }}>
                                        Could not load PDF preview in browser.
                                    </p>
                                    <p style={{ color: '#b91c1c' }}>
                                        Please use the "View in New Tab" or "Download" buttons above.
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="no-data">No official form submitted.</p>
                    )}
                </div>

                {/* Final Action Buttons (Gated by Checklist) */}
                <div className="popup-actions">
                    <button 
                        className="approve-btn" 
                        onClick={() => handleFinalDecision('Approved for Filing')}
                        // Disable if the checklist is not complete or if saving is in progress
                        disabled={!isChecklistComplete || isSaving} 
                    >
                        <i className="bi bi-check-circle me-1"></i>Approve for Filing
                    </button>
                    <button 
                        className="reject-btn" 
                        onClick={() => handleFinalDecision('Rejected')}
                        disabled={isSaving}
                    >
                        <i className="bi bi-x-circle me-1"></i>Reject Submission
                    </button>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        <i className="bi bi-x-lg me-1"></i>Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const UnderReviewum = () => {
    const [submissions, setSubmissions] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubmissions = async () => {
        try {
            // Fetch data, including the new checklist fields
            const response = await axios.get(`${API_BASE_URL}/um-submissions-under-review`);
            console.log('✅ Fetched Under Review UM submissions:', response.data);
            setSubmissions(response.data);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError('Failed to fetch Under Review submissions.');
            setLoading(false);
        }
    };

    // Handler for saving checklist status only (calls the new um-checklist-update endpoint)
    const handleChecklistUpdate = async (projectId, checklistData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/um-checklist-update/${projectId}`, checklistData);
            
            // Update the selected project's status and checklist fields immediately in the UI
            setSelectedProject(prev => ({
                ...prev,
                ...checklistData,
                status: response.data.message.includes('Ready for Review') ? 'Ready for Review' : 'Under Review'
            }));

            fetchSubmissions(); // Re-fetch to update status in the main table
        } catch (err) {
            console.error(`❌ Error updating checklist for ${projectId}:`, err);
            // Re-throw the error so the caller can handle the failed save state
            throw err; 
        }
    };

    // Modified handler for final decision (calls the um-review-action endpoint)
    const handleFinalAction = async (projectId, action, rejection_reason) => {
        const confirmAction = window.confirm(`Are you sure you want to change project ID ${projectId} status to '${action}'? This is a final decision.`);
        if (!confirmAction) return;

        try {
            // API call to update the status and store the final rejection reason/notes
            await axios.put(`${API_BASE_URL}/um-review-action/${projectId}`, { action, rejection_reason });
            
            setSelectedProject(null); // Close popup
            setSubmissions(prev => prev.filter(p => p.id !== projectId)); // Remove from 'Under Review' list
            alert(`Project ${projectId} status successfully updated to '${action}'.`);
        } catch (err) {
            console.error(`❌ Error performing action (${action}):`, err);
            alert(`Failed to perform action ${action}. Details: ${err.response?.data?.error || 'Server error.'}`);
        }
    };

    useEffect(() => {
        fetchSubmissions();
        const interval = setInterval(fetchSubmissions, 5000);
        return () => clearInterval(interval);
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
                <div className="error-message">
                    ❌ {error}
                </div>
            </div>
        );
    }

    return (
        <div className="Table-container">
            <h2>
                <i className="bi bi-hourglass-split me-2" aria-hidden="true"></i>
                 Under Review - Utility Model Submissions
            </h2>

            {submissions.length === 0 ? (
                <div className="error-message">No projects are currently under review.</div>
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
                                    <th><i className="bi bi-calendar me-1" aria-hidden="true"></i>FILING DATE</th>
                                    <th><i className="bi bi-list-ul me-1" aria-hidden="true"></i>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {submissions.map((project) => (
                                    <Row
                                        key={project.id}
                                        project={project}
                                        onView={() => setSelectedProject(project)} 
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pop-up Modal for Review/Approval */}
                    {selectedProject && (
                        <ReviewPopup
                            project={selectedProject}
                            onClose={() => setSelectedProject(null)}
                            onFinalAction={handleFinalAction}
                            onChecklistUpdate={handleChecklistUpdate}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default UnderReviewum;