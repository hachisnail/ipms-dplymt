import React, { useEffect, useState, useCallback } from 'react';
import './SideBar.css';
import navList from './Data/navitem';
import navDropList from './Data/navDropList';
import NavRenderList from './NavRenderList';
import RenderDropList from './RenderDropList';

// ── URL normalizer (mirrors InventorNotice.jsx) ──────────────────────────────
const _RAW     = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API_BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── Badge pill component (matches .badge-number from InventorNotification.css)
function SideNavBadge({ count }) {
    if (!count || count <= 0) return null;
    return (
        <span
            className="side-nav-badge"
            style={{
                display:        'inline-flex',
                alignItems:     'center',
                justifyContent: 'center',
                minWidth:       '18px',
                height:         '18px',
                padding:        '0 5px',
                borderRadius:   '9px',
                fontSize:       '10px',
                fontWeight:     700,
                lineHeight:     1,
                color:          '#fff',
                background:     'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow:      '0 2px 6px rgba(239,68,68,0.35)',
                marginLeft:     'auto',
                flexShrink:     0,
                animation:      'pulse-badge 2.2s ease-in-out infinite',
            }}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}

function SideBar({ onNavigate, onPdfClick }) {
    const [active, setActive] = useState('Dashboard');

    // ── Notification counts ──────────────────────────────────────────────────
    // Keyed by notification type so we can map them to nav items
    const [typeCounts, setTypeCounts] = useState({
        resubmission_required: 0, // → Resubmission nav item
        submission_received:   0, // → Submission Portal dropdown
        consultant_assigned:   0, // → Tracker nav item
        status_update:         0,
        approved:              0,
        rejected:              0,
    });

    const fetchCounts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/inventor/notifications`, {
                headers: authHeaders(),
            });
            if (!res.ok) return;
            const data = await res.json();
            const unread = Array.isArray(data) ? data.filter(n => !n.is_read) : [];

            // Count per type
            const counts = {};
            unread.forEach(n => {
                counts[n.type] = (counts[n.type] || 0) + 1;
            });
            setTypeCounts(prev => ({ ...prev, ...counts }));
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchCounts();
        const iv = setInterval(fetchCounts, 10000); // poll every 10 s (same as InventorNotice)
        return () => clearInterval(iv);
    }, [fetchCounts]);

    // ── Hash sync ────────────────────────────────────────────────────────────
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) setActive(hash);

        const handleHashChange = () => {
            const newHash = window.location.hash.replace('#', '');
            if (newHash) setActive(newHash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleNavClick = (name) => {
        setActive(name);
        window.location.hash = name;
        if (onNavigate) onNavigate(name);
    };

    // ── Badge mapping ────────────────────────────────────────────────────────
    // Map each nav item name → which notification types count toward it
    const navBadges = {
        // "Tracker" shows consultant_assigned + status_update + approved + rejected
        'Tracker': (typeCounts.consultant_assigned || 0)
                 + (typeCounts.status_update       || 0)
                 + (typeCounts.approved             || 0)
                 + (typeCounts.rejected             || 0),

        // "Resubmission" shows resubmission_required count
        'Resubmission': typeCounts.resubmission_required || 0,
    };

    // Submission Portal dropdown badge = submission_received count
    const submissionPortalBadge = typeCounts.submission_received || 0;

    // ── Inject live badge counts into data arrays ────────────────────────────
    const navListWithBadges = navList.map(item => ({
        ...item,
        badge: navBadges[item.name] || 0,
    }));

    const navDropListWithBadges = navDropList.map(group => ({
        ...group,
        badge: group.name === 'Submission Portal' ? submissionPortalBadge : (group.badge || 0),
    }));

    return (
        <aside id="sidebar" className="sidebar">
            <ul className="sidebar-nav" id="sidebar-nav">

                {/* ── Dashboard ── */}
                <li className="nav-item">
                    <a
                        href="#Dashboard"
                        className={`nav-link ${active === 'Dashboard' ? '' : 'collapsed'}`}
                        onClick={(e) => { e.preventDefault(); handleNavClick('Dashboard'); }}
                    >
                        <i className="bi bi-grid"></i>
                        <span>Dashboard</span>
                    </a>
                </li>

                {/* ── Standard nav items (Submission Guide, Tracker, Resubmission) ── */}
                {navListWithBadges && navListWithBadges.map(item => (
                    <li key={item._id} className="nav-item">
                        <a
                            href={`#${item.name}`}
                            className={`nav-link ${active === item.name ? '' : 'collapsed'}`}
                            onClick={(e) => { e.preventDefault(); handleNavClick(item.name); }}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <i className={item.icon}></i>
                            <span style={{ flex: 1 }}>{item.name}</span>
                            <SideNavBadge count={item.badge} />
                        </a>
                    </li>
                ))}

                {/* ── Dropdown nav (Submission Portal) ── */}
                <RenderDropList
                    navDropList={navDropListWithBadges}
                    active={active}
                    onItemClick={handleNavClick}
                    onPdfClick={onPdfClick}
                    BadgeComponent={SideNavBadge}
                />

            </ul>
        </aside>
    );
}

export default SideBar;