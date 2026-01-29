import React, { useState } from "react";
// --- FormViewerItem: Handles individual expandable items/documents ---
const FormViewerItem = ({ item, level, setPdfUrl }) => {
  const [isOpen, setIsOpen] = useState(false);

  // If the item has a 'href', it's a clickable form/document link
  const isDocument = !!item.href;
  
  const handleClick = (e) => {
    e.preventDefault();
    if (isDocument) {
      // Calls the function passed from the parent (SubmissionPortal)
      setPdfUrl(item.href); 
    } else if (item.children) {
      setIsOpen(!isOpen);
    }
  };

  const itemStyle = {
    paddingLeft: `${10 + (level * 15)}px`, // Increase indentation by level
  };

  return (
    <div className="nav-item-wrapper">
      <a 
        href={item.href || '#'} 
        className={`nav-item ${isDocument ? 'document-link' : 'folder-link'}`}
        style={itemStyle}
        onClick={handleClick}
      >
        <i className={item.icon || 'bi bi-dot'}></i>
        <span>{item.name}</span>
        {item.children && (
          <i className={`bi bi-chevron-down expand-icon ${isOpen ? 'open' : ''}`}></i>
        )}
      </a>
      
      {item.children && isOpen && (
        <div className="nav-children">
          {item.children.map(child => (
            <FormViewerItem key={child._id} item={child} level={level + 1} setPdfUrl={setPdfUrl} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- FormViewer: Main sidebar container ---
export const FormViewer = ({ formsData, setPdfUrl }) => {
  return (
    <div className="form-viewer-sidebar">
      <header className="sidebar-header">Forms Library</header>
      <div className="sidebar-content">
        {formsData.map(group => (
          <FormViewerItem key={group._id} item={group} level={0} setPdfUrl={setPdfUrl} />
        ))}
      </div>
    </div>
  );
};
export default FormViewer;