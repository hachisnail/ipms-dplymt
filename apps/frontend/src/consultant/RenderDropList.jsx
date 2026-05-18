import React from 'react';

// ── RenderDropList ─────────────────────────────────────────────────────────
// Props:
//   navDropList    — array of nav groups
//                    group.badge        → number shown on parent row
//                    child.notifBadge   → number shown on child row
//   onPdfClick     — handler for .pdf links
//   onNavigate     — handler for hash navigation (Inventor / original name)
//   onItemClick    — alias for onNavigate (Admin / Consultant naming)
//   BadgeComponent — optional: <BadgeComponent count={n} /> renders the pill
// ──────────────────────────────────────────────────────────────────────────

function RenderDropList({ navDropList = [], onPdfClick, onNavigate, onItemClick, BadgeComponent }) {

    // Support both prop names
    const navigate = onItemClick || onNavigate;

    const handleLinkClick = (e, item) => {
        if (item.href && item.href.endsWith('.pdf')) {
            e.preventDefault();
            onPdfClick && onPdfClick(item.href, item.name);
        } else if (item.href && item.href !== '#') {
            e.preventDefault();
            const hashSegment = item.href.split('/').pop();
            window.location.hash = hashSegment;
            navigate && navigate(hashSegment);
        } else if (item.href === '#') {
            e.preventDefault();
        }
    };

    return (
        <>
            {navDropList.length === 0 ? (
                <li className="nav-item">
                    <span className="nav-link text-muted">No pages available</span>
                </li>
            ) : (
                navDropList.map((nav) => (
                    <li className="nav-item" key={nav._id}>

                        {/* ── Level 1: parent dropdown trigger ── */}
                        <a
                            className="nav-link collapsed"
                            data-bs-target={`#dropdown-${nav._id}`}
                            data-bs-toggle="collapse"
                            href="#"
                        >
                            <i className={nav.icon}></i>
                            <span style={{ flex: 1 }}>{nav.name}</span>

                            {/* Parent badge */}
                            {BadgeComponent && typeof nav.badge === 'number' && (
                                <BadgeComponent count={nav.badge} />
                            )}

                            <i className="bi bi-chevron-down ms-auto"></i>
                        </a>

                        {/* ── Level 2: dropdown content ── */}
                        <ul
                            id={`dropdown-${nav._id}`}
                            className="nav-content collapse"
                            data-bs-parent="#sidebar-nav"
                        >
                            {nav.children?.map((child) => (
                                <li key={child._id}>
                                    {child.children ? (
                                        <>
                                            {/* Level 2 is itself a nested dropdown folder */}
                                            <a
                                                className="nav-link collapsed"
                                                data-bs-target={`#dropdown-${child._id}`}
                                                data-bs-toggle="collapse"
                                                href="#"
                                            >
                                                <i className={child.icon}></i>
                                                <span style={{ flex: 1 }}>{child.name}</span>

                                                {BadgeComponent && typeof child.notifBadge === 'number' && (
                                                    <BadgeComponent count={child.notifBadge} />
                                                )}

                                                <i className="bi bi-chevron-down ms-auto"></i>
                                            </a>

                                            {/* Level 3: deepest links */}
                                            <ul
                                                id={`dropdown-${child._id}`}
                                                className="nav-content collapse"
                                                data-bs-parent={`#dropdown-${nav._id}`}
                                            >
                                                {child.children.map((sub) => (
                                                    <li key={sub._id}>
                                                        <a
                                                            href={sub.href || '#'}
                                                            onClick={(e) => handleLinkClick(e, sub)}
                                                        >
                                                            <i className={sub.icon}></i>
                                                            <span style={{ flex: 1 }}>{sub.name}</span>

                                                            {BadgeComponent && typeof sub.notifBadge === 'number' && (
                                                                <BadgeComponent count={sub.notifBadge} />
                                                            )}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        // Level 2 is a direct link
                                        <a
                                            href="#"
                                            onClick={(e) => handleLinkClick(e, child)}
                                        >
                                            <i className={child.icon}></i>
                                            <span style={{ flex: 1 }}>{child.name}</span>

                                            {/* Child badge */}
                                            {BadgeComponent && typeof child.notifBadge === 'number' && (
                                                <BadgeComponent count={child.notifBadge} />
                                            )}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>

                    </li>
                ))
            )}
        </>
    );
}

export default RenderDropList;