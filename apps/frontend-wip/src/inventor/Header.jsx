import "./Header.css"; //this css will only work in this jsx file.
import Logo from "./Logo";
import Nav from "./Nav";

function Header() {
  return (
    <>
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <Logo />
        <Nav />
      </header>
    </>
  );
}

export default Header;
