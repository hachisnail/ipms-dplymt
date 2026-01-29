/* eslint-disable react-hooks/immutability */
import React from 'react';

function RenderDropList({ navDropList = [], onPdfClick }) {
    // ✅ Safe key generation function
    const getKey = (item, index) => {
        return item?._id || item?.id || item?.name || `item-${index}`;
    };

    // ✅ IMPROVED: Central function to handle all link clicks in the sidebar
    const handleLinkClick = (e, item) => { 
        console.log('🔗 Link clicked:', item); // Debug log
        
        // 1. Check for PDF links (e.g., "pdfs/...")
        if (item?.href && item.href.endsWith('.pdf')) {
            e.preventDefault();
            console.log('📄 Opening PDF:', item.href);
            onPdfClick && onPdfClick(item.href, item.name);
            return;
        } 
        
        // 2. Handle hash links (#Dashboard, #Profile, #UtilityModelPortal)
        if (item?.href && item.href.startsWith('#')) {
            e.preventDefault(); 
            window.location.hash = item.href.substring(1);
            return;
        }
        
        // 3. Handle old format (main2/UtilityModelPortal) - for backward compatibility
        if (item?.href && item.href !== '#' && item.href.includes('/')) {
            e.preventDefault(); 
            const hashSegment = item.href.split('/').pop();
            window.location.hash = hashSegment;
            return;
        } 
        
        // 4. Handle direct navigation (no slash, no hash)
        if (item?.href && item.href !== '#') {
            e.preventDefault();
            window.location.hash = item.href;
            return;
        }
        
        // 5. Handle placeholder links (href="#")
        if (!item?.href || item.href === '#') {
            e.preventDefault();
            return;
        }
    };
    
    // Guard against invalid data
    if (!Array.isArray(navDropList)) {
        console.error('❌ navDropList is not an array:', navDropList);
        return null;
    }

    if (navDropList.length === 0) {
        return (
            <li className="nav-item">
                <span className="nav-link text-muted">No pages available</span>
            </li>
        );
    }

    return (
        <>
            {navDropList.map((nav, navIndex) => {
                if (!nav) {
                    console.warn('⚠️ Null nav item at index:', navIndex);
                    return null;
                }

                const navKey = getKey(nav, navIndex);
                const dropdownId = `dropdown-${navKey}`;

                return (
                    <li className="nav-item" key={navKey}>
                        {/* Level 1 Link (Always a dropdown trigger) */}
                        <a
                            className="nav-link collapsed"
                            data-bs-target={`#${dropdownId}`}
                            data-bs-toggle="collapse"
                            href="#"
                            onClick={(e) => e.preventDefault()}
                        >
                            <i className={nav.icon || 'bi bi-folder'}></i>
                            <span>{nav.name || 'Unnamed'}</span>
                            <i className="bi bi-chevron-down ms-auto"></i>
                        </a>
                        
                        {/* Level 2 Dropdown Content */}
                        {nav.children && Array.isArray(nav.children) && (
                            <ul
                                id={dropdownId}
                                className="nav-content collapse"
                                data-bs-parent="#sidebar-nav"
                            >
                                {nav.children.map((child, childIndex) => {
                                    if (!child) {
                                        console.warn('⚠️ Null child item at index:', childIndex);
                                        return null;
                                    }

                                    const childKey = getKey(child, childIndex);
                                    const childDropdownId = `dropdown-${childKey}`;

                                    return (
                                        <li key={childKey}>
                                            {child.children && Array.isArray(child.children) ? (
                                                <>
                                                    {/* Level 2 is a Folder (Nested Dropdown) */}
                                                    <a
                                                        className="nav-link collapsed"
                                                        data-bs-target={`#${childDropdownId}`}
                                                        data-bs-toggle="collapse"
                                                        href="#"
                                                        onClick={(e) => e.preventDefault()}
                                                    >
                                                        <i className={child.icon || 'bi bi-folder'}></i>
                                                        <span>{child.name || 'Unnamed'}</span>
                                                        <i className="bi bi-chevron-down ms-auto"></i>
                                                    </a>
                                                    
                                                    {/* Level 3: Deepest Nested Links (PDFs or Placeholder) */}
                                                    <ul
                                                        id={childDropdownId}
                                                        className="nav-content collapse"
                                                        data-bs-parent={`#${dropdownId}`}
                                                    >
                                                        {child.children.map((sub, subIndex) => {
                                                            if (!sub) {
                                                                console.warn('⚠️ Null sub item at index:', subIndex);
                                                                return null;
                                                            }

                                                            const subKey = getKey(sub, subIndex);

                                                            return (
                                                                <li key={subKey}>
                                                                    <a 
                                                                        href={sub.href || '#'}
                                                                        onClick={(e) => handleLinkClick(e, sub)}
                                                                    >
                                                                        <i className={sub.icon || 'bi bi-file-earmark'}></i>
                                                                        <span>{sub.name || 'Unnamed'}</span>
                                                                    </a>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </>
                                            ) : (
                                                // Level 2 is a Direct Link (Portals or Guides)
                                                <a
                                                    href={child.href || '#'}
                                                    onClick={(e) => handleLinkClick(e, child)}
                                                >
                                                    <i className={child.icon || 'bi bi-file-earmark'}></i>
                                                    <span>{child.name || 'Unnamed'}</span>
                                                </a>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </li>
                );
            })}
        </>
    );
}

export default RenderDropList;