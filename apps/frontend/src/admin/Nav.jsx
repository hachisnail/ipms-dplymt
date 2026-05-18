import './Nav.css';
import NavNotice from './AdminNotice';
import NavAvatar from './AdminAvatar';

function Nav() {
    return (
        <nav className="header-nav ms-auto">
            <ul className="d-flex align-items-center">
                <NavNotice/>
                <NavAvatar/>
            </ul>
        </nav>
    );
}

export default Nav;
