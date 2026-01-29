/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import './Portal.css';

// ✅ WRAPPED IN BOOTSTRAP GRID FOR CENTERING
export function IndustrialPortalSection() {
    return (
        <section className="Portal section">
            <div className="row justify-content-center">
                <div className='col-lg-8'>
                    <IndustrialPortal/>
                </div>
            </div>
        </section>
    );
}

const INITIAL_FORM_DATA = {
    title: "",
    type: "", 
    description: "",
    file: null, 
    image: null, 
    date: "", 
};

const getValidationRules = (submissionType) => {
    if (submissionType === 'Basic Submission') {
        return {
            title: "Design title is required.",
            description: "Description of the design is required.",
            file: "Please upload the official application form (PDF/DOCX).",
        };
    }
    return {
        title: "Design title is required.",
        type: "Design category is required.",
        description: "Description of the design is required.",
        file: "Please upload the official application form (PDF/DOCX).",
        image: "Please upload design representation (image or file).",
        date: "Please select a filing date.",
    };
};

export default function IndustrialPortal() {
    const [step, setStep] = useState(0); 
    const [submissionType, setSubmissionType] = useState(null); 
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState({});
    const [showPopup, setShowPopup] = useState(false);

    // Refs for custom file upload buttons
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value, files, type } = e.target;
        const newValue = (type === 'file' && files && files.length > 0) ? files[0] : value;

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };
    
    const handleTypeSelect = (type) => {
        setSubmissionType(type);
        setStep(1);
    };

    const handleCancel = () => {
        window.location.hash = "Dashboard";
    };

    const validateFields = (fieldsToValidate) => {
        const rules = getValidationRules(submissionType);
        const newErrors = {};
        let isValid = true;

        for (const field of fieldsToValidate) {
            const value = formData[field];
            if (!value || (typeof value === 'string' && !value.trim())) {
                if (rules[field]) {
                    newErrors[field] = rules[field];
                    isValid = false;
                }
            }
        }
        setErrors(newErrors);
        return isValid;
    };
    
    const handleNext = () => {
        if (submissionType === 'Complete Application') {
            const fieldsToValidate = ['title', 'type', 'description'];
            if (validateFields(fieldsToValidate)) setStep(2);
        }
    };

    const handlePrevious = () => setStep(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let fieldsToValidate = [];
        
        if (submissionType === 'Basic Submission') {
            fieldsToValidate = ['title', 'description', 'file'];
        } else if (submissionType === 'Complete Application' && step === 2) {
            fieldsToValidate = ['file', 'image', 'date'];
        }
        
        if (!validateFields(fieldsToValidate)) return;
        const URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

        const API_URL = `${URL}/id/submit`;
        const submissionData = new FormData();
        submissionData.append('title', formData.title);
        submissionData.append('description', formData.description);
        submissionData.append('submissionType', submissionType);
        submissionData.append('file', formData.file); 
        
        if (submissionType === 'Complete Application') {
            submissionData.append('type', formData.type);
            submissionData.append('date', formData.date);
            submissionData.append('image', formData.image);
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: submissionData,
            });
            if (response.ok) {
                setShowPopup(true);
            } else {
                const result = await response.json();
                alert(`Submission failed: ${result.error}`);
            }
        } catch (error) {
            alert('A network error occurred.');
        }
    };

    const handlePopupClose = () => {
        setShowPopup(false);
        setStep(0);
        setSubmissionType(null);
        setFormData(INITIAL_FORM_DATA);
        setErrors({});
    };

    const handleDateSelect = (e) => {
        handleChange(e);
        e.target.blur(); 
    };
    
    const initialPopUp = (
        <div className="popup-overlay">
            <div className="popup-box">
                <h3>Select Submission Type</h3>
                <p style={{fontSize: '0.9rem', color: '#666'}}>
                    Choose how you will submit your Industrial Design application.
                </p>
                <div className="radio-group">
                    <label className="radio-label">
                        <input 
                            type="radio" 
                            name="submission" 
                            checked={submissionType === 'Basic Submission'}
                            onChange={() => setSubmissionType('Basic Submission')}
                        />
                        <span className="radio-text">Basic Submission (Form Only)</span>
                    </label>
                    <label className="radio-label">
                        <input 
                            type="radio" 
                            name="submission" 
                            checked={submissionType === 'Complete Application'}
                            onChange={() => setSubmissionType('Complete Application')}
                        />
                        <span className="radio-text">Complete Application (Full Filing)</span>
                    </label>
                </div>
                <div className="button-row">
                    <button className="cancel-btn" onClick={handleCancel} type="button">Cancel</button>
                    {submissionType && (
                        <button className="ok-btn" onClick={() => handleTypeSelect(submissionType)} type="button">
                            Proceed to Form
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const basicSubmissionContent = (
        <>
            <h3>Basic Industrial Design Submission</h3>
            <label>Design Title:</label>
            <input type="text" name="title" placeholder="Enter design name" value={formData.title} onChange={handleChange} />
            {errors.title && <p className="error">{errors.title}</p>}

            <label>Description:</label>
            <textarea name="description" placeholder="Describe aesthetic features..." value={formData.description} onChange={handleChange}></textarea>
            {errors.description && <p className="error">{errors.description}</p>}
            
            <label>Official Application Form (PDF/DOCX):</label>
            <input type="file" name="file" ref={fileInputRef} hidden accept=".pdf,.docx" onChange={handleChange} />
            <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()}>📎 Choose File</button>
            {formData.file && <p className="file-name">{formData.file.name}</p>}
            {errors.file && <p className="error">{errors.file}</p>}

            <div className="button-right">
                <button type="submit" className="submit-btn">Submit Form</button>
            </div>
        </>
    );

    const completeApplicationStep1Content = (
        <>
            <h3>Industrial Design Details</h3>
            <label>Design Title:</label>
            <input type="text" name="title" placeholder="Enter design name" value={formData.title} onChange={handleChange} />
            {errors.title && <p className="error">{errors.title}</p>}

            <label>Design Category:</label>
            <select name="type" value={formData.type} onChange={handleChange}>
                <option value="" disabled>Select category</option>
                <option value="Furniture">Furniture</option>
                <option value="Textiles & Clothing">Textiles & Clothing</option>
                <option value="Electronic Device Casing">Electronic Device Casing</option>
                <option value="Vehicles & Parts">Vehicles & Parts</option>
                <option value="Containers & Packaging">Containers & Packaging</option>
            </select>
            {errors.type && <p className="error">{errors.type}</p>}

            <label>Description:</label>
            <textarea name="description" placeholder="Describe aesthetic features..." value={formData.description} onChange={handleChange}></textarea>
            {errors.description && <p className="error">{errors.description}</p>}

            <div className="button-right">
                <button type="button" className="next-btn" onClick={handleNext}>Next →</button>
            </div>
        </>
    );

    const completeApplicationStep2Content = (
        <>
            <h3>Industrial Design Files</h3>
            <label>Official Application Form:</label>
            <input type="file" name="file" ref={fileInputRef} hidden accept=".pdf,.docx" onChange={handleChange} />
            <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()}>📎 Upload Form</button>
            {formData.file && <p className="file-name">{formData.file.name}</p>}
            {errors.file && <p className="error">{errors.file}</p>}

            <label>Design Representation (Image/File):</label>
            <input type="file" name="image" ref={imageInputRef} hidden accept="image/*,.pdf,.docx,.doc" onChange={handleChange} />
            <button type="button" className="upload-btn" onClick={() => imageInputRef.current.click()}>📎 Upload Representation</button>
            {formData.image && <p className="file-name">{formData.image.name}</p>}
            {errors.image && <p className="error">{errors.image}</p>}

            <label>Filing Date:</label>
            <input type="date" name="date" value={formData.date} onChange={handleDateSelect} />
            {errors.date && <p className="error">{errors.date}</p>}

            <div className="button-row">
                <button type="button" className="prev-btn" onClick={handlePrevious}>← Previous</button>
                <button type="submit" className="submit-btn">Submit</button>
            </div>
        </>
    );
    
    const renderFormContent = () => {
        if (submissionType === 'Basic Submission') return basicSubmissionContent;
        if (submissionType === 'Complete Application') return step === 1 ? completeApplicationStep1Content : completeApplicationStep2Content;
        return null;
    };
    
    return (
        <div className="portal-container">
            <header className="portal-header">Industrial Design Portal</header>
            
            {step === 0 && initialPopUp}

            {step > 0 && (
                <form className="form-card" onSubmit={handleSubmit}>
                    {renderFormContent()}
                </form>
            )}

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h3>✅ Successfully Submitted!</h3>
                        <p>Your Industrial Design application has been received.</p>
                        <button className="ok-btn" onClick={handlePopupClose}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}