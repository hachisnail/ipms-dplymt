import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemAudit.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function SystemAudit() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/system-audit`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to load activity logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const csvData = filteredLogs.map(log => ({
            'Timestamp': formatTimestamp(log.timestamp),
            'User Name': log.user_name || 'System',
            'Role': log.user_type || 'N/A',
            'Action': log.action_type,
            'Description': log.description,
            'Status': log.activity_status || 'SUCCESS',
            'Flag': log.flag_type || 'NORMAL'
        }));

        const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ipms-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (actionType) => {
        const colors = {
            'Login': '#28a745',
            'Logout': '#6c757d',
            'Failed Login': '#dc3545',
            'Upload': '#007bff',
            'New Submission': '#28a745',
            'Approval': '#28a745',
            'Rejection': '#dc3545',
            'Status Change': '#17a2b8',
            'Profile Update': '#fd7e14'
        };
        return colors[actionType] || '#6c757d';
    };

    const getFlagColor = (flagType) => {
        const colors = {
            'NORMAL': '#28a745',
            'WARNING': '#ffc107',
            'ERROR': '#dc3545',
            'CRITICAL': '#721c24'
        };
        return colors[flagType] || '#28a745';
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            (log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesAction = filterAction === 'all' || log.action_type === filterAction;
        const matchesRole = filterRole === 'all' || log.user_type === filterRole;
        
        let matchesDate = true;
        if (dateRange.start && dateRange.end) {
            const logDate = new Date(log.timestamp);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end + ' 23:59:59');
            matchesDate = logDate >= startDate && logDate <= endDate;
        }
        
        return matchesSearch && matchesAction && matchesRole && matchesDate;
    });

    if (loading) {
        return (
            <div className="audit-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Activity Logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="audit-container">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchLogs} className="btn-retry">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="audit-container">
            {/* Header */}
            <div className="audit-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-clipboard-data"></i> System Activity Log
                    </h2>
                    <p className="subtitle">Complete audit trail of all IPMS activities</p>
                </div>
                <div className="header-right">
                    <button onClick={handleExportCSV} className="btn-export" disabled={filteredLogs.length === 0}>
                        <i className="bi bi-download"></i> Export CSV
                    </button>
                    <button onClick={fetchLogs} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filters-row">
                    <div className="search-bar">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by user or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label><i className="bi bi-funnel"></i> Action:</label>
                        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                            <option value="all">All Actions</option>
                            <option value="Login">Login</option>
                            <option value="Failed Login">Failed Login</option>
                            <option value="Upload">Upload</option>
                            <option value="New Submission">New Submission</option>
                            <option value="Approval">Approval</option>
                            <option value="Rejection">Rejection</option>
                            <option value="Status Change">Status Change</option>
                            <option value="Profile Update">Profile Update</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label><i className="bi bi-people"></i> Role:</label>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="all">All Roles</option>
                            <option value="INVENTOR">Inventor</option>
                            <option value="CONSULTANT">Consultant</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>

                <div className="date-filter-row">
                    <div className="filter-group">
                        <label><i className="bi bi-calendar"></i> From:</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label><i className="bi bi-calendar"></i> To:</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button 
                        onClick={() => {
                            setDateRange({ start: '', end: '' });
                            setSearchTerm('');
                            setFilterAction('all');
                            setFilterRole('all');
                        }} 
                        className="btn-clear-dates"
                    >
                        <i className="bi bi-x-circle"></i> Clear All
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-journal-text"></i></div>
                    <div className="stat-content">
                        <h3>{filteredLogs.length}</h3>
                        <p>Total Activities</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-people"></i></div>
                    <div className="stat-content">
                        <h3>{[...new Set(filteredLogs.map(l => l.user_name).filter(Boolean))].length}</h3>
                        <p>Active Users</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-exclamation-triangle"></i></div>
                    <div className="stat-content">
                        <h3>{filteredLogs.filter(l => l.flag_type === 'WARNING' || l.flag_type === 'ERROR').length}</h3>
                        <p>Flagged Items</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-calendar-day"></i></div>
                    <div className="stat-content">
                        <h3>{filteredLogs.length > 0 ? formatTimestamp(filteredLogs[0].timestamp).split(',')[0] : 'N/A'}</h3>
                        <p>Latest Activity</p>
                    </div>
                </div>
            </div>

            {/* Activity Table */}
            {filteredLogs.length === 0 ? (
                <div className="no-data">
                    <i className="bi bi-inbox"></i>
                    <p>No activity logs found</p>
                </div>
            ) : (
                <div className="activity-table-container">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User Name</th>
                                <th>Role</th>
                                <th>Action</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Flag</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, index) => (
                                <tr key={log.id || index} className={`flag-${(log.flag_type || 'normal').toLowerCase()}`}>
                                    <td className="timestamp-cell">{formatTimestamp(log.timestamp)}</td>
                                    <td className="user-cell">
                                        <i className="bi bi-person-circle"></i>
                                        {log.user_name || 'System'}
                                    </td>
                                    <td>
                                        <span className="role-badge" style={{ 
                                            background: log.user_type === 'ADMIN' ? '#0f172a' : 
                                                       log.user_type === 'CONSULTANT' ? '#6f42c1' : '#17a2b8' 
                                        }}>
                                            {log.user_type || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="action-badge" style={{ background: getActionColor(log.action_type) }}>
                                            {log.action_type}
                                        </span>
                                    </td>
                                    <td className="description-cell">{log.description}</td>
                                    <td>
                                        <span className={`status-badge status-${(log.activity_status || 'success').toLowerCase()}`}>
                                            {log.activity_status || 'SUCCESS'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="flag-badge" style={{ background: getFlagColor(log.flag_type || 'NORMAL') }}>
                                            {log.flag_type || 'NORMAL'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SystemAudit;