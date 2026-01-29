import React from "react";
// NOTE: In a real project, this component would be imported by SubmissionPortal.jsx
import './PdfViewer.css';
export const PdfViewer = ({ url }) => {
  if (!url) {
    return (
      <div className="pdf-placeholder">
        <p>No PDF selected for viewing.</p>
        <p>Click an item in the Forms Library to load a document.</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-box">
      <h4>Document Preview</h4>
      <iframe 
        src={url} 
        title="PDF Viewer" 
        width="100%" 
        height="90%"
        style={{ border: 'none' }}
      />
    </div>
  );
};
