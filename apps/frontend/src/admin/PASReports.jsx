import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './PASReports.css';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const BASE = API.replace('/api', '');
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const fmt  = d => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

// ── Doc definitions for UM, ID, TM only ──────────────────────
const DOC_DEFS = {
    'Utility Model': [
        { field: 'endorsement_letter_path', label: 'Endorsement Letter',        icon: 'bi-file-earmark-text'  },
        { field: 'disclosure_form_path',    label: 'Technology Disclosure Form', icon: 'bi-file-earmark-text'  },
        { field: 'drawings_path',           label: 'Drawings / Illustrations',  icon: 'bi-file-earmark-image' },
        { field: 'government_id_path',      label: 'Government-Issued ID',      icon: 'bi-person-vcard'       },
    ],
    'Industrial Design': [
        { field: 'endorsement_letter_path', label: 'Endorsement Letter',        icon: 'bi-file-earmark-text'  },
        { field: 'disclosure_form_path',    label: 'Technology Disclosure Form', icon: 'bi-file-earmark-text'  },
        { field: 'drawings_path',           label: 'All-View Photos / Drawings',icon: 'bi-file-earmark-image' },
        { field: 'government_id_path',      label: 'Government-Issued ID',      icon: 'bi-person-vcard'       },
    ],
    'Trademark': [
        { field: 'endorsement_letter_path', label: 'Endorsement Letter',        icon: 'bi-file-earmark-text'  },
        { field: 'application_form_path',   label: 'IPOPHL Application Form',   icon: 'bi-file-earmark-text'  },
        { field: 'specimen_path',           label: 'Specimen / Sample of Mark', icon: 'bi-file-earmark-image' },
        { field: 'government_id_path',      label: 'Government-Issued ID',      icon: 'bi-person-vcard'       },
        { field: 'proof_of_use_path',       label: 'Proof of Use (optional)',   icon: 'bi-file-earmark-check' },
    ],
};

const TYPE_BADGE_CLASS = {
    'Utility Model':    'pas-ip-um',
    'Industrial Design':'pas-ip-id',
    'Trademark':        'pas-ip-tm',
    'Copyright':        'pas-ip-cr',
};

const REF_PREFIX = { umid: 'UM', tm: 'TM', cr: 'CR' };

function getRefId(row) {
    const prefix = row._prefix;
    if (prefix === 'tm') return `TM-${row.id}`;
    if (prefix === 'cr') return `CR-${row.id}`;
    if (row.ip_type === 'Industrial Design') return `ID-${row.id}`;
    return `UM-${row.id}`;
}

function getApproveEndpoint(row) {
    if (row._prefix === 'tm') return `${API}/tm-submission-approve/${row.id}`;
    if (row._prefix === 'cr') return `${API}/cr-submission-approve/${row.id}`;
    return `${API}/umid-submission-approve/${row.id}`;
}

// ── File icon helpers ────────────────────────────────────────
function fileIcon(path) {
    if (!path) return 'bi-file-earmark-x';
    const ext = path.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'bi-file-earmark-pdf-fill';
    if (['doc','docx'].includes(ext)) return 'bi-file-earmark-word-fill';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'bi-file-earmark-image-fill';
    return 'bi-file-earmark-fill';
}

function fileColor(path) {
    if (!path) return '#d1d5db';
    const ext = path.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '#ef4444';
    if (['doc','docx'].includes(ext)) return '#2563eb';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '#059669';
    return '#6b7280';
}

// ── APPROVE CONFIRM MODAL ────────────────────────────────────
function ApproveConfirmModal({ row, docs, onConfirm, onCancel }) {
    const refId  = getRefId(row);
    const hasPAS = !!row.pas_report_path;
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    const files = [
        ...docs.filter(d => row[d.field]).map(d => ({ label: d.label, path: row[d.field] })),
        ...(hasPAS ? [{ label: "Specialist's PAS Report", path: row.pas_report_path }] : []),
    ];

    const handleApprove = async () => {
        setLoading(true); setError(null);
        try {
            await axios.put(getApproveEndpoint(row), {}, { headers: hdrs() });
            onConfirm(row.id, row._prefix);
        } catch (err) {
            console.error('[Approve] Failed:', err);
            setError(err.response?.data?.error || 'Failed to approve. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="pas-done-overlay" onClick={onCancel}>
            <div className="pas-done-modal" onClick={e => e.stopPropagation()}>
                <div className="pas-done-modal-header">
                    <div className="pas-done-modal-icon"><i className="bi bi-patch-check-fill"></i></div>
                    <div style={{ flex: 1 }}>
                        <div className="pas-done-modal-title">Approve {row.ip_type} Application?</div>
                        <div className="pas-done-modal-sub">{refId} — {row.title || 'Untitled'}</div>
                    </div>
                    <button className="pas-done-x-btn" onClick={onCancel} disabled={loading}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="pas-done-modal-body">
                    <p className="pas-done-modal-msg">
                        Mark as <strong>Filed to IPOPHL</strong>? This application will be moved to the{' '}
                        <strong>Approved Applications</strong> table where all documents can be downloaded.
                    </p>
                    <div className="pas-done-file-list">
                        <div className="pas-done-file-label">
                            <i className="bi bi-folder2-open"></i> Files in package ({files.length})
                        </div>
                        {files.map((f, i) => (
                            <div className="pas-done-file-row" key={i}>
                                <i className="bi bi-file-earmark-check"></i>
                                <span className="pas-done-file-doc-label">{f.label}</span>
                            </div>
                        ))}
                    </div>
                    {!hasPAS && (
                        <div style={{
                            marginTop: 10, padding: '8px 12px',
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderRadius: 8, fontSize: 12.5, color: '#92400e'
                        }}>
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                            No PAS Report uploaded yet. Consider asking the consultant to upload one first.
                        </div>
                    )}
                    {error && (
                        <div style={{
                            marginTop: 10, padding: '8px 12px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, fontSize: 12.5, color: '#b91c1c'
                        }}>
                            <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
                        </div>
                    )}
                </div>
                <div className="pas-done-modal-footer">
                    <button className="pas-done-cancel-btn" onClick={onCancel} disabled={loading}>Cancel</button>
                    <button className="pas-done-confirm-btn" onClick={handleApprove} disabled={loading}>
                        {loading
                            ? <><span style={{ display:'inline-block',width:14,height:14,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',marginRight:6,verticalAlign:'middle' }}></span>Approving…</>
                            : <><i className="bi bi-patch-check-fill me-1"></i>Yes, Approve & File</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── DETAIL PANEL ─────────────────────────────────────────────
function PASDetailPanel({ row, onClose }) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const docs   = DOC_DEFS[row.ip_type] || DOC_DEFS['Utility Model'];
    const refId  = getRefId(row);
    const hasPAS = !!row.pas_report_path;

    return (
        <div className="pas-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="pas-panel">
                <div className="pas-panel-header">
                    <div className="pas-panel-header-icon"><i className="bi bi-file-earmark-check2"></i></div>
                    <div className="pas-panel-header-info">
                        <div className="pas-panel-title">{row.title || 'Untitled'}</div>
                        <div className="pas-panel-meta">
                            <span><i className="bi bi-hash"></i>{refId}</span>
                            <span className={`pas-ip-badge ${TYPE_BADGE_CLASS[row.ip_type] || 'pas-ip-um'}`}>
                                {row.ip_type}
                            </span>
                            <span><i className="bi bi-person"></i>{row.inventor_name || '—'}</span>
                        </div>
                    </div>
                    <button className="pas-panel-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
                </div>

                <div className="pas-panel-body">
                    <div className="pas-col-details">
                        <div className="pas-section-title"><i className="bi bi-info-circle"></i> Details</div>
                        <div className="pas-info-list">
                            <div className="pas-info-row">
                                <span className="pas-info-label">Inventor</span>
                                <span className="pas-info-value">{row.inventor_name || '—'}</span>
                            </div>
                            <div className="pas-info-row">
                                <span className="pas-info-label">IP Type</span>
                                <span className="pas-info-value">{row.ip_type}</span>
                            </div>
                            <div className="pas-info-row">
                                <span className="pas-info-label">Approved</span>
                                <span className="pas-info-value">{fmt(row.approval_date)}</span>
                            </div>
                            <div className="pas-info-row">
                                <span className="pas-info-label">PAS Report</span>
                                <span className="pas-info-value" style={{ color: hasPAS ? '#059669' : '#d97706', fontWeight: 700 }}>
                                    {hasPAS
                                        ? <><i className="bi bi-check-circle-fill me-1"></i>Uploaded</>
                                        : <><i className="bi bi-clock me-1"></i>Pending</>
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pas-col-docs">
                        <div className="pas-section-title"><i className="bi bi-folder2-open"></i> Documents</div>
                        <div className="pas-doc-list">
                            {docs.map(d => (
                                <div className={`pas-doc-item ${!row[d.field] ? 'pas-doc-missing' : ''}`} key={d.field}>
                                    <i className={`bi ${fileIcon(row[d.field])}`} style={{ color: fileColor(row[d.field]) }}></i>
                                    <div className="pas-doc-info"><div className="pas-doc-label">{d.label}</div></div>
                                    {row[d.field] && (
                                        <a href={`${BASE}/uploads/${row[d.field]}`} target="_blank" rel="noreferrer" className="pas-open-btn">Open</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pas-col-report">
                        <div className="pas-section-title"><i className="bi bi-file-earmark-check2"></i> PAS Report</div>
                        {hasPAS ? (
                            <div className="pas-report-card">
                                <div className="pas-report-label">Specialist's PAS Report</div>
                                <a href={`${BASE}/uploads/${row.pas_report_path}`}
                                   target="_blank" rel="noreferrer"
                                   className="pas-report-open-btn">Open PAS Report</a>
                            </div>
                        ) : (
                            <div className="pas-report-empty">
                                <p>No PAS Report uploaded yet.</p>
                                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                                    The consultant must upload the PAS Report from the Approved panel.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pas-panel-footer">
                    <button className="pas-footer-close" onClick={onClose}>Back</button>
                    <button
                        className="pas-done-btn"
                        onClick={() => setShowApproveModal(true)}
                        title="Verify PAS Report and move to Approved Applications"
                    >
                        <i className="bi bi-patch-check-fill me-1"></i>Approve & File
                    </button>
                </div>

                {showApproveModal && (
                    <ApproveConfirmModal
                        row={row}
                        docs={docs}
                        onCancel={() => setShowApproveModal(false)}
                        onConfirm={(id, prefix) => {
                            setShowApproveModal(false);
                            onClose(id, prefix);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function AdminPASReports() {
    const [all,      setAll]      = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);
    const [selected, setSelected] = useState(null);
    const [filterType, setFilterType] = useState('All');

    const load = useCallback(async () => {
        setError(null);
        try {
            // Fetch ALL 4 types with status = 'Approved for Filing'
            const res = await axios.get(`${API}/pas-reports-pending`, { headers: hdrs() });
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setAll(data.sort((a, b) => new Date(b.approval_date || 0) - new Date(a.approval_date || 0)));
        } catch (err) {
            console.error('❌ PAS load error:', err);
            setError(err.response?.data?.error || err.message || 'Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handlePanelClose = (approvedId, approvedPrefix) => {
        if (approvedId !== undefined) {
            setAll(prev => prev.filter(s => !(s.id === approvedId && s._prefix === approvedPrefix)));
        }
        setSelected(null);
    };

    const filtered = filterType === 'All'
        ? all
        : all.filter(s => s.ip_type === filterType);

    if (loading) return <div className="pas-loader"><div className="pas-spinner"></div></div>;

    return (
        <div className="pas-page">
            <div className="pas-page-inner">
                <div className="pas-title">
                    <i className="bi bi-file-earmark-check2"></i> PAS Reports — UM / ID / TM
                    <span className="pas-count">{all.length}</span>
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {['All','Utility Model','Industrial Design','Trademark'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                            cursor: 'pointer', border: '1.5px solid',
                            borderColor: filterType === t ? '#800000' : '#e2e8f0',
                            background:  filterType === t ? '#800000' : '#fff',
                            color:       filterType === t ? '#fff'    : '#334155',
                            fontFamily: 'DM Sans, system-ui, sans-serif',
                        }}>
                            {t === 'All' ? `All (${all.length})` : `${t} (${all.filter(s => s.ip_type === t).length})`}
                        </button>
                    ))}
                </div>

                {error && (
                    <div style={{
                        margin: '0 0 16px', padding: '12px 16px',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: 8, fontSize: 13, color: '#b91c1c',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <i className="bi bi-exclamation-circle-fill"></i>
                        <span>{error}</span>
                        <button onClick={load} style={{
                            marginLeft: 'auto', padding: '4px 12px',
                            background: '#fff', border: '1px solid #fecaca',
                            borderRadius: 6, cursor: 'pointer', fontSize: 12,
                            color: '#b91c1c', fontWeight: 600,
                        }}>Retry</button>
                    </div>
                )}

                <div className="pas-table-card">
                    {filtered.length === 0 ? (
                        <div className="pas-empty">
                            <p>No submissions pending PAS review{filterType !== 'All' ? ` for ${filterType}` : ''}.</p>
                        </div>
                    ) : (
                        <table className="pas-table">
                            <thead>
                                <tr>
                                    <th>REF</th>
                                    <th>IP TYPE</th>
                                    <th>TITLE</th>
                                    <th>INVENTOR</th>
                                    <th>APPROVED</th>
                                    <th>PAS REPORT</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={`${s._prefix}-${s.id}`}>
                                        <td><span className="pas-ref-badge">{getRefId(s)}</span></td>
                                        <td>
                                            <span className={`pas-ip-badge ${TYPE_BADGE_CLASS[s.ip_type] || 'pas-ip-um'}`}>
                                                {s.ip_type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{s.title}</td>
                                        <td>{s.inventor_name}</td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{fmt(s.approval_date)}</td>
                                        <td>
                                            {s.pas_report_path
                                                ? <span style={{ color:'#059669', fontWeight:700, fontSize:12 }}>
                                                    <i className="bi bi-check-circle-fill me-1"></i>Uploaded
                                                  </span>
                                                : <span style={{ color:'#d97706', fontWeight:700, fontSize:12 }}>
                                                    <i className="bi bi-clock me-1"></i>Pending
                                                  </span>
                                            }
                                        </td>
                                        <td>
                                            <button className="pas-view-btn" onClick={() => setSelected(s)}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {selected && <PASDetailPanel row={selected} onClose={handlePanelClose} />}
            </div>
        </div>
    );
}