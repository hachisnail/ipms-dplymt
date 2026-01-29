import React, { useEffect, useState } from 'react';
import Profile from './Profile';
import IndustrialDesign from './Industrial Design';
import UtilityModel from './Utility Model';
import Trademark from './Trademark';
import Copyright from './Copyright';
import ApprovedForFiling from './Approvedum';
import PageTitle from './PageTitle'; 
import './main2.css';
import UnderReviewid from './UnderReview id';
import UnderReviewum from './UnderReview um';
import UnderReviewcr from './UnderReview cr';
import UnderReviewtm from './UnderReview tm';
import Approvedid from './Approvedid';
import Approvedum from './Approvedum';
import Approvedcr from './Approvedcr';
import Approvedtm from './Approvedtm';
import Rejectedid from './Rejectedid';
import Rejectedum from './Rejectedum';
import Rejectedcr from './Rejectedcr';
import Rejectedtm from './Rejectedtm';

function Main2() {
    const getViewFromHash = () => {
        const h = window.location.hash.replace('#', '').trim();
        return decodeURIComponent(h) || 'Industrial Design';
    };

    const [view, setView] = useState(getViewFromHash());

    useEffect(() => {
        const onHashChange = () => setView(getViewFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const renderView = () => {
        switch(view) {
            case 'Profile':
                return <Profile />;
            case 'Industrial Design':
                return <IndustrialDesign />;
            case 'Utility Model':
                return <UtilityModel />;
            case 'Trademark':
                return <Trademark />;
            case 'Copyright':
                return <Copyright />;
            case 'Resubmission Review':
                return <Resubmission />;
            case 'Approved for Filing':
                return <ApprovedForFiling />;
            case 'Filed':
                return <div style={{ marginLeft: 300, marginTop: 60, padding: 20 }}>Filed (Coming Soon)</div>;
            
            // ✅ FIXED: Moved Under Review cases INSIDE renderView
            case 'UnderReviewid':
                return <UnderReviewid />;
            case 'UnderReviewum':
                return <UnderReviewum />;
            case 'UnderReviewcr':
                return <UnderReviewcr />;
            case 'UnderReviewtm':
                return <UnderReviewtm />;

            // ✅ FIXED: Moved Approved cases INSIDE renderView
            case 'Approvedid':
                return <Approvedid />;
            case 'Approvedum':
                return <Approvedum />;
            case 'Approvedcr':
                return <Approvedcr />;
            case 'Approvedtm':
                return <Approvedtm />;
            default:
                return <IndustrialDesign />;
            
            //Rejected IP projects
            case 'Rejectedid':
                return <Rejectedid />; 
            case 'Rejectedum':
                return <Rejectedum />;  
            case 'Rejectedcr':
                return <Rejectedcr />;
            case 'Rejectedtm':
                return <Rejectedtm />; 
        }
    };

    // ✅ FIXED: Added all missing page titles
    const pageTitle = {
        Profile: 'Specialist Profile',
        'Industrial Design': 'Industrial Design Portal',
        'Utility Model': 'Utility Model Portal',
        Trademark: 'Trademark Portal',
        Copyright: 'Copyright Portal',
        Resubmission: 'Resubmission Review',
        'Under Review': 'Under Review',
        'Approved for Filing': 'Approved for Filing',
        'Filed': 'Filed Applications',
        UnderReviewid: 'Under Review - Industrial Design',
        UnderReviewum: 'Under Review - Utility Model',
        UnderReviewcr: 'Under Review - Copyright',
        UnderReviewtm: 'Under Review - Trademark',
        Approvedid: 'Approved for Filing - Industrial Design',
        Approvedum: 'Approved for Filing - Utility Model',
        Approvedcr: 'Approved for Filing - Copyright',
        Approvedtm: 'Approved for Filing - Trademark',
        Rejectedid: 'Rejected Submissions - Industrial Design',
        Rejectedum: 'Rejected Submissions - Utility Model',
        Rejectedcr: 'Rejected Submissions - Copyright',
        Rejectedtm: 'Rejected Submissions - Trademark',
    }[view] || view;

    return (
        <>
            <div className="app-layout" style={{ display: 'flex', gap: 20 }}>
                {/* ✅ FIXED: Removed navList prop (SideBar doesn't need it) */}
                <SideBar active={view} onNavigate={setView} />
                
                <main id="main" className="main" style={{ flex: 1 }}>
                    <PageTitle page={pageTitle} /> 
                    {renderView()}
                </main>
            </div>
        </>
    );
}

export default Main2;