import React, { useState, useEffect, useRef } from 'react';
import ProfileImg from './Images/profilepic.jpg';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3006/api').replace('/api', '');

const getToken = () => {
    try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.token || localStorage.getItem('token') || '';
    } catch { return localStorage.getItem('token') || ''; }
};

const buildPicUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${BASE}/uploads/profile-pictures/${filename}`;
};

function ConsultantAvatar() {
    const stored = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    })();

    const [fullName,        setFullName]        = useState(stored.fullName || stored.full_name || 'User');
    const [userType,        setUserType]         = useState(stored.userType || 'IP Consultant');
    const [photoUrl,        setPhotoUrl]         = useState(buildPicUrl(stored.profilePicture) || null);
    const [showDropdown,    setShowDropdown]     = useState(false);
    const [showLogoutModal, setShowLogoutModal]  = useState(false);
    const dropRef = useRef(null);

    // Fetch real profile + photo from backend on mount
    useEffect(() => {
        const token = getToken();
        if (!token) return;
        fetch(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(json => {
                if (json.success && json.data) {
                    const u    = json.data;
                    const name = u.full_name || fullName;
                    const pic  = buildPicUrl(u.profile_picture);
                    setFullName(name);
                    if (pic) setPhotoUrl(pic);
                    try {
                        const curr = JSON.parse(localStorage.getItem('user') || '{}');
                        localStorage.setItem('user', JSON.stringify({
                            ...curr,
                            fullName:       name,
                            profilePicture: u.profile_picture || '',
                        }));
                    } catch {}
                }
            })
            .catch(() => {});

        // Listen for photo changes fired by Profile page — update avatar instantly
        const onPhotoUpdate = (e) => {
            const { filename } = e.detail;
            setPhotoUrl(filename ? buildPicUrl(filename) : null);
        };
        window.addEventListener('profile-picture-updated', onPhotoUpdate);
        return () => window.removeEventListener('profile-picture-updated', onPhotoUpdate);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

    const handleProfileClick = () => {
        setShowDropdown(false);
        // If already on #Profile, hash won't change and hashchange won't fire.
        // Force it by resetting to Dashboard first then back to Profile.
        if (window.location.hash === '#Profile') {
            window.location.hash = '';
            setTimeout(() => { window.location.hash = 'Profile'; }, 0);
        } else {
            window.location.hash = 'Profile';
        }
    };

    const handleLogoutClick = (e) => { e.preventDefault(); setShowLogoutModal(true); setShowDropdown(false); };

    return (
        <>
            <li className="nav-item dropdown pe-3" ref={dropRef}>
                <a className="nav-link nav-profile d-flex align-items-center pe-0"
                    href="javascript:void(0)"
                    onClick={(e) => { e.preventDefault(); setShowDropdown(v => !v); }}>
                    <img
                        src={photoUrl || ProfileImg}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: 36, height: 36, objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = ProfileImg; }}
                    />
                    <span className="d-none d-md-block dropdown-toggle ps-2">{fullName}</span>
                </a>

                {showDropdown && (
                    <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile show">
                        <li className="dropdown-header">
                            <h6>{fullName}</h6>
                            <span>{userType}</span>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <a className="dropdown-item d-flex align-items-center"
                                href="javascript:void(0)"
                                onClick={(e) => { e.preventDefault(); handleProfileClick(); }}>
                                <i className="bi bi-person"></i>
                                <span>My Profile</span>
                            </a>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <a className="dropdown-item d-flex align-items-center" href="javascript:void(0)"
                                onClick={handleLogoutClick}>
                                <i className="bi bi-box-arrow-right"></i>
                                <span>Sign out</span>
                            </a>
                        </li>
                    </ul>
                )}
            </li>

            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <div className="logout-modal-icon">
                            <i className="bi bi-exclamation-circle"></i>
                        </div>
                        <h3>Confirm Sign Out</h3>
                        <p>Are you sure you want to sign out?</p>
                        <div className="logout-modal-buttons">
                            <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>No, Cancel</button>
                            <button className="btn-confirm" onClick={() => { setShowLogoutModal(false); handleLogout(); }}>Yes, Sign Out</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ConsultantAvatar;