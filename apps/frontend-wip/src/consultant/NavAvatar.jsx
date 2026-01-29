import React, { useState, useEffect } from 'react';
import ProfileImg from './Images/profilepic.jpg';
import { logout, getProfilePictureUrl } from './api';

function NavAvatar() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [userData, setUserData] = useState({
        fullName: 'User',
        userType: 'Consultant',
        profilePicture: ProfileImg
    });

    // Load user data from localStorage on mount
    useEffect(() => {
        loadUserData();
    }, []);

    // Listen for profile updates
    useEffect(() => {
        const handleProfileUpdate = (event) => {
            console.log('Profile updated event received:', event.detail);
            loadUserData();
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    const loadUserData = () => {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData({
            fullName: stored.fullName || stored.full_name || 'User',
            userType: stored.userType || stored.user_type || 'Consultant',
            profilePicture: stored.profilePicture || stored.profile_picture 
                ? getProfilePictureUrl(stored.profilePicture || stored.profile_picture)
                : ProfileImg
        });
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            await logout();
        }
    };

    const handleProfileClick = () => {
        window.location.hash = 'Profile';
        setShowDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.nav-profile')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    return (
        <li className="nav-item dropdown pe-3">
            <a 
                className="nav-link nav-profile d-flex align-items-center pe-0" 
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                }}
            >
                <img 
                    src={userData.profilePicture} 
                    alt="Profile" 
                    className="rounded-circle"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = ProfileImg;
                    }}
                    style={{
                        width: '36px',
                        height: '36px',
                        objectFit: 'cover'
                    }}
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">
                    {userData.fullName}
                </span>
            </a>

            {showDropdown && (
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile show">
                    <li className="dropdown-header">
                        <h6>{userData.fullName}</h6>
                        <span>{userData.userType}</span>
                    </li>
                    <li>
                        <hr className="dropdown-divider"/>
                    </li>
                    <li>
                        <a
                            className="dropdown-item d-flex align-items-center"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleProfileClick();
                            }}
                        >
                            <i className="bi bi-person"></i>
                            <span>My Profile</span>
                        </a>
                    </li>
                    <li>
                        <hr className='dropdown-divider'/>
                    </li>
                    <li>
                        <a
                            className="dropdown-item d-flex align-items-center"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                            <span>Sign out</span>
                        </a>
                    </li>
                </ul>
            )}
        </li>
    );
}

export default NavAvatar;