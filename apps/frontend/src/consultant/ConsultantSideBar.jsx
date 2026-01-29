/* ================================================================
   CONSULTANT SIDEBAR - COMPLETE FIX
   ✅ Uses CONSULTANT nav data ONLY
   ================================================================ */

import React, { useEffect, useState } from 'react';
import './SideBar.css';
import navList from './Data/navitem';         // Consultant nav items
import navDropList from './Data/navDropList'; // Consultant dropdowns
import RenderDropList from './RenderDropList';

function ConsultantSideBar({ onNavigate, onPdfClick }) {
    const [active, setActive] = useState('');

    /* Sync active item with URL hash */
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            setActive(hash);
        }

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
                    CONSULTANT NAV ITEMS
                    Profile, Contacts, FAQs
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
                    CONSULTANT DROPDOWNS
                    Under Review, Approved for Filing, Rejected
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

export default ConsultantSideBar;
