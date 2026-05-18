// Approvedcr.jsx — Copyright
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ApprovedRow from './ApprovedRow';
import './UnderReview.css';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

export default function Approvedcr() {
    const [submissions, setSubmissions] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);

    const load = useCallback(async () => {
        try {
            const res  = await axios.get(`${API}/cr-submissions-approved`, { headers: hdrs() });
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setSubmissions(data);
            setError(null);
        } catch (err) {
            console.error('❌', err);
            setError('Failed to load Copyright submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [load]);

    if (loading) return (
        <div className="ur-page">
            <div className="ur-loader"><div className="ur-spinner"></div><p>Loading…</p></div>
        </div>
    );

    return (
        <div className="ur-page">
            {error && <div className="ur-error"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>}

            <div className="ur-table-card">
                {submissions.length === 0 ? (
                    <div className="ur-empty">
                        <i className="bi bi-inbox"></i>
                        <p>No approved Copyright submissions found.</p>
                    </div>
                ) : (
                    <table className="ur-table">
                        <thead>
                            <tr>
                                <th><i className="bi bi-hash"></i>REF</th>
                                <th><i className="bi bi-card-heading"></i>TITLE</th>
                                <th><i className="bi bi-person"></i>INVENTOR</th>
                                <th><i className="bi bi-shield-check"></i>STATUS</th>
                                <th><i className="bi bi-tag"></i>TYPE</th>
                                <th><i className="bi bi-calendar-check"></i>APPROVED</th>
                                <th><i className="bi bi-lightning"></i>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(s => (
                                <ApprovedRow
                                    key={s.id}
                                    project={s}
                                    ipType="cr"
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}