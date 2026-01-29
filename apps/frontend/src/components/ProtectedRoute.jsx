import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userDataString = localStorage.getItem('user');
    
    // Check if user is logged in
    if (!token || !userDataString) {
        return <Navigate to="/login" replace />;
    }

    // Determine redirect path inside try/catch (NO JSX HERE!)
    let redirectPath = null;
    let userData = null;
    
    try {
        userData = JSON.parse(userDataString);
        const userRole = userData.userType;

        // Check if user has the required role
        if (allowedRoles && !allowedRoles.includes(userRole)) {
            // Determine redirect path based on role (JUST STRING, NO JSX!)
            if (userRole === 'INVENTOR') {
                redirectPath = '/inventor';
            } else if (userRole === 'CONSULTANT') {
                redirectPath = '/consultant';
            } else if (userRole === 'ADMIN') {
                redirectPath = '/admin';
            } else {
                // Unknown role - back to login
                redirectPath = '/login';
            }
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
        redirectPath = '/login';
    }

    // NOW render JSX OUTSIDE try/catch
    if (redirectPath) {
        return <Navigate to={redirectPath} replace />;
    }

    // User has correct role, render the protected content
    return children;
};

export default ProtectedRoute;