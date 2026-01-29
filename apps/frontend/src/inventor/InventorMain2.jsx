import React, { useEffect, useState, useCallback } from 'react';
import SideBar from './InventorSideBar.jsx';
import Dashboard from './Dashboard.jsx';
import Profile from './Profile.jsx';
import Faqs from './FAQS.jsx';
import Contacts from './Contacts.jsx'
import navDropList from './Data/navDropList.jsx'; 
import PageTitle from './PageTitle.jsx'; 
import UtilityPortal from './Utilityprtl.jsx';
import IndustrialPortal from './Industrialprtl.jsx';
import TrademarkPortal from './Trademarkprtl.jsx';
import CopyrightPortal from './Copyrightprtl.jsx'; 
import Trademarkguide from './Trademarkguide.jsx';
import Copyrightguide from './Copyrightguide.jsx';
import Utilitymodelguide from './Utilitymodelguide.jsx';
import Industrialdesignguide from './Industrialguide.jsx';
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
        const h = window.location.hash.replace('#', '');
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
        
        // 1. PDF VIEWER ROUTE
        if (view === 'PDF_VIEWER' && pdfUrl) {
            return <PdfViewerContent url={pdfUrl} title={pdfTitle} />;
        }
        
        // 2. STANDARD ROUTES (NO error boundaries)
        if (view === 'Profile') return <Profile />;
        if (view === 'FAQS') return <Faqs />;
        if (view === 'Contacts') return <Contacts />;
        
        // Portal Routes (NO error boundaries)
        if (view === 'UtilityModelPortal') return <UtilityPortal />; 
        if (view === 'IndustrialDesignPortal') return <IndustrialPortal />; 
        if (view === 'TrademarkPortal') return <TrademarkPortal />; 
        if (view === 'CopyrightPortal') return <CopyrightPortal />; 

        // Guide Routes (NO error boundaries)
        if (view === 'TrademarkExaminationGuide') return <Trademarkguide />;
        if (view === 'IndustrialDesignExaminationGuide') return <Industrialdesignguide />;
        if (view === 'CopyrightExaminationGuide') return <Copyrightguide />;
        if (view === 'UtilityModelExaminationGuide') return <Utilitymodelguide />;

        // 3. DEFAULT - Dashboard (ONLY ONE with error boundary)
        return (
            <ErrorBoundary componentName="Dashboard">
                <Dashboard />
            </ErrorBoundary>
        );
    };

    const pageTitle = {
        Dashboard: 'Dashboard',
        Profile: 'User Profile',
        FAQS: 'FAQs',
        Contacts: 'Contacts',
        UtilityModelPortal: 'Utility Model Portal',
        IndustrialDesignPortal: 'Industrial Design Portal',
        TrademarkPortal: 'Trademark Portal',
        CopyrightPortal: 'Copyright Portal',
        TrademarkExaminationGuide: 'Trademark Examination Guide',
        CopyrightExaminationGuide: 'Copyright Examination Guide',
        UtilityModelExaminationGuide: 'Utility Model Examination Guide',
        IndustrialDesignExaminationGuide: 'Industrial Design Examination Guide',
        PDF_VIEWER: pdfTitle || 'Document Viewer',
    }[view] || view;

    return (
        <>
            <div className="app-layout" style={{ display: 'flex', gap: 20 }}>
                <SideBar navList={navDropList} onPdfClick={handlePdfClick} />
                
                <main id="main" className="main" style={{ flex: 1 }}>
                    <PageTitle page={pageTitle} /> 
                    {renderView()}
                </main>
            </div>
        </>
    );
}

export default InventorMain2;