import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const STATUS_CONFIG = {
  'Under Review':        { bg: '#dbeafe', color: '#1e40af', icon: 'bi-hourglass-split'    },
  'Revision Required':   { bg: '#fef9c3', color: '#854d0e', icon: 'bi-arrow-repeat'       },
  'Under Re-review':     { bg: '#dbeafe', color: '#1e40af', icon: 'bi-hourglass-split'    },
  'Assigned':            { bg: '#f1f5f9', color: '#475569', icon: 'bi-person-check'       },
  'Pending Resubmission':{ bg: '#fee2e2', color: '#b91c1c', icon: 'bi-exclamation-triangle'},
  'Resubmission':        { bg: '#fee2e2', color: '#b91c1c', icon: 'bi-exclamation-triangle'},
  'Resubmitted':         { bg: '#fef9c3', color: '#854d0e', icon: 'bi-arrow-repeat'       },
}

const TYPE_CONFIG = {
  'Utility Model':    { bg: '#dcfce7', color: '#166534', abbr: 'UM' },
  'Industrial Design':{ bg: '#f3f4f6', color: '#374151', abbr: 'ID' },
  'Trademark':        { bg: '#dbeafe', color: '#1e40af', abbr: 'TM' },
  'Copyright':        { bg: '#fde8e8', color: '#6b0000', abbr: 'CR' },
  'ID':               { bg: '#f3f4f6', color: '#374151', abbr: 'ID' },
  'TM':               { bg: '#dbeafe', color: '#1e40af', abbr: 'TM' },
  'CR':               { bg: '#fde8e8', color: '#6b0000', abbr: 'CR' },
  'UM':               { bg: '#dcfce7', color: '#166534', abbr: 'UM' },
}

function ActiveReviews() {
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterType,    setFilterType]    = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterUnit,    setFilterUnit]    = useState('all');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token    = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/active-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching active projects:', err);
      setError('Failed to load active reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p => {
    const q   = searchTerm.toLowerCase();
    const okQ = !q || p.title?.toLowerCase().includes(q) || p.delivery_unit?.toLowerCase().includes(q) || p.applicant_name?.toLowerCase().includes(q);
    const okT = filterType   === 'all' || p.ip_type === filterType;
    const okS = filterStatus === 'all' || p.status  === filterStatus;
    const okU = filterUnit   === 'all' || p.delivery_unit === filterUnit;
    return okQ && okT && okS && okU;
  });

  const deliveryUnits = [...new Set(projects.map(p => p.delivery_unit).filter(Boolean))].sort();

  const underReview = filtered.filter(p => p.status === 'Under Review');
  const revision    = filtered.filter(p => p.status === 'Revision Required');

  const daysColor = (d) => d >= 14 ? '#dc2626' : d >= 7 ? '#d97706' : '#16a34a';

  if (loading) return (
    <div className="project-container">
      <div style={{padding:40,textAlign:'center',color:'#9ca3af',fontSize:14}}>Loading…</div>
    </div>
  );

  if (error) return (
    <div className="project-container">
        <div className="error-message">
          <i className="bi bi-exclamation-triangle"></i><p>{error}</p>
          <button onClick={fetchProjects} className="btn-retry">Retry</button>
        </div>
    </div>
  );

  return (
    <div className="project-container">

        {/* ── Header ── */}
        <div className="project-header">
          <div className="header-left">
            <h2><i className="bi bi-clipboard-check"></i> Active Project Reviews</h2>
            <p className="subtitle">Monitor ongoing evaluations · {projects.length} total</p>
          </div>
          <div className="header-right">
            <button onClick={fetchProjects} className="btn-refresh">
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon"><i className="bi bi-hourglass-split"></i></div>
            <div className="stat-content"><h3>{underReview.length}</h3><p>Under Review</p></div>
          </div>
          <div className="stat-card revision">
            <div className="stat-icon"><i className="bi bi-arrow-repeat"></i></div>
            <div className="stat-content"><h3>{revision.length}</h3><p>Needs Revision</p></div>
          </div>
          <div className="stat-card total">
            <div className="stat-icon"><i className="bi bi-files"></i></div>
            <div className="stat-content"><h3>{filtered.length}</h3><p>Total Shown</p></div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="filters-row">
          <div className="search-bar">
            <i className="bi bi-search"></i>
            <input type="text" placeholder="Search by title, applicant, or delivery unit…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-group">
            <label><i className="bi bi-tag"></i> Type:</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Utility Model">Utility Model</option>
              <option value="Industrial Design">Industrial Design</option>
              <option value="TM">Trademark</option>
              <option value="CR">Copyright</option>
            </select>
          </div>
          <div className="filter-group">
            <label><i className="bi bi-funnel"></i> Status:</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Revision Required">Revision Required</option>
              <option value="Pending Resubmission">Pending Resubmission</option>
            </select>
          </div>
          <div className="filter-group">
            <label><i className="bi bi-building"></i> Unit:</label>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
              <option value="all">All Units</option>
              {deliveryUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="no-data">
              <i className="bi bi-inbox"></i>
              <p>No active reviews found</p>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'All submissions are either pending or finalized.'}
              </span>
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
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Days Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const typeCfg   = TYPE_CONFIG[p.ip_type]   || { bg: '#f3f4f6', color: '#374151', abbr: p.ip_type };
                  const statusCfg = STATUS_CONFIG[p.status]  || { bg: '#f3f4f6', color: '#374151', icon: 'bi-circle' };
                  const days      = p.days_active || 0;
                  return (
                    <tr key={`${p.id}-${idx}`}>
                      <td style={{ color: '#9ca3af', fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color, whiteSpace: 'nowrap' }}>
                          {typeCfg.abbr || p.ip_type}
                        </span>
                      </td>
                      <td className="title-cell" style={{ maxWidth: 220 }}>
                        <span title={p.title}>{p.title || 'N/A'}</span>
                      </td>
                      <td style={{ fontSize: 12.5 }}>{p.applicant_name || '—'}</td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>{p.delivery_unit || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusCfg.bg, color: statusCfg.color, whiteSpace: 'nowrap' }}>
                          <i className={`bi ${statusCfg.icon}`}></i>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>
                        {p.submission_date ? new Date(p.submission_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12.5, color: daysColor(days) }}>
                          <i className="bi bi-clock"></i> {days}d
                        </span>
                      </td>
                      <td>
                        <button onClick={() => { setSelectedProject(p); setShowModal(true); }} className="btn-view" title="View Details">
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

        {/* ── Modal ── */}
        {showModal && selectedProject && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content project-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="modal-header">
                {(() => {
                  const tc = TYPE_CONFIG[selectedProject.ip_type] || { bg:'#f3f4f6',color:'#374151' };
                  const sc = STATUS_CONFIG[selectedProject.status]|| { bg:'#f3f4f6',color:'#374151',icon:'bi-circle' };
                  return (
                    <>
                      <span style={{ display:'inline-flex',alignItems:'center',padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:700,background:tc.bg,color:tc.color,marginBottom:8 }}>
                        {selectedProject.ip_type}
                      </span>
                      <h2>{selectedProject.title}</h2>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,background:sc.bg,color:sc.color,marginTop:6 }}>
                        <i className={`bi ${sc.icon}`}></i>{selectedProject.status}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3><i className="bi bi-person"></i> Applicant Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><label>Name</label><p>{selectedProject.applicant_name || 'N/A'}</p></div>
                    <div className="detail-item"><label>Email</label><p>{selectedProject.applicant_email || 'N/A'}</p></div>
                    <div className="detail-item"><label>Delivery Unit</label><p>{selectedProject.delivery_unit || 'N/A'}</p></div>
                  </div>
                </div>
                <div className="detail-section">
                  <h3><i className="bi bi-clock-history"></i> Timeline</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Submitted</label>
                      <p>{selectedProject.submission_date ? new Date(selectedProject.submission_date).toLocaleDateString('en-PH', { dateStyle: 'long' }) : 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Assigned</label>
                      <p>{selectedProject.assigned_date ? new Date(selectedProject.assigned_date).toLocaleDateString('en-PH', { dateStyle: 'long' }) : 'Not yet assigned'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Days Active</label>
                      <p style={{ fontWeight: 700, color: daysColor(selectedProject.days_active || 0) }}>
                        {selectedProject.days_active || 0} days
                        {(selectedProject.days_active || 0) >= 14 && <span style={{ marginLeft: 6, fontSize: 11, background: '#fee2e2', color: '#b91c1c', borderRadius: 4, padding: '1px 6px' }}>Overdue</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}

export default ActiveReviews;