import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('all'); // all, today, week, month

    useEffect(() => {
        fetchDashboardStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, [timeRange]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/dashboard-stats?range=${timeRange}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // 🔍 DEBUG LOGS - Check console to see what data is coming
            console.log('=== DASHBOARD DEBUG ===');
            console.log('📊 Full API Response:', response.data);
            console.log('🏢 usersByDeliveryUnit:', response.data.data?.usersByDeliveryUnit);
            console.log('📝 Keys:', Object.keys(response.data.data?.usersByDeliveryUnit || {}));
            console.log('📏 Keys Length:', Object.keys(response.data.data?.usersByDeliveryUnit || {}).length);
            
            if (!response.data.data?.usersByDeliveryUnit) {
                console.error('❌ usersByDeliveryUnit is undefined! Backend not sending data!');
            } else if (Object.keys(response.data.data.usersByDeliveryUnit).length === 0) {
                console.error('❌ usersByDeliveryUnit is empty {}! Users might not be active/approved!');
            } else {
                console.log('✅ usersByDeliveryUnit has data:', response.data.data.usersByDeliveryUnit);
            }
            
            setStats(response.data.data || null);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="dashboard-container">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchDashboardStats} className="btn-retry">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const {
        submissions = {},
        reviews = {},
        users = {},
        usersByDeliveryUnit = {},
        ipTypeBreakdown = {},
        approvalRate = 0
    } = stats || {};

    // Calculate total users across all delivery units
    const totalDeliveryUnitUsers = Object.values(usersByDeliveryUnit || {}).reduce((sum, count) => sum + count, 0);

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-speedometer2"></i> Admin Dashboard
                    </h2>
                    <p className="subtitle">Real-time system overview</p>
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

            {/* Main Stats Grid */}
            <div className="stats-grid">
                {/* New Submissions */}
                <div className="stat-card new">
                    <div className="card-icon">
                        <i className="bi bi-file-earmark-plus"></i>
                    </div>
                    <div className="card-content">
                        <h3>{submissions.new || 0}</h3>
                        <p>New Submissions</p>
                        <span className="trend">
                            <i className="bi bi-arrow-up"></i> +{submissions.newToday || 0} today
                        </span>
                    </div>
                </div>

                {/* Active Reviews */}
                <div className="stat-card active">
                    <div className="card-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div className="card-content">
                        <h3>{reviews.pending || 0}</h3>
                        <p>Active Reviews</p>
                        <span className="trend">
                            <i className="bi bi-clock"></i> Pending approval
                        </span>
                    </div>
                </div>

                {/* Completed */}
                <div className="stat-card completed">
                    <div className="card-icon">
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="card-content">
                        <h3>{submissions.approved || 0}</h3>
                        <p>Completed</p>
                        <span className="trend">
                            <i className="bi bi-trophy"></i> Approved filings
                        </span>
                    </div>
                </div>

                {/* Approval Rate */}
                <div className="stat-card rate">
                    <div className="card-icon">
                        <i className="bi bi-percent"></i>
                    </div>
                    <div className="card-content">
                        <h3>{Math.round(approvalRate)}%</h3>
                        <p>Approval Rate</p>
                        <span className="trend">
                            <i className="bi bi-graph-up"></i> Success rate
                        </span>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="secondary-stats">
                <div className="stat-box">
                    <i className="bi bi-people"></i>
                    <div>
                        <strong>{users.inventors || 0}</strong>
                        <span>Inventors</span>
                    </div>
                </div>

                <div className="stat-box">
                    <i className="bi bi-person-badge"></i>
                    <div>
                        <strong>{users.consultants || 0}</strong>
                        <span>Consultants</span>
                    </div>
                </div>

                <div className="stat-box">
                    <i className="bi bi-inbox"></i>
                    <div>
                        <strong>{submissions.total || 0}</strong>
                        <span>Total Submissions</span>
                    </div>
                </div>

                <div className="stat-box">
                    <i className="bi bi-star"></i>
                    <div>
                        <strong>{users.total || 0}</strong>
                        <span>Total Users</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* IP Type Breakdown */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>
                            <i className="bi bi-pie-chart"></i> IP Type Breakdown
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="breakdown-list">
                            <div className="breakdown-item">
                                <div className="item-label">
                                    <span className="type-badge id">ID</span>
                                    <span>Industrial Design</span>
                                </div>
                                <div className="item-value">
                                    <strong>{ipTypeBreakdown.ID || 0}</strong>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill id"
                                            style={{ width: `${((ipTypeBreakdown.ID || 0) / (submissions.total || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="breakdown-item">
                                <div className="item-label">
                                    <span className="type-badge tm">TM</span>
                                    <span>Trademark</span>
                                </div>
                                <div className="item-value">
                                    <strong>{ipTypeBreakdown.TM || 0}</strong>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill tm"
                                            style={{ width: `${((ipTypeBreakdown.TM || 0) / (submissions.total || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="breakdown-item">
                                <div className="item-label">
                                    <span className="type-badge cr">CR</span>
                                    <span>Copyright</span>
                                </div>
                                <div className="item-value">
                                    <strong>{ipTypeBreakdown.CR || 0}</strong>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill cr"
                                            style={{ width: `${((ipTypeBreakdown.CR || 0) / (submissions.total || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="breakdown-item">
                                <div className="item-label">
                                    <span className="type-badge um">UM</span>
                                    <span>Utility Model</span>
                                </div>
                                <div className="item-value">
                                    <strong>{ipTypeBreakdown.UM || 0}</strong>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill um"
                                            style={{ width: `${((ipTypeBreakdown.UM || 0) / (submissions.total || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventors Per Delivery Unit */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>
                            <i className="bi bi-building"></i> Inventors Per Delivery Unit
                        </h3>
                    </div>
                    <div className="card-body">
                        {usersByDeliveryUnit && Object.keys(usersByDeliveryUnit).length > 0 ? (
                            <div className="breakdown-list">
                                {Object.entries(usersByDeliveryUnit)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([unit, count], index) => {
                                        const unitColors = {
                                            'CCMS': '#1e88e5',
                                            'COTT': '#43a047',
                                            'CANR': '#f4511e',
                                            'CAS': '#8e24aa',
                                            'COED': '#fbc02d',
                                            'COENG': '#00acc1',
                                            'CBPA': '#6d4c41',
                                            'GAD': '#d81b60',
                                            'CFAST': '#5e35b1',
                                            'ETEINZA': '#00897b'
                                        };
                                        
                                        const color = unitColors[unit] || '#455a64';
                                        
                                        return (
                                            <div key={index} className="breakdown-item">
                                                <div className="item-label">
                                                    <span 
                                                        className="type-badge" 
                                                        style={{ background: color }}
                                                    >
                                                        {unit}
                                                    </span>
                                                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                                        {unit === 'CCMS' && 'College of Computer and Multimedia Studies'}
                                                        {unit === 'COTT' && 'College of Trades and Technology'}
                                                        {unit === 'CANR' && 'College of Agriculture and Natural Resources'}
                                                        {unit === 'CAS' && 'College of Arts and Sciences'}
                                                        {unit === 'COED' && 'College of Education'}
                                                        {unit === 'COENG' && 'College of Engineering'}
                                                        {unit === 'CBPA' && 'College of Business and Public Administration'}
                                                        {unit === 'GAD' && 'Gender and Development'}
                                                        {unit === 'CFAST' && 'College of Fisheries, Aquatic Sciences and Technology'}
                                                        {unit === 'ETEINZA' && 'ETEINZA'}
                                                        {!['CCMS', 'COTT', 'CANR', 'CAS', 'COED', 'COENG', 'CBPA', 'GAD', 'CFAST', 'ETEINZA'].includes(unit) && 'Other Unit'}
                                                    </span>
                                                </div>
                                                <div className="item-value">
                                                    <strong>{count}</strong>
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill"
                                                            style={{ 
                                                                width: `${totalDeliveryUnitUsers > 0 ? ((count / totalDeliveryUnitUsers) * 100).toFixed(0) : 0}%`,
                                                                background: color
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="no-data">
                                <i className="bi bi-inbox"></i>
                                <p>No delivery unit data available</p>
                                <small style={{ display: 'block', marginTop: '10px', color: '#999' }}>
                                    Check browser console (F12) for debug info
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Summary */}
            <div className="system-summary">
                <h3>
                    <i className="bi bi-info-circle"></i> System Summary
                </h3>
                <div className="summary-grid">
                    <div className="summary-item">
                        <label>Total Inventors</label>
                        <strong>{users.inventors || 0}</strong>
                    </div>
                    <div className="summary-item">
                        <label>Total Consultants</label>
                        <strong>{users.consultants || 0}</strong>
                    </div>
                    <div className="summary-item">
                        <label>Total Submissions</label>
                        <strong>{submissions.total || 0}</strong>
                    </div>
                    <div className="summary-item">
                        <label>Pending Reviews</label>
                        <strong>{reviews.pending || 0}</strong>
                    </div>
                    <div className="summary-item">
                        <label>Approved Filings</label>
                        <strong>{submissions.approved || 0}</strong>
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
    );
}

export default Dashboard;