import React, { useEffect, useState } from 'react';
import AssignedSubmissions from './AssignedSubmissions';
import ApprovedForFiling from './Approvedum';
import Dashboard from './IPSpecialistDashboard';
import './main2.css';
import UnderReviewid from './UnderReview id';
import UnderReviewum from './UnderReview um';
import UnderReviewcr from './UnderReview cr';
import UnderReviewtm from './UnderReview tm';
import Approvedid from './Approvedid';
import Approvedum from './Approvedum';
import Approvedcr from './Approvedcr';
import Approvedtm from './Approvedtm';
import SideBar from './ConsultantSideBar';
import ConsultantProfile from './ConsultantProfile.jsx';

function Main2() {
    const getViewFromHash = () => {
        const h = window.location.hash.replace('#', '').trim();
        return decodeURIComponent(h) || 'Dashboard';
    };

    const [view, setView] = useState(getViewFromHash());

    useEffect(() => {
        const onHashChange = () => setView(getViewFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const renderView = () => {
        switch (view) {
            case 'Dashboard':
                return <Dashboard />;
            case 'Profile':
            case 'ConsultantProfile':
                return <ConsultantProfile />;
            case 'Assigned Submissions':
                return <AssignedSubmissions />;
            case 'Approved for Filing':
                return <ApprovedForFiling />;
            case 'Filed':
                return <div style={{ marginLeft: 300, marginTop: 60, padding: 20 }}>Filed (Coming Soon)</div>;
            case 'UnderReviewid':
                return <UnderReviewid />;
            case 'UnderReviewum':
                return <UnderReviewum />;
            case 'UnderReviewcr':
                return <UnderReviewcr />;
            case 'UnderReviewtm':
                return <UnderReviewtm />;
            case 'Approvedid':
                return <Approvedid />;
            case 'Approvedum':
                return <Approvedum />;
            case 'Approvedcr':
                return <Approvedcr />;
            case 'Approvedtm':
                return <Approvedtm />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <>
            <div className="app-layout" style={{ display: 'flex', gap: 20 }}>
                <SideBar active={view} onNavigate={setView} />
                <main id="main" className="main" style={{ flex: 1 }}>
                    {renderView()}
                </main>
            </div>
        </>
    );
}

export default Main2;