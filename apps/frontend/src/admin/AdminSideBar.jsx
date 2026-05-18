import React, { useEffect, useState, useCallback } from 'react';
import './SideBar.css';
import navList from './Data/navitem';
import navDropList from './Data/navDropList';
import RenderDropList from './RenderDropList';

// ── API setup (mirrors AdminNotice.jsx) ──────────────────────────────────────
const _RAW     = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API_BASE = _RAW.endsWith('/api') ? _RAW.slice(0, -4) : _RAW;

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── Badge pill ───────────────────────────────────────────────────────────────
export function SideNavBadge({ count }) {
    if (!count || count <= 0) return null;
    return (
        <span className="side-nav-badge">
            {count > 99 ? '99+' : count}
        </span>
    );
}

function AdminSideBar({ onNavigate, onPdfClick }) {
    const [active, setActive] = useState('');

    // ── Notification type counts ─────────────────────────────────────────────
    const [typeCounts, setTypeCounts] = useState({
        new_submission: 0,
        new_user:       0,
        role_change:    0,
        pas_report:     0,
        assignment:     0,
        communication:  0,
    });

    const fetchCounts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/notifications`, {
                headers: authHeaders(),
            });
            if (!res.ok) return;
            const data = await res.json();
            const unread = (Array.isArray(data) ? data : (data.data || [])).filter(n => !n.is_read);

            // Reset to 0 first so stale counts don't linger
            const counts = {
                new_submission: 0,
                new_user:       0,
                role_change:    0,
                pas_report:     0,
                assignment:     0,
                communication:  0,
            };
            unread.forEach(n => {
                if (counts[n.type] !== undefined) counts[n.type] += 1;
            });
            setTypeCounts(counts);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchCounts();
        const iv = setInterval(fetchCounts, 10000);
        return () => clearInterval(iv);
    }, [fetchCounts]);

    // ── Hash sync ────────────────────────────────────────────────────────────
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

    // ── Badge mapping ────────────────────────────────────────────────────────

    // Flat nav items — extend if these ever get notification types
    const navBadges = {
        'Dashboard':          0,
        'Content Management': 0,
    };

    // Parent group = sum of all child types under it
    const dropBadges = {
        'Project Management': (typeCounts.new_submission || 0)
                            + (typeCounts.assignment      || 0)
                            + (typeCounts.pas_report      || 0),
        'User Management':    (typeCounts.new_user        || 0)
                            + (typeCounts.role_change     || 0),
        'Account & Support':   typeCounts.communication   || 0,
    };

    // Child item badges
    // ┌─────────────────────────┬────────────────────────────────────────────┐
    // │ Child                   │ Notification type(s)                       │
    // ├─────────────────────────┼────────────────────────────────────────────┤
    // │ Assign Submission       │ new_submission + assignment                │
    // │ Active Reviews          │ new_submission                             │
    // │ PAS Reports             │ pas_report                                 │
    // │ Account Management      │ new_user                                   │
    // │ Role Permissions        │ role_change                                │
    // │ Terms & Conditions      │ communication                              │
    // └─────────────────────────┴────────────────────────────────────────────┘
    const childBadges = {
        'Assign Submission':    (typeCounts.new_submission || 0) + (typeCounts.assignment || 0),
        'Active Reviews':        typeCounts.new_submission || 0,
        'Resubmission':          0,
        'Approved Application':  0,
        'PAS Reports':           typeCounts.pas_report     || 0,
        'Account Management':    typeCounts.new_user       || 0,
        'User Directory':        0,
        'Role Permissions':      typeCounts.role_change    || 0,
        'IP Reference Library':  0,
        'Terms & Conditions':    typeCounts.communication  || 0,
    };

    // ── Inject badge counts into data arrays ─────────────────────────────────
    const navListWithBadges = navList.map(item => ({
        ...item,
        badge: navBadges[item.name] || 0,
    }));

    const navDropListWithBadges = navDropList.map(group => ({
        ...group,
        // remove any leftover static `badge` string from the data file
        badge: dropBadges[group.name] || 0,
        children: group.children?.map(child => ({
            ...child,
            // notifBadge is the numeric count; the old static `badge` string is intentionally ignored
            notifBadge: childBadges[child.name] || 0,
        })),
    }));

    return (
        <aside id="sidebar" className="sidebar">
            <ul className="sidebar-nav" id="sidebar-nav">

                {/* ── Flat nav items (Dashboard, Content Management) ── */}
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

                {/* ── Dropdown nav (Project Management, User Management, Account & Support) ── */}
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

export default AdminSideBar;