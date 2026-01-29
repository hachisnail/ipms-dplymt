import React, { useEffect, useState } from 'react';
import './main2.css';
import SideBar from './AdminSideBar';
// Imports for navitem (Dashboard)
import Dashboard from './Dashboard';
// Imports for navDropList main and child items
// Project Management
import ActiveReviews from './ActiveReviews';
import FinalizedProjects from './FinalizedProjects';
// User Management
import InventorDirectory from './InventorDirectory';
import SpecialistDirectory from './SpecialistDirectory';
import RolePermissions from './RolePermissions';
// System Records
import ReferenceLibrary from './ReferenceLibrary';
import SystemAudit from './SystemAudit';
// Account & Support
import AdminSetting from './AdminSetting';
import TermsConditions from './TermsConditions';

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
        switch(view) {
            // navitem
            case 'Dashboard':
                return <Dashboard />;

            // navDropList: Project Management
            case 'ActiveReviews':
                return <ActiveReviews />;
            case 'FinalizedProjects':
                return <FinalizedProjects />;

            // navDropList: User Management
            case 'InventorDirectory':
                return <InventorDirectory />;
            case 'SpecialistDirectory':
                return <SpecialistDirectory />;
            case 'RolePermissions':
                return <RolePermissions />;

            // navDropList: System Records
            case 'ReferenceLibrary':
                return <ReferenceLibrary />;
            case 'SystemAudit':
                return <SystemAudit />;

            // navDropList: Account & Support
            case 'AdminSetting':
                return <AdminSetting />;
            case 'TermsConditions':
                return <TermsConditions />;

            default:
                return <Dashboard />;
        }
    };

    return (
        <>
            {/* ✅ REMOVED: Conflicting inline styles (display: flex, gap: 20) */}
            {/* ✅ Sidebar positioning is handled by SideBar.css (position: fixed) */}
            <SideBar active={view} onNavigate={setView} />
            
            {/* ✅ Main content margin is handled by main2.css */}
            <main id="main" className="main">
                {renderView()}
            </main>
        </>
    );
}

export default Main2;