/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import "./Portal.css";

// ✅ WRAPPED IN BOOTSTRAP GRID FOR CENTERING
export function CopyrightPortalSection() {
  return (
    <section className="Portal section">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <CopyrightPortal />
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
  if (submissionType === "Basic Submission") {
    return {
      title: "Title is required.",
      description: "Description is required.",
      file: "Please upload a form file (PDF/DOCX).",
    };
  }
  return {
    title: "Title is required.",
    type: "Type of Submission is required.",
    description: "Description is required.",
    file: "Please upload a form file (PDF/DOCX).",
    image: "Please upload a representation (image or file).",
    date: "Please select a filing date.",
  };
};

export default function CopyrightPortal() {
  const [step, setStep] = useState(0); 
  const [submissionType, setSubmissionType] = useState(null); 
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);

  // Refs for custom file upload buttons
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    const newValue = type === "file" ? files?.[0] || null : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTypeSelect = () => {
    if (submissionType) setStep(1);
  };

  const handleCancel = () => {
    window.location.hash = "Dashboard";
  };

  const validateFields = (fields) => {
    const rules = getValidationRules(submissionType);
    const newErrors = {};
    let valid = true;

    fields.forEach((field) => {
      const val = formData[field];
      if (!val || (typeof val === "string" && !val.trim())) {
        newErrors[field] = rules[field] || "This field is required.";
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    const requiredStep1 = ["title", "type", "description"];
    if (validateFields(requiredStep1)) setStep(2);
  };

  const handlePrevious = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required =
      submissionType === "Basic Submission"
        ? ["title", "description", "file"]
        : ["file", "image", "date"];

    if (!validateFields(required)) return;

    const URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

    const API_URL = `${URL}/cr/submit`;

    const form = new FormData();
    form.append("submissionType", submissionType);
    form.append("title", formData.title);
    form.append("description", formData.description);

    if (submissionType === "Complete Application") {
      form.append("type", formData.type);
      form.append("date", formData.date);
      if (formData.image) form.append("image", formData.image);
    }
    if (formData.file) form.append("file", formData.file);

    try {
      const response = await fetch(API_URL, { method: "POST", body: form });
      if (response.ok) {
        setShowPopup(true);
      } else {
        const result = await response.json();
        alert(`Submission failed: ${result.error || "Unknown error."}`);
      }
    } catch (err) {
      alert("Network error: Unable to reach server.");
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
        <p style={{ fontSize: "0.9rem", color: "#666" }}>
          Choose whether you are submitting a full copyright application or just a form.
        </p>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="submission"
              checked={submissionType === "Basic Submission"}
              onChange={() => setSubmissionType("Basic Submission")}
            />
            <span className="radio-text">Basic Submission (Form Only)</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="submission"
              checked={submissionType === "Complete Application"}
              onChange={() => setSubmissionType("Complete Application")}
            />
            <span className="radio-text">Complete Application (Full Filing)</span>
          </label>
        </div>
        <div className="button-row">
          <button className="cancel-btn" onClick={handleCancel} type="button">Cancel</button>
          {submissionType && (
            <button className="ok-btn" onClick={handleTypeSelect} type="button">Proceed to Form</button>
          )}
        </div>
      </div>
    </div>
  );

  const basicSubmissionContent = (
    <>
      <h3>Basic Copyright Submission</h3>
      <label>Title:</label>
      <input type="text" name="title" placeholder="Enter Copyright title" value={formData.title} onChange={handleChange} />
      {errors.title && <p className="error">{errors.title}</p>}

      <label>Description:</label>
      <textarea name="description" placeholder="Describe your work..." value={formData.description} onChange={handleChange} />
      {errors.description && <p className="error">{errors.description}</p>}

      <label>Official Form (PDF/DOCX):</label>
      <input type="file" name="file" ref={fileInputRef} hidden accept=".pdf,.docx" onChange={handleChange} />
      <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()}>📎 Choose File</button>
      {formData.file && <p className="file-name">{formData.file.name}</p>}
      {errors.file && <p className="error">{errors.file}</p>}

      <div className="button-right">
        <button type="submit" className="submit-btn">Submit Form</button>
      </div>
    </>
  );

  const completeApplicationContent1 = (
    <>
      <h3>Copyright Details</h3>
      <label>Copyright Title:</label>
      <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter Copyright title" />
      {errors.title && <p className="error">{errors.title}</p>}

      <label>Type of Work:</label>
      <select name="type" value={formData.type} onChange={handleChange}>
        <option value="" disabled>Select type</option>
        <option value="Literary Works">Literary Works</option>
        <option value="Computer Programs">Computer Programs</option>
        <option value="Musical Works">Musical Works</option>
        <option value="Artistic Works">Artistic Works</option>
        <option value="Audio-Visual Works">Audio-Visual Works</option>
      </select>
      {errors.type && <p className="error">{errors.type}</p>}

      <label>Description:</label>
      <textarea name="description" placeholder="Describe the work..." value={formData.description} onChange={handleChange} />
      {errors.description && <p className="error">{errors.description}</p>}

      <div className="button-right">
        <button type="button" className="next-btn" onClick={handleNext}>Next →</button>
      </div>
    </>
  );

  const completeApplicationContent2 = (
    <>
      <h3>Copyright Files</h3>
      <label>Official Application Form:</label>
      <input type="file" name="file" ref={fileInputRef} hidden accept=".pdf,.docx" onChange={handleChange} />
      <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()}>📎 Upload Form</button>
      {formData.file && <p className="file-name">{formData.file.name}</p>}
      {errors.file && <p className="error">{errors.file}</p>}

      <label>Work Representation (Image/File):</label>
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

  const renderContent = () => {
    if (submissionType === "Basic Submission") return basicSubmissionContent;
    if (submissionType === "Complete Application") return step === 1 ? completeApplicationContent1 : completeApplicationContent2;
    return null;
  };

  return (
    <div className="portal-container">
      <header className="portal-header">Copyright Portal</header>

      {step === 0 && initialPopUp}

      {step > 0 && (
        <form className="form-card" onSubmit={handleSubmit}>
          {renderContent()}
        </form>
      )}

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>✅ Successfully Submitted!</h3>
            <p>Your copyright application has been received.</p>
            <button className="ok-btn" onClick={handlePopupClose}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}