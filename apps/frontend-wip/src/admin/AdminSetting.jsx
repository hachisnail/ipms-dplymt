import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSetting.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
// Extract base URL for images (remove '/api' from the end if present)
const BASE_URL = API_URL.replace('/api', ''); 

function AdminSetting() {
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        profile_picture: ''
    });
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data.data || {};
            setProfile(userData);
            
            // Construct full URL for backend images
            let imageUrl = '';
            if (userData.profile_picture) {
                // If it's already a full URL (e.g. from google), use it
                if (userData.profile_picture.startsWith('http')) {
                    imageUrl = userData.profile_picture;
                } else {
                    // Otherwise prepend backend base URL
                    // Remove leading slash to avoid double slashes if needed, or rely on browser
                    const cleanPath = userData.profile_picture.startsWith('/') 
                        ? userData.profile_picture 
                        : `/uploads/profile-pictures/${userData.profile_picture}`;
                    imageUrl = `${BASE_URL}${cleanPath}`;
                }
            }
            setPreviewUrl(imageUrl);

        } catch (err) {
            console.error('Error fetching profile:', err);
            showMessage('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showMessage('error', 'File size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                showMessage('error', 'Please select an image file');
                return;
            }
            setSelectedFile(file);
            // Create local preview
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            
            // If there's a new image, upload it first
            let profilePictureUrl = profile.profile_picture;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('profilePicture', selectedFile); // Ensure name matches backend expectation
                
                const uploadResponse = await axios.post(
                    `${API_URL}/users/profile-picture`, // Using the general user upload endpoint
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                // Backend usually returns filename or path
                profilePictureUrl = uploadResponse.data.filename; 
            }

            // Update profile
            await axios.put(
                `${API_URL}/admin/profile`,
                {
                    full_name: profile.full_name,
                    email: profile.email,
                    profile_picture: profilePictureUrl
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            showMessage('success', 'Profile updated successfully!');
            setEditMode(false);
            setSelectedFile(null);
            // Refresh profile to get standardized paths
            fetchProfile();
        } catch (err) {
            console.error('Error saving profile:', err);
            showMessage('error', err.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    if (loading) {
        return (
            <div className="admin-setting-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-setting-container">
            {/* Header */}
            <div className="setting-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-gear"></i> Admin Settings
                    </h2>
                    <p className="subtitle">Manage your profile and account settings</p>
                </div>
                <div className="header-right">
                    {!editMode ? (
                        <button onClick={() => setEditMode(true)} className="btn-edit">
                            <i className="bi bi-pencil"></i> Edit Profile
                        </button>
                    ) : (
                        <>
                            <button onClick={() => {
                                setEditMode(false);
                                setSelectedFile(null);
                                fetchProfile();
                            }} className="btn-cancel">
                                <i className="bi bi-x"></i> Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="btn-save"
                                disabled={saving}
                            >
                                <i className="bi bi-check"></i> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`message-banner ${message.type}`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Profile Section */}
            <div className="profile-section">
                <div className="profile-card">
                    <div className="card-header">
                        <h3>
                            <i className="bi bi-person-circle"></i> Profile Information
                        </h3>
                    </div>
                    <div className="card-body">
                        {/* Profile Picture */}
                        <div className="profile-picture-section">
                            <div className="picture-wrapper">
                                <img 
                                    src={previewUrl || 'https://placehold.co/150x150?text=No+Image'} 
                                    alt="Profile" 
                                    className="profile-picture"
                                    // ✅ CRITICAL FIX: Prevent infinite loop by unsetting onerror
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src = 'https://placehold.co/150x150?text=Error'; 
                                    }}
                                />
                                {editMode && (
                                    <label className="upload-overlay">
                                        <i className="bi bi-camera"></i>
                                        <span>Change Photo</span>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="picture-info">
                                <p className="picture-label">Profile Picture</p>
                                <p className="picture-hint">JPG, PNG or GIF (max 5MB)</p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="form-section">
                            <div className="form-group">
                                <label>
                                    <i className="bi bi-person"></i> Full Name
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={profile.full_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className="bi bi-envelope"></i> Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email || ''}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className="bi bi-shield-check"></i> User Type
                                </label>
                                <input
                                    type="text"
                                    value="ADMIN"
                                    disabled
                                    className="readonly-field"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="info-card">
                    <div className="card-header">
                        <h3>
                            <i className="bi bi-info-circle"></i> Account Information
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="info-list">
                            <div className="info-item">
                                <label>Account Status:</label>
                                <span className="status-badge active">
                                    <i className="bi bi-circle-fill"></i> Active
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Role:</label>
                                <span>System Administrator</span>
                            </div>
                            <div className="info-item">
                                <label>Member Since:</label>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="info-item">
                                <label>Last Login:</label>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="security-section">
                <div className="security-card">
                    <div className="card-header">
                        <h3>
                            <i className="bi bi-lock"></i> Security Settings
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="security-item">
                            <div className="security-content">
                                <h4>Change Password</h4>
                                <p>Update your password to keep your account secure</p>
                            </div>
                            <button className="btn-secondary">
                                <i className="bi bi-key"></i> Change Password
                            </button>
                        </div>
                        <div className="security-item">
                            <div className="security-content">
                                <h4>Two-Factor Authentication</h4>
                                <p>Add an extra layer of security to your account</p>
                            </div>
                            <button className="btn-secondary">
                                <i className="bi bi-shield-check"></i> Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminSetting;