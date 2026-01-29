import './Logo.css';
import IPMOLogo from './Images/ipmo.jpg';

function Logo() {
    const handleToggleSidebar = () => {
        document.body.classList.toggle('toggle-sidebar');
        
        // ✅ ADDED: Debug logging
        console.log('🎯 Toggle button clicked!');
        console.log('📋 Body classes:', document.body.className);
        console.log('✅ Has toggle-sidebar:', document.body.classList.contains('toggle-sidebar'));
        
        // ✅ ADDED: Additional debugging
        const sidebar = document.querySelector('.sidebar');
        const main = document.querySelector('#main');
        if (sidebar && main) {
            console.log('📏 Sidebar left:', window.getComputedStyle(sidebar).left);
            console.log('📏 Main margin-left:', window.getComputedStyle(main).marginLeft);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-between">
            <a href="#Dashboard" className="logo d-flex align-items-center">
                <img src={IPMOLogo} alt="IPMO Logo"></img>
                <span className="d-none d-lg-block" spellCheck="false">
                    WELCOME INVENTOR
                </span>
            </a>
            <i
                className='bi bi-list toggle-sidebar-btn'
                onClick={handleToggleSidebar}
            ></i>
        </div>
    );
}

export default Logo;