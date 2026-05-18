import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const getToken = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').token || localStorage.getItem('token') || ''; }
    catch { return localStorage.getItem('token') || ''; }
};
const hdrs = () => ({ Authorization: `Bearer ${getToken()}` });
const fmt  = d => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ── Status colours ────────────────────────────────────────────────────────────
const S_COLOR = {
    'Submitted':            { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
    'Assigned':             { bg: '#EEEDFE', text: '#534AB7', dot: '#7F77DD' },
    'Under Review':         { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27' },
    'Under Re-review':      { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27' },
    'Pending Resubmission': { bg: '#FCEBEB', text: '#A32D2D', dot: '#E24B4A' },
    'Approved for Filing':  { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
    'Filed to IPOPHL':      { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
    'Filed to NLP':         { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
    'Rejected':             { bg: '#FCEBEB', text: '#A32D2D', dot: '#E24B4A' },
};

const IP_STYLE = {
    'Utility Model':     { color: '#185FA5', bg: '#E6F1FB', border: '#B5D4F4' },
    'Industrial Design': { color: '#534AB7', bg: '#EEEDFE', border: '#CECBF6' },
    'Trademark':         { color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
    'Copyright':         { color: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB' },
};
const IP_FULL = { UM: 'Utility Model', ID: 'Industrial Design', TM: 'Trademark', CR: 'Copyright' };

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
    const size = 110; const cx = 55; const r = 40; const sw = 14;
    const total = data.reduce((s, d) => s + d.value, 0);
    const [hovered, setHovered] = useState(null);

    if (total === 0) return (
        <div className="invdb-chart-empty">
            <i className="bi bi-pie-chart"></i><span>No data yet</span>
        </div>
    );

    let angle = -90;
    const slices = data.filter(d => d.value > 0).map(d => {
        const sweep = (d.value / total) * 360;
        const a1 = (angle * Math.PI) / 180;
        const a2 = ((angle + sweep) * Math.PI) / 180;
        angle += sweep;
        return {
            ...d, sweep,
            x1: cx + r * Math.cos(a1), y1: cx + r * Math.sin(a1),
            x2: cx + r * Math.cos(a2), y2: cx + r * Math.sin(a2),
            large: sweep > 180 ? 1 : 0,
        };
    });

    const active = data.find(d => d.label === hovered);

    return (
        <div className="invdb-donut-wrap">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
                {slices.map(s => (
                    <path key={s.label}
                        d={`M${s.x1} ${s.y1} A${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2}`}
                        fill="none" stroke={s.color}
                        strokeWidth={hovered === s.label ? sw + 3 : sw}
                        strokeLinecap="butt"
                        style={{ cursor: 'pointer', transition: 'stroke-width 0.15s' }}
                        onMouseEnter={() => setHovered(s.label)}
                        onMouseLeave={() => setHovered(null)}
                    />
                ))}
                <text x={cx} y={cx - 5} textAnchor="middle" fontSize="16" fontWeight="600" fill="#0f172a">
                    {active ? active.value : total}
                </text>
                <text x={cx} y={cx + 10} textAnchor="middle" fontSize="8" fill="#64748b">
                    {active ? active.label.split(' ')[0] : 'total'}
                </text>
            </svg>
            <div className="invdb-donut-legend">
                {data.filter(d => d.value > 0).map(d => (
                    <div key={d.label}
                        className={`invdb-legend-row${hovered === d.label ? ' active' : ''}`}
                        onMouseEnter={() => setHovered(d.label)}
                        onMouseLeave={() => setHovered(null)}>
                        <span className="invdb-legend-dot" style={{ background: d.color }}></span>
                        <span className="invdb-legend-lbl">{d.label}</span>
                        <span className="invdb-legend-num">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="invdb-bar-wrap">
            {data.map(d => (
                <div key={d.label} className="invdb-bar-row">
                    <span className="invdb-bar-lbl">{d.label}</span>
                    <div className="invdb-bar-track">
                        <div className="invdb-bar-fill"
                            style={{ width: `${(d.value / max) * 100}%`, background: d.color }}>
                            {d.value > 0 && <span className="invdb-bar-num">{d.value}</span>}
                        </div>
                    </div>
                    {d.value === 0 && <span className="invdb-bar-zero">0</span>}
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InventorDashboard() {
    const [submissions, setSubmissions] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [userName,    setUserName]    = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                setUserName(u.name || u.full_name || u.username || '');
            } catch {}
            const res  = await axios.get(`${API}/tracker/submissions`, { headers: hdrs() });
            const data = Array.isArray(res.data) ? res.data : (res.data?.submissions || []);
            setSubmissions(data);
            setError(null);
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError('Failed to load your submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const actionRequired = submissions.filter(s => s.status === 'Pending Resubmission');
    const statusCounts   = submissions.reduce((a, s) => ({ ...a, [s.status]: (a[s.status] || 0) + 1 }), {});

    const inProgress = ['Submitted','Assigned','Under Review','Under Re-review']
        .reduce((s, k) => s + (statusCounts[k] || 0), 0);
    const filed = ['Approved for Filing','Filed to IPOPHL','Filed to NLP']
        .reduce((s, k) => s + (statusCounts[k] || 0), 0);

    const donutData = [
        { label: 'In Progress',  value: inProgress,                               color: '#EF9F27' },
        { label: 'Filed',        value: filed,                                     color: '#1D9E75' },
        { label: 'Needs Action', value: statusCounts['Pending Resubmission'] || 0, color: '#E24B4A' },
        { label: 'Rejected',     value: statusCounts['Rejected'] || 0,            color: '#888780' },
    ].filter(d => d.value > 0);

    const typeCounts = submissions.reduce((a, s) => {
        const t = s.ip_type || IP_FULL[s.ip_type_prefix] || s.ip_type_prefix || 'Unknown';
        return { ...a, [t]: (a[t] || 0) + 1 };
    }, {});

    const barData = [
        { label: 'Utility Model',     value: typeCounts['Utility Model']     || typeCounts['UM'] || 0, color: '#185FA5' },
        { label: 'Industrial Design', value: typeCounts['Industrial Design']  || typeCounts['ID'] || 0, color: '#534AB7' },
        { label: 'Trademark',         value: typeCounts['Trademark']          || typeCounts['TM'] || 0, color: '#BA7517' },
        { label: 'Copyright',         value: typeCounts['Copyright']          || typeCounts['CR'] || 0, color: '#0F6E56' },
    ];

    const greeting = () => {
        const h = new Date().getHours();
        return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    };

    const goTo = hash => { window.location.hash = hash; };

    if (loading) return (
        <div className="invdb-page">
            <div className="invdb-loader">
                <div className="invdb-spinner"></div>
                <p>Loading your dashboard…</p>
            </div>
        </div>
    );

    return (
        <div className="invdb-page">

            {/* ── Greeting card ── */}
            <div className="invdb-greeting-card">
                <div>
                    <p className="invdb-greeting-title">
                        {greeting()}{userName ? `, ${userName}` : ''}! 👋
                    </p>
                    <p className="invdb-greeting-sub">
                        Here's an overview of your IP submissions at CNSC-IPMO.
                    </p>
                </div>
                <button className="invdb-refresh-btn" onClick={load} title="Refresh">
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="invdb-error-bar">
                    <i className="bi bi-exclamation-triangle-fill"></i> {error}
                </div>
            )}

            {/* ── Action Required ── */}
            {actionRequired.length > 0 && (
                <div className="invdb-action-bar">
                    <div className="invdb-action-left">
                        <div className="invdb-action-icon">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                        </div>
                        <div>
                            <p className="invdb-action-title">Action required</p>
                            <p className="invdb-action-sub">
                                {actionRequired.length} submission{actionRequired.length > 1 ? 's' : ''} returned by the IP Specialist — upload the corrected documents.
                            </p>
                        </div>
                    </div>
                    <button className="invdb-action-btn" onClick={() => goTo('Resubmission')}>
                        Fix now <i className="bi bi-arrow-right"></i>
                    </button>
                </div>
            )}

            {/* ── Summary cards ── */}
            <div className="invdb-cards">
                <div className="invdb-card" style={{ borderLeftColor: '#185FA5' }}>
                    <p className="invdb-card-lbl">Total submissions</p>
                    <p className="invdb-card-num">{submissions.length}</p>
                </div>
                <div className="invdb-card" style={{ borderLeftColor: '#BA7517' }}>
                    <p className="invdb-card-lbl">In progress</p>
                    <p className="invdb-card-num">{inProgress}</p>
                </div>
                <div className="invdb-card" style={{ borderLeftColor: '#0F6E56' }}>
                    <p className="invdb-card-lbl">Filed / approved</p>
                    <p className="invdb-card-num">{filed}</p>
                </div>
                <div className="invdb-card invdb-card--alert"
                    style={{ borderLeftColor: '#A32D2D', cursor: actionRequired.length > 0 ? 'pointer' : 'default' }}
                    onClick={() => actionRequired.length > 0 && goTo('Resubmission')}>
                    <p className="invdb-card-lbl">Needs resubmission</p>
                    <p className="invdb-card-num" style={{ color: actionRequired.length > 0 ? '#A32D2D' : 'inherit' }}>
                        {actionRequired.length}
                    </p>
                </div>
            </div>

            {/* ── Charts ── */}
            <div className="invdb-charts-row">
                <div className="invdb-chart-card">
                    <p className="invdb-chart-title">
                        <i className="bi bi-pie-chart-fill"></i> Status breakdown
                    </p>
                    <DonutChart data={donutData} />
                </div>
                <div className="invdb-chart-card">
                    <p className="invdb-chart-title">
                        <i className="bi bi-bar-chart-fill"></i> IP type distribution
                    </p>
                    <BarChart data={barData} />
                </div>
            </div>

            {/* ── Submissions table ── */}
            <div className="invdb-table-card">
                <div className="invdb-table-hdr">
                    <p className="invdb-table-title">
                        <i className="bi bi-list-ul"></i> My submissions
                    </p>
                    <button className="invdb-view-all" onClick={() => goTo('Tracker')}>
                        View all <i className="bi bi-arrow-right"></i>
                    </button>
                </div>

                {submissions.length === 0 ? (
                    <div className="invdb-table-empty">
                        <i className="bi bi-inbox"></i>
                        <p>You haven't submitted anything yet.</p>
                    </div>
                ) : (
                    <div className="invdb-table-wrap">
                        <table className="invdb-table">
                            <thead>
                                <tr>
                                    <th>Ref</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.slice(0, 8).map(s => {
                                    const prefix  = s.ip_type_prefix || 'IP';
                                    const ipLabel = s.ip_type || IP_FULL[prefix] || prefix;
                                    const ipStyle = IP_STYLE[ipLabel] || { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
                                    const sc      = S_COLOR[s.status] || { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
                                    const isAlert = s.status === 'Pending Resubmission';
                                    return (
                                        <tr key={`${prefix}-${s.id}`} className={isAlert ? 'invdb-row-alert' : ''}>
                                            <td>
                                                <span className="invdb-ref">{prefix}-{s.id}</span>
                                            </td>
                                            <td className="invdb-td-title">
                                                {s.title || 'Untitled'}
                                                {isAlert && (
                                                    <span className="invdb-needs-action">
                                                        <i className="bi bi-exclamation-circle-fill"></i> Action needed
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="invdb-type-badge"
                                                    style={{ color: ipStyle.color, background: ipStyle.bg, borderColor: ipStyle.border }}>
                                                    {ipLabel}
                                                </span>
                                            </td>
                                            <td className="invdb-td-date">{fmt(s.submission_date || s.created_at)}</td>
                                            <td>
                                                <span className="invdb-status-badge"
                                                    style={{ background: sc.bg, color: sc.text }}>
                                                    <span className="invdb-dot" style={{ background: sc.dot }}></span>
                                                    {s.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}