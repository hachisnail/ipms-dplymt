// admin/App.jsx - Admin Portal Main Component
import { useEffect } from 'react';
// 1. Theme variables FIRST
import '../styles/themes-variables.css';
// 2. Body & Layout SECOND (NEW!)
import '../styles/body-layout.css';
// 3. Global components THIRD
import '../styles/global-base.css';
// 4. Page-specific styles LAST
import './App.css';
import Header from './Header';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import 'remixicon/fonts/remixicon.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import SideBar from './AdminSideBar';
import Main2 from './main2';
import Footer from './Footer';
import BacktoTopButton from './BacktoTopButton';

function App() {
  // ✅ Initialize hash on mount
  useEffect(() => {
    console.log('🚀 AdminApp mounted');
    console.log('📍 Current URL:', window.location.href);
    
    // Set default hash to Dashboard if none exists
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '') {
      console.log('⚙️ Setting default hash to Dashboard');
      window.location.hash = 'Dashboard';
    }
    document.documentElement.setAttribute('data-theme', 'admin');
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

export default App;