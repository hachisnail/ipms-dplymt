import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Resubmission.css';

const Resubmission = () => {
  const [resubmissions, setResubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResubmission, setSelectedResubmission] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [contactFile, setContactFile] = useState(null);
  const [designFile, setDesignFile] = useState(null);
  const [descriptionFile, setDescriptionFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

  const getIpTypeCode = (ipType) => {
    const mapping = {
      'Copyright': 'cr',
      'Trademark': 'tm',
      'Industrial Design': 'id',
      'Utility Model': 'um'
    };
    return mapping[ipType] || 'cr';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        console.log('🔍 Checking credentials:', { 
          userId, 
          hasToken: !!token
        });
        
        if (!userId || !token) {
          const sessionUserId = sessionStorage.getItem('userId');
          const sessionToken = sessionStorage.getItem('token');
          
          if (!sessionUserId || !sessionToken) {
            console.error('❌ No credentials found');
            setError('Please login first');
            setLoading(false);
            return;
          }
          
          console.log('✅ Using sessionStorage credentials');
          await fetchResubmissions(sessionUserId, sessionToken);
          return;
        }
        
        await fetchResubmissions(userId, token);
        
      } catch (err) {
        console.error('❌ Error in fetchData:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchResubmissions = async (userId, token) => {
    console.log(`📥 Fetching resubmissions for user ${userId}...`);
    
    const response = await axios.get(
      `${API_BASE_URL}/inventor-resubmissions/${userId}`,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('📦 Response:', response.data);
    
    if (response.data.success && response.data.data) {
      setResubmissions(response.data.data);
      console.log(`✅ Loaded ${response.data.data.length} resubmissions`);
    } else {
      setResubmissions([]);
      console.log('ℹ️ No resubmissions found');
    }
    
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      alert('Please provide remarks explaining what you corrected');
      return;
    }

    // Validate required files
    if (selectedResubmission.missing_inventor_details && !contactFile) {
      alert('You must upload the Inventor Contact Document');
      return;
    }

    if (selectedResubmission.missing_design_views && !designFile) {
      alert('You must upload the Design Views Document');
      return;
    }

    if (selectedResubmission.missing_description && !descriptionFile) {
      alert('You must upload the Description Document');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      if (contactFile) formData.append('contactFile', contactFile);
      if (designFile) formData.append('designFile', designFile);
      if (descriptionFile) formData.append('descriptionFile', descriptionFile);
      formData.append('remarks', remarks);

      const ipTypeCode = getIpTypeCode(selectedResubmission.ip_type);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/resubmission/${ipTypeCode}/${selectedResubmission.id}/submit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('✅ Re-submission submitted successfully! The consultant will be notified.');
        setShowSubmitModal(false);
        // Reset form
        setContactFile(null);
        setDesignFile(null);
        setDescriptionFile(null);
        setRemarks('');
        // Refresh data
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        await fetchResubmissions(userId, token);
      }
    } catch (err) {
      console.error('❌ Submit error:', err);
      alert(err.response?.data?.error || 'Failed to submit re-submission');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      'Pending Resubmission': { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
      'Resubmitted': { bg: '#dbeafe', color: '#1e40af', icon: '📤' },
      'Received by Consultant': { bg: '#e0e7ff', color: '#3730a3', icon: '📥' },
      'Under Re-review': { bg: '#fef3c7', color: '#92400e', icon: '🔍' },
      'Approved': { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      'Rejected Again': { bg: '#fee2e2', color: '#991b1b', icon: '❌' }
    };
    return styles[status] || { bg: '#f3f4f6', color: '#374151', icon: '📋' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{marginTop: '1rem', fontSize: '1.125rem', color: '#6b7280'}}>Loading your re-submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  const stats = {
    total: resubmissions.length,
    pending: resubmissions.filter(r => r.resubmission_status === 'Pending Resubmission').length,
    submitted: resubmissions.filter(r => ['Resubmitted', 'Received by Consultant', 'Under Re-review'].includes(r.resubmission_status)).length,
    completed: resubmissions.filter(r => ['Approved', 'Rejected Again'].includes(r.resubmission_status)).length
  };

  return (
    <div className="resubmission-portal">
      {/* Header */}
      <div className="portal-header">
        <h1>
          <i className="fas fa-redo-alt"></i>
          Re-submission Portal
        </h1>
        <p className="subtitle">
          Complete and resubmit your IP applications that require additional information
        </p>
      </div>

      {/* No Re-submissions State */}
      {resubmissions.length === 0 ? (
        <div className="no-resubmissions">
          <i className="fas fa-check-circle"></i>
          <h3>All Clear!</h3>
          <p>You don't have any pending re-submissions at this time.</p>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Re-submissions</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">Action Required</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.submitted}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>

          {/* Re-submissions Grid */}
          <div className="resubmissions-grid">
            {resubmissions.map((resub) => {
              const statusStyle = getStatusBadgeStyle(resub.resubmission_status);
              const isActionRequired = resub.resubmission_status === 'Pending Resubmission';

              return (
                <div 
                  key={`${resub.ip_type}-${resub.id}`} 
                  className={`resubmission-card ${isActionRequired ? 'action-required' : ''}`}
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="header-left">
                      <h3>{resub.title || 'Untitled Submission'}</h3>
                      <span className="ip-type-badge">{resub.ip_type}</span>
                    </div>
                    <span 
                      className="status-badge"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color
                      }}
                    >
                      {statusStyle.icon} {resub.resubmission_status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    <div className="info-row">
                      <i className="fas fa-hashtag"></i>
                      <span>Resubmission #{resub.resubmission_number}</span>
                    </div>

                    <div className="info-row">
                      <i className="fas fa-calendar-alt"></i>
                      <span>Created: {new Date(resub.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}</span>
                    </div>

                    {resub.resubmission_deadline && (
                      <div className="info-row">
                        <i className="fas fa-clock"></i>
                        <span>Deadline: {new Date(resub.resubmission_deadline).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}</span>
                      </div>
                    )}

                    {/* Missing Requirements */}
                    {(resub.missing_inventor_details || resub.missing_design_views || resub.missing_description) && (
                      <div className="missing-requirements">
                        <h4>
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          Missing Requirements
                        </h4>
                        <ul>
                          {resub.missing_inventor_details && (
                            <li className="missing-item">
                              <i className="fas fa-times-circle"></i>
                              <span>Inventor Contact Details</span>
                            </li>
                          )}
                          {resub.missing_design_views && (
                            <li className="missing-item">
                              <i className="fas fa-times-circle"></i>
                              <span>Design Views/Images</span>
                            </li>
                          )}
                          {resub.missing_description && (
                            <li className="missing-item">
                              <i className="fas fa-times-circle"></i>
                              <span>Detailed Description</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Consultant Comments */}
                    {resub.resubmission_notes && (
                      <div className="consultant-comments">
                        <h4>
                          <i className="fas fa-comment-dots me-2"></i>
                          Consultant's Feedback
                        </h4>
                        <p>{resub.resubmission_notes}</p>
                      </div>
                    )}

                    {/* Your Previous Remarks */}
                    {resub.applicant_remarks && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f0fdf4',
                        borderRadius: '0.5rem',
                        borderLeft: '4px solid #10b981'
                      }}>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          color: '#065f46',
                          margin: '0 0 0.5rem 0',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-reply me-2"></i>
                          Your Remarks
                        </h4>
                        <p style={{margin: 0, color: '#047857', fontSize: '0.875rem'}}>
                          {resub.applicant_remarks}
                        </p>
                      </div>
                    )}

                    {/* Final Decision */}
                    {resub.consultant_remarks && ['Approved', 'Rejected Again'].includes(resub.resubmission_status) && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: resub.resubmission_status === 'Approved' ? '#f0fdf4' : '#fef2f2',
                        borderRadius: '0.5rem',
                        borderLeft: `4px solid ${resub.resubmission_status === 'Approved' ? '#10b981' : '#ef4444'}`
                      }}>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          color: resub.resubmission_status === 'Approved' ? '#065f46' : '#991b1b',
                          margin: '0 0 0.5rem 0',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-gavel me-2"></i>
                          Final Decision
                        </h4>
                        <p style={{
                          margin: 0,
                          color: resub.resubmission_status === 'Approved' ? '#047857' : '#991b1b',
                          fontSize: '0.875rem'
                        }}>
                          {resub.consultant_remarks}
                        </p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="timestamp-info">
                      {resub.resubmission_date && (
                        <>
                          <i className="fas fa-upload"></i>
                          <span>Submitted: {new Date(resub.resubmission_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer">
                    {isActionRequired && (
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                          setSelectedResubmission(resub);
                          setShowSubmitModal(true);
                          setContactFile(null);
                          setDesignFile(null);
                          setDescriptionFile(null);
                          setRemarks('');
                        }}
                      >
                        <i className="fas fa-upload me-2"></i>
                        Submit Re-submission
                      </button>
                    )}

                    {!isActionRequired && (
                      <button
                        className="btn btn-secondary"
                        style={{cursor: 'default', opacity: 0.7}}
                        disabled
                      >
                        <i className="fas fa-hourglass-half me-2"></i>
                        {resub.resubmission_status}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedResubmission && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              className="close-btn"
              onClick={() => setShowSubmitModal(false)}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="modal-header">
              <h2>
                <i className="fas fa-upload me-2"></i>
                Submit Re-submission
              </h2>
              <h3>{selectedResubmission.title || 'Untitled'}</h3>
              <span className="ip-type-badge large">{selectedResubmission.ip_type}</span>
            </div>

            {/* Modal Body - Form */}
            <form className="resubmission-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Info Box */}
              <div className="info-box">
                <h4>
                  <i className="fas fa-info-circle me-2"></i>
                  Instructions
                </h4>
                <p>
                  Please upload the corrected documents as requested and provide a brief explanation
                  of the changes you made. Required files are marked with an asterisk (*).
                </p>
              </div>

              {/* Original Feedback */}
              {selectedResubmission.resubmission_notes && (
                <div style={{
                  padding: '1rem',
                  background: '#fef3c7',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    color: '#92400e',
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-comment-alt me-2"></i>
                    Consultant's Feedback
                  </h4>
                  <p style={{margin: 0, color: '#92400e', fontSize: '0.875rem', lineHeight: 1.6}}>
                    {selectedResubmission.resubmission_notes}
                  </p>
                </div>
              )}

              {/* File Uploads */}
              {selectedResubmission.missing_inventor_details && (
                <div className="form-group">
                  <label className="required">
                    <i className="fas fa-user-circle me-2"></i>
                    Inventor Contact Document
                  </label>
                  <input
                    type="file"
                    className="file-input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setContactFile(e.target.files[0])}
                  />
                  {contactFile && (
                    <div className="file-selected">
                      <i className="fas fa-check-circle me-2"></i>
                      Selected: {contactFile.name}
                    </div>
                  )}
                  <small className="form-help">
                    Upload complete inventor/applicant contact information (PDF, DOC, DOCX)
                  </small>
                </div>
              )}

              {selectedResubmission.missing_design_views && (
                <div className="form-group">
                  <label className="required">
                    <i className="fas fa-images me-2"></i>
                    Design Views/Images
                  </label>
                  <input
                    type="file"
                    className="file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.zip"
                    onChange={(e) => setDesignFile(e.target.files[0])}
                  />
                  {designFile && (
                    <div className="file-selected">
                      <i className="fas fa-check-circle me-2"></i>
                      Selected: {designFile.name}
                    </div>
                  )}
                  <small className="form-help">
                    Upload all required design views (PDF, JPG, PNG, or ZIP file)
                  </small>
                </div>
              )}

              {selectedResubmission.missing_description && (
                <div className="form-group">
                  <label className="required">
                    <i className="fas fa-file-alt me-2"></i>
                    Detailed Description
                  </label>
                  <input
                    type="file"
                    className="file-input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setDescriptionFile(e.target.files[0])}
                  />
                  {descriptionFile && (
                    <div className="file-selected">
                      <i className="fas fa-check-circle me-2"></i>
                      Selected: {descriptionFile.name}
                    </div>
                  )}
                  <small className="form-help">
                    Upload detailed description/specification (PDF, DOC, DOCX)
                  </small>
                </div>
              )}

              {/* Remarks */}
              <div className="form-group">
                <label className="required">
                  <i className="fas fa-comment-dots me-2"></i>
                  Your Remarks
                </label>
                <textarea
                  className="form-textarea"
                  rows="5"
                  placeholder="Explain what corrections you made and how you addressed the consultant's feedback..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
                <small className="form-help">
                  Please provide a clear explanation of the changes you made to address the feedback.
                </small>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                >
                  <i className="fas fa-times me-2"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Submit Re-submission
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resubmission;