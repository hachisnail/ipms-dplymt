import React, { useEffect } from 'react';
import './Header.css';
import Logo from './Logo';
import Nav from './Nav';

function Header() {
    useEffect(() => {
        // Handle sidebar toggle button
        const handleToggleSidebar = () => {
            document.body.classList.toggle('toggle-sidebar');
        };

        const toggleBtn = document.querySelector('.toggle-sidebar-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', handleToggleSidebar);
        }

        // Cleanup
        return () => {
            if (toggleBtn) {
                toggleBtn.removeEventListener('click', handleToggleSidebar);
            }
        };
    }, []);

    return (
        <header id="header" className="header fixed-top d-flex align-items-center">
            {/* Hamburger Menu Button */}
            <i className="bi bi-list toggle-sidebar-btn"></i>
            
            {/* Logo */}
            <Logo />
            
            {/* Navigation (Notifications + Avatar) */}
            <Nav />
        </header>
    );
}

export default Header;