import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './AdminResubmission.css';

// ── URL normalizer ────────────────────────────────────────────
const _RAW = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API  = _RAW.endsWith('/api') ? _RAW : `${_RAW}/api`;
const BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const fmt  = d => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

const IP_LABEL   = { um: 'Utility Model', id: 'Industrial Design', tm: 'Trademark', cr: 'Copyright' };
const PREFIX_MAP = { 'Utility Model': 'um', 'Industrial Design': 'id', 'Trademark': 'tm', 'Copyright': 'cr' };
const REF_PRE    = { um: 'UM', id: 'ID', tm: 'TM', cr: 'CR' };

/* ─────────────────────────────────────────────────────────────
   COMM LETTER UPLOAD MODAL
   Director uploads the signed Communication Letter PDF/DOCX
   — same pattern as the PAS Report uploader used by consultants
───────────────────────────────────────────────────────────── */
function CommLetterModal({ submission, refId, onClose, onUploaded }) {
    const [file,       setFile]       = useState(null);
    const [uploading,  setUploading]  = useState(false);
    const [error,      setError]      = useState('');
    const fileRef = useRef();

    const hasLetter = !!submission.comm_letter_path;
    const uploadedAt = submission.comm_letter_signed_at
        ? fmt(submission.comm_letter_signed_at) : null;

    const handleUpload = async () => {
        if (!file) { setError('Please select a file to upload.'); return; }
        setError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('commLetter', file);
            formData.append('submissionId', submission.id);

            const prefix    = PREFIX_MAP[submission.ip_type] || 'um';
            const apiPrefix = (prefix === 'um' || prefix === 'id') ? 'umid' : prefix;

            await axios.post(
                `${API}/${apiPrefix}/upload-comm-letter/${submission.id}`,
                formData,
                { headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' } }
            );
            onUploaded();
            onClose();
        } catch (err) {
            console.error('Comm letter upload error:', err);
            setError(err?.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="ar-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ar-modal">

                {/* Header */}
                <div className="ar-modal-header">
                    <div className="ar-modal-header-left">
                        <i className="bi bi-envelope-paper-fill"></i>
                        <div>
                            <h3>Communication Letter</h3>
                            <p>{refId} — {submission.title || 'Untitled'}</p>
                        </div>
                    </div>
                    <button className="ar-modal-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="ar-modal-body">

                    {/* Current status banner */}
                    <div className={`ar-letter-status ${hasLetter ? 'signed' : 'pending'}`}>
                        <i className={`bi ${hasLetter ? 'bi-patch-check-fill' : 'bi-hourglass-split'}`}></i>
                        {hasLetter
                            ? <>Letter Uploaded &amp; On File
                                {uploadedAt && <span className="ar-letter-date">on {uploadedAt}</span>}
                              </>
                            : <>No Communication Letter uploaded yet</>
                        }
                    </div>

                    {/* Already uploaded — view link */}
                    {hasLetter && (
                        <div className="ar-existing-letter">
                            <div className="ar-existing-letter-label">
                                <i className="bi bi-file-earmark-check-fill"></i>
                                Current Letter on File
                            </div>
                            <a
                                href={`${BASE}/uploads/${submission.comm_letter_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ar-view-letter-link"
                            >
                                <i className="bi bi-box-arrow-up-right"></i>
                                {submission.comm_letter_path.split('/').pop()}
                            </a>
                            <p className="ar-replace-hint">
                                You can replace the current letter by uploading a new file below.
                            </p>
                        </div>
                    )}

                    {/* Upload zone — same pattern as PAS report */}
                    <div className="ar-upload-section">
                        <div className="ar-upload-label">
                            <i className="bi bi-upload"></i>
                            {hasLetter ? 'Replace Communication Letter' : 'Upload Communication Letter'}
                        </div>
                        <p className="ar-upload-hint">
                            Upload the signed Communication Letter issued by the IPMO Director.
                            Accepted formats: PDF, DOC, DOCX. Max size: 20 MB.
                        </p>

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileRef}
                            accept=".pdf,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={e => {
                                setFile(e.target.files[0] || null);
                                setError('');
                            }}
                        />

                        {/* Drop / click zone */}
                        <div
                            className={`ar-upload-zone${file ? ' selected' : ''}`}
                            onClick={() => fileRef.current?.click()}
                        >
                            {file ? (
                                <>
                                    <i className="bi bi-file-earmark-check-fill ar-uz-icon selected"></i>
                                    <div className="ar-uz-filename">{file.name}</div>
                                    <div className="ar-uz-change">Click to change file</div>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-arrow-up ar-uz-icon"></i>
                                    <div className="ar-uz-cta">Click to select file</div>
                                    <div className="ar-uz-types">PDF, DOC, DOCX — max 20 MB</div>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="ar-upload-error">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Info about what happens after upload */}
                    <div className="ar-upload-info">
                        <i className="bi bi-info-circle"></i>
                        <span>
                            After uploading, the inventor will be able to view and download the
                            Communication Letter from their portal. The application remains in
                            <strong> Pending Resubmission</strong> status until the inventor
                            re-uploads the corrected documents.
                        </span>
                    </div>

                </div>

                {/* Footer */}
                <div className="ar-modal-footer">
                    <button className="ar-modal-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="ar-modal-upload-btn"
                        onClick={handleUpload}
                        disabled={uploading || !file}
                    >
                        {uploading
                            ? <><i className="bi bi-hourglass-split"></i> Uploading…</>
                            : <><i className="bi bi-cloud-arrow-up-fill"></i> Upload Letter</>
                        }
                    </button>
                </div>

            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function AdminResubmission() {
    const [submissions, setSubmissions] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [filter,      setFilter]      = useState('all');
    const [letterSub,   setLetterSub]   = useState(null);

    /* ── Data fetching ── */
    const load = useCallback(async () => {
        try {
            const [umid, tm, cr] = await Promise.all([
                axios.get(`${API}/umid-submissions-resubmission`, { headers: hdrs() }),
                axios.get(`${API}/tm-submissions-resubmission`,   { headers: hdrs() }),
                axios.get(`${API}/cr-submissions-resubmission`,   { headers: hdrs() }),
            ]);
            const all = [
                ...(Array.isArray(umid.data) ? umid.data : []),
                ...(Array.isArray(tm.data)   ? tm.data   : []),
                ...(Array.isArray(cr.data)   ? cr.data   : []),
            ];
            setSubmissions(all);
            setError(null);
        } catch (err) {
            console.error('❌ Admin resubmission load error:', err);
            setError('Failed to load resubmission data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [load]);

    /* ── Reopen for review ── */
    const handleReopenReview = async (submission) => {
        const prefix = submission.ip_type === 'Trademark' ? 'tm'
                     : submission.ip_type === 'Copyright'  ? 'cr'
                     : 'umid';
        const ok = window.confirm(
            `Return this application to Under Review?\n\nThe IP Specialist will be notified to begin re-checking.`
        );
        if (!ok) return;
        try {
            await axios.put(`${API}/${prefix}-reopen-review/${submission.id}`, {}, { headers: hdrs() });
            await load();
        } catch (err) {
            console.error('Reopen error:', err);
            alert('Failed to return to review. ' + (err?.response?.data?.error || ''));
        }
    };

    /* ── Derived data ── */
    const filtered = filter === 'all'
        ? submissions
        : submissions.filter(s => (PREFIX_MAP[s.ip_type] || 'um') === filter);

    const counts = {
        all: submissions.length,
        um:  submissions.filter(s => s.ip_type === 'Utility Model').length,
        id:  submissions.filter(s => s.ip_type === 'Industrial Design').length,
        tm:  submissions.filter(s => s.ip_type === 'Trademark').length,
        cr:  submissions.filter(s => s.ip_type === 'Copyright').length,
    };

    const withoutLetter = submissions.filter(s => !s.comm_letter_path).length;

    /* ── Loading ── */
    if (loading) return (
        <div className="ar-page">
            <div className="ar-page-inner">
                <div className="ar-loader">
                    <div className="ar-spinner"></div>
                    <p>Loading…</p>
                </div>
            </div>
        </div>
    );

    /* ── Main render ── */
    return (
        <div className="ar-page">
            <div className="ar-page-inner">

                {/* Page Header */}
                <div className="ar-page-header">
                    <div className="ar-page-header-left">
                        <div className="ar-page-icon">
                            <i className="bi bi-arrow-clockwise"></i>
                        </div>
                        <div>
                            <h1>Pending Resubmissions</h1>
                            <p>
                                Applications returned to the inventor by the IP Specialist for missing or
                                incomplete documents. Upload the signed Communication Letter for each
                                application, then the inventor resubmits through their portal.
                            </p>
                        </div>
                    </div>
                    {withoutLetter > 0 && (
                        <div className="ar-unsigned-alert">
                            <i className="bi bi-envelope-paper-fill"></i>
                            <span>
                                <strong>{withoutLetter}</strong> letter{withoutLetter > 1 ? 's' : ''} not yet uploaded
                            </span>
                        </div>
                    )}
                </div>

                {/* QCP Process Notice */}
                <div className="ar-qcp-notice">
                    <i className="bi bi-journal-check"></i>
                    <span>
                        <strong>Resubmission Process:</strong> Upload the signed Communication Letter
                        for each returned application. Once uploaded, the inventor can view it in
                        their portal and re-upload the corrected documents. The status will return
                        to <em>Under Review</em> automatically once they resubmit.
                        Use <em>Return to Review</em> only to manually trigger this if needed.
                    </span>
                </div>

                {error && (
                    <div className="ar-error">
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="ar-filter-tabs">
                    {['all', 'um', 'id', 'tm', 'cr'].map(f => (
                        <button
                            key={f}
                            className={`ar-filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'All Types' : IP_LABEL[f]}
                            <span className="ar-tab-count">{counts[f]}</span>
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="ar-table-card">
                    <div className="ar-table-scroll">
                        {filtered.length === 0 ? (
                            <div className="ar-empty">
                                <i className="bi bi-inbox"></i>
                                <p>No applications pending resubmission{filter !== 'all' ? ` for ${IP_LABEL[filter]}` : ''}.</p>
                            </div>
                        ) : (
                            <table className="ar-table">
                                <thead>
                                    <tr>
                                        <th>REF</th>
                                        <th>TITLE</th>
                                        <th>INVENTOR / APPLICANT</th>
                                        <th>IP TYPE</th>
                                        <th>MISSING ITEMS</th>
                                        <th>RETURNED ON</th>
                                        <th>COMM LETTER</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(s => {
                                        const prefix = PREFIX_MAP[s.ip_type] || 'um';
                                        const refId  = `${REF_PRE[prefix]}-${s.id}`;
                                        const missingItems = (s.missing_items || '')
                                            .split(/[;,]/).map(x => x.trim()).filter(Boolean);
                                        const hasLetter = !!s.comm_letter_path;

                                        return (
                                            <tr key={`${prefix}-${s.id}`}>

                                                {/* REF */}
                                                <td>
                                                    <span className="ar-ref-badge">{refId}</span>
                                                </td>

                                                {/* TITLE */}
                                                <td>
                                                    <div className="ar-title">{s.title || 'N/A'}</div>
                                                </td>

                                                {/* INVENTOR */}
                                                <td>
                                                    <div className="ar-inventor-name">{s.inventor_name || 'N/A'}</div>
                                                    <div className="ar-inventor-email">{s.inventor_email || ''}</div>
                                                </td>

                                                {/* IP TYPE */}
                                                <td>
                                                    <span className={`ar-type-badge ar-type-${prefix}`}>
                                                        {s.ip_type}
                                                    </span>
                                                </td>

                                                {/* MISSING ITEMS */}
                                                <td>
                                                    {missingItems.length > 0 ? (
                                                        <div className="ar-missing-cell">
                                                            <span className="ar-missing-count">
                                                                <i className="bi bi-x-circle-fill"></i>
                                                                {missingItems.length} item{missingItems.length > 1 ? 's' : ''}
                                                            </span>
                                                            <div className="ar-missing-list">
                                                                {missingItems.map((x, i) => (
                                                                    <div key={i} className="ar-missing-row">· {x}</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="ar-no-missing">See notes</span>
                                                    )}
                                                </td>

                                                {/* RETURNED ON */}
                                                <td className="ar-date">
                                                    {fmt(s.approval_date || s.updated_at)}
                                                </td>

                                                {/* COMM LETTER STATUS */}
                                                <td>
                                                    {hasLetter ? (
                                                        <a
                                                            href={`${BASE}/uploads/${s.comm_letter_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ar-letter-badge signed"
                                                        >
                                                            <i className="bi bi-file-earmark-check-fill"></i>
                                                            View Letter
                                                        </a>
                                                    ) : (
                                                        <span className="ar-letter-badge pending">
                                                            <i className="bi bi-hourglass-split"></i>
                                                            Not Uploaded
                                                        </span>
                                                    )}
                                                </td>

                                                {/* ACTION */}
                                                <td>
                                                    <div className="ar-action-col">
                                                        {/* Upload / Replace Letter */}
                                                        <button
                                                            className={`ar-letter-btn ${hasLetter ? 'signed' : 'unsigned'}`}
                                                            onClick={() => setLetterSub(s)}
                                                            title={hasLetter ? 'Replace uploaded letter' : 'Upload signed letter'}
                                                        >
                                                            <i className={`bi ${hasLetter ? 'bi-arrow-repeat' : 'bi-cloud-arrow-up-fill'}`}></i>
                                                            {hasLetter ? 'Replace Letter' : 'Upload Letter'}
                                                        </button>

                                                        {/* Return to Review */}
                                                        <button
                                                            className="ar-reopen-btn"
                                                            onClick={() => handleReopenReview(s)}
                                                            title="Manually return to Under Review"
                                                        >
                                                            <i className="bi bi-arrow-counterclockwise"></i>
                                                            Return to Review
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Communication Letter Upload Modal */}
                {letterSub && (
                    <CommLetterModal
                        submission={letterSub}
                        refId={`${REF_PRE[PREFIX_MAP[letterSub.ip_type] || 'um']}-${letterSub.id}`}
                        onClose={() => setLetterSub(null)}
                        onUploaded={load}
                    />
                )}

            </div>
        </div>
    );
}