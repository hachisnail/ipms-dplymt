import { useEffect } from 'react';
// 1. Theme variables FIRST
import '../styles/themes-variables.css';
// 2. Body & Layout SECOND (NEW!)
import '../styles/body-layout.css';
// 3. Global components THIRD
import '../styles/global-base.css';import './App.css';
import Header from './Header';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import 'remixicon/fonts/remixicon.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import SideBar from './InventorSideBar'
import Main2 from './InventorMain2';
import Footer from './Footer';
import BacktoTopButton from './BacktoTopButton';

function App() {
  useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'inventor');
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
