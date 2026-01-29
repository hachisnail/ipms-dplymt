import React from 'react';
import { NavLink } from 'react-router-dom'; // Assuming you use NavLink or a similar tag
// If you use standard <a> tags based on your Sidebar code, keep using them.

function NavRenderList({ navDropList, active, onItemClick, onPdfClick }) {
  if (!navDropList || navDropList.length === 0) return null;

  return (
    <>
      {navDropList.map((item) => (
        <li key={item.id || item.name} className="nav-item">
          <a
            className={`nav-link ${active === item.name ? '' : 'collapsed'}`}
            data-bs-target={`#${item.targetId}`}
            data-bs-toggle="collapse"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Only trigger navigation if it's a direct link, otherwise toggle dropdown
              if (!item.subItems) onItemClick(item.name);
            }}
          >
            <i className={item.icon}></i>
            <span>{item.name}</span>
            {item.subItems && <i className="bi bi-chevron-down ms-auto"></i>}
          </a>

          {item.subItems && (
            <ul
              id={item.targetId}
              className={`nav-content collapse ${active === item.name ? 'show' : ''}`}
              data-bs-parent="#sidebar-nav"
            >
              {item.subItems.map((sub) => (
                <li key={sub.name}>
                  <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        if (sub.isPdf && onPdfClick) {
                            onPdfClick(sub.pdfUrl || sub.file);
                        } else {
                            onItemClick(sub.name);
                        }
                    }}
                    className={active === sub.name ? 'active' : ''}
                  >
                    <i className="bi bi-circle"></i>
                    <span>{sub.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </>
  );
}

// ✅ THIS LINE IS CRITICAL - IT FIXES THE ERROR
export default NavRenderList;