import React, { useState } from 'react';
import ProfileImg from './Images/profilepic.jpg';

function NavAvatar() {
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const fullName = userData.fullName || 'User';
    const userType = userData.userType || 'Admin';
    const profilePicture = userData.profilePicture || ProfileImg;

    const handleLogout = () => {
        // Clear all stored data
        localStorage.clear();
        
        // Redirect to login page (or root)
        window.location.href = '/';
    };

    const handleProfileClick = () => {
        window.location.hash = 'Profile';
        setShowDropdown(false);
    };

    return (
        <li className="nav-item dropdown pe-3">
            <a 
                className="nav-link nav-profile d-flex align-items-center pe-0" 
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    setShowDropdown(!showDropdown);
                }}
            >
                <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="rounded-circle"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = ProfileImg;
                    }}
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">
                    {fullName}
                </span>
            </a>

            {showDropdown && (
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile show">
                    <li className="dropdown-header">
                        <h6>{fullName}</h6>
                        <span>{userType}</span>
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
                                if (window.confirm('Are you sure you want to sign out?')) {
                                    handleLogout();
                                }
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