import './Header.css';
import Logo from './Logo';
import Nav from './Nav';

function Header() {
  return (
    <>
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        {/* Left group: logo + welcome text + toggle sidebar btn
            Wrapping Logo in .header-left overrides the inner
            justify-content-between that was spacing things apart */}
        <div className="header-left">
          <Logo />
        </div>

        {/* Right group: bell notification + avatar */}
        <Nav />
      </header>
    </>
  );
}

export default Header;