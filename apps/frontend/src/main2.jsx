import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Import components from separate files
import DesignNav from './components/DesignNav'
import HomePage from './components/HomePage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import AboutIPMS from './pages/AboutIPMS'
import './styles/main2.css'

// Import styles
import './styles/main2.css'
import './index.css'

// Main App Component for Preview (NO EMAIL VERIFICATION)
function Main2() {
  return (
    <Router>
      <DesignNav />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<AboutIPMS />} />
      </Routes>
    </Router>
  )
}

// Render
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main2 />
  </React.StrictMode>,
)

export default Main2;