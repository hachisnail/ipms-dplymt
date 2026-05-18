import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AssignedSubmissions.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const UPLOADS_URL  = API_BASE_URL.replace('/api', '') + '/uploads';

const getToken  = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const authHdrs  = () => ({ Authorization: `Bearer ${getToken()}` });

function fmtDate(d) {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Per-prefix document definitions ─────────────────────────
// Keys match the aliased columns returned by GET /api/consultant/assigned
const DOC_DEFS = {
    umid: [
        { key: 'endorsement_letter_path', label: 'Endorsement Letter',         icon: 'bi-file-earmark-text'  },
        { key: 'doc2_path',               label: 'Technology Disclosure Form', icon: 'bi-file-earmark-text'  },
        { key: 'doc3_path',               label: 'Drawings / Illustrations',   icon: 'bi-file-earmark-image' },
        { key: 'doc4_path',               label: 'Government-Issued ID',       icon: 'bi-person-vcard'       },
    ],
    tm: [
        { key: 'endorsement_letter_path', label: 'Endorsement Letter',         icon: 'bi-file-earmark-text'  },
        { key: 'doc2_path',               label: 'IPOPHL Application Form',    icon: 'bi-file-earmark-text'  },
        { key: 'doc3_path',               label: 'Specimen / Sample of Mark',  icon: 'bi-file-earmark-image' },
        { key: 'doc4_path',               label: 'Government-Issued ID',       icon: 'bi-person-vcard'       },
    ],
    cr: [
        { key: 'endorsement_letter_path', label: 'Endorsement / Cover Letter',              icon: 'bi-file-earmark-text'  },
        { key: 'doc2_path',               label: 'BCRR Copyright Enrollment Form (4 sets)', icon: 'bi-file-earmark-text'  },
        { key: 'doc3_path',               label: 'BCRR Form 2 Supplemental Form (4 sets)',  icon: 'bi-file-earmark-text'  },
        { key: 'doc4_path',               label: 'Notarized Deed of Assignment (4 sets)',    icon: 'bi-file-earmark-text'  },
        { key: 'doc5_path',               label: "Author's Gov-ID signed 3× (4 sets)",      icon: 'bi-person-vcard'       },
        { key: 'doc6_path',               label: 'Copy of Creative Work (4 sets)',           icon: 'bi-file-earmark-image' },
    ],
};

function ipBadgeClass(ipType) {
    if (!ipType) return 'ap-ip-def';
    const t = ipType.toLowerCase();
    if (t.includes('utility'))    return 'ap-ip-um';
    if (t.includes('industrial')) return 'ap-ip-id';
    if (t.includes('trademark'))  return 'ap-ip-tm';
    if (t.includes('copyright'))  return 'ap-ip-cr';
    return 'ap-ip-def';
}

function statusBadgeClass(status) {
    if (!status) return 'ap-status-default';
    const s = status.toLowerCase();
    if (s.includes('under review'))  return 'ap-status-review';
    if (s.includes('resubmission'))  return 'ap-status-resubmit';
    if (s.includes('approved'))      return 'ap-status-approved';
    if (s.includes('filed'))         return 'ap-status-filed';
    return 'ap-status-default';
}

const FILTER_OPTIONS = [
    { value: 'All', label: 'All IP Types' },
];

// ── Detail popup ─────────────────────────────────────────────
function DetailModal({ project, onClose, onStartReview }) {
    const [reviewing, setReviewing] = useState(false);

    // Use the correct DOC_DEFS key: 'umid' covers both UM and ID
    const docsKey = project.prefix === 'tm' ? 'tm'
                  : project.prefix === 'cr' ? 'cr'
                  : 'umid';
    const docs = DOC_DEFS[docsKey] || DOC_DEFS.umid;

    const handleReview = async () => {
        setReviewing(true);
        try {
            await onStartReview(project);
            onClose();
        } catch (err) {
            console.error('Start review error:', err);
            alert('Failed to start review. Please try again.');
        } finally {
            setReviewing(false);
        }
    };

    return (
        <div className="ap-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ap-popup">

                {/* Header */}
                <div className="ap-popup-header">
                    <div className="ap-popup-header-icon">
                        <i className="bi bi-folder2-open"></i>
                    </div>
                    <div className="ap-popup-header-text">
                        <h3>{project.prefix.toUpperCase()}-{project.id} · {project.title}</h3>
                        <p>Assigned {fmtDate(project.assigned_at)}</p>
                    </div>
                </div>
                <button className="ap-popup-close" onClick={onClose} aria-label="Close">×</button>

                {/* Body */}
                <div className="ap-popup-body">

                    {/* LEFT — details */}
                    <div className="ap-popup-left">
                        <div>
                            <div className="ap-popup-section-title">
                                <i className="bi bi-info-circle"></i>
                                Submission Details
                            </div>
                            <div className="ap-detail-list">
                                <div className="ap-detail-row">
                                    <i className="bi bi-hash"></i>
                                    <strong>Reference</strong>
                                    {project.prefix.toUpperCase()}-{project.id}
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-person"></i>
                                    <strong>Inventor</strong>
                                    {project.inventor_name || 'N/A'}
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-envelope"></i>
                                    <strong>Email</strong>
                                    {project.inventor_email || 'N/A'}
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-tag"></i>
                                    <strong>IP Type</strong>
                                    <span className={`ap-ip-badge ${ipBadgeClass(project.ip_type)}`}>
                                        {project.ip_type || 'N/A'}
                                    </span>
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-layers"></i>
                                    <strong>Project Type</strong>
                                    {project.project_type || 'N/A'}
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-calendar3"></i>
                                    <strong>Filing Date</strong>
                                    {fmtDate(project.date_submitted)}
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-clock-history"></i>
                                    <strong>Assigned On</strong>
                                    {fmtDate(project.assigned_at)}
                                </div>
                                <div className="ap-detail-row">
                                    <i className="bi bi-shield-check"></i>
                                    <strong>Status</strong>
                                    <span className={`ap-status ${statusBadgeClass(project.status)}`}>
                                        {project.status || 'Under Review'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — documents */}
                    <div className="ap-popup-right">
                        <div className="ap-popup-section-title">
                            <i className="bi bi-paperclip"></i>
                            Submitted Documents
                        </div>

                        {docs.map(({ key, label, icon }) => {
                            const filename = project[key];
                            return (
                                <div className="ap-doc-card" key={key}>
                                    <div className="ap-doc-card-info">
                                        <div className="ap-doc-card-label">
                                            <i className={`bi ${icon} me-2`}></i>
                                            {label}
                                        </div>
                                        <div className="ap-doc-card-sub">
                                            {filename ? filename.split('/').pop() : 'Not submitted'}
                                        </div>
                                    </div>
                                    {filename ? (
                                        <a
                                            className="ap-open-link"
                                            href={`${UPLOADS_URL}/${filename}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="bi bi-box-arrow-up-right"></i>
                                            Open
                                        </a>
                                    ) : (
                                        <span className="ap-doc-missing">Not submitted</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="ap-popup-footer">
                    <div className="ap-popup-footer-left">
                        <button className="ap-close-footer-btn" onClick={onClose}>
                            <i className="bi bi-x-lg"></i>
                            Close
                        </button>
                    </div>
                    <div className="ap-popup-footer-right">
                        <button
                            className="ap-popup-review-btn"
                            onClick={handleReview}
                            disabled={reviewing}
                        >
                            <i className="bi bi-clipboard2-pulse"></i>
                            {reviewing ? 'Starting Review…' : 'Start Review'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────
const AssignedSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [selected,    setSelected]    = useState(null);
    const [filter,      setFilter]      = useState('All');

    const fetchAssigned = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/consultant/assigned`, { headers: authHdrs() });
            if (res.data.success) {
                setSubmissions(res.data.data);
            } else {
                setError('Failed to load assigned submissions.');
            }
            setLoading(false);
        } catch (err) {
            console.error('❌ Fetch error:', err);
            if (err.response?.status === 401) setError('Session expired. Please log in again.');
            else if (err.response?.status === 403) setError('Access denied. Consultant account required.');
            else setError('Failed to fetch assigned submissions.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const safe = async () => { if (mounted) await fetchAssigned(); };
        safe();
        const interval = setInterval(safe, 30000);
        return () => { mounted = false; clearInterval(interval); };
    }, [fetchAssigned]);

    // Move project to Under Review
    const handleStartReview = async (project) => {
        await axios.put(
            `${API_BASE_URL}/consultant/start-review`,
            { prefix: project.prefix, submissionId: project.id },
            { headers: authHdrs() }
        );
        // Remove from the assigned list immediately
        setSubmissions(prev => prev.filter(s => !(s.prefix === project.prefix && s.id === project.id)));
    };

    const visible = filter === 'All'
        ? submissions
        : submissions.filter(s => s.ip_type === filter);

    if (loading) return (
        <div className="assigned-page">
            <div className="ap-loader"><div className="ap-spinner"></div><p>Loading assigned submissions…</p></div>
        </div>
    );

    if (error) return (
        <div className="assigned-page">
            <div className="ap-error"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>
        </div>
    );

    return (
        <div className="assigned-page">

            {/* Toolbar */}
            <div className="ap-toolbar">
                <div className="ap-filter-group">
                    <span className="ap-filter-label">
                        <i className="bi bi-funnel me-1"></i>
                        IP Type:
                    </span>
                    <select className="ap-dropdown" value={filter} onChange={e => setFilter(e.target.value)}>
                        {FILTER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <span className="ap-result-count">
                    Showing <strong>{visible.length}</strong> of <strong>{submissions.length}</strong> application{submissions.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="ap-table-card">
                {visible.length === 0 ? (
                    <div className="ap-empty">
                        <i className="bi bi-inbox"></i>
                        <p>{submissions.length === 0 ? 'No applications assigned to you yet.' : `No ${filter} applications found.`}</p>
                        <span>{submissions.length === 0 ? 'Check back later or contact the administrator.' : 'Try a different filter.'}</span>
                    </div>
                ) : (
                    <table className="ap-table">
                        <thead>
                            <tr>
                                <th><i className="bi bi-hash"></i> REF</th>
                                <th><i className="bi bi-person"></i> INVENTOR</th>
                                <th><i className="bi bi-tag"></i> IP TYPE</th>
                                <th><i className="bi bi-calendar"></i> DATES</th>
                                <th><i className="bi bi-activity"></i> STATUS</th>
                                <th><i className="bi bi-lightning"></i> ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(s => (
                                <tr key={`${s.prefix}-${s.id}`}>
                                    <td>
                                        <span className="ap-ref-badge">{s.prefix.toUpperCase()}-{s.id}</span>
                                    </td>
                                    <td>
                                        <div className="ap-name">{s.inventor_name || '—'}</div>
                                        <div className="ap-email">{s.inventor_email || ''}</div>
                                    </td>
                                    <td>
                                        <span className={`ap-ip-badge ${ipBadgeClass(s.ip_type)}`}>
                                            {s.ip_type || '—'}
                                        </span>
                                        {s.project_type && (
                                            <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 4 }}>
                                                {s.project_type}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="ap-date-row">
                                            <span className="ap-date-label">Filed</span>
                                            <span className="ap-date">{fmtDate(s.date_submitted)}</span>
                                        </div>
                                        <div className="ap-date-row">
                                            <span className="ap-date-label">Assigned</span>
                                            <span className="ap-date">{fmtDate(s.assigned_at)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`ap-status ${statusBadgeClass(s.status)}`}>
                                            {s.status || 'Assigned'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="ap-actions-cell">
                                            <button className="ap-view-btn" onClick={() => setSelected(s)}>
                                                <i className="bi bi-eye"></i>
                                                View
                                            </button>
                                            <button
                                                className="ap-review-btn"
                                                onClick={async () => {
                                                    try { await handleStartReview(s); }
                                                    catch { alert('Could not start review. Please try again.'); }
                                                }}
                                            >
                                                <i className="bi bi-clipboard2-pulse"></i>
                                                Review
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Popup */}
            {selected && (
                <DetailModal
                    project={selected}
                    onClose={() => setSelected(null)}
                    onStartReview={handleStartReview}
                />
            )}
        </div>
    );
};

export default AssignedSubmissions;