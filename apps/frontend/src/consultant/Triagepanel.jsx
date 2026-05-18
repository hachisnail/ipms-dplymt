// TriagePanel.jsx — CNSC-IPMO Triage & Review Panel
// PAS flow:
//   Inventor submits their own PAS with the application → visible here (read-only, doc5_path).
//   Specialist uploads the official PAS Report in ApprovedReviewPanel (Approved tab only).
import React, { useState } from 'react';
import './UnderReview.css';

const API_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:3006/api').replace('/api', '');

// ── QCP Checklists per IP type ──────────────────────────────────────────────
const CHECKLISTS = {
    um: [
        { key: 'chk_cover_letter',     label: 'Endorsement / Cover Letter',        desc: 'Signed endorsement letter from the department head is present.' },
        { key: 'chk_disclosure_form',  label: 'Technology Disclosure Form',         desc: 'CNSC Technology Disclosure Form fully accomplished (all fields).' },
        { key: 'chk_drawings',         label: 'Drawings / Illustrations',           desc: 'Clear engineering drawings with all required views (front, side, top, perspective).' },
        { key: 'chk_description',      label: 'Description is Clear',               desc: 'Written description clearly identifies the utility and claimed features.' },
        { key: 'chk_inventor_details', label: 'Inventor Details Verified',          desc: 'All inventors listed with complete contact info and CNSC affiliation.' },
        { key: 'chk_gov_id',           label: 'Government-Issued ID Attached',      desc: 'Valid government-issued ID of the lead inventor is attached.' },
        { key: 'chk_inventor_pas',     label: "Inventor's PAS Report Submitted",    desc: "Inventor's own Prior Art Search report is attached and reviewed. The Specialist will conduct an independent PAS before IPOPHL filing." },
    ],
    id: [
        { key: 'chk_cover_letter',     label: 'Endorsement / Cover Letter',         desc: 'Signed endorsement letter from the department head is present.' },
        { key: 'chk_disclosure_form',  label: 'Technology Disclosure Form',         desc: 'CNSC Technology Disclosure Form fully accomplished (all fields).' },
        { key: 'chk_all_views',        label: 'All-View Photos / Illustrations',    desc: 'Photos from all required views: front, back, left, right, top, bottom, perspective.' },
        { key: 'chk_description',      label: 'Ornamental Description',             desc: 'Written description clearly identifies all ornamental features claimed.' },
        { key: 'chk_inventor_details', label: 'Designer Details Verified',          desc: 'All designers listed with complete contact info and CNSC affiliation.' },
        { key: 'chk_gov_id',           label: 'Government-Issued ID Attached',      desc: 'Valid government-issued ID of the lead designer is attached.' },
        { key: 'chk_inventor_pas',     label: "Designer's PAS Report Submitted",    desc: "Designer's own Prior Art Search report is attached and reviewed. The Specialist will conduct an independent PAS before IPOPHL filing." },
    ],
    tm: [
        { key: 'chk_cover_letter',     label: 'Endorsement / Cover Letter',         desc: 'Signed endorsement letter from the department head is present.' },
        { key: 'chk_ipophl_form',      label: 'IPOPHL Trademark Application Form',  desc: 'IPOPHL Trademark application form is fully accomplished and correct.' },
        { key: 'chk_specimen',         label: 'Specimen / Sample of Mark',          desc: 'Clear representation of the mark (logo, wordmark, or combined) is attached.' },
        { key: 'chk_mark_type',        label: 'Mark Type Specified',                desc: 'Type of mark correctly identified (word mark, device, combined, etc.).' },
        { key: 'chk_goods_services',   label: 'Goods / Services Listed',            desc: 'All goods/services under the applicable Nice Classification are listed.' },
        { key: 'chk_inventor_details', label: 'Applicant Details Verified',         desc: 'Applicant name, CNSC unit, and contact details are complete and verified.' },
        { key: 'chk_gov_id',           label: 'Government-Issued ID Attached',      desc: 'Valid government-issued ID of the applicant is attached.' },
    ],
    cr: [
        { key: 'chk_cover_letter',     label: 'Endorsement / Cover Letter',              desc: 'Signed endorsement letter from the department head is present.' },
        { key: 'chk_bcrr1',           label: 'BCRR Copyright Enrollment Form (4 sets)',  desc: 'BCRR Form 1 submitted in 4 sets, duly accomplished.' },
        { key: 'chk_bcrr2',           label: 'BCRR Form 2 Supplemental Form (4 sets)',   desc: 'BCRR Supplemental Form submitted in 4 sets with complete data.' },
        { key: 'chk_deed',            label: 'Notarized Deed of Assignment (4 sets)',     desc: 'Notarized Deed of Assignment is present in 4 sets.' },
        { key: 'chk_author_id',       label: "Author's Gov-ID signed 3× (4 sets)",       desc: "Author's government-issued ID with 3 specimen signatures, in 4 sets." },
        { key: 'chk_creative_work',   label: 'Copy of Creative Work (4 sets)',            desc: 'Complete copy of the creative work submitted in 4 sets.' },
        { key: 'chk_work_type',       label: 'Work Type Correctly Identified',            desc: 'Type of copyrightable work correctly identified per RA 8293.' },
        { key: 'chk_inventor_details',label: 'Author / Creator Details Verified',         desc: 'Author name, CNSC affiliation, and contact details are verified.' },
        { key: 'chk_inventor_pas',     label: "Author's PAS Report Submitted",            desc: "Author's own Prior Art Search report is attached and reviewed. The Specialist will conduct an independent PAS before filing." },
    ],
};

const DOC_PANELS = {
    um: [
        { key: 'endorsement_letter_path', label: 'Endorsement Letter',             icon: 'bi-file-earmark-text'  },
        { key: 'doc2_path',               label: 'Technology Disclosure Form',     icon: 'bi-file-earmark-text'  },
        { key: 'doc3_path',               label: 'Drawings / Illustrations',       icon: 'bi-file-earmark-image' },
        { key: 'doc4_path',               label: 'Government-Issued ID',           icon: 'bi-person-vcard'       },
        { key: 'doc5_path',               label: "Inventor's PAS Report",          icon: 'bi-file-earmark-check', inventorPas: true },
    ],
    id: [
        { key: 'endorsement_letter_path', label: 'Endorsement Letter',             icon: 'bi-file-earmark-text'  },
        { key: 'doc2_path',               label: 'Technology Disclosure Form',     icon: 'bi-file-earmark-text'  },
        { key: 'doc3_path',               label: 'All-View Photos',                icon: 'bi-file-earmark-image' },
        { key: 'doc4_path',               label: 'Government-Issued ID',           icon: 'bi-person-vcard'       },
        { key: 'doc5_path',               label: "Designer's PAS Report",          icon: 'bi-file-earmark-check', inventorPas: true },
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
        { key: 'doc7_path',               label: "Author's PAS Report",                      icon: 'bi-file-earmark-check', inventorPas: true },
    ],
};

const IP_LABEL   = { um: 'Utility Model', id: 'Industrial Design', tm: 'Trademark', cr: 'Copyright' };
const REF_PREFIX = { um: 'UM', id: 'ID', tm: 'TM', cr: 'CR' };
const APPLICANT  = { um: 'inventor', id: 'designer', tm: 'applicant', cr: 'author' };

function fmtDate(d) {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Resubmission Confirmation Modal ─────────────────────────────────────────
function ResubConfirmModal({ missingItems, ipType, isSaving, onCancel, onConfirm }) {
    const [notes, setNotes] = useState('');
    const applicant = APPLICANT[ipType] || 'applicant';

    return (
        <div className="resub-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="resub-modal resub-modal--wide">
                <div className="resub-header">
                    <i className="bi bi-arrow-clockwise"></i>
                    <div>
                        <h3>Return for Resubmission</h3>
                        <p className="resub-header-sub">
                            The {applicant} will see the missing items in their portal and re-upload the corrections.
                            The application will return to you for re-checking once resubmitted.
                        </p>
                    </div>
                </div>

                <div className="resub-body">
                    <div className="resub-qcp-notice">
                        <i className="bi bi-info-circle-fill"></i>
                        <span>
                            The {applicant}'s portal status will change to <strong>Pending Resubmission</strong>.
                            They will see the missing items listed below and upload only those documents.
                            Once they resubmit, the application returns to <strong>Under Review</strong> for your re-check.
                        </span>
                    </div>

                    {missingItems.length > 0 ? (
                        <div className="resub-missing-box">
                            <div className="resub-missing-title">
                                <i className="bi bi-x-circle-fill"></i>
                                Items to be corrected by {applicant} ({missingItems.length})
                            </div>
                            {missingItems.map(item => (
                                <div key={item.key} className="resub-missing-item">
                                    <i className="bi bi-dash-circle-fill" style={{ color: '#dc2626' }}></i>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="resub-all-ok-notice">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <span>All checklist items are marked complete. Are you sure you want to request resubmission?</span>
                        </div>
                    )}

                    <label className="resub-label" htmlFor="resub-notes">
                        Notes / Instructions for {applicant.charAt(0).toUpperCase() + applicant.slice(1)}
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}> (optional)</span>
                    </label>
                    <textarea
                        id="resub-notes"
                        className="resub-textarea"
                        rows={4}
                        placeholder={`Add any specific instructions for the ${applicant} here (optional).`}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

                <div className="resub-footer">
                    <button className="resub-cancel" onClick={onCancel} disabled={isSaving}>Cancel</button>
                    <button
                        className="resub-confirm"
                        disabled={isSaving}
                        onClick={() => onConfirm(notes)}
                    >
                        <i className="bi bi-send-check me-1"></i>
                        {isSaving ? 'Processing…' : `Return to ${applicant.charAt(0).toUpperCase() + applicant.slice(1)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ── DOC_KEY_MAP — maps checklist key → file path field on project ────────────
const DOC_KEY_MAP = {
    um: {
        chk_cover_letter:    'endorsement_letter_path',
        chk_disclosure_form: 'doc2_path',
        chk_drawings:        'doc3_path',
        chk_gov_id:          'doc4_path',
        chk_inventor_pas:    'doc5_path',
    },
    id: {
        chk_cover_letter:    'endorsement_letter_path',
        chk_disclosure_form: 'doc2_path',
        chk_all_views:       'doc3_path',
        chk_gov_id:          'doc4_path',
        chk_inventor_pas:    'doc5_path',
    },
    tm: {
        chk_cover_letter:    'endorsement_letter_path',
        chk_ipophl_form:     'doc2_path',
        chk_specimen:        'doc3_path',
        chk_gov_id:          'doc4_path',
    },
    cr: {
        chk_cover_letter:    'endorsement_letter_path',
        chk_bcrr1:           'doc2_path',
        chk_bcrr2:           'doc3_path',
        chk_deed:            'doc4_path',
        chk_author_id:       'doc5_path',
        chk_creative_work:   'doc6_path',
        chk_work_type:       null,
        chk_inventor_details:null,
        chk_inventor_pas:    'doc7_path',
    },
};

// ── Inline Document Viewer ───────────────────────────────────────────────────
function InlineDocViewer({ filePath, label, onClose }) {
    if (!filePath) return null;
    const url = `${API_BASE}/uploads/${filePath}`;
    const ext = filePath.split('.').pop()?.toLowerCase();
    const isPdf = ext === 'pdf';
    const isImg = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
    const isDoc = ['doc','docx','ppt','pptx','xls','xlsx'].includes(ext);

    return (
        <div className="tp-inline-viewer">
            {/* Viewer header */}
            <div className="tp-iv-header">
                <div className="tp-iv-title">
                    <i className="bi bi-file-earmark-text"></i>
                    <span>{label}</span>
                </div>
                <div className="tp-iv-actions">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                       className="tp-iv-btn" title="Open in new tab">
                        <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                    <a href={url} download className="tp-iv-btn" title="Download">
                        <i className="bi bi-download"></i>
                    </a>
                    <button className="tp-iv-btn tp-iv-close" onClick={onClose} title="Close viewer">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>

            {/* Viewer filename */}
            <div className="tp-iv-filename">
                {filePath.split('/').pop()}
            </div>

            {/* Viewer content */}
            <div className="tp-iv-body">
                {isPdf && (
                    <iframe
                        src={`${url}#toolbar=1&navpanes=0`}
                        title={label}
                        className="tp-iv-iframe"
                    />
                )}
                {isImg && (
                    <div className="tp-iv-img-wrap">
                        <img src={url} alt={label} className="tp-iv-img" />
                    </div>
                )}
                {isDoc && (
                    <div className="tp-iv-fallback">
                        <i className="bi bi-file-earmark-word tp-iv-fallback-icon"
                           style={{ color: '#2b579a' }}></i>
                        <p>Word / Office documents cannot be previewed inline.</p>
                        <div className="tp-iv-fallback-btns">
                            <a href={url} target="_blank" rel="noopener noreferrer"
                               className="tp-iv-fallback-open">
                                <i className="bi bi-box-arrow-up-right"></i> Open in new tab
                            </a>
                            <a href={url} download className="tp-iv-fallback-dl">
                                <i className="bi bi-download"></i> Download
                            </a>
                        </div>
                    </div>
                )}
                {!isPdf && !isImg && !isDoc && (
                    <div className="tp-iv-fallback">
                        <i className="bi bi-file-earmark tp-iv-fallback-icon"
                           style={{ color: '#6b7280' }}></i>
                        <p>Preview not available for this file type.</p>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                           className="tp-iv-fallback-open">
                            <i className="bi bi-box-arrow-up-right"></i> Open file
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
function SuccessToast({ message, onDismiss }) {
    return (
        <div className="resub-success-toast">
            <i className="bi bi-check-circle-fill"></i>
            <span>{message}</span>
            <button onClick={onDismiss}><i className="bi bi-x"></i></button>
        </div>
    );
}

// ── Main TriagePanel ─────────────────────────────────────────────────────────
export default function TriagePanel({ project, ipType, onClose, onSave, onApprove, onResubmit }) {
    const defs      = CHECKLISTS[ipType] || CHECKLISTS.um;
    const docPanels = DOC_PANELS[ipType] || DOC_PANELS.um;
    const initChecklist = () => {
        const obj = {};
        defs.forEach(item => { obj[item.key] = !!(project[item.key]); });
        return obj;
    };

    const [checklist,       setChecklist]       = useState(initChecklist);
    const [notes,           setNotes]           = useState(project.triage_notes || project.rejection_reason || '');
    const [isSaving,        setIsSaving]        = useState(false);
    const [showResubModal,  setShowResubModal]  = useState(false);
    const [successMsg,      setSuccessMsg]      = useState('');
    const [viewerDoc,       setViewerDoc]       = useState(null); // { filePath, label }

    const docKeyMap = DOC_KEY_MAP[ipType] || {};

    const total      = defs.length;
    const done       = Object.values(checklist).filter(Boolean).length;
    const pct        = Math.round((done / total) * 100);
    const isComplete = done === total;
    const missing    = defs.filter(item => !checklist[item.key]);

    const toggle = key => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(checklist, notes);
            setSuccessMsg('Triage progress saved successfully.');
        } catch (err) {
            console.error(err);
            alert('Save failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApprove = async () => {
        if (!isComplete) return;
        const ok = window.confirm(`Approve this ${IP_LABEL[ipType]} submission for filing?`);
        if (!ok) return;
        setIsSaving(true);
        try {
            await onApprove(notes);
            setSuccessMsg('Submission approved for filing.');
        } catch (err) {
            console.error(err);
            alert('Approval failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResubConfirm = async (resubNotes) => {
        setIsSaving(true);
        try {
            await onResubmit(missing, resubNotes || notes);
            setShowResubModal(false);
            setSuccessMsg(`Application returned to ${APPLICANT[ipType]}. They will be notified to resubmit the missing documents.`);
        } catch (err) {
            console.error(err);
            alert('Resubmission processing failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const refId = `${REF_PREFIX[ipType]}-${project.id}`;

    return (
        <>
            <div className="triage-overlay">
                <div className="triage-panel">

                    {/* ── Header ── */}
                    <div className="triage-header">
                        <div className="triage-header-icon">
                            <i className="bi bi-clipboard2-pulse"></i>
                        </div>
                        <div className="triage-header-info">
                            <h2>Triage &amp; Review: {project.title || 'Untitled Submission'}</h2>
                            <div className="triage-meta">
                                <span className="triage-meta-item"><i className="bi bi-hash"></i><strong>{refId}</strong></span>
                                <span className="triage-meta-item"><i className="bi bi-tag"></i><strong>{IP_LABEL[ipType]}</strong></span>
                                {project.inventor_name && (
                                    <span className="triage-meta-item"><i className="bi bi-person"></i><strong>{project.inventor_name}</strong></span>
                                )}
                                <span className="triage-meta-item"><i className="bi bi-calendar3"></i><strong>{fmtDate(project.filing_date || project.date_submitted)}</strong></span>
                                <span className="triage-meta-item"><i className="bi bi-check2-all"></i><strong>{done}/{total} items complete</strong></span>

                            </div>
                        </div>
                        <button className="triage-close-btn" onClick={onClose} aria-label="Close panel">
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>

                    {/* Success toast */}
                    {successMsg && (
                        <SuccessToast message={successMsg} onDismiss={() => setSuccessMsg('')} />
                    )}

                    {/* ── Body: 3 columns ── */}
                    <div className="triage-body">

                        {/* COL 1 — Notes */}
                        <div className="triage-col" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div className="triage-section-title">
                                <i className="bi bi-chat-dots"></i>
                                Triage Notes
                            </div>

                            {/* QCP Status Banner */}
                            {(project.status === 'Resubmission' || project.status === 'Pending Resubmission') && (
                                <div className="triage-resub-banner">
                                    <i className="bi bi-arrow-clockwise"></i>
                                    <div>
                                        <strong>Resubmission in Progress</strong>
                                        <p>This application was returned to the {APPLICANT[ipType]} for corrections. Awaiting resubmission.</p>
                                    </div>
                                </div>
                            )}

                            {/* Missing items summary */}
                            {missing.length > 0 && (
                                <div className="triage-missing-summary">
                                    <div className="triage-missing-title">
                                        <i className="bi bi-exclamation-triangle-fill"></i>
                                        {missing.length} item{missing.length > 1 ? 's' : ''} need{missing.length === 1 ? 's' : ''} attention
                                    </div>
                                    {missing.map(item => (
                                        <div key={item.key} className="triage-missing-row">
                                            <i className="bi bi-dash-circle-fill" style={{ color: '#dc2626', fontSize: 11 }}></i>
                                            <span>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="triage-notes-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label htmlFor={`notes-${project.id}`}>Notes / Instructions for {APPLICANT[ipType]}</label>
                                <textarea
                                    id={`notes-${project.id}`}
                                    placeholder="Enter triage observations or instructions here…"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    style={{ flex: 1, resize: 'none' }}
                                />
                            </div>

                            {/* QCP Reference */}
                            <div className="triage-qcp-box">
                                <div className="triage-qcp-title"><i className="bi bi-journal-text"></i> QCP Quick Reference</div>
                                <div className="triage-qcp-row"><i className="bi bi-clock"></i>
                                    {ipType === 'um' || ipType === 'id'
                                        ? 'Filing: 15 days after satisfactory PAS'
                                        : 'Filing: Within 5 working days of receipt'}
                                </div>
                                {(ipType === 'um' || ipType === 'id') && (
                                    <div className="triage-qcp-row"><i className="bi bi-search"></i>Inventor submits PAS · Specialist prepares official PAS (15 working days)</div>
                                )}
                                <div className="triage-qcp-row"><i className="bi bi-send"></i>Acknowledgment to applicant: 3 working days</div>
                                <div className="triage-qcp-row"><i className="bi bi-envelope-paper"></i>Deficiency Notice: IPMO Director endorses Comm. Letter</div>
                            </div>
                        </div>

                        {/* COL 2 — Checklist */}
                        <div className="triage-col">
                            <div className="triage-section-title">
                                <i className="bi bi-list-check"></i>
                                QCP Completeness Checklist
                            </div>

                            <div className="triage-progress-wrap">
                                <div className="triage-progress-label">
                                    <span>Completeness</span>
                                    <span>{done} / {total} items &nbsp;({pct}%)</span>
                                </div>
                                <div className="triage-progress-bg">
                                    <div
                                        className={`triage-progress-fill ${isComplete ? 'complete' : ''}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>

                            <div className={`triage-status-pill ${isComplete ? 'complete' : 'incomplete'}`}>
                                <i className={`bi ${isComplete ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                                {isComplete
                                    ? 'All items complete — ready for approval'
                                    : `Incomplete — ${total - done} item(s) need attention`}
                            </div>

                            <div className="triage-checklist">
                                {defs.map(item => {
                                    const checked     = !!checklist[item.key];
                                    const docPathKey  = docKeyMap[item.key];
                                    const filePath    = docPathKey ? project[docPathKey] : null;
                                    const isActive    = viewerDoc?.filePath === filePath && filePath;
                                    return (
                                        <div
                                            key={item.key}
                                            className={`triage-check-item ${checked ? 'checked' : 'missing'}${isActive ? ' viewer-active' : ''}`}
                                            onClick={() => toggle(item.key)}
                                        >
                                            <input type="checkbox" checked={checked} readOnly />
                                            <div className="tr-checkbox"><i className="bi bi-check"></i></div>
                                            <div className="tr-check-label">
                                                <strong>{item.label}</strong>
                                                <span>{item.desc}</span>
                                                {!checked && (
                                                    <div className="tr-missing-tag">
                                                        <i className="bi bi-arrow-clockwise"></i>
                                                        Needs resubmission
                                                    </div>
                                                )}
                                            </div>
                                            {/* Open button — only if file was submitted */}
                                            {filePath ? (
                                                <button
                                                    className={`tr-open-btn ${isActive ? 'active' : ''}`}
                                                    title={`View ${item.label}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setViewerDoc(
                                                            isActive ? null : { filePath, label: item.label }
                                                        );
                                                    }}
                                                >
                                                    <i className={`bi ${isActive ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                                    {isActive ? 'Close' : 'Open'}
                                                </button>
                                            ) : (
                                                <span className="tr-no-file" title="No file submitted">
                                                    <i className="bi bi-dash-circle"></i>
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* COL 3 — Inline Document Viewer */}
                        <div className={`triage-col triage-col--viewer ${viewerDoc ? 'has-doc' : 'empty-viewer'}`}>
                            {viewerDoc ? (
                                <InlineDocViewer
                                    filePath={viewerDoc.filePath}
                                    label={viewerDoc.label}
                                    onClose={() => setViewerDoc(null)}
                                />
                            ) : (
                                <div className="tp-iv-empty">
                                    <i className="bi bi-file-earmark-text"></i>
                                    <p>Click <strong>Open</strong> on any checklist item to view the submitted document here.</p>
                                </div>
                            )}
                        </div>

                    </div>{/* end triage-body */}

                    {/* ── Footer ── */}
                    <div className="triage-footer">
                        <div className="triage-footer-left">
                            <button className="triage-back-btn" onClick={onClose} disabled={isSaving}>
                                <i className="bi bi-arrow-left"></i>Back to List
                            </button>
                            <button className="triage-save-btn" onClick={handleSave} disabled={isSaving}>
                                <i className="bi bi-floppy"></i>
                                {isSaving ? 'Saving…' : 'Save Progress'}
                            </button>
                        </div>
                        <div className="triage-footer-right">
                            <button
                                className="triage-resub-btn"
                                onClick={() => setShowResubModal(true)}
                                disabled={isSaving}
                                title={isComplete ? 'All items complete — resubmission only if correction still needed' : ''}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                                Return to {APPLICANT[ipType]}
                                {!isComplete && missing.length > 0 && (
                                    <span className="triage-resub-badge">{missing.length}</span>
                                )}
                            </button>
                            <button
                                className="triage-approve-btn"
                                onClick={handleApprove}
                                disabled={!isComplete || isSaving}
                                title={!isComplete ? 'Complete all checklist items before approving' : ''}
                            >
                                <i className="bi bi-check-circle-fill"></i>
                                Approve for Filing
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Resubmission Confirmation Modal */}
            {showResubModal && (
                <ResubConfirmModal
                    missingItems={missing}
                    ipType={ipType}
                    isSaving={isSaving}
                    onCancel={() => setShowResubModal(false)}
                    onConfirm={handleResubConfirm}
                />
            )}
        </>
    );
}