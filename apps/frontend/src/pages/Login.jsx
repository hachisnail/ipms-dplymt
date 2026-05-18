import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';
import '../styles/Login.css';

// Institution logos — relative to src/
import cnscLogo from '../image/CNSC.jpg';
import ipmoLogo from '../image/IPMO.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const Login = () => {
    const navigate  = useNavigate();
    const [formData, setFormData]       = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading]     = useState(false);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, formData);
            if (response.data.success) {
                const userData = response.data.data;

                if (userData.approval_status === 'pending') {
                    toast.warning('⏳ Your account is pending admin approval. Please wait.');
                    setIsLoading(false); return;
                }
                if (userData.approval_status === 'rejected') {
                    toast.error(`❌ Account rejected. Reason: ${userData.rejection_reason || 'No reason provided'}`);
                    setIsLoading(false); return;
                }
                if (userData.approval_status !== 'approved') {
                    toast.error('Account status unknown. Please contact support.');
                    setIsLoading(false); return;
                }

                localStorage.setItem('token',        userData.token);
                localStorage.setItem('sessionToken', userData.sessionToken);
                localStorage.setItem('user',         JSON.stringify(userData));
                toast.success(`Welcome back, ${userData.fullName}! 🎉`);

                setTimeout(() => {
                    switch (userData.userType) {
                        case 'INVENTOR':   navigate('/inventor');   break;
                        case 'CONSULTANT': navigate('/consultant'); break;
                        case 'ADMIN':      navigate('/admin');      break;
                        default:
                            navigate('/login');
                            toast.error('Unknown user role. Please contact support.');
                    }
                }, 1000);
            }
        } catch (error) {
            if (error.response?.status === 403) {
                toast.warning(error.response.data.message || 'Account pending approval');
            } else {
                toast.error(error.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* ══════════════════════════════════════════
                LEFT — Branding panel
            ══════════════════════════════════════════ */}
            <div className="login-panel-brand">
                <div className="lp-brand-ring" />

                <div className="lp-brand-inner">

                    {/* Heading */}
                    <span className="lp-eyebrow">Camarines Norte State College</span>
                    <h2 className="lp-brand-title">
                        Intellectual Property<br />Management System
                    </h2>
                    <p className="lp-brand-sub">
                        Secure, efficient, and streamlined IP protection
                        for innovators, consultants, and administrators.
                    </p>

                    {/* Logos — below title */}
                    <div className="lp-logos-row">
                        <div className="lp-logo-wrap">
                            <img src={cnscLogo} alt="CNSC Logo" className="lp-inst-logo" />
                        </div>
                        <div className="lp-logo-divider" />
                        <div className="lp-logo-wrap">
                            <img src={ipmoLogo} alt="IPMO Logo" className="lp-inst-logo" />
                        </div>
                    </div>

                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT — Form panel
            ══════════════════════════════════════════ */}
            <div className="login-panel-form">
                <div className="lp-form-wrap">

                    <div className="lp-form-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in to continue to the IPMO portal</p>
                        <div className="lp-divider" />
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">

                        <div className="form-group">
                            <label htmlFor="email">
                                <FaEnvelope /> Email Address
                            </label>
                            <input
                                type="email" id="email" name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <FaLock /> Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password" name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required disabled={isLoading}
                                />
                                <button
                                    type="button" className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-button" disabled={isLoading}>
                            {isLoading
                                ? <><span className="spinner" /> Signing In…</>
                                : <><FaSignInAlt /> Sign In</>
                            }
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Don't have an account?</p>
                        <Link to="/signup" className="signup-link">Create Account</Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;