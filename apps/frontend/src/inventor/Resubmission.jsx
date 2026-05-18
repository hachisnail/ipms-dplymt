import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './InventorResubmission.css';

// ── URL normalizer ────────────────────────────────────────────────────────────
const _RAW     = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API_BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;
const API      = `${API_BASE}/api`;

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const fmt  = d => d
    ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

// ── Document field map per IP type ────────────────────────────────────────────
const DOC_FIELD_MAP = {
    um: {
        chk_cover_letter    : { label: 'Endorsement / Cover Letter',       fieldName: 'endorsementLetter', dbCol: 'endorsement_letter_path', accept: '.pdf,.doc,.docx' },
        chk_disclosure_form : { label: 'Technology Disclosure Form',        fieldName: 'disclosureForm',    dbCol: 'disclosure_form_path',    accept: '.pdf,.doc,.docx' },
        chk_drawings        : { label: 'Drawings / Illustrations',          fieldName: 'drawings',          dbCol: 'drawings_path',           accept: '.pdf,.jpg,.jpeg,.png,.zip' },
        chk_description     : { label: 'Description is Clear',              fieldName: 'disclosureForm',    dbCol: 'disclosure_form_path',    accept: '.pdf,.doc,.docx' },
        chk_inventor_details: { label: 'Inventor Details Verified',         fieldName: 'disclosureForm',    dbCol: 'disclosure_form_path',    accept: '.pdf,.doc,.docx' },
        chk_gov_id          : { label: 'Government-Issued ID Attached',     fieldName: 'governmentId',      dbCol: 'government_id_path',      accept: '.pdf,.jpg,.jpeg,.png' },
    },
    id: {
        chk_cover_letter    : { label: 'Endorsement / Cover Letter',        fieldName: 'endorsementLetter', dbCol: 'endorsement_letter_path', accept: '.pdf,.doc,.docx' },
        chk_disclosure_form : { label: 'Technology Disclosure Form',        fieldName: 'disclosureForm',    dbCol: 'disclosure_form_path',    accept: '.pdf,.doc,.docx' },
        chk_all_views       : { label: 'All-View Photos / Illustrations',   fieldName: 'drawings',          dbCol: 'drawings_path',           accept: '.pdf,.jpg,.jpeg,.png,.zip' },
        chk_description     : { label: 'Ornamental Description',            fieldName: 'disclosureForm',    dbCol: 'disclosure_form_path',    accept: '.pdf,.doc,.docx' },
        chk_inventor_details: { label: 'Designer Details Verified',         fieldName: 'disclosureForm',    dbCol: 'disclosure_form_path',    accept: '.pdf,.doc,.docx' },
        chk_gov_id          : { label: 'Government-Issued ID Attached',     fieldName: 'governmentId',      dbCol: 'government_id_path',      accept: '.pdf,.jpg,.jpeg,.png' },
    },
    tm: {
        chk_cover_letter    : { label: 'Endorsement / Cover Letter',        fieldName: 'endorsementLetter', dbCol: 'endorsement_letter_path', accept: '.pdf,.doc,.docx' },
        chk_ipophl_form     : { label: 'IPOPHL Trademark Application Form', fieldName: 'applicationForm',   dbCol: 'application_form_path',   accept: '.pdf,.doc,.docx' },
        chk_specimen        : { label: 'Specimen / Sample of Mark',         fieldName: 'specimen',          dbCol: 'specimen_path',           accept: '.pdf,.jpg,.jpeg,.png' },
        chk_mark_type       : { label: 'Mark Type Specified',               fieldName: 'applicationForm',   dbCol: 'application_form_path',   accept: '.pdf,.doc,.docx' },
        chk_goods_services  : { label: 'Goods / Services Listed',           fieldName: 'applicationForm',   dbCol: 'application_form_path',   accept: '.pdf,.doc,.docx' },
        chk_inventor_details: { label: 'Applicant Details Verified',        fieldName: 'endorsementLetter', dbCol: 'endorsement_letter_path', accept: '.pdf,.doc,.docx' },
        chk_gov_id          : { label: 'Government-Issued ID Attached',     fieldName: 'governmentId',      dbCol: 'government_id_path',      accept: '.pdf,.jpg,.jpeg,.png' },
    },
    cr: {
        chk_cover_letter    : { label: 'Endorsement / Cover Letter',              fieldName: 'endorsementLetter', dbCol: 'endorsement_letter_path', accept: '.pdf,.doc,.docx' },
        chk_bcrr1           : { label: 'BCRR Copyright Enrollment Form (4 sets)', fieldName: 'bcrrForm',          dbCol: 'bcrr_form_path',          accept: '.pdf,.zip' },
        chk_bcrr2           : { label: 'BCRR Form 2 Supplemental Form (4 sets)',  fieldName: 'bcrrForm2',         dbCol: 'bcrr_form2_path',         accept: '.pdf,.zip' },
        chk_deed            : { label: 'Notarized Deed of Assignment (4 sets)',   fieldName: 'deedOfAssignment',  dbCol: 'deed_of_assignment_path', accept: '.pdf,.zip' },
        chk_author_id       : { label: "Author's Gov-ID signed 3× (4 sets)",     fieldName: 'authorId',          dbCol: 'author_id_path',          accept: '.pdf,.jpg,.jpeg,.png,.zip' },
        chk_creative_work   : { label: 'Copy of Creative Work (4 sets)',          fieldName: 'creativeWork',      dbCol: 'creative_work_path',      accept: '.pdf,.zip,.doc,.docx' },
        chk_work_type       : { label: 'Work Type Correctly Identified',          fieldName: 'bcrrForm',          dbCol: 'bcrr_form_path',          accept: '.pdf,.zip' },
        chk_inventor_details: { label: 'Author / Creator Details Verified',       fieldName: 'endorsementLetter', dbCol: 'endorsement_letter_path', accept: '.pdf,.doc,.docx' },
    },
};

const IP_LABEL   = { um: 'Utility Model', id: 'Industrial Design', tm: 'Trademark', cr: 'Copyright' };
const REF_PREFIX = { um: 'UM', id: 'ID', tm: 'TM', cr: 'CR' };
const PREFIX_MAP = {
    'Utility Model'    : 'um',
    'Industrial Design': 'id',
    'Trademark'        : 'tm',
    'Copyright'        : 'cr',
    // handle raw prefix values returned from the DB
    'um': 'um', 'id': 'id', 'tm': 'tm', 'cr': 'cr',
};

// ── Single Resubmission Card ──────────────────────────────────────────────────
function ResubmissionCard({ submission, onSubmitted }) {
    const rawPrefix = submission.ip_type_prefix || PREFIX_MAP[submission.ip_type] || 'um';
    const ipType    = rawPrefix;
    const fieldMap  = DOC_FIELD_MAP[ipType] || DOC_FIELD_MAP.um;
    const refId     = `${REF_PREFIX[ipType] || 'IP'}-${submission.id}`;

    const labelToKey = Object.fromEntries(
        Object.entries(fieldMap).map(([k, v]) => [v.label.toLowerCase().trim(), k])
    );

    const missingKeys = (() => {
        const rawKeys = (submission.missing_checklist_keys || '').trim();
        if (rawKeys) {
            const keys = rawKeys.split(/[,;]/).map(s => s.trim()).filter(Boolean);
            if (keys.some(k => k.startsWith('chk_'))) return keys;
        }
        const rawLabels = (submission.missing_items || '').trim();
        if (rawLabels) {
            return rawLabels
                .split(/[;,]/).map(s => s.trim()).filter(Boolean)
                .map(label => labelToKey[label.toLowerCase().trim()] || null)
                .filter(Boolean);
        }
        return [];
    })();

    const itemsToResubmit = missingKeys
        .map(key => ({ key, ...(fieldMap[key] || { label: key, fieldName: null, dbCol: null, accept: '*' }) }))
        .filter(item => item.fieldName);

    const existingItems = Object.entries(fieldMap)
        .filter(([key]) => !missingKeys.includes(key));

    const [files,      setFiles]      = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState('');

    const handleFileChange = (key, file) => setFiles(prev => ({ ...prev, [key]: file }));

    const handleSubmit = async () => {
        const missing = itemsToResubmit.filter(item => !files[item.key]);
        if (missing.length > 0) {
            setError(`Please upload all required documents: ${missing.map(i => i.label).join(', ')}`);
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('submissionId', submission.id);
            formData.append('ipTypePrefix', ipType);

            const fieldNameToFile = {};
            itemsToResubmit.forEach(item => {
                if (files[item.key]) fieldNameToFile[item.fieldName] = files[item.key];
            });
            Object.entries(fieldNameToFile).forEach(([fieldName, file]) => {
                formData.append(fieldName, file);
            });
            formData.append('resubmittedKeys', missingKeys.join(','));

            const routePrefix = (ipType === 'um' || ipType === 'id') ? 'umid' : ipType;
            const res = await axios.post(
                `${API}/${routePrefix}/resubmit/${submission.id}`,
                formData,
                { headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' } }
            );
            if (res.status === 200) onSubmitted(submission.id);
        } catch (err) {
            console.error('Resubmission error:', err);
            setError(err?.response?.data?.error || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const allUploaded = itemsToResubmit.length > 0 &&
        itemsToResubmit.every(item => !!files[item.key]);

    return (
        <div className="resub-card">

            {/* ── Card Header ── */}
            <div className="resub-card-header">
                <div className="resub-card-left">
                    <span className="resub-ref-badge">{refId}</span>
                    <div className="resub-card-info">
                        <div className="resub-card-title">{submission.title || 'Untitled'}</div>
                        <div className="resub-card-meta">
                            <span>
                                <i className="bi bi-tag"></i>
                                {submission.ip_type || IP_LABEL[ipType]}
                            </span>
                            <span>
                                <i className="bi bi-calendar3"></i>
                                Returned: {fmt(submission.approval_date || submission.updated_at)}
                            </span>
                            <span className="resub-missing-count">
                                <i className="bi bi-exclamation-circle-fill"></i>
                                {itemsToResubmit.length} item{itemsToResubmit.length !== 1 ? 's' : ''} to correct
                            </span>
                        </div>
                    </div>
                </div>
                <div className="resub-card-right">
                    <span className="resub-status-badge">
                        <i className="bi bi-arrow-clockwise"></i>
                        Needs Resubmission
                    </span>
                </div>
            </div>

            {/* ── Card Body ── */}
            <div className="resub-card-body">

                {/* Deficiency notice */}
                <div className="resub-notice-box">
                    <div className="resub-notice-header">
                        <i className="bi bi-envelope-paper-fill"></i>
                        Communication from IPMO Director
                    </div>
                    <div className="resub-notice-body">
                        {submission.rejection_reason
                            ? <p>{submission.rejection_reason}</p>
                            : <p><em>Please correct and resubmit the documents listed below.</em></p>
                        }
                    </div>
                </div>

                {/* ── Communication Letter download ── */}
                {submission.comm_letter_path ? (
                    <div className="resub-comm-letter-box resub-comm-letter--available">
                        <div className="resub-comm-letter-left">
                            <i className="bi bi-file-earmark-pdf-fill"></i>
                            <div>
                                <strong>Communication Letter Issued</strong>
                                <span>
                                    Signed by the IPMO Director
                                    {submission.comm_letter_signed_at
                                        ? ` on ${fmt(submission.comm_letter_signed_at)}`
                                        : ''}
                                    . Download and review before resubmitting.
                                </span>
                            </div>
                        </div>
                        <a
                            href={`${API_BASE}/uploads/${submission.comm_letter_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resub-comm-letter-btn"
                        >
                            <i className="bi bi-download"></i>
                            Download Letter
                        </a>
                    </div>
                ) : (
                    <div className="resub-comm-letter-box resub-comm-letter--pending">
                        <i className="bi bi-hourglass-split"></i>
                        <span>
                            The signed Communication Letter is being prepared by the IPMO Director
                            and will appear here once uploaded. You may begin preparing your corrected
                            documents in the meantime.
                        </span>
                    </div>
                )}

                {/* Upload corrected documents */}
                <div className="resub-section-title">
                    <i className="bi bi-upload"></i>
                    Upload Corrected Documents
                    <span className="resub-section-sub">
                        Only upload the documents listed below. Your other documents remain on file.
                    </span>
                </div>

                <div className="resub-upload-list">
                    {itemsToResubmit.length === 0 ? (
                        <div className="resub-no-items">
                            <i className="bi bi-check-circle-fill"></i>
                            No specific documents flagged. Please contact IPMO for guidance.
                        </div>
                    ) : (
                        itemsToResubmit.map(item => (
                            <div
                                key={item.key}
                                className={`resub-upload-item${files[item.key] ? ' uploaded' : ''}`}
                            >
                                {/* Label + hint */}
                                <div className="resub-upload-label">
                                    <i className={`bi ${files[item.key] ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} resub-upload-icon`}></i>
                                    <div>
                                        <strong>{item.label}</strong>
                                        <span className="resub-upload-hint">Accepted: {item.accept}</span>
                                    </div>
                                </div>

                                {/* File name + choose button */}
                                <div className="resub-upload-control">
                                    {files[item.key] && (
                                        <span className="resub-file-name">
                                            <i className="bi bi-paperclip"></i>
                                            {files[item.key].name}
                                        </span>
                                    )}
                                    <label className="resub-file-btn">
                                        <i className="bi bi-cloud-arrow-up"></i>
                                        {files[item.key] ? 'Replace' : 'Choose File'}
                                        <input
                                            type="file"
                                            accept={item.accept}
                                            style={{ display: 'none' }}
                                            onChange={e => handleFileChange(item.key, e.target.files[0] || null)}
                                        />
                                    </label>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Documents already on file */}
                <div className="resub-existing-title">
                    <i className="bi bi-folder-check"></i>
                    Documents Already on File
                    <span className="resub-section-sub">These do not need to be re-uploaded.</span>
                </div>
                <div className="resub-existing-list">
                    {existingItems.map(([key, meta]) => {
                        const filePath = submission[meta.dbCol];
                        return (
                            <div key={key} className="resub-existing-item">
                                <i className="bi bi-check2-circle"></i>
                                <span>{meta.label}</span>
                                {filePath && (
                                    <a
                                        href={`${API_BASE}/uploads/${filePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resub-view-link"
                                    >
                                        <i className="bi bi-box-arrow-up-right"></i>View
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* In-card error */}
                {error && (
                    <div className="resub-error-msg">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {error}
                    </div>
                )}

                {/* Submit footer */}
                <div className="resub-submit-row">
                    <div className="resub-submit-note">
                        <i className="bi bi-info-circle"></i>
                        After submitting, your application will return to the IP Specialist for re-review.
                    </div>
                    <button
                        className="resub-submit-btn"
                        onClick={handleSubmit}
                        disabled={submitting || !allUploaded}
                    >
                        {submitting
                            ? <><i className="bi bi-hourglass-split"></i> Submitting…</>
                            : <><i className="bi bi-send-check-fill"></i> Submit Corrections</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Resubmission() {
    const [submissions, setSubmissions] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [successIds,  setSuccessIds]  = useState([]);

    const load = useCallback(async () => {
        try {
            const [umid, tm, cr] = await Promise.all([
                axios.get(`${API}/inventor/resubmission-pending/umid`, { headers: hdrs() }),
                axios.get(`${API}/inventor/resubmission-pending/tm`,   { headers: hdrs() }),
                axios.get(`${API}/inventor/resubmission-pending/cr`,   { headers: hdrs() }),
            ]);
            const all = [
                ...(Array.isArray(umid.data) ? umid.data : []),
                ...(Array.isArray(tm.data)   ? tm.data   : []),
                ...(Array.isArray(cr.data)   ? cr.data   : []),
            ];
            setSubmissions(all.filter(s => !successIds.includes(s.id)));
            setError(null);
        } catch (err) {
            console.error('❌ Resubmission load error:', err);
            setError('Failed to load your resubmission requests.');
        } finally {
            setLoading(false);
        }
    }, [successIds]);

    useEffect(() => { load(); }, [load]);

    const handleSubmitted = (id) => {
        setSuccessIds(prev => [...prev, id]);
        setSubmissions(prev => prev.filter(s => s.id !== id));
    };

    if (loading) return (
        <div className="inv-resub-page">
            <div className="inv-resub-loader">
                <div className="inv-resub-spinner"></div>
                <p>Loading your resubmission requests…</p>
            </div>
        </div>
    );

    return (
        <div className="inv-resub-page">

            {/* Page header */}
            <div className="inv-resub-header">
                <div className="inv-resub-header-icon">
                    <i className="bi bi-arrow-clockwise"></i>
                </div>
                <div>
                    <h1>Resubmission Required</h1>
                    <p>
                        The applications below were returned by the IPMO because some documents are
                        missing or need correction. Please upload only the flagged items and resubmit.
                    </p>
                </div>
            </div>

            {/* QCP reminder */}
            <div className="inv-resub-qcp-notice">
                <i className="bi bi-journal-check"></i>
                <span>
                    <strong>CNSC-IPMO Process Reminder:</strong> Per QCP guidelines, only the
                    missing or non-conforming documents need to be replaced. Documents already
                    accepted remain on file and do not need to be re-uploaded.
                </span>
            </div>

            {/* Load error */}
            {error && (
                <div className="inv-resub-error">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {error}
                </div>
            )}

            {/* Success */}
            {successIds.length > 0 && (
                <div className="inv-resub-success">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>
                        Your correction{successIds.length > 1 ? 's have' : ' has'} been submitted successfully.
                        The IP Specialist will review your updated documents and you will be notified of the outcome.
                    </span>
                </div>
            )}

            {/* Empty state */}
            {submissions.length === 0 && successIds.length === 0 ? (
                <div className="inv-resub-empty">
                    <i className="bi bi-check2-all"></i>
                    <p>No resubmission requests at this time. All your applications are in good standing.</p>
                </div>
            ) : (
                <div className="inv-resub-list">
                    {submissions.map(s => (
                        <ResubmissionCard
                            key={s.id}
                            submission={s}
                            onSubmitted={handleSubmitted}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}