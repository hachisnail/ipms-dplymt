import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
    FaUser, FaMapMarkerAlt, FaBirthdayCake, FaImage,
    FaBuilding, FaCertificate, FaRocket, FaCheckCircle,
    FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import './SignUp.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api';

const DELIVERY_UNITS = [
    'CCMS', 'COTT', 'CANR', 'CAS', 'COED',
    'COENG', 'CBPA', 'GAD', 'CFAST', 'ETEINZA'
];

const IP_CATEGORIES = [
    { value: 'INDUSTRIAL_DESIGN', label: 'Industrial Design' },
    { value: 'UTILITY_MODEL', label: 'Utility Model' },
    { value: 'TRADEMARK', label: 'Trademark' },
    { value: 'COPYRIGHT', label: 'Copyright' }
];

const SignUp = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        address: '',
        age: '',
        birthdate: '',
        profilePicture: null,
        deliveryUnit: '',
        ipCategory: '',
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
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            setFormData(prev => ({
                ...prev,
                profilePicture: file
            }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateStep = () => {
        if (step === 1) {
            if (!userType) {
                toast.error('Please select an account type');
                return false;
            }
            return true;
        }

        if (step === 2) {
            const { email, password, confirmPassword, fullName } = formData;

            if (!email || !password || !confirmPassword || !fullName) {
                toast.error('Please fill in all required fields');
                return false;
            }

            if (password !== confirmPassword) {
                toast.error('Passwords do not match');
                return false;
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                toast.error('Please enter a valid email address');
                return false;
            }

            return true;
        }

        if (step === 3) {
            const { address, age, birthdate } = formData;

            if (!address || !age || !birthdate) {
                toast.error('Please fill in all required fields');
                return false;
            }

            if (age < 18 || age > 100) {
                toast.error('Age must be between 18 and 100');
                return false;
            }

            if (userType === 'INVENTOR' && !formData.deliveryUnit) {
                toast.error('Please select a delivery unit');
                return false;
            }

            if (userType === 'CONSULTANT' && !formData.ipCategory) {
                toast.error('Please select an IP category');
                return false;
            }

            return true;
        }

        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep()) {
            return;
        }

        setIsLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('email', formData.email);
            submitData.append('password', formData.password);
            submitData.append('userType', userType);
            submitData.append('fullName', formData.fullName);
            submitData.append('address', formData.address);
            submitData.append('age', formData.age);
            submitData.append('birthdate', formData.birthdate);

            if (formData.profilePicture) {
                submitData.append('profilePicture', formData.profilePicture);
            }

            if (userType === 'INVENTOR') {
                submitData.append('deliveryUnit', formData.deliveryUnit);
            } else if (userType === 'CONSULTANT') {
                submitData.append('ipCategory', formData.ipCategory);
            } else if (userType === 'ADMIN') {
                submitData.append('adminLevel', formData.adminLevel);
            }

            const response = await axios.post(`${API_URL}/auth/register`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Registration successful! Please check your email to verify your account. 📧');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-background">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            <div className="signup-content">
                <div className="signup-card">
                    <div className="signup-header">
                        <div className="logo-container">
                            <FaRocket className="logo-icon" />
                        </div>
                        <h1>Create Your Account</h1>
                        <p>Join the IP Management System</p>
                    </div>

                    <div className="progress-steps">
                        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="step-number">{step > 1 ? <FaCheckCircle /> : '1'}</div>
                            <div className="step-label">Account Type</div>
                        </div>
                        <div className={`step-line ${step > 1 ? 'completed' : ''}`}></div>
                        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="step-number">{step > 2 ? <FaCheckCircle /> : '2'}</div>
                            <div className="step-label">Basic Info</div>
                        </div>
                        <div className={`step-line ${step > 2 ? 'completed' : ''}`}></div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Details</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="step-content">
                                <h2>Select Your Account Type</h2>
                                <p className="step-description">Choose the role that best describes you</p>

                                <div className="user-type-cards">
                                    <div className={`user-type-card ${userType === 'INVENTOR' ? 'selected' : ''}`} onClick={() => setUserType('INVENTOR')}>
                                        <div className="card-icon inventor">🎨</div>
                                        <h3>Inventor</h3>
                                        <p>Submit and track your innovative designs</p>
                                        <div className="card-badge">For Innovators</div>
                                    </div>

                                    <div className={`user-type-card ${userType === 'CONSULTANT' ? 'selected' : ''}`} onClick={() => setUserType('CONSULTANT')}>
                                        <div className="card-icon consultant">👔</div>
                                        <h3>Consultant</h3>
                                        <p>Review and evaluate IP submissions</p>
                                        <div className="card-badge">For Specialists</div>
                                    </div>

                                    <div className={`user-type-card ${userType === 'ADMIN' ? 'selected' : ''}`} onClick={() => setUserType('ADMIN')}>
                                        <div className="card-icon admin">🔐</div>
                                        <h3>Administrator</h3>
                                        <p>Manage and oversee the system</p>
                                        <div className="card-badge">For Admins</div>
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
                                <h2>Basic Information</h2>
                                <p className="step-description">Enter your account credentials</p>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label htmlFor="fullName"><FaUser /> Full Name *</label>
                                        <input type="text" id="fullName" name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required disabled={isLoading} />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="email"><FaEnvelope /> Email Address *</label>
                                        <input type="email" id="email" name="email" placeholder="your.email@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="password"><FaLock /> Password *</label>
                                        <div className="password-input-wrapper">
                                            <input type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="Enter password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
                                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        <small>8+ chars, uppercase, lowercase, number, special char</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword"><FaLock /> Confirm Password *</label>
                                        <div className="password-input-wrapper">
                                            <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
                                            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
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
                                <h2>Complete Your Profile</h2>
                                <p className="step-description">Additional details for your account</p>

                                <div className="form-grid">
                                    <div className="form-group full-width profile-picture-group">
                                        <label><FaImage /> Profile Picture (Optional)</label>
                                        <div className="profile-upload">
                                            <div className="profile-preview">
                                                {profilePreview ? (
                                                    <img src={profilePreview} alt="Profile preview" />
                                                ) : (
                                                    <FaUserCircle />
                                                )}
                                            </div>
                                            <div className="profile-upload-info">
                                                <input type="file" id="profilePicture" accept="image/*" onChange={handleFileChange} disabled={isLoading} style={{ display: 'none' }} />
                                                <label htmlFor="profilePicture" className="upload-button">
                                                    Choose Image
                                                </label>
                                                <small>Max 5MB • JPEG, PNG, GIF, WebP</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="age"><FaUserCircle /> Age *</label>
                                        <input type="number" id="age" name="age" placeholder="Your age" value={formData.age} onChange={handleChange} min="18" max="100" required disabled={isLoading} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="birthdate"><FaBirthdayCake /> Birthdate *</label>
                                        <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange} required disabled={isLoading} />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="address"><FaMapMarkerAlt /> Address *</label>
                                        <textarea id="address" name="address" placeholder="Enter your full address" value={formData.address} onChange={handleChange} rows="3" required disabled={isLoading} />
                                    </div>

                                    {userType === 'INVENTOR' && (
                                        <div className="form-group full-width">
                                            <label htmlFor="deliveryUnit"><FaBuilding /> Delivery Unit *</label>
                                            <select id="deliveryUnit" name="deliveryUnit" value={formData.deliveryUnit} onChange={handleChange} required disabled={isLoading}>
                                                <option value="">Select delivery unit</option>
                                                {DELIVERY_UNITS.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {userType === 'CONSULTANT' && (
                                        <div className="form-group full-width">
                                            <label htmlFor="ipCategory"><FaCertificate /> IP Category *</label>
                                            <select id="ipCategory" name="ipCategory" value={formData.ipCategory} onChange={handleChange} required disabled={isLoading}>
                                                <option value="">Select IP category</option>
                                                {IP_CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="step-actions">
                                    <button type="button" className="back-button" onClick={prevStep} disabled={isLoading}><FaArrowLeft /> Back</button>
                                    <button type="submit" className="submit-button" disabled={isLoading}>
                                        {isLoading ? (<><span className="spinner"></span>Creating Account...</>) : (<>Create Account <FaCheckCircle /></>)}
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