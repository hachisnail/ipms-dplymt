import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './ApprovedReview.css';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const API_BASE = API.replace('/api', '');
const hdrs     = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const fmt      = d => d ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : 'N/A';

const DOC_DEFS = {
    um: [
        { label: 'Endorsement Letter',         field: 'endorsement_letter_path', icon: 'bi-file-earmark-text'  },
        { label: 'Technology Disclosure Form',  field: 'disclosure_form_path',   icon: 'bi-file-earmark-text'  },
        { label: 'Drawings / Illustrations',   field: 'drawings_path',           icon: 'bi-file-earmark-image' },
        { label: 'Government-Issued ID',       field: 'government_id_path',      icon: 'bi-person-vcard'       },
    ],
    id: [
        { label: 'Endorsement Letter',         field: 'endorsement_letter_path', icon: 'bi-file-earmark-text'  },
        { label: 'Technology Disclosure Form', field: 'disclosure_form_path',    icon: 'bi-file-earmark-text'  },
        { label: 'All-View Photos / Drawings', field: 'drawings_path',           icon: 'bi-file-earmark-image' },
        { label: 'Government-Issued ID',       field: 'government_id_path',      icon: 'bi-person-vcard'       },
    ],
    tm: [
        { label: 'Endorsement Letter',         field: 'endorsement_letter_path', icon: 'bi-file-earmark-text'  },
        { label: 'IPOPHL Application Form',    field: 'application_form_path',   icon: 'bi-file-earmark-text'  },
        { label: 'Specimen / Sample of Mark',  field: 'specimen_path',           icon: 'bi-file-earmark-image' },
        { label: 'Government-Issued ID',       field: 'government_id_path',      icon: 'bi-person-vcard'       },
        { label: 'Proof of Use',               field: 'proof_of_use_path',       icon: 'bi-file-earmark-check', optional: true },
    ],
    cr: [
        { label: 'Endorsement Letter',               field: 'endorsement_letter_path', icon: 'bi-file-earmark-text'  },
        { label: 'BCRR Copyright Enrollment Form',   field: 'bcrr_form_path',          icon: 'bi-file-earmark-text'  },
        { label: 'BCRR Form 2 Supplemental Form',    field: 'bcrr_form2_path',         icon: 'bi-file-earmark-text'  },
        { label: 'Notarized Deed of Assignment',     field: 'deed_of_assignment_path', icon: 'bi-file-earmark-text'  },
        { label: "Author Gov-Issued ID (signed 3×)", field: 'author_id_path',          icon: 'bi-person-vcard'       },
        { label: 'Copy of Creative Work',            field: 'creative_work_path',      icon: 'bi-file-earmark-image' },
    ],
};

const IP_LABEL = { um: 'Utility Model', id: 'Industrial Design', tm: 'Trademark', cr: 'Copyright' };

const fileIcon = p => {
    if (!p) return 'bi-file-earmark';
    const e = p.split('.').pop().toLowerCase();
    if (e === 'pdf') return 'bi-file-earmark-pdf-fill';
    if (['doc','docx'].includes(e)) return 'bi-file-earmark-word-fill';
    if (['jpg','jpeg','png','gif','webp'].includes(e)) return 'bi-file-earmark-image-fill';
    return 'bi-file-earmark-fill';
};
const fileColor = p => {
    if (!p) return '#9ca3af';
    const e = p.split('.').pop().toLowerCase();
    if (e === 'pdf') return '#ef4444';
    if (['doc','docx'].includes(e)) return '#2563eb';
    if (['jpg','jpeg','png','gif','webp'].includes(e)) return '#059669';
    return '#6b7280';
};

export default function ApprovedReviewPanel({ project, ipType, refId, onClose }) {
    const docs          = DOC_DEFS[ipType] || DOC_DEFS.um;
    const availableDocs = docs.filter(d => project[d.field]);
    const subType       = project.ip_type || project.mark_type || project.work_type || project.project_type || '—';

    const [pasFile,     setPasFile]     = useState(null);
    const [uploading,   setUploading]   = useState(false);
    const [uploadDone,  setUploadDone]  = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [dragOver,    setDragOver]    = useState(false);
    const fileRef = useRef();

    // If PAS already uploaded, pre-show success state
    const alreadyUploaded = !!project.pas_report_path;

    // CR only — no PAS needed, direct Mark as Filed
    const [approving,    setApproving]    = useState(false);
    const [approvedDone, setApprovedDone] = useState(false);
    const [approveError, setApproveError] = useState(null);
    const [confirmOpen,  setConfirmOpen]  = useState(false);

    const handleMarkFiled = async () => {
        setApproving(true); setApproveError(null);
        try {
            await axios.put(
                `${API}/cr-review-action/${project.id}`,
                { action: 'Filed to IPOPHL' },
                { headers: hdrs() }
            );
            setApprovedDone(true);
        } catch (err) {
            setApproveError(err.response?.data?.error || 'Action failed. Please try again.');
        } finally {
            setApproving(false);
            setConfirmOpen(false);
        }
    };

    const handleFileDrop = e => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0]; if (f) setPasFile(f);
    };

    const handleSubmitPAS = async () => {
        if (!pasFile) return;
        setUploading(true); setUploadError(null);
        try {
            const form = new FormData();
            form.append('pasReport', pasFile);
            form.append('prefix', (ipType === 'id' || ipType === 'um') ? 'umid' : ipType);
            form.append('submissionId', project.id);
            await axios.post(`${API}/approved/upload-pas`, form, {
                headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' }
            });
            setUploadDone(true);
        } catch (err) {
            setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const infoRows = [
        { icon: 'bi-hash',           label: 'Reference',  value: refId },
        { icon: 'bi-tag',            label: 'IP Type',    value: IP_LABEL[ipType] },
        { icon: 'bi-layers',         label: 'Sub-type',   value: subType },
        { icon: 'bi-person',         label: 'Inventor',   value: project.inventor_name || project.full_name || 'N/A' },
        { icon: 'bi-envelope',       label: 'Email',      value: project.inventor_email || project.email || 'N/A' },
        { icon: 'bi-calendar3',      label: 'Filed',      value: fmt(project.filing_date) },
        { icon: 'bi-calendar-check', label: 'Approved',   value: fmt(project.approval_date) },
    ];

    const panel = (
        <div className="apr-triage-overlay">
            <div className="apr-triage-panel">

                {/* ── Header ── */}
                <div className="apr-triage-header">
                    <div className="apr-triage-header-icon">
                        <i className="bi bi-check2-circle"></i>
                    </div>
                    <div className="apr-triage-header-info">
                        <h2>{project.title || 'Untitled Submission'}</h2>
                        <div className="apr-triage-meta">
                            <span className="apr-triage-meta-item">
                                <i className="bi bi-hash"></i><strong>{refId}</strong>
                            </span>
                            <span className="apr-triage-meta-item">
                                <i className="bi bi-tag"></i><strong>{IP_LABEL[ipType]}</strong>
                            </span>
                            {project.inventor_name && (
                                <span className="apr-triage-meta-item">
                                    <i className="bi bi-person"></i><strong>{project.inventor_name}</strong>
                                </span>
                            )}
                            <span className="apr-triage-meta-item apr-meta-approved">
                                <i className="bi bi-check-circle-fill"></i>
                                <strong>Approved {fmt(project.approval_date)}</strong>
                            </span>
                        </div>
                    </div>
                    <button className="apr-triage-close-btn" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* ── Body — 3 cols ── */}
                <div className="apr-triage-body">

                    {/* COL 1 — Submission Details */}
                    <div className="apr-triage-col">
                        <div className="apr-triage-section-title">
                            <i className="bi bi-info-circle"></i>Submission Details
                        </div>
                        <div className="apr-info-block">
                            {infoRows.map(r => (
                                <div key={r.label} className="apr-info-row">
                                    <i className={`bi ${r.icon}`}></i>
                                    <span className="apr-tir-label">{r.label}</span>
                                    <span className="apr-tir-value">{r.value}</span>
                                </div>
                            ))}
                        </div>
                        {project.triage_notes && (
                            <>
                                <div className="apr-triage-section-title" style={{ marginTop: 20 }}>
                                    <i className="bi bi-chat-dots"></i>Reviewer Notes
                                </div>
                                <div className="apr-reviewer-notes">{project.triage_notes}</div>
                            </>
                        )}
                    </div>

                    {/* COL 2 — Submitted Documents */}
                    <div className="apr-triage-col">
                        <div className="apr-triage-section-title">
                            <i className="bi bi-folder2-open"></i>
                            Submitted Documents
                            <span className="apr-doc-count-badge">{availableDocs.length}/{docs.length}</span>
                        </div>
                        {docs.map(d => {
                            const fp  = project[d.field];
                            const fn  = fp ? fp.split('/').pop() : null;
                            return (
                                <div key={d.field} className={`triage-doc-card ${!fp ? 'apr-doc-card-missing' : ''}`}>
                                    <div className="triage-doc-info">
                                        <div className="triage-doc-name">
                                            <i className={`bi ${fp ? fileIcon(fp) : d.icon} me-2`}
                                               style={{ color: fp ? fileColor(fp) : '#cbd5e1' }}></i>
                                            {d.label}
                                            {d.optional && <span className="apr-optional-tag"> (optional)</span>}
                                        </div>
                                        <div className="triage-doc-sub">{fn || 'Not submitted'}</div>
                                    </div>
                                    {fp ? (
                                        <a href={`${API_BASE}/uploads/${fp}`}
                                           target="_blank" rel="noopener noreferrer"
                                           className="triage-doc-open">
                                            <i className="bi bi-box-arrow-up-right"></i> Open
                                        </a>
                                    ) : (
                                        <span className="triage-doc-missing">
                                            <i className="bi bi-dash-circle me-1"></i>Missing
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* COL 3 — Mark as Filed (CR) or PAS Upload (UM/ID/TM) */}
                    <div className="apr-triage-col">

                        {ipType === 'cr' ? (
                            /* ── CR: no PAS required — direct Mark as Filed ── */
                            <>
                                <div className="apr-triage-section-title">
                                    <i className="bi bi-check2-all"></i>Filing Action
                                </div>
                                {approvedDone ? (
                                    <div className="apr-upload-success">
                                        <i className="bi bi-check-circle-fill"></i>
                                        <p>Marked as Filed!</p>
                                        <span>This Copyright submission has been successfully filed with IPOPHL.</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="apr-upload-desc">
                                            Copyright submissions do not require a PAS Report.
                                            Once all documents have been reviewed, click below to confirm
                                            and mark this submission as officially filed with IPOPHL.
                                        </p>
                                        {confirmOpen ? (
                                            <div style={{
                                                background: '#fff7ed', border: '1px solid #fdba74',
                                                borderRadius: 10, padding: '18px 16px', marginBottom: 14,
                                            }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>
                                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm Filing
                                                </p>
                                                <p style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6, marginBottom: 14 }}>
                                                    Are you sure you want to mark <strong>{project.title}</strong> as filed?
                                                    This action cannot be undone.
                                                </p>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="apr-submit-btn"
                                                        style={{ flex: 1, background: 'linear-gradient(135deg,#059669 0%,#047857 100%)' }}
                                                        onClick={handleMarkFiled} disabled={approving}>
                                                        {approving
                                                            ? <><span className="apr-spinner"></span> Processing…</>
                                                            : <><i className="bi bi-check-circle-fill"></i> Yes, Mark as Filed</>
                                                        }
                                                    </button>
                                                    <button onClick={() => setConfirmOpen(false)} style={{
                                                        padding: '10px 16px', border: '1px solid #d1d5db',
                                                        borderRadius: 8, background: '#fff', fontSize: 13,
                                                        cursor: 'pointer', fontFamily: 'var(--font)',
                                                    }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="apr-submit-btn"
                                                style={{ background: 'linear-gradient(135deg,#059669 0%,#047857 100%)' }}
                                                onClick={() => setConfirmOpen(true)}>
                                                <i className="bi bi-check-circle-fill"></i> Mark as Filed to IPOPHL
                                            </button>
                                        )}
                                        {approveError && (
                                            <div className="apr-upload-error" style={{ marginTop: 12 }}>
                                                <i className="bi bi-exclamation-triangle-fill"></i> {approveError}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            /* ── UM / ID / TM: PAS Report upload required ── */
                            <>
                                <div className="apr-triage-section-title">
                                    <i className="bi bi-cloud-upload"></i>PAS Report Upload
                                </div>

                                {(uploadDone || alreadyUploaded) ? (
                                    <div className="apr-upload-success">
                                        <i className="bi bi-check-circle-fill"></i>
                                        <p>PAS Report {uploadDone ? 'submitted!' : 'already uploaded'}</p>
                                        <span>
                                            {uploadDone
                                                ? 'The admin has been notified and will review shortly.'
                                                : 'Awaiting admin approval in PAS Reports.'}
                                        </span>
                                        {alreadyUploaded && project.pas_report_path && (
                                            <a href={`${API_BASE}/uploads/${project.pas_report_path}`}
                                               target="_blank" rel="noopener noreferrer"
                                               style={{
                                                   display: 'inline-flex', alignItems: 'center', gap: 6,
                                                   marginTop: 14, fontSize: 13, fontWeight: 700,
                                                   color: '#059669', textDecoration: 'none',
                                                   background: '#d1fae5', padding: '6px 14px',
                                                   borderRadius: 8, border: '1px solid #6ee7b7',
                                               }}>
                                                <i className="bi bi-box-arrow-up-right"></i> View Uploaded PAS
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p className="apr-upload-desc">
                                            Upload your official Prior Art Search (PAS) Report for this{' '}
                                            <strong>{IP_LABEL[ipType]}</strong> submission.
                                            Once uploaded, the admin will review and approve it in the PAS Reports page
                                            before it is officially filed with IPOPHL.
                                        </p>
                                        <div
                                            className={`apr-dropzone ${dragOver ? 'apr-dropzone-active' : ''} ${pasFile ? 'apr-dropzone-has-file' : ''}`}
                                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleFileDrop}
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png"
                                                style={{ display: 'none' }}
                                                onChange={e => setPasFile(e.target.files[0] || null)}
                                            />
                                            {pasFile ? (
                                                <div className="apr-dropzone-file">
                                                    <i className="bi bi-file-earmark-check-fill"></i>
                                                    <div className="apr-dropzone-filename">{pasFile.name}</div>
                                                    <div className="apr-dropzone-filesize">{(pasFile.size / 1024).toFixed(1)} KB</div>
                                                    <button className="apr-dropzone-remove"
                                                        onClick={e => { e.stopPropagation(); setPasFile(null); }}>
                                                        <i className="bi bi-x-circle-fill"></i> Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="apr-dropzone-empty">
                                                    <i className="bi bi-cloud-arrow-up"></i>
                                                    <p>Drag &amp; drop PAS Report here</p>
                                                    <span>or click to browse</span>
                                                    <div className="apr-dropzone-hint">PDF, DOC, DOCX, JPG, PNG</div>
                                                </div>
                                            )}
                                        </div>
                                        {uploadError && (
                                            <div className="apr-upload-error">
                                                <i className="bi bi-exclamation-triangle-fill"></i> {uploadError}
                                            </div>
                                        )}
                                        <button className="apr-submit-btn"
                                            onClick={handleSubmitPAS}
                                            disabled={!pasFile || uploading}>
                                            {uploading
                                                ? <><span className="apr-spinner"></span> Uploading…</>
                                                : <><i className="bi bi-send-fill"></i> Submit PAS Report to Admin</>
                                            }
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                    </div>

                </div>{/* end body */}

                {/* ── Footer ── */}
                <div className="apr-triage-footer">
                    <div>
                        <button className="triage-back-btn" onClick={onClose}>
                            <i className="bi bi-arrow-left"></i> Back to List
                        </button>
                    </div>
                    <div>
                        <span className="apr-footer-status">
                            <i className="bi bi-check-circle-fill"></i>
                            Approved for Filing
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );

    return ReactDOM.createPortal(panel, document.body);
}