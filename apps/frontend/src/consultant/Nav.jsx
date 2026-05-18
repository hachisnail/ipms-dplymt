import './Nav.css';
import NavNotice from './ConsultantNotice';
import NavAvatar from './ConsultantAvatar';

function Nav() {
    return (
        <nav className="header-nav ms-auto">
            <ul className="d-flex align-items-center">
                <NavNotice />
                <NavAvatar />
            </ul>
        </nav>
    );
}

export default Nav;
