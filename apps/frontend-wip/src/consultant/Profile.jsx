import React, { useState, useRef, useEffect } from "react";
import { User, Mail, Briefcase, Calendar, MapPin, Edit, Save, Upload, Trash2 } from 'lucide-react';
import './Profile.css';
import { getProfile, updateProfile, uploadProfilePicture, deleteProfilePicture, getProfilePictureUrl } from './api';

// --- Consultant Specific Constants ---
const DEPARTMENTS = [
    "Patent Examination", "Trademark Registry", "Legal Services", "Copyright Office", "IT Services"
];
const ROLES = [
    "IP Consultant", "Senior Examiner", "Legal Advisor", "Technical Specialist", "Project Lead"
];

const INITIAL_PROFILE_DATA = {
    name: "",
    contact: "",
    employeeId: "",
    specialization: "",
    department: "",
    role: "",
    birthdate: "",
    address: "",
    about: "",
    profileImage: "https://placehold.co/140x140/3b82f6/ffffff?text=User",
};

// Reusable Form Group Component
const FormGroup = ({ icon: Icon, label, name, type = 'text', options = [], value, handleChange, placeholder = '', disabled = false }) => (
    <div className="form-group">
        <label htmlFor={name} className="form-label">
            {Icon && <Icon className="form-icon" />}
            {label}
        </label>
        {type === 'select' ? (
            <select
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                className="input-field select-field"
                disabled={disabled}
            >
                <option value="" disabled>Select {label.toLowerCase()}</option>
                {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
        ) : type === 'textarea' ? (
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                rows="3"
                placeholder={placeholder}
                className="input-field textarea-field"
                disabled={disabled}
            />
        ) : (
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="input-field"
                disabled={disabled}
            />
        )}
    </div>
);

// Main Profile Component
export default function Profile() {
    const [profileData, setProfileData] = useState(INITIAL_PROFILE_DATA);
    const [originalData, setOriginalData] = useState(INITIAL_PROFILE_DATA);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(INITIAL_PROFILE_DATA.profileImage);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const fileInputRef = useRef(null);

    // Load profile data from backend on mount
    useEffect(() => {
        loadProfile();
    }, []);

    // Track changes
    useEffect(() => {
        const dataChanged = JSON.stringify(profileData) !== JSON.stringify(originalData);
        const imageChanged = imageFile !== null;
        setHasChanges(dataChanged || imageChanged);
    }, [profileData, originalData, imageFile]);

    // Cleanup Blob URL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError('');
            
            const result = await getProfile();
            
            if (result.success && result.data) {
                const user = result.data;
                const profilePictureUrl = getProfilePictureUrl(user.profile_picture);
                
                const loadedData = {
                    name: user.full_name || "",
                    contact: user.email || "",
                    employeeId: user.id || "",
                    specialization: user.ip_category || "",
                    department: user.department || DEPARTMENTS[0],
                    role: user.user_type || "",
                    birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : "",
                    address: user.address || "",
                    about: user.about || "",
                    profileImage: profilePictureUrl,
                };

                setProfileData(loadedData);
                setOriginalData(loadedData);
                setPreviewUrl(profilePictureUrl);
            } else {
                setError(result.error || 'Failed to load profile');
            }
        } catch (err) {
            console.error('Load profile error:', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const validateImage = (file) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (!allowed.includes(file.type)) return 'Only JPG, PNG, WEBP or GIF images are allowed.';
        if (file.size > maxSize) return 'Image must be 5MB or smaller.';
        return '';
    };

    const handleImageSelect = (e) => {
        setError('');
        setSuccess('');
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        
        const v = validateImage(f);
        if (v) {
            setError(v);
            e.target.value = '';
            return;
        }
        
        // Revoke existing blob URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        
        const url = URL.createObjectURL(f);
        setImageFile(f);
        setPreviewUrl(url);
    };

    const handleUploadClick = () => {
        setError('');
        setSuccess('');
        fileInputRef.current && fileInputRef.current.click();
    };

    const handleRemoveImage = async () => {
        setError('');
        setSuccess('');
        setUploading(true);

        try {
            // If there's a pending file, just remove it locally
            if (imageFile && previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
                setImageFile(null);
                setPreviewUrl(originalData.profileImage);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setSuccess('Image removed (not saved yet)');
            } else {
                // Remove from backend
                const result = await deleteProfilePicture();
                
                if (result.success) {
                    const defaultImage = 'https://placehold.co/140x140/3b82f6/ffffff?text=User';
                    setPreviewUrl(defaultImage);
                    setProfileData(prev => ({ ...prev, profileImage: defaultImage }));
                    setOriginalData(prev => ({ ...prev, profileImage: defaultImage }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    setImageFile(null);
                    setSuccess('Profile picture removed successfully!');
                } else {
                    setError(result.error || 'Failed to remove image');
                }
            }
        } catch (err) {
            console.error('Remove image error:', err);
            setError('Failed to remove profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setUploading(true);

        try {
            let finalImageUrl = profileData.profileImage;

            // Upload image first if there's a new one
            if (imageFile) {
                const uploadResult = await uploadProfilePicture(imageFile);
                
                if (uploadResult.success) {
                    finalImageUrl = uploadResult.url;
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    throw new Error(uploadResult.error || 'Image upload failed');
                }
            }

            // Update profile data
            const updateData = {
                full_name: profileData.name,
                email: profileData.contact,
                profile_picture: finalImageUrl,
                // Add other fields as needed by your backend
            };

            const result = await updateProfile(updateData);

            if (result.success) {
                const updatedData = {
                    ...profileData,
                    profileImage: finalImageUrl
                };
                setProfileData(updatedData);
                setOriginalData(updatedData);
                setPreviewUrl(finalImageUrl);
                setSuccess('Profile updated successfully!');
                setHasChanges(false);
                
                // Success will auto-hide after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error(result.error || 'Profile update failed');
            }

        } catch (err) {
            console.error('Save profile error:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setProfileData(originalData);
        setPreviewUrl(originalData.profileImage);
        if (imageFile && previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setError('');
        setSuccess('');
        setHasChanges(false);
    };

    const isSaveDisabled = !hasChanges || uploading || loading;
    const isPhotoResetDisabled = (previewUrl === originalData.profileImage && !imageFile) || uploading;

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div className="loading-spinner" style={{ 
                            border: '3px solid #ffe8e5',
                            borderTop: '3px solid #FF6B5A',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 15px'
                        }}></div>
                        <p>Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card" role="region" aria-label="Profile management form">

                {error && (
                    <div style={{ 
                        padding: '12px', 
                        background: '#fee2e2', 
                        border: '1px solid #fca5a5', 
                        borderRadius: '8px', 
                        color: '#dc2626',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ 
                        padding: '12px', 
                        background: '#d1fae5', 
                        border: '1px solid #6ee7b7', 
                        borderRadius: '8px', 
                        color: '#059669',
                        marginBottom: '20px'
                    }}>
                        {success}
                    </div>
                )}

                <div className="profile-content-wrapper">
                    {/* Left Column: Image and Metadata */}
                    <aside className="profile-sidebar">
                        <div className="profile-image-wrapper">
                            <img
                                src={previewUrl}
                                alt="Profile"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/140x140/9ca3af/ffffff?text=Error";
                                }}
                                className="profile-image"
                            />
                        </div>
                        
                        <h3 className="profile-name">{profileData.name || 'User Name'}</h3>
                        <p className="profile-role">{profileData.role || 'Role'}</p>

                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            onChange={handleImageSelect}
                            ref={fileInputRef}
                            className="file-input-hidden"
                        />
                        
                        <div className="image-action-buttons">
                            <button
                                onClick={handleUploadClick}
                                className="action-button upload-button"
                                disabled={uploading}
                            >
                                <Upload className="button-icon" /> Upload New Photo
                            </button>
                            <button
                                onClick={handleRemoveImage}
                                disabled={isPhotoResetDisabled}
                                className="action-button reset-button"
                            >
                                <Trash2 className="button-icon" /> Reset Photo
                            </button>
                        </div>
                    </aside>

                    {/* Right Column: Form Fields */}
                    <section className="profile-form-section">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid">
                                <FormGroup icon={User} label="Full Name" name="name" value={profileData.name} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={Mail} label="Email/Contact" name="contact" type="email" value={profileData.contact} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup label="Employee ID" name="employeeId" value={profileData.employeeId} handleChange={handleProfileChange} disabled={true} />
                                <FormGroup icon={Calendar} label="Birthdate" name="birthdate" type="date" value={profileData.birthdate} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={Briefcase} label="Department" name="department" type="select" options={DEPARTMENTS} value={profileData.department} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={Edit} label="Role" name="role" value={profileData.role} handleChange={handleProfileChange} disabled={true} />
                                <FormGroup label="Specialization" name="specialization" value={profileData.specialization} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={MapPin} label="Office Address" name="address" value={profileData.address} handleChange={handleProfileChange} disabled={uploading} />
                            </div>

                            <div className="form-summary-container">
                                <FormGroup
                                    label="About Me / Professional Summary"
                                    name="about"
                                    type="textarea"
                                    value={profileData.about}
                                    handleChange={handleProfileChange}
                                    placeholder="Write a brief summary of your main responsibilities and experience."
                                    disabled={uploading}
                                />
                            </div>
                        </form>
                    </section>
                </div>
                
                {/* Actions */}
                <div className="profile-actions">
                    <button
                        onClick={handleReset}
                        className="action-button reset-form-button"
                        disabled={!hasChanges || uploading}
                    >
                        Reset Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        className={`action-button save-button ${isSaveDisabled ? 'disabled' : ''}`}
                    >
                        {uploading ? (
                            <>
                                <Save className="button-icon" style={{ animation: 'spin 0.8s linear infinite' }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="button-icon" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}