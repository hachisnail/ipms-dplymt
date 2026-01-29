import React, { useRef, useCallback } from 'react';
import { Save } from 'lucide-react'; 
import './PdfViewer.css'; 

const PdfViewer = ({ url, title }) => {
    const iframeRef = useRef(null); 
    const handleSavePrint = useCallback(() => {
        if (iframeRef.current) {
            try {
                const iframeWindow = iframeRef.current.contentWindow;
                
                if (iframeWindow && iframeWindow.print) {
                    iframeWindow.print();
                } else {
                    console.error("PDF printing not supported via iframe contentWindow.");
                }
            } catch (error) {
                console.error("Error accessing iframe content for save/print. Suggesting manual download.", error);
                alert("Cannot access the form directly. Please use the 'Download Original' button, open the file on your computer, fill it out, and save it there.");
            }
        }
    }, []);

    const docTitle = title || url.substring(url.lastIndexOf('/') + 1); 

    if (!url) {
        return (
            <div className="pdf-inline-view-wrapper">
                <div className="pdf-empty-state">
                    <h3 className="text-lg font-semibold">No Form Selected</h3>
                    <p className="mt-2 text-gray-600">Please choose a form from the **Forms** section in the sidebar to view a PDF document here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pdf-inline-view-wrapper">
            
            <div className="pdf-viewer-header">
                <div className="pdf-header-buttons">
                    
                    {/* 1. SAVE/PRINT BUTTON (Kept for printing/saving filled form) */}
                    <button 
                        onClick={handleSavePrint}
                        className="pdf-save-btn" 
                        aria-label="Save Filled PDF"
                        title="Save as PDF (Includes inputted data)"
                    >
                        <Save size={20} />
                    </button>
                </div>
            </div>
            
            <div className="pdf-content-area-inline">
                <iframe
                    ref={iframeRef}
                    src={url}
                    title={`PDF Document: ${docTitle}`}
                    className="pdf-iframe-inline"
                    frameBorder="0" 
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                >
                    <p className="pdf-fallback-text">
                        Your browser does not support embedded PDFs. 
                        <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-fallback-link">
                            Download the file here.
                        </a>
                    </p>
                </iframe>
            </div>
        </div>
    );
};

export default PdfViewer;