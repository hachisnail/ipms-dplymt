import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// 1. Theme variables FIRST
import './styles/themes-variables.css';
// 2. Body & Layout SECOND (NEW!)
import './styles/body-layout.css';
// 3. Global components THIRD
import './styles/global-base.css';import './App.css';
import './App.css';
// Auth Components
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import AboutIPMS from './pages/AboutIPMS';

// Inventor Portal (Maroon & Coral theme)
import InventorApp from './inventor/App';

// Consultant Portal (Maroon & Green theme)
import ConsultantApp from './consultant/App';

// Admin Portal (Maroon & Blue theme)
import AdminApp from './admin/App';

// Landing/Home Page
import HomePage from './components/HomePage';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* ===================================== */}
        {/* PUBLIC ROUTES */}
        {/* ===================================== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<AboutIPMS />} />

        {/* ===================================== */}
        {/* INVENTOR PORTAL (Protected) */}
        {/* ===================================== */}
        <Route
          path="/inventor"
          element={
            <ProtectedRoute allowedRoles={['INVENTOR']}>
              <InventorApp />
            </ProtectedRoute>
          }
        />

        {/* ===================================== */}
        {/* CONSULTANT PORTAL (Protected) */}
        {/* ===================================== */}
        <Route
          path="/consultant"
          element={
            <ProtectedRoute allowedRoles={['CONSULTANT']}>
              <ConsultantApp />
            </ProtectedRoute>
          }
        />

        {/* ===================================== */}
        {/* ADMIN PORTAL (Protected) */}
        {/* ===================================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminApp />
            </ProtectedRoute>
          }
        />

        {/* ===================================== */}
        {/* FALLBACK - Redirect to Login */}
        {/* ===================================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;