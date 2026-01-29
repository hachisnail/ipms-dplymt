import React, { useState, useRef, useEffect } from "react";
import { User, Mail, Briefcase, Calendar, MapPin, Edit, Save, Upload, Trash2 } from 'lucide-react';
import './Profile.css';

// --- IP Office Specific Constants ---
const DEPARTMENTS = [
    "IT Services", "Patent Examination", "Trademark Registry", "Legal Services", "Finance and Admin"
];
const ROLES = [
    "IT Specialist", "Network Administrator", "Database Manager", "Help Desk Support", "Project Manager"
];

const INITIAL_PROFILE_DATA = {
    name: "Alex Johnson",
    contact: "alex.johnson@ipo.gov",
    employeeId: "IPO-IT-7890",
    specialization: "Cybersecurity & Infrastructure",
    department: "IT Services",
    role: "IT Specialist",
    birthdate: "1988-10-25",
    address: "101 IP Tower, Tech City, 12345",
    about: "Responsible for managing and securing the core network infrastructure, ensuring 99.9% uptime for all patent and trademark processing systems.",
    profileImage: "https://placehold.co/140x140/3b82f6/ffffff?text=AJ",
};

// Reusable Form Group Component (CSS styled)
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
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(INITIAL_PROFILE_DATA.profileImage);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Effect for cleaning up Blob URL
    useEffect(() => {
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
        const maxSize = 2 * 1024 * 1024; // 2MB
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
            // Reset file input value if validation fails
            e.target.value = '';
            return;
        }
        
        // Revoke existing blob URL if it exists
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(f);
        
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
        setPreviewUrl(INITIAL_PROFILE_DATA.profileImage);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        setError('');
        setUploading(true);
        try {
            // Simulate API latency for saving data
            await new Promise(r => setTimeout(r, 700));

            let finalImageUrl = profileData.profileImage;

            if (imageFile) {
                // In a real app, this is where you'd upload the image and get a final URL.
                // For this demo, we'll just update the stored profile image to the preview URL.
                finalImageUrl = previewUrl;
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }

            const dataToSave = { ...profileData, profileImage: finalImageUrl };
            setProfileData(dataToSave);

            console.log('Profile data saved:', dataToSave);
            alert('Profile updated (Demo: Data logged to console)'); 

        } catch (err) {
            console.error(err);
            setError('Failed to save profile. Please check the console for details.');
        } finally {
            setUploading(false);
        }
    };
    
    // Check if any mandatory field is empty to disable save button
    const isSaveDisabled = !Object.values(profileData).every(val => val.toString().trim() !== "") || uploading;

    const isPhotoResetDisabled = previewUrl === INITIAL_PROFILE_DATA.profileImage && !imageFile;

    return (
        <div className="profile-container">
            <div 
                className="profile-card" 
                role="region" 
                aria-label="IP Office profile management form"
            >
                <header className="card-header">
                    <h2 className="card-title">IP Office Profile Management</h2>
                </header>

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
                        
                        <h3 className="profile-name">{profileData.name}</h3>
                        <p className="profile-role">{profileData.role}</p>

                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
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
                                disabled={isPhotoResetDisabled || uploading}
                                className="action-button reset-button"
                            >
                                <Trash2 className="button-icon" /> Reset Photo
                            </button>
                        </div>
                        {error && (
                            <p className="error-message">{error}</p>
                        )}
                    </aside>

                    {/* Right Column: Form Fields */}
                    <section className="profile-form-section">
                        <form>
                            <div className="form-grid">
                                
                                {/* Personal Info */}
                                <FormGroup icon={User} label="Full Name" name="name" value={profileData.name} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={Mail} label="Email/Contact" name="contact" type="email" value={profileData.contact} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup label="Employee ID" name="employeeId" value={profileData.employeeId} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={Calendar} label="Birthdate" name="birthdate" type="date" value={profileData.birthdate} handleChange={handleProfileChange} disabled={uploading} />

                                {/* Employment Details */}
                                <FormGroup icon={Briefcase} label="Department" name="department" type="select" options={DEPARTMENTS} value={profileData.department} handleChange={handleProfileChange} disabled={uploading} />
                                <FormGroup icon={Edit} label="Role" name="role" type="select" options={ROLES} value={profileData.role} handleChange={handleProfileChange} disabled={uploading} />
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
                        onClick={() => setProfileData(INITIAL_PROFILE_DATA)}
                        className="action-button reset-form-button"
                        disabled={uploading}
                    >
                        Reset Form
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        className={`action-button save-button ${isSaveDisabled ? 'disabled' : ''}`}
                    >
                        {uploading ? 'Saving...' : <><Save className="button-icon" /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}