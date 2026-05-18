import React, { useEffect, useState } from 'react';
import './main2.css';
import SideBar from './AdminSideBar';
import Dashboard from './Dashboard';
import ContentManagement from './ContentManagement.jsx';
import AssignSubmission from './AssignSubmission';
import ApprovedforApplication from './ApprovedforApplication.jsx';
import ActiveReviews from './ActiveReviews';
import AdminResubmission from './AdminResubmission';
import PASReports from './PASReports';
import Userdirectory from './Userdirectory';
import RolePermissions from './RolePermissions';
import ReferenceLibrary from './ReferenceLibrary';
import TermsConditions from './TermsConditions';
import AdminProfile from './AdminProfile.jsx';
import AccountManagement from './AccountManagement.jsx';
import PageBuilder from './PageBuilder.jsx';

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
            case 'Content Management':
                return <ContentManagement/>;
            case 'PageBuilder':
                return <PageBuilder/>;
            case 'AdminProfile':
                return <AdminProfile />;
            case 'AssignSubmission':
                return <AssignSubmission />;
            case 'ApprovedforApplication':
                /* FIXED: Passing the prefix prop here so the component knows which API to call[cite: 11, 12] */
                return <ApprovedforApplication prefix="umid" />;
            case 'ActiveReviews':
                return <ActiveReviews />;
            case 'AdminResubmission':
                return <AdminResubmission />;
            case 'PASReports':
                return <PASReports />;
            case 'AccountManagement':
                return <AccountManagement/>;
            case 'Userdirectory':
                return <Userdirectory />;
            case 'RolePermissions':
                return <RolePermissions />;
            case 'ReferenceLibrary':
                return <ReferenceLibrary />;
            case 'TermsConditions':
                return <TermsConditions />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <>
            <SideBar active={view} onNavigate={setView} />
            <main id="main" className="main">
                {renderView()}
            </main>
        </>
    );
}

export default Main2;