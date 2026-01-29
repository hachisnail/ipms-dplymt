import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ResubmissionReview.css';

const ResubmissionReview = () => {
  const [resubmissions, setResubmissions] = useState([]);
  const [filteredResubmissions, setFilteredResubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ipTypeFilter, setIpTypeFilter] = useState('all');
  const [selectedResubmission, setSelectedResubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [finalComments, setFinalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

  const getIpTypeCode = (ipType) => {
    const mapping = {
      'Copyright': 'cr',
      'Trademark': 'tm',
      'Industrial Design': 'id',
      'Utility Model': 'um'
    };
    return mapping[ipType] || 'cr';
  };

  const fetchResubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/consultant-resubmissions-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setResubmissions(response.data.data);
        setFilteredResubmissions(response.data.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Failed to load re-submissions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResubmissions();
  }, []);

  useEffect(() => {
    let filtered = [...resubmissions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.resubmission_status === statusFilter);
    }

    if (ipTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.ip_type === ipTypeFilter);
    }

    setFilteredResubmissions(filtered);
  }, [statusFilter, ipTypeFilter, resubmissions]);

  const getStatusBadge = (status) => {
    const badges = {
      'Pending Resubmission': { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
      'Resubmitted': { bg: '#dbeafe', color: '#1e40af', icon: '📤' },
      'Received by Consultant': { bg: '#e0e7ff', color: '#3730a3', icon: '📥' },
      'Under Re-review': { bg: '#fef3c7', color: '#92400e', icon: '🔍' },
      'Approved': { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      'Rejected Again': { bg: '#fee2e2', color: '#991b1b', icon: '❌' }
    };
    return badges[status] || { bg: '#f3f4f6', color: '#374151', icon: '📋' };
  };

  const handleReceive = async (resubmission) => {
    try {
      const ipTypeCode = getIpTypeCode(resubmission.ip_type);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/resubmission/${ipTypeCode}/${resubmission.id}/receive`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('✅ Marked as received');
      fetchResubmissions();
      setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark as received');
    }
  };

  const handleStartReview = async (resubmission) => {
    try {
      const ipTypeCode = getIpTypeCode(resubmission.ip_type);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/resubmission/${ipTypeCode}/${resubmission.id}/start-review`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('✅ Re-review started');
      fetchResubmissions();
      setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start review');
    }
  };

  const handleSubmitDecision = async () => {
    if (!decision) {
      alert('Please select a decision');
      return;
    }

    if (!finalComments.trim()) {
      alert('Please provide final comments');
      return;
    }

    try {
      setSubmitting(true);
      const ipTypeCode = getIpTypeCode(selectedResubmission.ip_type);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/resubmission/${ipTypeCode}/${selectedResubmission.id}/decision`,
        { decision, final_comments: finalComments },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert(`✅ Re-submission ${decision.toLowerCase()} successfully`);
      fetchResubmissions();
      setShowDetailModal(false);
      setDecision('');
      setFinalComments('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading re-submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2"></i>
          Error: {error}
        </div>
        <button onClick={fetchResubmissions} className="btn btn-primary">
          <i className="fas fa-redo me-2"></i>
          Retry
        </button>
      </div>
    );
  }

  const stats = {
    total: filteredResubmissions.length,
    new: filteredResubmissions.filter(r => r.resubmission_status === 'Resubmitted').length,
    inReview: filteredResubmissions.filter(r => r.resubmission_status === 'Under Re-review').length,
    received: filteredResubmissions.filter(r => r.resubmission_status === 'Received by Consultant').length
  };

  return (
    <div style={{padding: '2rem', maxWidth: '1400px', margin: '0 auto'}}>
      {/* Header */}
      <div className="page-header">
        <h2>
          <i className="fas fa-clipboard-check me-2"></i>
          Re-submission Review Center
        </h2>
        <p className="subtitle">Review and process inventor re-submissions</p>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.new}</div>
          <div className="stat-label">New Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.received}</div>
          <div className="stat-label">Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.inReview}</div>
          <div className="stat-label">In Review</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label><i className="fas fa-filter me-2"></i>Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="Pending Resubmission">Pending Resubmission</option>
            <option value="Resubmitted">Resubmitted</option>
            <option value="Received by Consultant">Received</option>
            <option value="Under Re-review">Under Review</option>
          </select>
        </div>

        <div className="filter-group">
          <label><i className="fas fa-layer-group me-2"></i>IP Type</label>
          <select 
            value={ipTypeFilter} 
            onChange={(e) => setIpTypeFilter(e.target.value)} 
            className="filter-select"
          >
            <option value="all">All IP Types</option>
            <option value="Copyright">Copyright</option>
            <option value="Trademark">Trademark</option>
            <option value="Industrial Design">Industrial Design</option>
            <option value="Utility Model">Utility Model</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredResubmissions.length === 0 ? (
        <div className="no-data-message">
          <i className="fas fa-inbox fa-4x" style={{color: '#d1d5db'}}></i>
          <h3>No re-submissions found</h3>
          <p>There are no re-submissions matching your filters</p>
        </div>
      ) : (
        <div style={{background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f9fafb', borderBottom: '2px solid #e5e7eb'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151'}}>
                  <i className="fas fa-layer-group me-2"></i>IP Type
                </th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151'}}>
                  <i className="fas fa-file-alt me-2"></i>Title
                </th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151'}}>
                  <i className="fas fa-user me-2"></i>Applicant
                </th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151'}}>
                  <i className="fas fa-info-circle me-2"></i>Status
                </th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151'}}>
                  <i className="fas fa-calendar me-2"></i>Date
                </th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResubmissions.map((resub) => {
                const statusStyle = getStatusBadge(resub.resubmission_status);
                return (
                  <tr key={`${resub.ip_type}-${resub.id}`} style={{borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s'}} 
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={{padding: '1rem'}}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.375rem 0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151'
                      }}>
                        {resub.ip_type}
                      </span>
                    </td>
                    <td style={{padding: '1rem', fontWeight: 500, color: '#1f2937'}}>{resub.title || 'Untitled'}</td>
                    <td style={{padding: '1rem', color: '#6b7280'}}>
                      {resub.inventor_name || resub.applicant_name || 'N/A'}
                      {resub.applicant_email && (
                        <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>
                          {resub.applicant_email}
                        </div>
                      )}
                    </td>
                    <td style={{padding: '1rem'}}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.875rem',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        <span>{statusStyle.icon}</span>
                        <span>{resub.resubmission_status}</span>
                      </span>
                    </td>
                    <td style={{padding: '1rem', color: '#6b7280', fontSize: '0.9375rem'}}>
                      {resub.resubmission_date 
                        ? new Date(resub.resubmission_date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })
                        : new Date(resub.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                    </td>
                    <td style={{padding: '1rem'}}>
                      <button
                        onClick={() => {
                          setSelectedResubmission(resub);
                          setShowDetailModal(true);
                          setDecision('');
                          setFinalComments('');
                        }}
                        style={{
                          padding: '0.625rem 1.25rem',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-eye"></i>
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedResubmission && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }} 
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="large-popup"
            style={{
              background: 'white',
              borderRadius: '16px',
              position: 'relative',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowDetailModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(0, 0, 0, 0.1)',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#374151',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem'}}>
                <i className="fas fa-clipboard-check fa-2x"></i>
                <div>
                  <h2 style={{margin: 0, fontSize: '1.5rem'}}>{selectedResubmission.title || 'Untitled'}</h2>
                  <p style={{margin: '0.25rem 0 0 0', opacity: 0.9, fontSize: '1rem'}}>
                    {selectedResubmission.ip_type} - Resubmission #{selectedResubmission.resubmission_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{padding: '2rem'}}>
              {/* Basic Info Section */}
              <div className="section">
                <h4><i className="fas fa-info-circle me-2"></i>Basic Information</h4>
                <div className="detail-row">
                  <strong>Applicant Name:</strong> {selectedResubmission.applicant_name || selectedResubmission.inventor_name || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Applicant Email:</strong> {selectedResubmission.applicant_email || selectedResubmission.inventor_email || 'N/A'}
                </div>
                {selectedResubmission.applicant_phone && (
                  <div className="detail-row">
                    <strong>Phone:</strong> {selectedResubmission.applicant_phone}
                  </div>
                )}
                {selectedResubmission.applicant_address && (
                  <div className="detail-row">
                    <strong>Address:</strong> {selectedResubmission.applicant_address}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span style={{
                    marginLeft: '0.5rem',
                    ...getStatusBadge(selectedResubmission.resubmission_status),
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    {selectedResubmission.resubmission_status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Deadline:</strong> {
                    selectedResubmission.resubmission_deadline 
                      ? new Date(selectedResubmission.resubmission_deadline).toLocaleDateString()
                      : 'Not set'
                  }
                </div>
              </div>

              {/* Original Feedback */}
              {selectedResubmission.resubmission_notes && (
                <div className="section">
                  <h4><i className="fas fa-comment-alt me-2"></i>Original Rejection Feedback</h4>
                  <div className="feedback-box original-feedback">
                    {selectedResubmission.resubmission_notes}
                  </div>
                </div>
              )}

              {/* Missing Requirements */}
              <div className="section">
                <h4><i className="fas fa-exclamation-triangle me-2"></i>Missing Requirements</h4>
                <div className="missing-requirements-list">
                  {selectedResubmission.missing_inventor_details ? (
                    <div className="missing-item">
                      <i className="fas fa-times-circle"></i>
                      <span>Missing or Incomplete Inventor Details</span>
                    </div>
                  ) : null}
                  {selectedResubmission.missing_design_views ? (
                    <div className="missing-item">
                      <i className="fas fa-times-circle"></i>
                      <span>Missing or Incomplete Design Views</span>
                    </div>
                  ) : null}
                  {selectedResubmission.missing_description ? (
                    <div className="missing-item">
                      <i className="fas fa-times-circle"></i>
                      <span>Missing or Incomplete Description</span>
                    </div>
                  ) : null}
                  {!selectedResubmission.missing_inventor_details && 
                   !selectedResubmission.missing_design_views && 
                   !selectedResubmission.missing_description && (
                    <p style={{margin: 0, color: '#6b7280', fontStyle: 'italic'}}>
                      No specific missing requirements flagged
                    </p>
                  )}
                </div>
              </div>

              {/* Inventor's Response */}
              {selectedResubmission.applicant_remarks && (
                <div className="section">
                  <h4><i className="fas fa-reply me-2"></i>Inventor's Response</h4>
                  <div className="feedback-box inventor-feedback">
                    {selectedResubmission.applicant_remarks}
                  </div>
                </div>
              )}

              {/* Updated Files */}
              <div className="section">
                <h4><i className="fas fa-paperclip me-2"></i>Updated Files</h4>
                <div className="files-grid">
                  {selectedResubmission.updated_contact_document_path && (
                    <div className="file-card">
                      <i className="fas fa-file-alt file-icon"></i>
                      <div className="file-name">Contact Document</div>
                      <button 
                        className="view-file-btn"
                        onClick={() => window.open(`http://${API_URL.replace('/api', '')}/uploads/${selectedResubmission.updated_contact_document_path}`, '_blank')}
                      >
                        <i className="fas fa-eye me-1"></i>
                        View
                      </button>
                    </div>
                  )}
                  {selectedResubmission.updated_design_image_path && (
                    <div className="file-card">
                      <i className="fas fa-image file-icon" style={{color: '#8b5cf6'}}></i>
                      <div className="file-name">Design Images</div>
                      <button 
                        className="view-file-btn"
                        onClick={() => window.open(`http://${API_URL.replace('/api', '')}/uploads/${selectedResubmission.updated_design_image_path}`, '_blank')}
                      >
                        <i className="fas fa-eye me-1"></i>
                        View
                      </button>
                    </div>
                  )}
                  {selectedResubmission.updated_official_form_path && (
                    <div className="file-card">
                      <i className="fas fa-file-pdf file-icon" style={{color: '#ef4444'}}></i>
                      <div className="file-name">Official Form</div>
                      <button 
                        className="view-file-btn"
                        onClick={() => window.open(`http://${API_URL.replace('/api', '')}/uploads/${selectedResubmission.updated_official_form_path}`, '_blank')}
                      >
                        <i className="fas fa-eye me-1"></i>
                        View
                      </button>
                    </div>
                  )}
                  {!selectedResubmission.updated_contact_document_path && 
                   !selectedResubmission.updated_design_image_path && 
                   !selectedResubmission.updated_official_form_path && (
                    <div className="no-files">
                      <i className="fas fa-inbox"></i>
                      <p>No files uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Section - Only show for Under Re-review status */}
              {selectedResubmission.resubmission_status === 'Under Re-review' && (
                <div className="section">
                  <h4><i className="fas fa-gavel me-2"></i>Make Decision</h4>
                  
                  <div className="decision-buttons">
                    <button 
                      className={`decision-btn approve-decision ${decision === 'Approved' ? 'active' : ''}`}
                      onClick={() => setDecision('Approved')}
                    >
                      <i className="fas fa-check-circle me-2"></i>
                      Approve for Filing
                    </button>
                    <button 
                      className={`decision-btn reject-decision ${decision === 'Rejected Again' ? 'active' : ''}`}
                      onClick={() => setDecision('Rejected Again')}
                    >
                      <i className="fas fa-times-circle me-2"></i>
                      Reject Again
                    </button>
                  </div>

                  <div style={{marginTop: '1.5rem'}}>
                    <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151'}}>
                      <i className="fas fa-comment-dots me-2"></i>
                      Final Comments <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <textarea 
                      className="decision-textarea"
                      rows="5"
                      placeholder="Provide detailed feedback on your decision..."
                      value={finalComments}
                      onChange={(e) => setFinalComments(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Previous Decision */}
              {selectedResubmission.consultant_remarks && selectedResubmission.resubmission_status !== 'Under Re-review' && (
                <div className="section">
                  <h4><i className="fas fa-comment-dots me-2"></i>Consultant's Decision</h4>
                  <div className="feedback-box" style={{
                    background: selectedResubmission.resubmission_status === 'Approved' ? '#d1fae5' : '#fee2e2',
                    borderLeft: `4px solid ${selectedResubmission.resubmission_status === 'Approved' ? '#10b981' : '#ef4444'}`,
                    color: selectedResubmission.resubmission_status === 'Approved' ? '#065f46' : '#991b1b'
                  }}>
                    {selectedResubmission.consultant_remarks}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-section">
                {selectedResubmission.resubmission_status === 'Resubmitted' && (
                  <button 
                    onClick={() => handleReceive(selectedResubmission)}
                    className="action-btn receive-btn"
                  >
                    <i className="fas fa-inbox me-2"></i>
                    Mark as Received
                  </button>
                )}

                {selectedResubmission.resubmission_status === 'Received by Consultant' && (
                  <button 
                    onClick={() => handleStartReview(selectedResubmission)}
                    className="action-btn review-btn"
                  >
                    <i className="fas fa-play-circle me-2"></i>
                    Start Re-review
                  </button>
                )}

                {selectedResubmission.resubmission_status === 'Under Re-review' && (
                  <button 
                    onClick={handleSubmitDecision}
                    disabled={!decision || !finalComments.trim() || submitting}
                    className="action-btn submit-decision-btn"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-double me-2"></i>
                        Submit Decision
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResubmissionReview;