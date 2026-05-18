// Tracker.jsx — Full-Screen Submission Tracker
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Tracker.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const getAuthToken = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return userData.token;
};
const getAxiosConfig = () => ({
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
});

// ── Status helpers ────────────────────────────────────────────
function statusMeta(status = '') {
    const s = status.toLowerCase();
    if (s.includes('filed') || s.includes('ipophl') || s.includes('nlp'))
        return { cls: 'trk-status-filed',      icon: 'bi-send-check-fill',        label: status };
    if (s.includes('approved'))
        return { cls: 'trk-status-approved',   icon: 'bi-check-circle-fill',      label: status };
    if (s.includes('under review') || s.includes('re-review'))
        return { cls: 'trk-status-review',     icon: 'bi-eye-fill',               label: status };
    if (s.includes('pending resubmission') || s.includes('resubmission'))
        return { cls: 'trk-status-resubmit',   icon: 'bi-arrow-repeat',           label: status };
    if (s.includes('rejected'))
        return { cls: 'trk-status-rejected',   icon: 'bi-x-circle-fill',          label: status };
    if (s.includes('submitted'))
        return { cls: 'trk-status-submitted',  icon: 'bi-hourglass-split',        label: status };
    return      { cls: 'trk-status-default',   icon: 'bi-circle',                 label: status };
}

function ipTypeMeta(type = '') {
    const t = type.toLowerCase();
    if (t.includes('utility'))    return { cls: 'trk-ip-um', short: 'UM' };
    if (t.includes('industrial')) return { cls: 'trk-ip-id', short: 'ID' };
    if (t.includes('trademark'))  return { cls: 'trk-ip-tm', short: 'TM' };
    if (t.includes('copyright'))  return { cls: 'trk-ip-cr', short: 'CR' };
    return                               { cls: 'trk-ip-def', short: '—' };
}

const fmt = d => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function Tracker() {
    const [submissions, setSubmissions] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [selected,    setSelected]    = useState(null);
    const [error,       setError]       = useState(null);
    const [filter,      setFilter]      = useState('All');
    const [search,      setSearch]      = useState('');

    const fetchSubmissions = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const token = getAuthToken();
            if (!token) { setError("Authentication required. Please log in."); return; }

            const res = await axios.get(`${API_BASE_URL}/tracker/submissions`, getAxiosConfig());
            setSubmissions(res.data || []);
        } catch (e) {
            if (e.response?.status === 401) setError("Session expired. Please log in again.");
            else setError("Failed to load submissions.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
        const t = setInterval(() => fetchSubmissions(true), 30000);
        return () => clearInterval(t);
    }, [fetchSubmissions]);

    const openDetails = async (prefix, id) => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/tracker/submission/${prefix}/${id}`,
                getAxiosConfig()
            );
            setSelected(res.data);
        } catch (e) {
            if (e.response?.status === 404) alert("Submission not found.");
            else if (e.response?.status === 401) alert("Session expired.");
            else alert("Failed to load submission details.");
        }
    };

    const handleDeleteRejected = async (prefix, id) => {
        try {
            await axios.put(
                `${API_BASE_URL}/tracker/submission/${prefix}/${id}/done`,
                {},
                getAxiosConfig()
            );
            setSubmissions(prev => prev.filter(s => !(s.prefix === prefix && s.id === id)));
            setSelected(null);
        } catch (e) {
            alert("Failed to remove submission. Please try again.");
        }
    };

    // Filter + search
    const STATUS_FILTERS = ['All', 'Submitted', 'Under Review', 'Approved for Filing', 'Filed to IPOPHL', 'Pending Resubmission', 'Rejected'];
    const visible = submissions.filter(s => {
        const matchFilter = filter === 'All' || s.status === filter;
        const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase())
            || s.submissionType?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    // Summary counts
    const counts = {
        total:    submissions.length,
        active:   submissions.filter(s => ['Submitted','Under Review','Under Re-review','Approved for Filing'].includes(s.status)).length,
        filed:    submissions.filter(s => s.status?.includes('Filed')).length,
        rejected: submissions.filter(s => s.status === 'Rejected').length,
    };

    return (
        <div className="trk-page">

            {/* ── Header ── */}
            <div className="trk-header">
                <div className="trk-header-left">
                    <div className="trk-header-icon"><i className="bi bi-journal-bookmark-fill"></i></div>
                    <div>
                        <h1 className="trk-title">My Submissions</h1>
                        <p className="trk-subtitle">Track the status of all your IP applications</p>
                    </div>
                </div>
                <button
                    className={`trk-refresh-btn ${refreshing ? 'trk-refreshing' : ''}`}
                    disabled={refreshing}
                    onClick={() => fetchSubmissions(true)}
                >
                    <i className={`bi bi-arrow-clockwise ${refreshing ? 'trk-spin' : ''}`}></i>
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {/* ── Summary Cards ── */}
            <div className="trk-summary-row">
                <div className="trk-summary-card trk-sum-total">
                    <i className="bi bi-folder2-open"></i>
                    <div><span className="trk-sum-num">{counts.total}</span><span className="trk-sum-label">Total</span></div>
                </div>
                <div className="trk-summary-card trk-sum-active">
                    <i className="bi bi-hourglass-split"></i>
                    <div><span className="trk-sum-num">{counts.active}</span><span className="trk-sum-label">In Progress</span></div>
                </div>
                <div className="trk-summary-card trk-sum-filed">
                    <i className="bi bi-send-check-fill"></i>
                    <div><span className="trk-sum-num">{counts.filed}</span><span className="trk-sum-label">Filed</span></div>
                </div>
                <div className="trk-summary-card trk-sum-rejected">
                    <i className="bi bi-x-circle-fill"></i>
                    <div><span className="trk-sum-num">{counts.rejected}</span><span className="trk-sum-label">Rejected</span></div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="trk-toolbar">
                <div className="trk-search-wrap">
                    <i className="bi bi-search trk-search-icon"></i>
                    <input
                        className="trk-search"
                        type="text"
                        placeholder="Search by title or IP type…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="trk-search-clear" onClick={() => setSearch('')}>
                            <i className="bi bi-x"></i>
                        </button>
                    )}
                </div>
                <div className="trk-filters">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f}
                            className={`trk-filter-pill ${filter === f ? 'trk-filter-active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="trk-error">
                    <i className="bi bi-exclamation-triangle-fill"></i> {error}
                </div>
            )}

            {/* ── Content ── */}
            {loading ? (
                <div className="trk-loading">
                    <div className="trk-spinner"></div>
                    <p>Loading your submissions…</p>
                </div>
            ) : visible.length === 0 ? (
                <div className="trk-empty">
                    <i className="bi bi-inbox"></i>
                    <h3>{submissions.length === 0 ? "No submissions yet" : `No results for "${search || filter}"`}</h3>
                    <p>{submissions.length === 0
                        ? "Submit your IP application to start tracking it here."
                        : "Try a different search term or filter."}</p>
                </div>
            ) : (
                <div className="trk-table-card">
                    <div className="trk-table-meta">
                        Showing <strong>{visible.length}</strong> of <strong>{submissions.length}</strong> submission{submissions.length !== 1 ? 's' : ''}
                    </div>
                    <div className="trk-table-scroll">
                        <table className="trk-table">
                            <thead>
                                <tr>
                                    <th><i className="bi bi-hash"></i> REF</th>
                                    <th><i className="bi bi-card-heading"></i> TITLE</th>
                                    <th><i className="bi bi-tag"></i> IP TYPE</th>
                                    <th><i className="bi bi-calendar3"></i> SUBMITTED</th>
                                    <th><i className="bi bi-activity"></i> STATUS</th>
                                    <th><i className="bi bi-list-ul"></i> ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(item => {
                                    const st = statusMeta(item.status);
                                    const ip = ipTypeMeta(item.submissionType);
                                    const refId = `${(item.prefix || '').toUpperCase()}-${item.id}`;
                                    return (
                                        <tr key={`${item.prefix}-${item.id}`} className="trk-row">
                                            <td>
                                                <span className="trk-ref-badge">{refId}</span>
                                            </td>
                                            <td>
                                                <div className="trk-title-cell">{item.title || '—'}</div>
                                            </td>
                                            <td>
                                                <span className={`trk-ip-badge ${ip.cls}`}>
                                                    <span className="trk-ip-short">{ip.short}</span>
                                                    <span className="trk-ip-full">{item.submissionType || '—'}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <span className="trk-date">{fmt(item.filing_date || item.date_submitted || item.created_at)}</span>
                                            </td>
                                            <td>
                                                <span className={`trk-status-badge ${st.cls}`}>
                                                    <i className={`bi ${st.icon}`}></i>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="trk-view-btn"
                                                    onClick={() => openDetails(item.prefix, item.id)}
                                                >
                                                    <i className="bi bi-eye"></i> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {selected && (
                <TrackerModal
                    submission={selected}
                    close={() => setSelected(null)}
                    onDelete={handleDeleteRejected}
                />
            )}
        </div>
    );
}

// ── DETAIL MODAL ──────────────────────────────────────────────
function TrackerModal({ submission, close, onDelete }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const isRejected = submission.status === "Rejected";
    const isPendingResubmit = submission.status === "Pending Resubmission";
    const st = statusMeta(submission.status);
    const ip = ipTypeMeta(submission.submissionType);

    const rejectedEntry = isRejected && submission.timeline
        ? [...(submission.timeline)].reverse().find(t => t.stage === "Rejected" && t.note)
        : null;

    return (
        <div className="trk-modal-overlay" onClick={close}>
            <div className="trk-modal" onClick={e => e.stopPropagation()}>

                {/* Modal Header */}
                <div className="trk-modal-header">
                    <div className="trk-modal-header-left">
                        <span className={`trk-ip-badge ${ip.cls}`} style={{ marginBottom: 8 }}>
                            <span className="trk-ip-short">{ip.short}</span>
                            <span className="trk-ip-full">{submission.submissionType || '—'}</span>
                        </span>
                        <h3 className="trk-modal-title">{submission.title || 'Untitled'}</h3>
                        <span className={`trk-status-badge ${st.cls}`} style={{ marginTop: 6 }}>
                            <i className={`bi ${st.icon}`}></i> {st.label}
                        </span>
                    </div>
                    <button className="trk-modal-close" onClick={close}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* Rejection reason */}
                {isRejected && rejectedEntry && (
                    <div className="trk-rejection-box">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <div>
                            <strong>Rejection Reason</strong>
                            <p>{rejectedEntry.note}</p>
                        </div>
                    </div>
                )}

                {/* Pending resubmission notice */}
                {isPendingResubmit && submission.timeline && (
                    (() => {
                        const resubEntry = [...(submission.timeline)].reverse().find(
                            t => t.stage?.includes('Resubmission') && t.note
                        );
                        return resubEntry ? (
                            <div className="trk-resubmit-box">
                                <i className="bi bi-arrow-repeat"></i>
                                <div>
                                    <strong>Action Required — Resubmission Needed</strong>
                                    <p>{resubEntry.note}</p>
                                </div>
                            </div>
                        ) : null;
                    })()
                )}

                {/* Timeline */}
                <div className="trk-modal-body">
                    <div className="trk-timeline-label">
                        <i className="bi bi-clock-history"></i> Application Timeline
                    </div>
                    <div className="trk-timeline">
                        {submission.timeline?.length > 0 ? (
                            submission.timeline.map((t, i) => (
                                <div key={i} className={`trk-tl-item ${t.completed ? 'trk-tl-done' : 'trk-tl-pending'}`}>
                                    <div className="trk-tl-dot">
                                        {t.completed
                                            ? <i className="bi bi-check-lg"></i>
                                            : <i className="bi bi-circle"></i>}
                                    </div>
                                    <div className="trk-tl-content">
                                        <div className="trk-tl-stage">{t.stage}</div>
                                        <div className="trk-tl-date">{t.date}</div>
                                        {t.note && <div className="trk-tl-note">{t.note}</div>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: 14 }}>No timeline data available.</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="trk-modal-footer">
                    {isRejected && (
                        <button className="trk-remove-btn" onClick={() => setShowConfirm(true)}>
                            <i className="bi bi-trash3"></i> Remove
                        </button>
                    )}
                    <button className="trk-ok-btn" onClick={close}>
                        Close
                    </button>
                </div>
            </div>

            {/* Confirm delete */}
            {showConfirm && (
                <div className="trk-confirm-overlay" onClick={e => e.stopPropagation()}>
                    <div className="trk-confirm-box">
                        <div className="trk-confirm-icon">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                        </div>
                        <h4>Remove Submission?</h4>
                        <p>Are you sure you want to permanently remove <strong>"{submission.title}"</strong>? This cannot be undone.</p>
                        <div className="trk-confirm-btns">
                            <button className="trk-confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="trk-confirm-delete" onClick={() => { setShowConfirm(false); onDelete(submission.prefix, submission.id); }}>
                                <i className="bi bi-trash3"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}