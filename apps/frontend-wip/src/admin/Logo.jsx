
import './Logo.css'; //this css will only work in this jsx file.
import IPMOLogo from './Images/ipmo.jpg';

function Logo() {

    const handleToggleSidebar = () => {
        document.body.classList.toggle('toggle-sidebar');
    };

  return (
    
        <div className="d-flex align-items-center justify-content-between">
            <a href="/" className="logo d-flex align-items-center">
           <img src={IPMOLogo} alt="IPMO Logo"></img>
            <span className="d-none d-lg-block" spellCheck="false">WELCOME ADMIN</span>
            </a>
            <i
            className='bi bi-list toggle-sidebar-btn'
                onClick={handleToggleSidebar}
             ></i>
        </div>
  );
}

export default Logo;

