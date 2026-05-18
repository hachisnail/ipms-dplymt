import './Nav.css';
import NavAvatar from './InventorAvatar';
import NavNotice from './InventorNotice';
function Nav() {
    return (
        <nav className='header-nav ms-auto'>
            <ul className='d-flex align-items-center'>
                <NavNotice/>
                <NavAvatar/>
            </ul>
        </nav>
    );
}

export default Nav;