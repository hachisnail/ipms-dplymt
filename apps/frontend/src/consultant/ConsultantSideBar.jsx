import React, { useEffect, useState, useCallback } from 'react';
import './SideBar.css';
import navList from './Data/navitem';
import navDropList from './Data/navDropList';
import RenderDropList from './RenderDropList';

// ── API setup — matches ConsultantNotice.jsx exactly ─────────────────────────
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3006/api')
    .replace(/\/$/, '');

const hdrs = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

// ── Badge pill ────────────────────────────────────────────────────────────────
function SideNavBadge({ count }) {
    if (!count || count <= 0) return null;
    return (
        <span className="side-nav-badge">
            {count > 99 ? '99+' : count}
        </span>
    );
}

function ConsultantSideBar({ onNavigate, onPdfClick }) {
    const [active, setActive] = useState('');

    // ── Notification type counts ──────────────────────────────────────────────
    // From backend /api/notifications (shared `notifications` table):
    //
    //  type: 'new_submission'
    //    → fires when an inventor submits (umid/tm/cr)
    //    → consultant sees new work coming in = Assigned Submissions badge
    //
    //  type: 'resubmission_received'
    //    → fires when an inventor resubmits corrected docs
    //    → submission goes back to Under Review = Under Review badge
    //
    //  NOTE: There is NO separate consultant_notifications table in the backend.
    //        The /api/notifications table is currently shared between admin
    //        and consultant views. If you later add a dedicated consultant
    //        notifications table, update API_BASE_URL route accordingly.

    const [typeCounts, setTypeCounts] = useState({
        new_submission:        0,   // → Assigned Submissions
        resubmission_received: 0,   // → Under Review
    });

    const fetchCounts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications`, { headers: hdrs() });
            if (!res.ok) return;
            const data = await res.json();
            const unread = (Array.isArray(data) ? data : []).filter(n => !n.is_read);

            // Reset to 0 first so counts clear when notifications are read
            const counts = {
                new_submission:        0,
                resubmission_received: 0,
            };
            unread.forEach(n => {
                if (counts[n.type] !== undefined) counts[n.type] += 1;
            });
            setTypeCounts(counts);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchCounts();
        const iv = setInterval(fetchCounts, 10000); // same 10 s as ConsultantNotice
        return () => clearInterval(iv);
    }, [fetchCounts]);

    // ── Hash sync ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) setActive(hash);

        const handleHashChange = () => {
            const h = window.location.hash.replace('#', '');
            if (h) setActive(h);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleNavClick = (name) => {
        setActive(name);
        window.location.hash = name;
        if (onNavigate) onNavigate(name);
    };

    // ── Badge mapping ─────────────────────────────────────────────────────────
    //
    // Flat navList
    const navBadges = {
        'Dashboard':            0,
        // New submissions = newly assigned work the consultant hasn't picked up yet
        'Assigned Submissions': typeCounts.new_submission || 0,
    };

    // Dropdown parent badges
    const dropBadges = {
        // Inventor resubmitted → goes back Under Review
        'Under Review':        typeCounts.resubmission_received || 0,
        // No backend type fires for "Approved for Filing" toward consultant
        'Approved for Filing': 0,
    };

    // Dropdown child badges — all Under Review children share the same count
    // (backend does not break down by IP type in the notifications table)
    const childBadges = {
        'Under Review of Industrial Design': typeCounts.resubmission_received || 0,
        'Under Review of Utility Model':     typeCounts.resubmission_received || 0,
        'Under Review of Copyright':         typeCounts.resubmission_received || 0,
        'Under Review of Trademark':         typeCounts.resubmission_received || 0,
        'Approved Industrial Design':        0,
        'Approved Utility Model':            0,
        'Approved Copyright':                0,
        'Approved Trademark':                0,
    };

    // ── Inject counts into data ───────────────────────────────────────────────
    const navListWithBadges = navList.map(item => ({
        ...item,
        badge: navBadges[item.name] || 0,
    }));

    const navDropListWithBadges = navDropList.map(group => ({
        ...group,
        badge: dropBadges[group.name] || 0,
        children: group.children?.map(child => ({
            ...child,
            notifBadge: childBadges[child.name] || 0,
        })),
    }));

    return (
        <aside id="sidebar" className="sidebar">
            <ul className="sidebar-nav" id="sidebar-nav">

                {/* ── Flat nav items (Dashboard, Assigned Submissions) ── */}
                {navListWithBadges && navListWithBadges.map(item => (
                    <li key={item._id} className="nav-item">
                        <a
                            href={`#${item.name}`}
                            className={`nav-link ${active === item.name ? '' : 'collapsed'}`}
                            onClick={(e) => { e.preventDefault(); handleNavClick(item.name); }}
                        >
                            <i className={item.icon}></i>
                            <span style={{ flex: 1 }}>{item.name}</span>
                            <SideNavBadge count={item.badge} />
                        </a>
                    </li>
                ))}

                {/* ── Dropdown nav (Under Review, Approved for Filing) ── */}
                <RenderDropList
                    navDropList={navDropListWithBadges}
                    active={active}
                    onItemClick={handleNavClick}
                    onNavigate={handleNavClick}
                    onPdfClick={onPdfClick}
                    BadgeComponent={SideNavBadge}
                />

            </ul>
        </aside>
    );
}

export default ConsultantSideBar;