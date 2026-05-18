import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
    FaUser, FaMapMarkerAlt, FaBirthdayCake, FaImage,
    FaBuilding, FaCertificate, FaCheckCircle,
    FaArrowLeft, FaArrowRight, FaShieldAlt, FaFileContract,
    FaPhone, FaTools
} from 'react-icons/fa';
import '../styles/Signup.css';

// Institution logos — relative to src/
import cnscLogo from '../image/CNSC.jpg';
import ipmoLogo from '../image/IPMO.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const DELIVERY_UNITS = [
    'CCMS', 'COTT', 'CANR', 'CAS', 'COED',
    'COENG', 'CBPA', 'CFAST', 'ETIENZA',
    'CEID', 'GS', 'GASS'
];

const STEPS = [
    { label: 'Select Role',     hint: 'Choose your account type' },
    { label: 'Account Details', hint: 'Email & password'          },
    { label: 'Personal Info',   hint: 'Profile & contact'         },
];

const SignUp = () => {
    const navigate = useNavigate();
    const [step, setStep]                       = useState(1);
    const [userType, setUserType]               = useState('');
    const [showPassword, setShowPassword]       = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading]             = useState(false);
    const [profilePreview, setProfilePreview]   = useState(null);
    const [showPrivacyModal, setShowPrivacyModal] = useState(true);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '',
        fullName: '', contact: '', address: '',
        age: '', birthdate: '', profilePicture: null,
        deliveryUnit: '', adminLevel: 'ADMIN'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, profilePicture: file }));
            const reader = new FileReader();
            reader.onloadend = () => setProfilePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => {
        if (step === 1 && !userType) { toast.error('Please select your role'); return; }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!privacyAccepted) { toast.error('Please accept the Data Privacy Act to continue'); setShowPrivacyModal(true); return; }
        if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match!'); return; }
        setIsLoading(true);
        try {
            const data = new FormData();
            data.append('email',     formData.email);
            data.append('password',  formData.password);
            data.append('fullName',  formData.fullName);
            data.append('contact',   formData.contact);
            data.append('address',   formData.address);
            data.append('age',       formData.age);
            data.append('birthdate', formData.birthdate);
            data.append('userType',  userType.toUpperCase());
            if (formData.profilePicture) data.append('profilePicture', formData.profilePicture);
            if (userType === 'inventor'  && formData.deliveryUnit) data.append('deliveryUnit', formData.deliveryUnit);
            if (userType === 'admin') data.append('adminLevel', formData.adminLevel);

            await axios.post(`${API_URL}/auth/register`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Registration successful! Awaiting admin approval.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrivacyAccept = () => {
        setPrivacyAccepted(true);
        setShowPrivacyModal(false);
        toast.success('Thank you for accepting our Data Privacy Policy');
    };

    const handlePrivacyDecline = () => {
        toast.info('You must accept the Data Privacy Act to create an account');
        navigate('/login');
    };

    return (
        <div className="signup-page">

            {/* ══════════════════════════════════════════
                LEFT — Sidebar
            ══════════════════════════════════════════ */}
            <div className="signup-sidebar">
                <div className="sp-sidebar-ring" />

                <div className="sp-sidebar-inner">

                    <span className="sp-eyebrow">Camarines Norte State College</span>
                    <h2 className="sp-brand-title">IPMO Portal<br />Registration</h2>
                    <p className="sp-brand-sub">
                        Create your account to access the Intellectual
                        Property Management System.
                    </p>

                    {/* Logos — below title */}
                    <div className="sp-logos-row">
                        <div className="sp-logo-wrap">
                            <img src={cnscLogo} alt="CNSC Logo" className="sp-inst-logo" />
                        </div>
                        <div className="sp-logo-divider" />
                        <div className="sp-logo-wrap">
                            <img src={ipmoLogo} alt="IPMO Logo" className="sp-inst-logo" />
                        </div>
                    </div>

                    {/* Step tracker */}
                    <div className="sp-steps">
                        {STEPS.map((s, i) => {
                            const n   = i + 1;
                            const cls = step === n ? 'active' : step > n ? 'done' : '';
                            return (
                                <div key={n} className={`sp-step ${cls}`}>
                                    <div className="sp-step-num">
                                        {step > n ? '✓' : n}
                                    </div>
                                    <div className="sp-step-label">
                                        <strong>{s.label}</strong>
                                        <span>{s.hint}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT — Main form area
            ══════════════════════════════════════════ */}
            <div className="signup-main">
                <div className="sp-form-wrap">

                    {/* ── Privacy Modal ── */}
                    {showPrivacyModal && (
                        <div className="privacy-modal-overlay">
                            <div className="privacy-modal">
                                <div className="privacy-modal-header">
                                    <div className="privacy-icon"><FaShieldAlt /></div>
                                    <h2>Data Privacy Act of 2012</h2>
                                    <p>Republic Act No. 10173</p>
                                </div>

                                <div className="privacy-modal-body">

                                    {/* Notice */}
                                    <div className="privacy-section">
                                        <FaFileContract className="section-icon" />
                                        <div>
                                            <h3>Privacy Notice</h3>
                                            <p>
                                                By creating an account in the Intellectual Property Management System (IPMS),
                                                you agree to the collection, use, and processing of your personal information
                                                in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).
                                            </p>
                                        </div>
                                    </div>

                                    <div className="privacy-content">

                                        <h4>Information We Collect</h4>
                                        <ul>
                                            <li>Personal identification — Full Name, Email Address</li>
                                            <li>Contact information — Address, Phone Number</li>
                                            <li>Demographic data — Age, Birthdate</li>
                                            <li>Professional information — Delivery Unit, Position</li>
                                            <li>Profile picture (if provided)</li>
                                            <li>IP submissions and related documents</li>
                                        </ul>

                                        <h4>Purpose of Collection</h4>
                                        <ul>
                                            <li>Account creation and authentication</li>
                                            <li>Processing and managing IP submissions</li>
                                            <li>Communication regarding your submissions</li>
                                            <li>System administration and security</li>
                                            <li>Compliance with legal requirements</li>
                                        </ul>

                                        <h4>Your Rights under RA 10173</h4>
                                        <ul>
                                            <li>Right to be informed about data collection</li>
                                            <li>Right to access and correct your personal data</li>
                                            <li>Right to object to data processing</li>
                                            <li>Right to data portability</li>
                                            <li>Right to file a complaint with the NPC</li>
                                        </ul>

                                        <div className="privacy-notice">
                                            <strong>Important:</strong> Your data will be stored securely and shared only
                                            with authorized IPMO personnel for the purposes stated above.
                                        </div>

                                        <div className="privacy-contact">
                                            <p>
                                                For data privacy inquiries, contact our Data Protection Officer at{' '}
                                                <strong>dpo@cnsc.edu.ph</strong>
                                            </p>
                                        </div>

                                    </div>
                                </div>

                                <div className="privacy-modal-footer">
                                    <button className="privacy-decline-btn" onClick={handlePrivacyDecline}>
                                        <FaArrowLeft /> Decline &amp; Exit
                                    </button>
                                    <button className="privacy-accept-btn" onClick={handlePrivacyAccept}>
                                        <FaCheckCircle /> I Accept &amp; Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit}>

                        {/* ── Step 1 — Role Selection ── */}
                        {step === 1 && (
                            <>
                                <div className="sp-step-header">
                                    <h2>Select Your Role</h2>
                                    <p>Choose the role that best describes you</p>
                                    <div className="sp-divider" />  
                                </div>

                                <div className="user-type-cards">
                                    <div
                                        className={`user-type-card ${userType === 'inventor' ? 'selected' : ''}`}
                                        onClick={() => setUserType('inventor')}
                                    >
                                        <div className="card-icon inventor"><FaUser /></div>
                                        <h3>Applicant</h3>
                                        <p>Submit and manage your intellectual property applications</p>
                                        <span className="card-badge">Most Popular</span>
                                    </div>

                                    <div
                                        className={`user-type-card ${userType === 'consultant' ? 'selected' : ''}`}
                                        onClick={() => setUserType('consultant')}
                                    >
                                        <div className="card-icon consultant"><FaCertificate /></div>
                                        <h3>Consultant</h3>
                                        <p>Review and provide guidance on IP submissions</p>
                                        <span className="card-badge">Expert</span>
                                    </div>

                                    <div
                                        className={`user-type-card ${userType === 'admin' ? 'selected' : ''}`}
                                        onClick={() => setUserType('admin')}
                                    >
                                        <div className="card-icon admin"><FaTools /></div>
                                        <h3>Admin</h3>
                                        <p>Manage the system and oversee all operations</p>
                                        <span className="card-badge">System</span>
                                    </div>
                                </div>

                                <div className="step-actions">
                                    <button type="button" className="next-button" onClick={nextStep} disabled={!userType}>
                                        Continue <FaArrowRight />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── Step 2 — Account Details ── */}
                        {step === 2 && (
                            <>
                                <div className="sp-step-header">
                                    <h2>Account Details</h2>
                                    <p>Create your secure login credentials</p>
                                    <div className="sp-divider" />
                                </div>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label><FaEnvelope /> Email Address</label>
                                        <input
                                            type="email" name="email"
                                            value={formData.email} onChange={handleChange}
                                            placeholder="Enter your email" required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaLock /> Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password} onChange={handleChange}
                                                placeholder="Create password" required
                                            />
                                            <button type="button" className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        <small className="password-requirement">
                                            Min. 8 characters with uppercase, number &amp; special character (!@#$%^&amp;* etc.)
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label><FaLock /> Confirm Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword} onChange={handleChange}
                                                placeholder="Confirm password" required
                                            />
                                            <button type="button" className="password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="step-actions">
                                    <button type="button" className="back-button" onClick={prevStep}>
                                        <FaArrowLeft /> Back
                                    </button>
                                    <button type="button" className="next-button" onClick={nextStep}>
                                        Continue <FaArrowRight />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── Step 3 — Personal Information ── */}
                        {step === 3 && (
                            <>
                                <div className="sp-step-header">
                                    <h2>Personal Information</h2>
                                    <p>Complete your profile details</p>
                                    <div className="sp-divider" />
                                </div>

                                {/* Profile picture */}
                                <div className="profile-picture-group">
                                    <div className="profile-upload">
                                        <div className="profile-preview">
                                            {profilePreview
                                                ? <img src={profilePreview} alt="Profile Preview" />
                                                : <FaUserCircle />}
                                        </div>
                                        <div className="profile-upload-info">
                                            <label htmlFor="profilePicture" className="upload-button">
                                                <FaImage /> Upload Photo
                                            </label>
                                            <input
                                                type="file" id="profilePicture" accept="image/*"
                                                onChange={handleFileChange} style={{ display: 'none' }}
                                            />
                                            <small>JPG, PNG or GIF · Max 2 MB</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label><FaUser /> Full Name</label>
                                        <input
                                            type="text" name="fullName"
                                            value={formData.fullName} onChange={handleChange}
                                            placeholder="Enter your full name" required
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label><FaPhone /> Contact Number</label>
                                        <input
                                            type="tel" name="contact"
                                            value={formData.contact} onChange={handleChange}
                                            placeholder="e.g. 09123456789"
                                            pattern="[0-9]{10,11}"
                                            title="Please enter a valid 10 or 11-digit phone number" required
                                        />
                                        <small>Format: 09123456789</small>
                                    </div>

                                    <div className="form-group full-width">
                                        <label><FaMapMarkerAlt /> Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address} onChange={handleChange}
                                            placeholder="Enter your complete address" required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaUser /> Age</label>
                                        <input
                                            type="number" name="age"
                                            value={formData.age} onChange={handleChange}
                                            placeholder="Your age" min="18" max="100" required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaBirthdayCake /> Birthdate</label>
                                        <input
                                            type="date" name="birthdate"
                                            value={formData.birthdate} onChange={handleChange} required
                                        />
                                    </div>

                                    {userType === 'inventor' && (
                                        <div className="form-group full-width">
                                            <label><FaBuilding /> Delivery Unit</label>
                                            <select
                                                name="deliveryUnit"
                                                value={formData.deliveryUnit} onChange={handleChange} required
                                            >
                                                <option value="">Select Delivery Unit</option>
                                                {DELIVERY_UNITS.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="step-actions">
                                    <button type="button" className="back-button" onClick={prevStep}>
                                        <FaArrowLeft /> Back
                                    </button>
                                    <button type="submit" className="submit-button" disabled={isLoading}>
                                        {isLoading
                                            ? <><div className="spinner" /> Creating Account…</>
                                            : <><FaCheckCircle /> Create Account</>
                                        }
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    <div className="signup-footer-link">
                        <p>Already have an account?</p>
                        <Link to="/login" className="login-link">Sign In</Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SignUp;