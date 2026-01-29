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
        if (hash) setActive(hash);
    }, []);

    const handleNavClick = (name) => {
        setActive(name);
        window.location.hash = name;
        onNavigate && onNavigate(name);
    };

    return (
        <aside id="sidebar" className="sidebar">
            <ul className="sidebar-nav">

                {/* Dashboard */}
                <li className="nav-item">
                    <a
                        href="#Dashboard"
                        className={`nav-link ${active === 'Dashboard' ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavClick('Dashboard');
                        }}
                    >
                        <i className="bi bi-grid"></i>
                        <span>Dashboard</span>
                    </a>
                </li>

                {/* Standard navigation items */}
                <NavRenderList
                    navList={navList}
                    active={active}
                    onItemClick={handleNavClick}
                />

                {/* Dropdown navigation (PDFs, submenus) */}
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
