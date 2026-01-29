import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Profile.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const DELIVERY_UNITS = [
    'CCMS', 'COTT', 'CANR', 'CAS', 'COED',
    'COENG', 'CBPA', 'GAD', 'CFAST', 'ETEINZA'
];

const INITIAL_PROFILE_DATA = {
    email: '',
    fullName: '',
    address: '',
    age: '',
    birthdate: '',
    profilePicture: '',
    deliveryUnit: '',
    position: '',
    password: '',
    confirmPassword: '',
};

const FormGroup = ({ label, name, type = 'text', options = [], value, handleChange, isRequired = false, ...rest }) => (
    <div className="form-group">
        <label htmlFor={name}>
            {label}{isRequired && <span className="small-muted"> *</span>}
        </label>
        {type === 'select' ? (
            <select id={name} name={name} value={value} onChange={handleChange} {...rest}>
                <option value="" disabled>Select {label.toLowerCase()}</option>
                {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
        ) : type === 'textarea' ? (
            <textarea id={name} name={name} value={value} onChange={handleChange} rows="3" {...rest} />
        ) : (
            <input id={name} name={name} type={type} value={value} onChange={handleChange} {...rest} />
        )}
    </div>
);

export default function Profile() {
    const [profileData, setProfileData] = React.useState(INITIAL_PROFILE_DATA);
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState('');
    const [uploading, setUploading] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const fileInputRef = React.useRef(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    // Fetch profile on mount
    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    console.error('No token found');
                    setError('Not authenticated. Please login again.');
                    setLoading(false);
                    return;
                }

                console.log('Fetching profile from:', `${API_URL}/auth/profile`);
                
                const res = await axios.get(`${API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Profile response:', res.data);
                
                const user = res.data.data;
                setProfileData({
                    email: user.email || '',
                    fullName: user.full_name || '',
                    address: user.address || '',
                    age: user.age || '',
                    birthdate: user.birthdate ? user.birthdate.substring(0, 10) : '',
                    profilePicture: user.profile_picture || '',
                    deliveryUnit: user.delivery_unit || '',
                    position: user.position || '',
                    password: '',
                    confirmPassword: '',
                });
                
                const profilePicUrl = user.profile_picture 
                    ? `${API_URL.replace('/api','')}/uploads/profile-pictures/${user.profile_picture}` 
                    : 'https://placehold.co/140x140/800000/ffffff?text=User';
                    
                setPreviewUrl(profilePicUrl);
                setError('');
            } catch (err) {
                console.error('Profile fetch error:', err);
                const errorMsg = err.response?.data?.message || 'Failed to load profile.';
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    React.useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const validateImage = (file) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 2 * 1024 * 1024;
        if (!allowed.includes(file.type)) return 'Only JPG, PNG or WEBP images are allowed.';
        if (file.size > maxSize) return 'Image must be 2MB or smaller.';
        return '';
    };

    const handleImageSelect = (e) => {
        setError('');
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const v = validateImage(f);
        if (v) {
            setError(v);
            e.target.value = '';
            return;
        }
        const url = URL.createObjectURL(f);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setImageFile(f);
        setPreviewUrl(url);
    };

    const handleUploadClick = () => {
        setError('');
        fileInputRef.current && fileInputRef.current.click();
    };

    const handleRemoveImage = () => {
        setError('');
        if (imageFile && previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setImageFile(null);
        setPreviewUrl('https://placehold.co/140x140/800000/ffffff?text=User');
        setProfileData(prev => ({ ...prev, profilePicture: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Not authenticated');
            }

            const formDataToSend = new FormData();
            formDataToSend.append('email', profileData.email);
            formDataToSend.append('fullName', profileData.fullName);
            formDataToSend.append('address', profileData.address);
            formDataToSend.append('age', profileData.age);
            formDataToSend.append('birthdate', profileData.birthdate);
            formDataToSend.append('deliveryUnit', profileData.deliveryUnit);
            formDataToSend.append('position', profileData.position);
            if (imageFile) formDataToSend.append('profilePicture', imageFile);
            if (profileData.password) {
                if (profileData.password !== profileData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                formDataToSend.append('password', profileData.password);
                formDataToSend.append('confirmPassword', profileData.confirmPassword);
            }

            const res = await axios.put(`${API_URL}/auth/profile`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            setSuccess('Profile updated successfully!');
            toast.success('Profile updated!');
            setImageFile(null);
            setProfileData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            // Update localStorage user
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ 
                ...currentUser,
                fullName: profileData.fullName,
                email: profileData.email,
                profilePicture: res.data.profilePicture || profileData.profilePicture 
            }));
        } catch (err) {
            console.error('Profile update error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="profile-page-wrapper">
                <div className="profile-main-container">
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        minHeight: '400px' 
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid #800000',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px'
                            }}></div>
                            <p>Loading profile...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            <div className="profile-main-container" role="region" aria-label="User profile">
                <div className="profile-content">
                    <div className="profile-columns">
                        <aside className="profile-left">
                            <div className="profile-image-wrapper" title="Profile photo">
                                <img
                                    src={previewUrl || 'https://placehold.co/140x140/800000/ffffff?text=User'}
                                    alt="Profile"
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src = 'https://placehold.co/140x140/800000/ffffff?text=User'; 
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleImageSelect}
                                />
                                <button type="button" className="save-button" onClick={handleUploadClick} disabled={uploading}>
                                    {imageFile ? 'Change' : 'Upload'}
                                </button>
                                <button type="button" className="save-button" onClick={handleRemoveImage} disabled={uploading}>
                                    Remove
                                </button>
                            </div>
                            <div className="small-muted" style={{ marginTop: 8, textAlign: 'center' }}>
                                Member since 2024
                            </div>
                        </aside>
                        <section className="profile-right">
                            <form onSubmit={handleSave} encType="multipart/form-data">
                                <div className="form-grid">
                                    <FormGroup label="Email" name="email" value={profileData.email} handleChange={handleProfileChange} isRequired type="email" />
                                    <FormGroup label="Full Name" name="fullName" value={profileData.fullName} handleChange={handleProfileChange} isRequired />
                                    <FormGroup label="Birthdate" name="birthdate" type="date" value={profileData.birthdate} handleChange={handleProfileChange} />
                                    <FormGroup label="Age" name="age" value={profileData.age} handleChange={handleProfileChange} type="number" />
                                </div>
                                <div style={{ height: 14 }} />
                                <div className="form-grid" style={{ alignItems: 'start' }}>
                                    <FormGroup label="Delivery Unit" name="deliveryUnit" type="select" options={DELIVERY_UNITS} value={profileData.deliveryUnit} handleChange={handleProfileChange} isRequired />
                                    <FormGroup label="Position" name="position" value={profileData.position} handleChange={handleProfileChange} />
                                </div>
                                <div style={{ height: 8 }} />
                                <div>
                                    <FormGroup label="Address" name="address" type="textarea" value={profileData.address} handleChange={handleProfileChange} />
                                </div>
                                <div style={{ height: 14 }} />
                                <div className="form-grid">
                                    <FormGroup
                                        label="New Password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={profileData.password}
                                        handleChange={handleProfileChange}
                                        autoComplete="new-password"
                                        placeholder="Leave blank to keep current"
                                    />
                                    <FormGroup
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={profileData.confirmPassword}
                                        handleChange={handleProfileChange}
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <label style={{ fontSize: 12 }}>
                                        <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(v => !v)} /> Show Password
                                    </label>
                                    <label style={{ fontSize: 12 }}>
                                        <input type="checkbox" checked={showConfirmPassword} onChange={() => setShowConfirmPassword(v => !v)} /> Show Confirm
                                    </label>
                                </div>
                                {error && <div className="message error">{error}</div>}
                                {success && <div className="message success">{success}</div>}
                                <div className="profile-actions" style={{ marginTop: 12 }}>
                                    <button 
                                        type="button" 
                                        className="save-button" 
                                        onClick={() => { 
                                            setProfileData({ ...INITIAL_PROFILE_DATA }); 
                                            handleRemoveImage(); 
                                        }} 
                                        disabled={uploading}
                                    >
                                        Reset
                                    </button>
                                    <button type="submit" className="save-button primary" disabled={uploading}>
                                        {uploading ? 'Saving...' : 'Update Profile'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}