import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

// ─── Helpers ─────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)         return 'Just now';
    if (diff < 3600)       return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)      return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 86400 * 7)  return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)} wks ago`;
    return `${Math.floor(diff / 86400 / 30)} mos ago`;
}

function getUrgencyClass(dateStr) {
    if (!dateStr) return '';
    const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (days >= 14) return 'urgent';
    if (days >= 7)  return 'warning';
    return '';
}

function getActionLabel(status) {
    switch (status) {
        case 'Assigned':              return { label: 'Start Review',    icon: 'bi-play-circle',         cls: 'btn-start'    };
        case 'Under Review':          return { label: 'Continue Triage', icon: 'bi-search',              cls: 'btn-continue' };
        case 'Pending Resubmission':  return { label: 'Awaiting Docs',   icon: 'bi-hourglass',           cls: 'btn-waiting'  };
        case 'Resubmission':          return { label: 'Awaiting Docs',   icon: 'bi-hourglass',           cls: 'btn-waiting'  };
        case 'Approved for Filing':   return { label: 'Upload PAS',      icon: 'bi-cloud-arrow-up',      cls: 'btn-pas'      };
        default:                      return { label: 'View',            icon: 'bi-eye',                 cls: 'btn-view'     };
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Assigned':             return 'badge-assigned';
        case 'Under Review':         return 'badge-review';
        case 'Pending Resubmission':
        case 'Resubmission':         return 'badge-resub';
        case 'Approved for Filing':  return 'badge-approved';
        default:                     return 'badge-default';
    }
}

// ─── Main Component ───────────────────────────────────────────
function IPSpecialistDashboard() {
    const [stats,     setStats]     = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const [timeRange, setTimeRange] = useState('all');

    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, [timeRange]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/specialist/dashboard-stats?range=${timeRange}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStats(response.data.data || null);
            setError(null);
        } catch (err) {
            console.error('Error fetching specialist dashboard stats:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // ── Error ──
    if (error && !stats) {
        return (
            <div className="specialist-dashboard">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchDashboardStats} className="btn-retry">Retry</button>
                </div>
            </div>
        );
    }

    const {
        myCases           = {},
        ipTypeBreakdown   = {},
        recentSubmissions = [],
        approvalRate      = 0,
        submissions       = {},
    } = stats || {};

    // Fallback — support both old and new backend shape
    const assignedCount   = myCases.assigned   ?? submissions.pendingTriage  ?? 0;
    const underReviewCount= myCases.underReview ?? submissions.underReview   ?? 0;
    const pendingResubCount=myCases.pendingResub?? submissions.pendingResub  ?? 0;
    const approvedCount   = myCases.approved   ?? submissions.approved       ?? 0;
    const totalActive     = assignedCount + underReviewCount + pendingResubCount + approvedCount;

    return (
        <div className="specialist-dashboard">

            {/* ══ Header ══════════════════════════════════════════ */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-clipboard2-pulse"></i> Specialist Dashboard
                    </h2>
                    <p className="subtitle">My active IP cases — real-time overview</p>
                </div>
                <div className="header-right">
                    <select
                        className="time-range-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <button onClick={fetchDashboardStats} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* ══ Summary Cards ═══════════════════════════════════ */}
            <div className="stats-grid">

                {/* Assigned to Me */}
                <div className="stat-card assigned">
                    <div className="card-icon">
                        <i className="bi bi-inbox-fill"></i>
                    </div>
                    <div className="card-content">
                        <h3>{assignedCount}</h3>
                        <p>Assigned to Me</p>
                        <span className="trend">
                            <i className="bi bi-arrow-right-circle"></i> Not yet started
                        </span>
                    </div>
                </div>

                {/* Under Review */}
                <div className="stat-card review">
                    <div className="card-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div className="card-content">
                        <h3>{underReviewCount}</h3>
                        <p>Under Review</p>
                        <span className="trend">
                            <i className="bi bi-search"></i> In progress
                        </span>
                    </div>
                </div>

                {/* Pending Resubmission */}
                <div className="stat-card resub">
                    <div className="card-icon">
                        <i className="bi bi-arrow-counterclockwise"></i>
                    </div>
                    <div className="card-content">
                        <h3>{pendingResubCount}</h3>
                        <p>Pending Resubmission</p>
                        <span className="trend">
                            <i className="bi bi-person-exclamation"></i> Awaiting inventor
                        </span>
                    </div>
                </div>

                {/* Approved for Filing */}
                <div className="stat-card portfolio">
                    <div className="card-icon">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="card-content">
                        <h3>{approvedCount}</h3>
                        <p>Approved for Filing</p>
                        <span className="trend">
                            <i className="bi bi-cloud-arrow-up"></i> Awaiting PAS upload
                        </span>
                    </div>
                </div>

            </div>

            {/* ══ Secondary Stats Row ═════════════════════════════ */}
            <div className="secondary-stats">
                <div className="stat-box">
                    <i className="bi bi-layers"></i>
                    <div>
                        <strong>{totalActive}</strong>
                        <span>Total Active Cases</span>
                    </div>
                </div>
                <div className="stat-box">
                    <i className="bi bi-file-earmark-text"></i>
                    <div>
                        <strong>{submissions.total || 0}</strong>
                        <span>Assigned Submissions</span>
                    </div>
                </div>
                <div className="stat-box">
                    <i className="bi bi-check2-all"></i>
                    <div>
                        <strong>{approvedCount}</strong>
                        <span>Approved for Filing</span>
                    </div>
                </div>
                <div className="stat-box">
                    <i className="bi bi-percent"></i>
                    <div>
                        <strong>{Math.round(approvalRate)}%</strong>
                        <span>Approval Rate</span>
                    </div>
                </div>
            </div>

            {/* ══ Dashboard Grid (IP Breakdown + Resubmission) ════ */}
            <div className="dashboard-grid">

                {/* IP Type Breakdown */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3><i className="bi bi-pie-chart"></i> IP Type Breakdown</h3>
                    </div>
                    <div className="card-body">
                        <div className="breakdown-list">
                            {[
                                { key: 'ID', label: 'Industrial Design', cls: 'id' },
                                { key: 'TM', label: 'Trademark',         cls: 'tm' },
                                { key: 'CR', label: 'Copyright',         cls: 'cr' },
                                { key: 'UM', label: 'Utility Model',     cls: 'um' },
                            ].map(({ key, label, cls }) => (
                                <div className="breakdown-item" key={key}>
                                    <div className="item-label">
                                        <span className={`type-badge ${cls}`}>{key}</span>
                                        <span>{label}</span>
                                    </div>
                                    <div className="item-value">
                                        <strong>{ipTypeBreakdown[key] || 0}</strong>
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${cls}`}
                                                style={{ width: `${((ipTypeBreakdown[key] || 0) / (submissions.total || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resubmission Status */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3><i className="bi bi-arrow-counterclockwise"></i> Resubmission Status</h3>
                    </div>
                    <div className="card-body">
                        <div className="breakdown-list">
                            <div className="breakdown-item">
                                <div className="item-label">
                                    <span className="type-badge resub">Pending</span>
                                    <span>Awaiting inventor action</span>
                                </div>
                                <div className="item-value">
                                    <strong>{pendingResubCount}</strong>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill resub"
                                            style={{ width: pendingResubCount > 0 ? '100%' : '0%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="breakdown-item">
                                <div className="item-label">
                                    <span className="type-badge pending">Resubmitted</span>
                                    <span>Documents received</span>
                                </div>
                                <div className="item-value">
                                    <strong>{stats?.resubmissions?.submitted || 0}</strong>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill pending"
                                            style={{ width: stats?.resubmissions?.submitted > 0 ? '100%' : '0%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Summary inside resubmission card */}
                        <div className="resub-summary-row">
                            <div className="summary-item">
                                <label>Assigned Submissions</label>
                                <strong>{submissions.total || 0}</strong>
                            </div>
                            <div className="summary-item">
                                <label>Under Review</label>
                                <strong>{underReviewCount}</strong>
                            </div>
                            <div className="summary-item">
                                <label>System Status</label>
                                <strong className="status-active">
                                    <i className="bi bi-circle-fill"></i> Active
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ══ My Active Cases ══════════════════════════════════ */}
            <div className="dashboard-card active-cases-card">
                <div className="card-header active-cases-header">
                    <h3>
                        <i className="bi bi-briefcase"></i> My Active Cases
                    </h3>
                    <span className="cases-count-badge">{recentSubmissions.length} cases</span>
                </div>
                <div className="active-cases-body">
                    {recentSubmissions.length > 0 ? (
                        <div className="active-cases-scroll">
                            <table className="submissions-table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Title</th>
                                        <th>IP Type</th>
                                        <th>Inventor</th>
                                        <th>Age</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSubmissions.map((row, i) => {
                                        const action    = getActionLabel(row.status);
                                        const urgency   = getUrgencyClass(row.dateFiled || row.assignedAt);
                                        const statusCls = getStatusBadgeClass(row.status);

                                        return (
                                            <tr key={i} className={`table-row ${urgency}`}>
                                                <td>
                                                    <span className="ref-id">
                                                        {row.type}-{row.id}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="td-title" title={row.title}>
                                                        {row.title}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`type-badge ${row.type?.toLowerCase()}`}>
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="td-meta">{row.inventor}</td>
                                                <td>
                                                    <span className={`age-label ${urgency}`}>
                                                        {urgency === 'urgent'  && <i className="bi bi-exclamation-triangle-fill"></i>}
                                                        {urgency === 'warning' && <i className="bi bi-clock-history"></i>}
                                                        {' '}{timeAgo(row.dateFiled || row.assignedAt)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${statusCls}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className={`btn-case-action ${action.cls}`}>
                                                        <i className={`bi ${action.icon}`}></i>
                                                        {' '}{action.label}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-data">
                            <i className="bi bi-inbox"></i>
                            <p>No active cases assigned to you</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

export default IPSpecialistDashboard;