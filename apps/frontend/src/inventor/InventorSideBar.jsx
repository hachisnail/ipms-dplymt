import React, { useEffect, useState } from 'react';
import './SideBar.css';
import navList from './Data/navitem';
import navDropList from './Data/navDropList';
import NavRenderList from './NavRenderList';
import RenderDropList from './RenderDropList';

function SideBar({ onNavigate, onPdfClick }) {
    const [active, setActive] = useState('Dashboard');

    /* Sync active item with URL hash */
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            setActive(hash);
        }

        // Listen for hash changes
        const handleHashChange = () => {
            const newHash = window.location.hash.replace('#', '');
            if (newHash) {
                setActive(newHash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleNavClick = (name) => {
        setActive(name);
        window.location.hash = name;
        if (onNavigate) {
            onNavigate(name);
        }
    };

    return (
        <aside id="sidebar" className="sidebar">
            <ul className="sidebar-nav" id="sidebar-nav">

                {/* ============================================
                    DASHBOARD - Always First
                ============================================ */}
                <li className="nav-item">
                    <a
                        href="#Dashboard"
                        className={`nav-link ${active === 'Dashboard' ? '' : 'collapsed'}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavClick('Dashboard');
                        }}
                    >
                        <i className="bi bi-grid"></i>
                        <span>Dashboard</span>
                    </a>
                </li>

                {/* ============================================
                    STANDARD NAVIGATION ITEMS
                    (Profile, Portfolio, Tracker, etc.)
                ============================================ */}
                {navList && navList.length > 0 && navList.map(item => (
                    <li key={item._id} className="nav-item">
                        <a
                            href={`#${item.name}`}
                            className={`nav-link ${active === item.name ? '' : 'collapsed'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavClick(item.name);
                            }}
                        >
                            <i className={item.icon}></i>
                            <span>{item.name}</span>
                        </a>
                    </li>
                ))}

                {/* ============================================
                    DROPDOWN NAVIGATION
                    (Examination Guides, Application Forms, etc.)
                ============================================ */}
                <RenderDropList
                    navDropList={navDropList}
                    active={active}
                    onItemClick={handleNavClick}
                    onPdfClick={onPdfClick}
                />

            </ul>
        </aside>
    );
}

export default SideBar;