import React, { useEffect, useState, useCallback } from 'react';
import SideBar from './InventorSideBar.jsx';
import Dashboard from './Dashboard.jsx';
import Tracker from './Tracker.jsx';
import Profile from './InventorProfile.jsx';
import Resubmission from './Resubmission.jsx';
import navDropList from './Data/navDropList.jsx'; 
import UMIDPortal from './UMIDprtl.jsx';
import TrademarkPortal from './Trademarkprtl.jsx';
import CopyrightPortal from './Copyrightprtl.jsx'; 
import SubmissionGuide from './SubmissionGuide.jsx';
import './main2.css';
import './PdfViewer.css';

// ✅ Error Boundary Component - ONLY FOR DASHBOARD
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Component Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    margin: '20px'
                }}>
                    <h2 style={{ color: '#856404', marginBottom: '15px' }}>
                        ⚠️ Component Error
                    </h2>
                    <p style={{ color: '#856404', marginBottom: '10px' }}>
                        The {this.props.componentName} component failed to load.
                    </p>
                    <details style={{ 
                        marginTop: '20px', 
                        textAlign: 'left',
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '4px'
                    }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            Error Details
                        </summary>
                        <pre style={{ 
                            marginTop: '10px',
                            fontSize: '12px',
                            overflow: 'auto'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

const PdfViewerContent = ({ url, title }) => {
    if (!url) return <Dashboard />;

    const docTitle = title || url.substring(url.lastIndexOf('/') + 1);

    return (
        <div className="pdf-inline-view-wrapper">
            <div className="pdf-content-area-inline">
                <iframe
                    src={url}
                    title={`PDF Document: ${docTitle}`}
                    className="pdf-iframe-inline"
                    frameBorder="0" 
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

function InventorMain2() {
    const getViewFromHash = () => {
        const h = decodeURIComponent(window.location.hash.replace('#', ''));
        return h || 'Dashboard';
    };

    const [view, setView] = useState(getViewFromHash());
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTitle, setPdfTitle] = useState('');

    useEffect(() => {
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '') {
            window.location.hash = 'Dashboard';
        }

        const onHashChange = () => setView(getViewFromHash());
        window.addEventListener('hashchange', onHashChange);

        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const handlePdfClick = useCallback((url, name) => {
        if (url && url.endsWith('.pdf')) {
            setPdfUrl(url);
            setPdfTitle(name);
            window.location.hash = 'PDF_VIEWER'; 
            return true;
        }
        return false;
    }, []);
    const renderView = () => {
        console.log('InventorMain2 renderView:', view);

        switch (view) {
            case 'Tracker':
                return <Tracker />;
            
            case 'Resubmission':
                return <Resubmission />;
            
            case 'Submission Guide':
                return <SubmissionGuide />;

            case 'PDF_VIEWER':
                // Only render if pdfUrl is present, otherwise fall through/default to Dashboard
                if (pdfUrl) {
                    return <PdfViewerContent url={pdfUrl} title={pdfTitle} />;
                }
                break; // If no url, it breaks and hits the default Dashboard

            case 'Profile':
                return <Profile />;

            case 'UMIDPortal':
                return <UMIDPortal />;

            case 'TrademarkPortal':
                return <TrademarkPortal />;

            case 'CopyrightPortal':
                return <CopyrightPortal />;

            default:
                // This acts as your "Dashboard" fallback and error boundary wrapper
                return (
                    <ErrorBoundary componentName="Dashboard">
                        <Dashboard />
                    </ErrorBoundary>
                );
        }
    };

    return (
        <>
            <div className="app-layout" style={{ display: 'flex', gap: 20 }}>
                <SideBar navList={navDropList} onPdfClick={handlePdfClick} />
                
                <main id="main" className="main" style={{ flex: 1 }}>
                    {renderView()}
                </main>
            </div>
        </>
    );
}

export default InventorMain2;