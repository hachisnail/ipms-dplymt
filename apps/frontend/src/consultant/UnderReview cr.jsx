// UnderReview_cr.jsx — Copyright
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TriagePanel from './Triagepanel';
import './UnderReview.css';

const _RAW = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API  = (_RAW.endsWith('/api') ? _RAW : `${_RAW}/api`);
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const fmt  = d => d ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : 'N/A';

export default function UnderReviewcr() {
    const [submissions, setSubmissions] = useState([]);
    const [selected,    setSelected]    = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/cr-submissions-under-review`, { headers: hdrs() });
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setSubmissions(data);
            setError(null);
        } catch (err) {
            console.error('❌', err);
            setError('Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

    const handleSave = async (checklist, notes) => {
        await axios.put(`${API}/cr-checklist-update/${selected.id}`,
            { ...checklist, triage_notes: notes }, { headers: hdrs() });
        setSelected(prev => ({ ...prev, ...checklist, triage_notes: notes }));
        load();
    };

    const handleApprove = async (notes) => {
        await axios.put(`${API}/cr-review-action/${selected.id}`,
            { action: 'Approved for Filing', rejection_reason: notes }, { headers: hdrs() });
        setSelected(null); load();
        alert('Submission approved for filing.');
    };

    // CR requires 4 complete sets of each form — enforce strictly
    const handleResubmit = async (missingItems, notes) => {
        await axios.put(`${API}/cr-review-action/${selected.id}`, {
            action:                 'Pending Resubmission',
            rejection_reason:       notes || 'Please correct the flagged documents.',
            missing_items:          missingItems.map(i => i.label).join('; '),
            missing_checklist_keys: missingItems.map(i => i.key).join(','),
        }, { headers: hdrs() });
        setSelected(null);
        load();
    };

    if (loading) return <div className="ur-page"></div>;

    const BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;

    return (
        <div className="ur-page">
            {error && (
                <div className="ur-error">
                    <i className="bi bi-exclamation-triangle me-2"></i>{error}
                </div>
            )}

            <div className="ur-table-card">
                {submissions.length === 0 ? (
                    <div className="ur-empty">
                        <i className="bi bi-inbox"></i>
                        <p>No Copyright submissions are currently under review.</p>
                    </div>
                ) : (
                    <div className="ur-table-scroll">
                    <table className="ur-table">
                        <thead><tr>
                            <th><i className="bi bi-hash"></i>REF</th>
                            <th><i className="bi bi-card-heading"></i>TITLE</th>
                            <th><i className="bi bi-person"></i>AUTHOR</th>
                            <th><i className="bi bi-palette"></i>WORK TYPE</th>
                            <th><i className="bi bi-shield-check"></i>STATUS</th>
                            <th><i className="bi bi-calendar3"></i>FILED</th>
                            <th><i className="bi bi-lightning"></i>ACTION</th>
                        </tr></thead>
                        <tbody>
                            {submissions.map(s => {
                                return (
                                    <tr key={s.id}>
                                        <td><span className="ur-ref-badge">CR-{s.id}</span></td>
                                        <td style={{ fontWeight: 700 }}>{s.title || 'N/A'}</td>
                                        <td>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.inventor_name || 'N/A'}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>{s.inventor_email || ''}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 12, background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700 }}>
                                                {s.work_type || s.project_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`ur-status-badge ${
                                                s.status === 'Pending Resubmission' || s.status === 'Resubmission'
                                                    ? 'resubmission' : 'under-review'
                                            }`}>
                                                <i className={`bi ${
                                                    s.status === 'Pending Resubmission' || s.status === 'Resubmission'
                                                        ? 'bi-arrow-clockwise' : 'bi-hourglass-split'
                                                }`}></i>
                                                {s.status || 'Under Review'}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmt(s.filing_date || s.date_submitted)}</td>
                                        <td>
                                            <button className="ur-review-btn" onClick={() => setSelected(s)}>
                                                <i className="bi bi-clipboard2-pulse"></i>
                                                Triage &amp; Review
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {selected && (
                <TriagePanel
                    project={selected}
                    ipType="cr"
                    onClose={() => setSelected(null)}
                    onSave={handleSave}
                    onApprove={handleApprove}
                    onResubmit={handleResubmit}
                />
            )}
        </div>
    );
}