import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
    FaUser, FaMapMarkerAlt, FaBirthdayCake, FaImage,
    FaBuilding, FaCertificate, FaRocket, FaCheckCircle,
    FaArrowLeft, FaArrowRight, FaShieldAlt, FaFileContract,
    FaPhone
} from 'react-icons/fa';

// Updated Style Import
import '../styles/SignUp.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const DELIVERY_UNITS = [
    'CCMS', 'COTT', 'CANR', 'CAS', 'COED',
    'COENG', 'CBPA', 'GAD', 'CFAST', 'ETEINZA'
];

const SignUp = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    
    // Data Privacy Consent State
    const [showPrivacyModal, setShowPrivacyModal] = useState(true);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        contact: '', 
        address: '',
        age: '',
        birthdate: '',
        profilePicture: null,
        deliveryUnit: '',
        adminLevel: 'ADMIN'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    const handleUserTypeSelect = (type) => {
        setUserType(type);
    };

    const nextStep = () => {
        if (step === 1 && !userType) {
            toast.error('Please select your role');
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!privacyAccepted) {
            toast.error('Please accept the Data Privacy Act to continue');
            setShowPrivacyModal(true);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('fullName', formData.fullName);
            data.append('contact', formData.contact);
            data.append('address', formData.address);
            data.append('age', formData.age);
            data.append('birthdate', formData.birthdate);
            data.append('userType', userType.toUpperCase());
            
            if (formData.profilePicture) {
                data.append('profilePicture', formData.profilePicture);
            }

            if (userType === 'inventor' && formData.deliveryUnit) {
                data.append('deliveryUnit', formData.deliveryUnit);
            }

            if (userType === 'admin') {
                data.append('adminLevel', formData.adminLevel);
            }

            const response = await axios.post(`${API_URL}/auth/register`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Registration successful! Awaiting admin approval.');
            navigate('/login');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Registration failed';
            toast.error(errorMsg);
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
        <div className="signup-container">
            {/* Background Animation */}
            <div className="signup-background">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            {/* DATA PRIVACY ACT MODAL */}
            {showPrivacyModal && (
                <div className="privacy-modal-overlay">
                    <div className="privacy-modal">
                        <div className="privacy-modal-header">
                            <div className="privacy-icon">
                                <FaShieldAlt />
                            </div>
                            <h2>Data Privacy Act of 2012</h2>
                            <p>Republic Act No. 10173</p>
                        </div>

                        <div className="privacy-modal-body">
                            <div className="privacy-section">
                                <FaFileContract className="section-icon" />
                                <h3>Privacy Notice</h3>
                                <p>
                                    By creating an account in the Intellectual Property Management System (IPMS), 
                                    you agree to the collection, use, and processing of your personal information 
                                    in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).
                                </p>
                            </div>

                            <div className="privacy-content">
                                <h4>We collect and process the following information:</h4>
                                <ul>
                                    <li>✓ Personal identification (Full Name, Email Address)</li>
                                    <li>✓ Contact information (Address, Phone Number)</li>
                                    <li>✓ Demographic data (Age, Birthdate)</li>
                                    <li>✓ Professional information (Delivery Unit, Position)</li>
                                    <li>✓ Profile picture (if provided)</li>
                                    <li>✓ Intellectual property submissions and related documents</li>
                                </ul>
                                {/* Additional privacy details omitted for brevity, keep your original modal content here */}
                            </div>
                        </div>

                        <div className="privacy-modal-footer">
                            <button className="privacy-decline-btn" onClick={handlePrivacyDecline}>
                                <FaArrowLeft /> Decline & Exit
                            </button>
                            <button className="privacy-accept-btn" onClick={handlePrivacyAccept}>
                                <FaCheckCircle /> I Accept & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Signup Content */}
            <div className="signup-content">
                <div className="signup-card">
                    <div className="signup-header">
                        <div className="logo-container">
                            <FaRocket className="logo-icon" />
                        </div>
                        <h1>Create Your Account</h1>
                        <p>Join the Intellectual Property Management System</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="step-content">
                                <h2>Select Your Role</h2>
                                <p className="step-description">Choose the role that best describes you</p>
                                <div className="user-type-cards">
                                    <div className={`user-type-card ${userType === 'inventor' ? 'selected' : ''}`} onClick={() => handleUserTypeSelect('inventor')}>
                                        <div className="card-icon inventor"><FaUser /></div>
                                        <h3>Inventor</h3>
                                        <p>Submit and manage your intellectual property applications</p>
                                    </div>
                                    <div className={`user-type-card ${userType === 'consultant' ? 'selected' : ''}`} onClick={() => handleUserTypeSelect('consultant')}>
                                        <div className="card-icon consultant"><FaCertificate /></div>
                                        <h3>Consultant</h3>
                                        <p>Review and provide guidance on IP submissions</p>
                                    </div>
                                    <div className={`user-type-card ${userType === 'admin' ? 'selected' : ''}`} onClick={() => handleUserTypeSelect('admin')}>
                                        <div className="card-icon admin"><FaRocket /></div>
                                        <h3>Admin</h3>
                                        <p>Manage the system and oversee all operations</p>
                                    </div>
                                </div>
                                <div className="step-actions">
                                    <button type="button" className="next-button" onClick={nextStep} disabled={!userType}>
                                        Continue <FaArrowRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step-content">
                                <h2>Account Details</h2>
                                <p className="step-description">Create your secure login credentials</p>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label><FaEnvelope /> Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label><FaLock /> Password</label>
                                        <div className="password-input-wrapper">
                                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required />
                                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label><FaLock /> Confirm Password</label>
                                        <div className="password-input-wrapper">
                                            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                                            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="step-actions">
                                    <button type="button" className="back-button" onClick={prevStep}><FaArrowLeft /> Back</button>
                                    <button type="button" className="next-button" onClick={nextStep}>Continue <FaArrowRight /></button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step-content">
                                <h2>Personal Information</h2>
                                <p className="step-description">Complete your profile details</p>
                                
                                <div className="profile-picture-group">
                                    <div className="profile-upload">
                                        <div className="profile-preview">
                                            {profilePreview ? <img src={profilePreview} alt="Preview" /> : <FaUserCircle />}
                                        </div>
                                        <div className="profile-upload-info">
                                            <label htmlFor="profilePicture" className="upload-button"><FaImage /> Upload Photo</label>
                                            <input type="file" id="profilePicture" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label><FaUser /> Full Name</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label><FaPhone /> Contact Number</label>
                                        <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label><FaMapMarkerAlt /> Address</label>
                                        <textarea name="address" value={formData.address} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label><FaUser /> Age</label>
                                        <input type="number" name="age" value={formData.age} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label><FaBirthdayCake /> Birthdate</label>
                                        <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} required />
                                    </div>

                                    {userType === 'inventor' && (
                                        <div className="form-group full-width">
                                            <label><FaBuilding /> Delivery Unit</label>
                                            <select name="deliveryUnit" value={formData.deliveryUnit} onChange={handleChange} required>
                                                <option value="">Select Delivery Unit</option>
                                                {DELIVERY_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="step-actions">
                                    <button type="button" className="back-button" onClick={prevStep}><FaArrowLeft /> Back</button>
                                    <button type="submit" className="submit-button" disabled={isLoading}>
                                        {isLoading ? 'Creating Account...' : 'Create Account'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
                <div className="signup-footer-link">
                    <p>Already have an account?</p>
                    <Link to="/login" className="login-link">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;