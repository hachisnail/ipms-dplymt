// Tracker.jsx
// ✅ FIXED: Proper API URL configuration and error handling

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Tracker.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';  // ✅ Fixed base URL

export default function Tracker() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);  // ✅ Added error state

    // ===============================
    // Fetch Submissions
    // ===============================
    const fetchSubmissions = async () => {
        try {
            if (!refreshing) setLoading(true);
            setError(null);  // ✅ Clear previous errors

            // ✅ Fixed API URL
            const res = await axios.get(`${API_BASE_URL}/tracker/submissions`);
            setSubmissions(res.data || []);
        } catch (e) {
            console.error("Fetch error:", e);
            setError("Failed to load submissions. Please check if the backend is running.");  // ✅ User-friendly error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
        const interval = setInterval(() => fetchSubmissions(), 10000);
        return () => clearInterval(interval);
    }, []);

    // ===============================
    // Open modal and fetch full details
    // ===============================
    const openDetails = async (prefix, id) => {
        try {
            // ✅ Fixed API URL
            const res = await axios.get(
                `${API_BASE_URL}/tracker/submission/${prefix}/${id}`
            );
            setSelected(res.data);
        } catch (e) {
            console.error("Failed to load details", e);
            alert("Failed to load submission details. Please try again.");
        }
    };

    return (
        <div className="tracker-list-container">
            <h2>My Submissions</h2>

            {/* Refresh Button */}
            <button
                className={`refresh-btn ${refreshing ? "loading" : ""}`}
                disabled={refreshing}
                onClick={() => {
                    setRefreshing(true);
                    fetchSubmissions();
                }}
            >
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* Error Message */}
            {error && (
                <div className="error-message" style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    borderRadius: '5px', 
                    marginBottom: '10px' 
                }}>
                    {error}
                </div>
            )}

            {/* Loading Spinner */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading submissions...</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="no-submissions" style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: '#6c757d' 
                }}>
                    <i className="bi bi-inbox" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                    <p>No submissions to track yet.</p>
                </div>
            ) : (
                <div className="tracker-cards-container">
                    <div className="tracker-scroll-area">
                        <div className="carousel-wrapper">
                            {submissions.map((item) => (
                                <SubmissionCard
                                    key={`${item.prefix}-${item.id}`}
                                    item={item}
                                    onView={() => openDetails(item.prefix, item.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selected && (
                <TrackerModal submission={selected} close={() => setSelected(null)} />
            )}
        </div>
    );
}

// ================================================
// SUBMISSION CARD COMPONENT
// ================================================
function SubmissionCard({ item, onView }) {
    return (
        <div className="submission-card">
            <div className="card-side-info">
                <div className="ip-type-label">Type</div>
                <div className="ip-type-tag">{item.submissionType}</div>
            </div>

            <div className="card-main-content">
                <div className="card-title">{item.title}</div>
                <div className="status-label">Status</div>
                <div className="status-value">{item.status}</div>
            </div>

            <div className="card-footer">
                <button className="view-details-btn" onClick={onView}>
                    View Details
                </button>
            </div>
        </div>
    );
}

// ================================================
// MODAL COMPONENT
// ================================================
function TrackerModal({ submission, close }) {
    const getStatusClass = (status) => {
        if (status.includes("Approved")) return "status-approved";
        if (status.includes("Transit") || status.includes("Processing"))
            return "status-in-transit";
        return "status-pending";
    };

    return (
        <div className="tracker-modal-overlay" onClick={close}>
            <div className="tracker-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h4>{submission.title}</h4>
                    <button className="close-btn" onClick={close}>&times;</button>
                </div>

                <div className={`modal-status-pill ${getStatusClass(submission.status)}`}>
                    {submission.status}
                </div>

                {/* TIMELINE */}
                <div className="timeline">
                    {submission.timeline && submission.timeline.length > 0 ? (
                        submission.timeline.map((t, index) => (
                            <div
                                key={index}
                                className={`timeline-item ${t.completed ? "completed" : "pending"}`}
                            >
                                <span className="timeline-dot"></span>
                                <div className="timeline-content">
                                    <strong>{t.stage}</strong>
                                    <div className="timeline-date">{t.date}</div>
                                    {t.note && <small>Note: {t.note}</small>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No timeline data available.</p>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="ok-btn" onClick={close}>OK</button>
                </div>
            </div>
        </div>
    );
}