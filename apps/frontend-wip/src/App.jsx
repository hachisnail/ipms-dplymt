import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Theme & Global Styles
import './styles/themes-variables.css';
import './styles/body-layout.css';
import './styles/global-base.css';
import './App.css';

// 2. Auth Pages (Located in src/pages/)
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AboutIPMS from './pages/AboutIPMS';

// 3. Global Components
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';

// 4. Role-Based Portals
import InventorApp from './inventor/InventorLayout';
import ConsultantApp from './consultant/ConsultantSideBar';
import AdminApp from './admin/AdminLayout';

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
          path="/inventor/*"
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
          path="/consultant/*"
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
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminApp />
            </ProtectedRoute>
          }
        />

        {/* ===================================== */}
        {/* FALLBACK */}
        {/* ===================================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;