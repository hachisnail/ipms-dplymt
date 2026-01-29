import React from 'react';

// ✅ FIXED: Added onNavigate prop
function RenderDropList({ navDropList = [], onPdfClick, onNavigate }) {
    // Central function to handle all link clicks in the sidebar
    const handleLinkClick = (e, item) => { 
        // 1. Check for PDF links (e.g., "pdfs/...")
        if (item.href && item.href.endsWith('.pdf')) {
            e.preventDefault(); // Stop default browser navigation/download
            onPdfClick && onPdfClick(item.href, item.name); // Open the PDF modal
        } 
        // 2. Handle standard internal navigation links (Portals/Guides)
        else if (item.href && item.href !== '#') {
            e.preventDefault(); 
            // The item.href likely contains a full path (e.g., 'main2/UnderReviewid').
            // We set the hash to the segment that Main2 expects (e.g., 'UnderReviewid').
            const hashSegment = item.href.split('/').pop();
            window.location.hash = hashSegment;
            
            // ✅ FIXED: Call onNavigate to update the view state in Main2
            onNavigate && onNavigate(hashSegment);
        } 
        // 3. Handle placeholder links (href="#")
        else if (item.href === '#') {
            e.preventDefault(); // Prevent page jump
        }
    };
    
    // The main render logic returns the JSX structure
    return (
        <>
            {navDropList.length === 0 ? (
                <li className="nav-item">
                    <span className="nav-link text-muted">No pages available</span>
                </li>
            ) : (
                navDropList.map((nav) => (
                    <li className="nav-item" key={nav._id}>
                        {/* Level 1 Link (Always a dropdown trigger) */}
                        <a
                            className="nav-link collapsed"
                            data-bs-target={`#dropdown-${nav._id}`}
                            data-bs-toggle="collapse"
                            href="#" 
                        >
                            <i className={nav.icon}></i>
                            <span>{nav.name}</span>
                            <i className="bi bi-chevron-down ms-auto"></i>
                        </a>
                        
                        {/* Level 2 Dropdown Content */}
                        <ul
                            id={`dropdown-${nav._id}`}
                            className="nav-content collapse"
                            data-bs-parent="#sidebar-nav"
                        >
                            {nav.children?.map((child) => (
                                <li key={child._id}>
                                    {child.children ? (
                                        <>
                                            {/* Level 2 is a Folder (Nested Dropdown) */}
                                            <a
                                                className="nav-link collapsed"
                                                data-bs-target={`#dropdown-${child._id}`}
                                                data-bs-toggle="collapse"
                                                href="#"
                                            >
                                                <i className={child.icon}></i>
                                                <span>{child.name}</span>
                                                <i className="bi bi-chevron-down ms-auto"></i>
                                            </a>
                                            {/* Level 3: Deepest Nested Links (PDFs or Placeholder) */}
                                            <ul
                                                id={`dropdown-${child._id}`}
                                                className="nav-content collapse"
                                                data-bs-parent={`#dropdown-${nav._id}`}
                                            >
                                                {child.children.map((sub) => (
                                                    <li key={sub._id}>
                                                        <a 
                                                            // Use the full href, the handler will determine action (PDF or Hash)
                                                            href={sub.href || '#'}
                                                            onClick={(e) => handleLinkClick(e, sub)}
                                                        >
                                                            <i className={sub.icon}></i>
                                                            <span>{sub.name}</span>
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        // Level 2 is a Direct Link (Portals or Guides)
                                        <a
                                            // ✅ FIXED: Use # for href to prevent page jumps
                                            href="#"
                                            onClick={(e) => handleLinkClick(e, child)}
                                        >
                                            <i className={child.icon}></i>
                                            <span>{child.name}</span>
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