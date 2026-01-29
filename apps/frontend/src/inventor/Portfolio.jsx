// Portfolio.jsx - Fixed version with updated chart library
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import axios from 'axios';
import './Portfolio.css';

// ✅ Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

export default function Portfolio() {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totals, setTotals] = useState({ id: 0, cr: 0, tm: 0, um: 0 });
    const [selectedYear, setSelectedYear] = useState('all');
    const [availableYears, setAvailableYears] = useState([]);

    // useCallback to memoize fetchPortfolioData and avoid missing dependency warning
    const fetchPortfolioData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const yearParam = selectedYear !== 'all' ? `&year=${selectedYear}` : '';

            const [idRes, crRes, tmRes, umRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/portfolio/approved-submissions?type=id${yearParam}`),
                axios.get(`${API_BASE_URL}/portfolio/approved-submissions?type=cr${yearParam}`),
                axios.get(`${API_BASE_URL}/portfolio/approved-submissions?type=tm${yearParam}`),
                axios.get(`${API_BASE_URL}/portfolio/approved-submissions?type=um${yearParam}`),
            ]);

            const idData = Array.isArray(idRes.data) ? idRes.data : [];
            const crData = Array.isArray(crRes.data) ? crRes.data : [];
            const tmData = Array.isArray(tmRes.data) ? tmRes.data : [];
            const umData = Array.isArray(umRes.data) ? umRes.data : [];

            // Calculate totals
            setTotals({
                id: idData.reduce((sum, d) => sum + (d?.submissions || 0), 0),
                cr: crData.reduce((sum, d) => sum + (d?.submissions || 0), 0),
                tm: tmData.reduce((sum, d) => sum + (d?.submissions || 0), 0),
                um: umData.reduce((sum, d) => sum + (d?.submissions || 0), 0),
            });

            // Get all unique labels and years
            const allLabels = new Set([
                ...idData.map(d => d?.label).filter(Boolean),
                ...crData.map(d => d?.label).filter(Boolean),
                ...tmData.map(d => d?.label).filter(Boolean),
                ...umData.map(d => d?.label).filter(Boolean),
            ]);

            const labels = Array.from(allLabels).sort((a, b) => {
                const [aMonth, aYear] = a.split(' ');
                const [bMonth, bYear] = b.split(' ');
                const aDate = new Date(`${aMonth} 1, ${aYear}`);
                const bDate = new Date(`${bMonth} 1, ${bYear}`);
                return aDate - bDate;
            });

            // Extract years for filter dropdown
            const years = new Set();
            [...idData, ...crData, ...tmData, ...umData].forEach(d => {
                if (d?.year) years.add(d.year);
            });
            setAvailableYears(Array.from(years).sort((a, b) => b - a));

            // Create data maps
            const createDataMap = (data) => {
                const map = {};
                data.forEach(item => {
                    if (item?.label) {
                        map[item.label] = item.submissions || 0;
                    }
                });
                return map;
            };

            const idMap = createDataMap(idData);
            const crMap = createDataMap(crData);
            const tmMap = createDataMap(tmData);
            const umMap = createDataMap(umData);

            // Set chart data
            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'Industrial Design',
                        data: labels.map(label => idMap[label] || 0),
                        backgroundColor: 'rgba(39, 174, 96, 0.8)',
                        borderColor: '#27ae60',
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: 'rgba(39, 174, 96, 1)',
                    },
                    {
                        label: 'Copyright',
                        data: labels.map(label => crMap[label] || 0),
                        backgroundColor: 'rgba(231, 76, 60, 0.8)',
                        borderColor: '#e74c3c',
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: 'rgba(231, 76, 60, 1)',
                    },
                    {
                        label: 'Trademark',
                        data: labels.map(label => tmMap[label] || 0),
                        backgroundColor: 'rgba(243, 156, 18, 0.8)',
                        borderColor: '#f39c12',
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: 'rgba(243, 156, 18, 1)',
                    },
                    {
                        label: 'Utility Model',
                        data: labels.map(label => umMap[label] || 0),
                        backgroundColor: 'rgba(142, 68, 173, 0.8)',
                        borderColor: '#8e44ad',
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: 'rgba(142, 68, 173, 1)',
                    },
                ],
            });
        } catch (err) {
            console.error("Error fetching approved submissions:", err);
            setError("Failed to load portfolio data. Please check if the backend is running.");
            setChartData({ labels: [], datasets: [] });
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchPortfolioData();
    }, [fetchPortfolioData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: 'bold' },
                },
            },
            title: {
                display: true,
                text: `Approved IP Submissions Trend ${selectedYear !== 'all' ? `(${selectedYear})` : '(All Years)'}`,
                font: { size: 16, weight: 'bold' },
                padding: 20,
            },
        },
        scales: {
            x: {
                stacked: false,
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
                title: {
                    display: true,
                    text: 'Number of Approved Submissions',
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    if (loading) {
        return (
            <div className="portfolio-container" style={{ 
                padding: '40px', 
                textAlign: 'center' 
            }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading Portfolio Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="portfolio-container" style={{ 
                padding: '40px', 
                textAlign: 'center' 
            }}>
                <div style={{
                    padding: '20px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb'
                }}>
                    <h4>⚠️ Error Loading Portfolio</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const totalApproved = totals.id + totals.cr + totals.tm + totals.um;

    return (
        <div className="portfolio-page">
            <div className="portfolio-header">
                <div></div>
                <div className="year-filter">
                    <label htmlFor="year-select">Filter by Year: </label>
                    <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="year-dropdown"
                    >
                        <option value="all">All Years</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card green">
                    <h3>Industrial Design</h3>
                    <p className="stat-value">{totals.id}</p>
                    <span className="stat-label">Approved</span>
                </div>
                <div className="stat-card red">
                    <h3>Copyright</h3>
                    <p className="stat-value">{totals.cr}</p>
                    <span className="stat-label">Approved</span>
                </div>
                <div className="stat-card yellow">
                    <h3>Trademark</h3>
                    <p className="stat-value">{totals.tm}</p>
                    <span className="stat-label">Approved</span>
                </div>
                <div className="stat-card purple">
                    <h3>Utility Model</h3>
                    <p className="stat-value">{totals.um}</p>
                    <span className="stat-label">Approved</span>
                </div>
            </div>

            {/* Total Summary */}
            <div className="total-summary">
                <h3>Total Approved Submissions: <span>{totalApproved}</span></h3>
            </div>

            {/* Chart Container */}
            <div className="chart-container">
                {chartData.labels.length > 0 ? (
                    <Bar options={chartOptions} data={chartData} />
                ) : (
                    <div className="no-data-message">
                        <p>No approved submissions data available for the selected period.</p>
                    </div>
                )}
            </div>
        </div>
    );
}