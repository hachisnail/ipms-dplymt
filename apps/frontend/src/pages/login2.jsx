import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaRocket } from 'react-icons/fa';
import '../styles/Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log(API_URL+" = vite api url")

            const response = await axios.post(`${API_URL}/auth/login`, formData);

            if (response.data.success) {
                const userData = response.data.data;
                
                // Store user data in localStorage
                localStorage.setItem('token', userData.token);
                localStorage.setItem('sessionToken', userData.sessionToken);
                localStorage.setItem('user', JSON.stringify(userData));

                toast.success(`Welcome back, ${userData.fullName}! 🎉`);
                
                // ðŸŽ¯ ROLE-BASED ROUTING - FIXED PATHS
                setTimeout(() => {
                    switch(userData.userType) {
                        case 'INVENTOR':
                            // âœ… Route to INVENTOR portal (Maroon & Coral theme)
                            navigate('/inventor');
                            break;
                        case 'CONSULTANT':
                            // âœ… Route to CONSULTANT portal (Maroon & Green theme)
                            navigate('/consultant');
                            break;
                        case 'ADMIN':
                            // âœ… Route to ADMIN portal (if exists)
                            navigate('/admin');
                            break;
                        default:
                            // Fallback
                            navigate('/login');
                            toast.error('Unknown user role. Please contact support.');
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            <div className="login-content">
                <div className="login-card">
                    <div className="login-header">
                        <div className="logo-container">
                            <FaRocket className="logo-icon" />
                        </div>
                        <h1>Welcome Back!</h1>
                        <p>Sign in to continue to IP Management System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">
                                <FaEnvelope /> Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <FaLock /> Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <FaSignInAlt /> Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Don't have an account?</p>
                        <Link to="/signup" className="signup-link">
                            Create Account
                        </Link>
                    </div>
                </div>

                <div className="login-info">
                    <div className="info-card">
                        <h2>Intellectual Property Management System</h2>
                        <p>Secure, efficient, and streamlined IP protection for innovators and consultants.</p>
                        <div className="features">
                            <div className="feature">
                                <div className="feature-icon">🎨</div>
                                <h3>For Inventors</h3>
                                <p>Submit and track your innovative designs</p>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">👔</div>
                                <h3>For Consultants</h3>
                                <p>Review and evaluate IP submissions</p>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">🔐</div>
                                <h3>For Admins</h3>
                                <p>Manage and oversee the entire system</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;