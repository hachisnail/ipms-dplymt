import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await axios.post(`${API_URL}/auth/logout`, { sessionToken });
      
      localStorage.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #FFF9F8 0%, #FFE5E5 100%)',
      padding: '40px' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '40px',
          borderBottom: '2px solid #0891b2',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              color: '#0891b2',
              margin: 0,
              marginBottom: '10px'
            }}>
              👔 Consultant Dashboard
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#64748b',
              margin: 0 
            }}>
              Welcome, {userData.fullName}!
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#dc2626'}
            onMouseOut={(e) => e.target.style.background = '#ef4444'}
          >
            Logout
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '20px' 
          }}>
            🚧
          </div>
          <h2 style={{ 
            fontSize: '28px', 
            color: '#0891b2',
            marginBottom: '15px'
          }}>
            Consultant System Coming Soon
          </h2>
          <p style={{ 
            fontSize: '18px', 
            color: '#64748b',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            The Consultant interface is currently under development.
            <br />
            This is where you'll review and evaluate IP submissions.
          </p>

          <div style={{ 
            background: '#f0f9ff',
            border: '2px solid #0891b2',
            borderRadius: '12px',
            padding: '30px',
            marginTop: '40px'
          }}>
            <h3 style={{ 
              color: '#0891b2',
              marginBottom: '15px' 
            }}>
              Your Account Details
            </h3>
            <div style={{ 
              textAlign: 'left',
              display: 'inline-block' 
            }}>
              <p><strong>Name:</strong> {userData.fullName}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Role:</strong> {userData.userType}</p>
              <p><strong>IP Category:</strong> {userData.ipCategory?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;