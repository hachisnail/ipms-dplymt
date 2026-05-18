import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Row from './Row';
import './TableView.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const Copyright = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Get authentication token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    // ✅ Create axios instance with auth headers
    const createAuthAxios = () => {
        const token = getAuthToken();
        return axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
    };

    const fetchSubmissions = async () => {
        try {
            const authAxios = createAuthAxios();
            const response = await authAxios.get('/cr-submissions-new');
            console.log('✅ Fetched NEW Copyright data:', response.data);
            setSubmissions(response.data);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            
            // ✅ Handle authentication errors
            if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
                // Optional: Redirect to login
                // window.location.href = '/login';
            } else if (err.response?.status === 403) {
                setError('You do not have permission to view these submissions.');
            } else {
                setError('Failed to fetch Copyright submissions.');
            }
            setLoading(false);
        }
    };

    const handleReceive = async (projectId) => {
        const confirmReceive = window.confirm(`Are you sure you want to RECEIVE project ID ${projectId} and move it to 'Under Review'?`);
        if (!confirmReceive) return;

        try {
            const authAxios = createAuthAxios();
            await authAxios.put(`/cr-receive/${projectId}`);
            setSubmissions(prev => prev.filter(p => p.id !== projectId));
            alert(`Project ${projectId} successfully moved to 'Under Review'.`);
        } catch (err) {
            console.error('❌ Error receiving project:', err);
            
            if (err.response?.status === 401) {
                alert('Session expired. Please log in again.');
            } else if (err.response?.status === 403) {
                alert('You do not have permission to perform this action.');
            } else {
                alert('Failed to receive project. Please check the backend connection.');
            }
        }
    };

    useEffect(() => {
        let isMounted = true;
        const safeFetchSubmissions = async () => {
            if (isMounted) {
                await fetchSubmissions();
            }
        };
        safeFetchSubmissions();
        const interval = setInterval(safeFetchSubmissions, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (loading) {
        return (
            <div className="Table-container">
                <div className="loader">
                    <div className="spinner"></div>
                    <p>Loading submissions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="Table-container">
                <div className="error-message">❌ {error}</div>
            </div>
        );
    }

    return (
        <div className="Table-container">
            <h2>
                <i className="bi bi-book me-2" aria-hidden="true"></i>
                New Copyright Submissions
            </h2>

            {submissions.length === 0 ? (
                <div className="error-message">No new submissions found.</div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="responsive-table">
                            <thead>
                                <tr>
                                    <th><i className="bi bi-hash me-1" aria-hidden="true"></i>ID</th>
                                    <th><i className="bi bi-envelope me-1" aria-hidden="true"></i>TITLE</th>
                                    <th><i className="bi bi-file-text me-1" aria-hidden="true"></i>DESCRIPTION</th>
                                    <th><i className="bi bi-tag me-1" aria-hidden="true"></i>STATUS</th>
                                    <th><i className="bi bi-folder2-open me-1" aria-hidden="true"></i>WORK TYPE</th>
                                    <th><i className="bi bi-calendar me-1" aria-hidden="true"></i>FILING DATE</th>
                                    <th><i className="bi bi-image me-1" aria-hidden="true"></i>MATERIAL</th>
                                    <th><i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>PDF FILE</th>
                                    <th><i className="bi bi-list-ul me-1" aria-hidden="true"></i>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {submissions.map((project) => (
                                    <Row
                                        key={project.id}
                                        project={project}
                                        onReceive={handleReceive}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Copyright;
