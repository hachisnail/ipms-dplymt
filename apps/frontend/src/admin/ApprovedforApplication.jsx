import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FileText, Download, Calendar, User,
    Search, Briefcase, X, FolderOpen,
    ExternalLink, Trash2, AlertTriangle,
} from 'lucide-react';
import './ApprovedApplication.css';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const BASE = API.replace('/api', '');
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

// ── Doc definitions — pas_report_path included for all types ─
const DOC_DEFS = {
    'Utility Model': [
        { field: 'endorsement_letter_path', label: 'Endorsement Letter' },
        { field: 'disclosure_form_path',    label: 'Technology Disclosure Form' },
        { field: 'drawings_path',           label: 'Drawings / Illustrations' },
        { field: 'government_id_path',      label: 'Government-Issued ID' },
        { field: 'pas_report_path',         label: "Specialist's PAS Report" },
    ],
    'Industrial Design': [
        { field: 'endorsement_letter_path', label: 'Endorsement Letter' },
        { field: 'disclosure_form_path',    label: 'Technology Disclosure Form' },
        { field: 'drawings_path',           label: 'All-View Photos / Drawings' },
        { field: 'government_id_path',      label: 'Government-Issued ID' },
        { field: 'pas_report_path',         label: "Specialist's PAS Report" },
    ],
    'Trademark': [
        { field: 'endorsement_letter_path', label: 'Endorsement Letter' },
        { field: 'application_form_path',   label: 'IPOPHL Application Form' },
        { field: 'specimen_path',           label: 'Specimen / Sample of Mark' },
        { field: 'government_id_path',      label: 'Government-Issued ID' },
        { field: 'proof_of_use_path',       label: 'Proof of Use (optional)' },
        { field: 'pas_report_path',         label: "Specialist's PAS Report" },
    ],
    'Copyright': [
        { field: 'endorsement_letter_path',  label: 'Endorsement Letter' },
        { field: 'bcrr_form_path',           label: 'BCRR Form 1' },
        { field: 'bcrr_form2_path',          label: 'BCRR Form 2' },
        { field: 'deed_of_assignment_path',  label: 'Deed of Assignment' },
        { field: 'author_id_path',           label: 'Author Government ID' },
        { field: 'creative_work_path',       label: 'Creative Work' },
    ],
};

function normalizeType(raw, prefix) {
    if (!raw) {
        if (prefix === 'tm') return 'Trademark';
        if (prefix === 'cr') return 'Copyright';
        return 'Utility Model';
    }
    const r = raw.toLowerCase();
    if (r.includes('industrial')) return 'Industrial Design';
    if (r.includes('trademark'))  return 'Trademark';
    if (r.includes('copyright'))  return 'Copyright';
    return 'Utility Model';
}

function badgeClass(type) {
    return {
        'Utility Model':    'utility-model',
        'Industrial Design':'industrial-design',
        'Copyright':        'copyright',
        'Trademark':        'trademark',
    }[type] || 'utility-model';
}

function refId(app) {
    const prefix = app._prefix;
    if (prefix === 'cr') return `CR-${app.id}`;
    if (prefix === 'tm') return `TM-${app.id}`;
    const t = normalizeType(app.ip_type, prefix);
    if (t === 'Industrial Design') return `ID-${app.id}`;
    return `UM-${app.id}`;
}

// ── Remove Modal ─────────────────────────────────────────────
function RemoveModal({ app, onConfirm, onCancel }) {
    const [permanent, setPermanent] = useState(false);
    const ref = refId(app);
    return (
        <div className="dossier-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="dossier-panel" style={{ maxWidth: 460 }}>
                <div className="dossier-header">
                    <div className="dossier-header-icon" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                        <AlertTriangle size={22} color="#dc2626" />
                    </div>
                    <div className="dossier-header-info">
                        <div className="dossier-title">Remove Application</div>
                        <div className="dossier-meta">
                            <span className="dossier-ref">{ref}</span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>{app.title}</span>
                        </div>
                    </div>
                    <button className="dossier-close-btn" onClick={onCancel}><X size={18} /></button>
                </div>

                <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: 13.5, color: '#334155', marginBottom: 16, lineHeight: 1.6 }}>
                        How would you like to remove this application from the list?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        <label style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                            border: `2px solid ${!permanent ? '#0d7377' : '#e2e8f0'}`,
                            background: !permanent ? '#e8f6f7' : '#f8f9fc', transition: 'all .15s',
                        }}>
                            <input type="radio" checked={!permanent} onChange={() => setPermanent(false)}
                                style={{ marginTop: 2, accentColor: '#0d7377' }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a5e61' }}>Archive (Hide from list)</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                    Keeps the record in the database but hides it from this table. Can be recovered if needed.
                                </div>
                            </div>
                        </label>
                        <label style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                            border: `2px solid ${permanent ? '#dc2626' : '#e2e8f0'}`,
                            background: permanent ? '#fef2f2' : '#f8f9fc', transition: 'all .15s',
                        }}>
                            <input type="radio" checked={permanent} onChange={() => setPermanent(true)}
                                style={{ marginTop: 2, accentColor: '#dc2626' }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c' }}>Permanently Delete</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                    Completely removes the record and all history. This cannot be undone.
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="dossier-footer" style={{ justifyContent: 'space-between' }}>
                    <button className="dossier-footer-close" onClick={onCancel}>Cancel</button>
                    <button onClick={() => onConfirm(permanent)} style={{
                        padding: '9px 22px',
                        background: permanent ? '#dc2626' : '#0d7377',
                        color: '#fff', border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 700,
                        fontFamily: 'DM Sans, system-ui, sans-serif', cursor: 'pointer',
                    }}>
                        {permanent ? 'Yes, Delete Permanently' : 'Yes, Archive'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Dossier Panel ─────────────────────────────────────────────
function DossierPanel({ app, onClose, onRemove }) {
    const type = normalizeType(app.ip_type, app._prefix);
    const docs  = DOC_DEFS[type] || DOC_DEFS['Utility Model'];
    const ref   = refId(app);

    const [showRemove,  setShowRemove]  = useState(false);
    const [downloading, setDownloading] = useState(false);

    const presentDocs = docs.filter(d => app[d.field]);
    const missingDocs = docs.filter(d => !app[d.field]);

    const downloadAll = () => {
        if (!presentDocs.length) return;
        setDownloading(true);
        presentDocs.forEach((d, i) => {
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = `${BASE}/uploads/${app[d.field]}`;
                a.download = app[d.field].split('/').pop();
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (i === presentDocs.length - 1) setDownloading(false);
            }, i * 400);
        });
    };

    return (
        <div className="dossier-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="dossier-panel">
                {/* Header */}
                <div className="dossier-header">
                    <div className="dossier-header-icon"><FolderOpen size={22} /></div>
                    <div className="dossier-header-info">
                        <div className="dossier-title">{app.title || 'Untitled'}</div>
                        <div className="dossier-meta">
                            <span className={`type-badge ${badgeClass(type)}`}>{type}</span>
                            <span className="dossier-ref">#{ref}</span>
                            <span className="dossier-inventor"><User size={13} /> {app.inventor_name || '—'}</span>
                        </div>
                    </div>
                    <button className="dossier-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                {/* Body */}
                <div className="dossier-body">
                    <div className="dossier-col">
                        <div className="dossier-section-title"><Briefcase size={14} /> Details</div>
                        <div className="dossier-info-list">
                            {[
                                ['Inventor',      app.inventor_name  || '—'],
                                ['Email',         app.inventor_email || '—'],
                                ['IP Type',       type],
                                ['Status',        app.status],
                                ['Filing Date',   app.filing_date   ? new Date(app.filing_date).toLocaleDateString('en-PH',   {year:'numeric',month:'short',day:'numeric'}) : 'N/A'],
                                ['Approval Date', app.approval_date ? new Date(app.approval_date).toLocaleDateString('en-PH', {year:'numeric',month:'short',day:'numeric'}) : 'N/A'],
                            ].map(([label, val]) => (
                                <div className="dossier-info-row" key={label}>
                                    <span className="dossier-info-label">{label}</span>
                                    <span className="dossier-info-val">{val}</span>
                                </div>
                            ))}
                            {app.triage_notes && (
                                <div className="dossier-info-row dossier-notes">
                                    <span className="dossier-info-label">Triage Notes</span>
                                    <span className="dossier-info-val">{app.triage_notes}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="dossier-col">
                        <div className="dossier-section-title">
                            <FolderOpen size={14} /> Documents ({presentDocs.length}/{docs.length})
                        </div>
                        <div className="dossier-doc-list">
                            {docs.map(d => (
                                <div className={`dossier-doc-row ${!app[d.field] ? 'doc-missing' : ''}`} key={d.field}>
                                    <span className="doc-label">{d.label}</span>
                                    {app[d.field]
                                        ? <a href={`${BASE}/uploads/${app[d.field]}`} target="_blank" rel="noreferrer" className="doc-open-btn">
                                              <ExternalLink size={13} /> Open
                                          </a>
                                        : <span className="doc-missing-tag">Not uploaded</span>
                                    }
                                </div>
                            ))}
                        </div>
                        {missingDocs.length > 0 && (
                            <div className="dossier-missing-note">
                                {missingDocs.length} file(s) not uploaded
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="dossier-footer" style={{ justifyContent: 'space-between' }}>
                    <button style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 16px', background: '#fef2f2',
                        color: '#b91c1c', border: '1.5px solid #fecaca',
                        borderRadius: 8, fontSize: 13, fontWeight: 700,
                        fontFamily: 'DM Sans, system-ui, sans-serif', cursor: 'pointer',
                    }} onClick={() => setShowRemove(true)}>
                        <Trash2 size={14} /> Remove
                    </button>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', background: '#e8f6f7',
                            color: '#0a5e61', border: '1.5px solid #b2dfdf',
                            borderRadius: 8, fontSize: 13, fontWeight: 700,
                            fontFamily: 'DM Sans, system-ui, sans-serif',
                            cursor: (downloading || !presentDocs.length) ? 'not-allowed' : 'pointer',
                            opacity: (downloading || !presentDocs.length) ? 0.6 : 1,
                        }} onClick={downloadAll} disabled={downloading || !presentDocs.length}>
                            <Download size={14} />
                            {downloading ? 'Downloading…' : `Download All (${presentDocs.length})`}
                        </button>
                        <button className="dossier-footer-close" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>

            {showRemove && (
                <RemoveModal
                    app={app}
                    onConfirm={(permanent) => { setShowRemove(false); onRemove(app, permanent); }}
                    onCancel={() => setShowRemove(false)}
                />
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────
const ApprovedforApplication = () => {
    const [applications, setApplications] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [searchTerm,   setSearchTerm]   = useState('');
    const [filterType,   setFilterType]   = useState('All');
    const [selected,     setSelected]     = useState(null);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/approved-applications`, { headers: hdrs() });
            setApplications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching approved applications:', err);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const handleRemove = async (app, permanent) => {
        try {
            await axios.delete(
                `${API}/approved-applications/${app._prefix}/${app.id}?permanent=${permanent}`,
                { headers: hdrs() }
            );
            setApplications(prev => prev.filter(a => !(a.id === app.id && a._prefix === app._prefix)));
            setSelected(null);
        } catch (err) {
            console.error('Remove failed:', err);
            alert('Failed to remove application. Please try again.');
        }
    };

    const filteredApplications = applications.filter(app => {
        const type       = normalizeType(app.ip_type, app._prefix);
        const titleMatch = app.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const nameMatch  = app.inventor_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType  = filterType === 'All' || type === filterType;
        return (titleMatch || nameMatch) && matchType;
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading approved applications...</p>
            </div>
        );
    }

    return (
        <div className="approved-container">
            <div className="controls-row">
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or inventor..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Utility Model">Utility Model</option>
                    <option value="Industrial Design">Industrial Design</option>
                    <option value="Trademark">Trademark</option>
                    <option value="Copyright">Copyright</option>
                </select>
            </div>

            <div className="applications-grid">
                {filteredApplications.length > 0 ? (
                    filteredApplications.map(app => {
                        const type = normalizeType(app.ip_type, app._prefix);
                        const ref  = refId(app);
                        return (
                            <div key={`${app._prefix}-${app.id}`} className="app-card">
                                <div className="app-card-header">
                                    <span className={`type-badge ${badgeClass(type)}`}>{type}</span>
                                    <span className="approval-date">
                                        <Calendar size={14} />
                                        {app.approval_date
                                            ? new Date(app.approval_date).toLocaleDateString('en-PH', {year:'numeric',month:'short',day:'numeric'})
                                            : 'N/A'}
                                    </span>
                                </div>
                                <h3 className="app-title">{app.title || 'Untitled Project'}</h3>
                                <div className="app-info">
                                    <div className="info-item"><User size={16} /><span>{app.inventor_name || 'Unknown'}</span></div>
                                    <div className="info-item"><Briefcase size={16} /><span>Ref: {ref}</span></div>
                                    <div className="info-item"><FileText size={16} /><span>{app.status}</span></div>
                                </div>
                                <div className="app-actions">
                                    <button className="btn-details" onClick={() => setSelected(app)}>
                                        <FolderOpen size={16} /> View Dossier
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No approved applications found matching your criteria.</p>
                    </div>
                )}
            </div>

            {selected && (
                <DossierPanel
                    app={selected}
                    onClose={() => setSelected(null)}
                    onRemove={handleRemove}
                />
            )}
        </div>
    );
};

export default ApprovedforApplication;