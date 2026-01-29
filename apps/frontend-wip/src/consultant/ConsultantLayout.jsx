import { useEffect } from 'react';

// 1. Theme variables FIRST (Moved to global styles)
import '../styles/themes-variables.css';
// 2. Body & Layout SECOND
import '../styles/body-layout.css';
// 3. Global components THIRD
import '../styles/global-base.css';

// Local App CSS
import './App.css';

import Header from './Header';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import 'remixicon/fonts/remixicon.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import SideBar from './ConsultantSideBar';
import Main2 from './main2';
import Footer from './Footer';
import BacktoTopButton from './BackToTopButton';

function ConsultantLayout() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'consultant');
  }, []);

  return (
    <>
      <Header/>
      <SideBar/>
      <Main2/>
      <Footer/>
      <BacktoTopButton/>
    </>
  );
}

export default ConsultantLayout;