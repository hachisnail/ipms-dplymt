import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Directory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

function RolePermissions() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [rejectedUsers, setRejectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Fetch pending, approved, and rejected users
            const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
                axios.get(`${API_URL}/admin/users/pending`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/admin/users/approved`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/admin/users/rejected`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setPendingUsers(pendingRes.data.data || []);
            setApprovedUsers(approvedRes.data.data || []);
            setRejectedUsers(rejectedRes.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/admin/users/${userId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success('User approved successfully!');
            fetchUsers(); // Refresh data
            setShowModal(false);
        } catch (err) {
            console.error('Error approving user:', err);
            toast.error('Failed to approve user. Please try again.');
        }
    };

    const handleRejectUser = async (userId, reason) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/admin/users/${userId}/reject`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success('User rejected.');
            fetchUsers(); // Refresh data
            setShowModal(false);
            setRejectionReason('');
        } catch (err) {
            console.error('Error rejecting user:', err);
            toast.error('Failed to reject user. Please try again.');
        }
    };

    const openActionModal = (user, action) => {
        setSelectedUser(user);
        setActionType(action);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setActionType(null);
        setRejectionReason('');
    };

    const confirmAction = () => {
        if (actionType === 'approve') {
            handleApproveUser(selectedUser.id);
        } else if (actionType === 'reject') {
            if (!rejectionReason.trim()) {
                toast.error('Please provide a rejection reason.');
                return;
            }
            handleRejectUser(selectedUser.id, rejectionReason);
        }
    };

    const getCurrentList = () => {
        switch (activeTab) {
            case 'pending':
                return pendingUsers;
            case 'approved':
                return approvedUsers;
            case 'rejected':
                return rejectedUsers;
            default:
                return pendingUsers;
        }
    };

    if (loading) {
        return (
            <div className="directory-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading User Permissions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="directory-container">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchUsers} className="btn-retry">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentList = getCurrentList();

    return (
        <div className="directory-container">
            <div className="directory-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-shield-check"></i> Role Permissions & Approvals
                    </h2>
                    <p className="subtitle">Manage user access permissions before they can log in</p>
                </div>
                <div className="header-right">
                    <button onClick={fetchUsers} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{pendingUsers.length}</h3>
                        <p>Pending Approval</p>
                    </div>
                </div>
                <div className="stat-card approved">
                    <div className="stat-icon">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{approvedUsers.length}</h3>
                        <p>Approved Users</p>
                    </div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-icon">
                        <i className="bi bi-x-circle-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{rejectedUsers.length}</h3>
                        <p>Rejected Users</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    <i className="bi bi-hourglass-split"></i> Pending ({pendingUsers.length})
                </button>
                <button
                    className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    <i className="bi bi-check-circle"></i> Approved ({approvedUsers.length})
                </button>
                <button
                    className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    <i className="bi bi-x-circle"></i> Rejected ({rejectedUsers.length})
                </button>
            </div>

            {/* Data Table */}
            <div className="table-container">
                {currentList.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>No {activeTab} users found</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Profile</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>User Type</th>
                                <th>Delivery Unit</th>
                                <th>Registration Date</th>
                                {activeTab === 'pending' && <th>Actions</th>}
                                {activeTab === 'rejected' && <th>Reason</th>}
                                {activeTab === 'approved' && <th>Approved Date</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentList.map((user, index) => (
                                <tr key={user.id || index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <img
                                            src={user.profile_picture 
                                                ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${user.profile_picture}`
                                                : 'https://placehold.co/40x40/007bff/ffffff?text=' + (user.full_name?.charAt(0) || 'U')
                                            }
                                            alt={user.full_name}
                                            className="profile-thumb"
                                            onError={(e) => {
                                                e.target.src = 'https://placehold.co/40x40/007bff/ffffff?text=' + (user.full_name?.charAt(0) || 'U');
                                            }}
                                        />
                                    </td>
                                    <td className="name-cell">{user.full_name || 'N/A'}</td>
                                    <td>{user.email || 'N/A'}</td>
                                    <td>
                                        <span className={`role-badge ${user.user_type?.toLowerCase()}`}>
                                            {user.user_type || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="unit-badge">{user.delivery_unit || 'N/A'}</span>
                                    </td>
                                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                                    
                                    {activeTab === 'pending' && (
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => openActionModal(user, 'approve')}
                                                    className="btn-approve"
                                                    title="Approve User"
                                                >
                                                    <i className="bi bi-check-circle"></i> Approve
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(user, 'reject')}
                                                    className="btn-reject"
                                                    title="Reject User"
                                                >
                                                    <i className="bi bi-x-circle"></i> Reject
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    
                                    {activeTab === 'rejected' && (
                                        <td>
                                            <span className="rejection-reason">
                                                {user.rejection_reason || 'No reason provided'}
                                            </span>
                                        </td>
                                    )}
                                    
                                    {activeTab === 'approved' && (
                                        <td>{user.approved_at ? new Date(user.approved_at).toLocaleDateString() : 'N/A'}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Confirmation Modal */}
            {showModal && selectedUser && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content action-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="modal-header-action">
                            {actionType === 'approve' ? (
                                <>
                                    <div className="icon-circle approve">
                                        <i className="bi bi-check-circle-fill"></i>
                                    </div>
                                    <h2>Approve User Access</h2>
                                </>
                            ) : (
                                <>
                                    <div className="icon-circle reject">
                                        <i className="bi bi-x-circle-fill"></i>
                                    </div>
                                    <h2>Reject User Access</h2>
                                </>
                            )}
                        </div>

                        <div className="user-info-summary">
                            <img
                                src={selectedUser.profile_picture 
                                    ? `${API_URL.replace('/api', '')}/uploads/profile-pictures/${selectedUser.profile_picture}`
                                    : 'https://placehold.co/60x60/007bff/ffffff?text=' + (selectedUser.full_name?.charAt(0) || 'U')
                                }
                                alt={selectedUser.full_name}
                                className="profile-thumb-large"
                            />
                            <div>
                                <h3>{selectedUser.full_name}</h3>
                                <p>{selectedUser.email}</p>
                                <span className={`role-badge ${selectedUser.user_type?.toLowerCase()}`}>
                                    {selectedUser.user_type}
                                </span>
                            </div>
                        </div>

                        {actionType === 'approve' ? (
                            <p className="confirmation-text">
                                Are you sure you want to approve <strong>{selectedUser.full_name}</strong> to access the system as a <strong>{selectedUser.user_type}</strong>?
                            </p>
                        ) : (
                            <div className="rejection-form">
                                <p className="confirmation-text">
                                    Please provide a reason for rejecting <strong>{selectedUser.full_name}</strong>'s access:
                                </p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason (required)..."
                                    rows="4"
                                    className="rejection-textarea"
                                />
                            </div>
                        )}

                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={actionType === 'approve' ? 'btn-approve' : 'btn-reject'}
                            >
                                {actionType === 'approve' ? (
                                    <><i className="bi bi-check-circle"></i> Approve User</>
                                ) : (
                                    <><i className="bi bi-x-circle"></i> Reject User</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RolePermissions;