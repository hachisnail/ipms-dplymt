import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/main2.css'

const HomePage = () => {
  return (
    <div className="homepage-container">
      <div className="homepage-content">
        <h1 className="homepage-title">
          🎨 IP Management System Designs
        </h1>
        <p className="homepage-subtitle">
          Click the navigation buttons above to preview each page design
        </p>

        <div className="design-cards-grid">
          {/* Login Card */}
          <Link to="/login" className="design-card">
            <div className="design-card-icon">🔑</div>
            <h3 className="design-card-title">Login Page</h3>
            <p className="design-card-description">
              Beautiful authentication interface with glassmorphism effects and animated background
            </p>
            <div className="design-card-button">
              View Login →
            </div>
          </Link>

          {/* SignUp Card */}
          <Link to="/signup" className="design-card">
            <div className="design-card-icon">📝</div>
            <h3 className="design-card-title">Sign Up Page</h3>
            <p className="design-card-description">
              3-step registration wizard with role selection, form validation, and file upload
            </p>
            <div className="design-card-button">
              View Sign-Up →
            </div>
          </Link>

          {/* About IPMS Card */}
          <Link to="/about" className="design-card">
            <div className="design-card-icon">📖</div>
            <h3 className="design-card-title">About IPMS</h3>
            <p className="design-card-description">
              System overview with auto-carousel, features, benefits, and how it works guide
            </p>
            <div className="design-card-button">
              View About →
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h2 className="features-title">
            ✨ Design Features
          </h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <h4 className="feature-title">Maroon & Coral Theme</h4>
              <p className="feature-description">Beautiful color palette</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <h4 className="feature-title">Glassmorphism</h4>
              <p className="feature-description">Modern frosted glass effects</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌊</div>
              <h4 className="feature-title">Animations</h4>
              <p className="feature-description">Smooth floating backgrounds</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h4 className="feature-title">Fully Responsive</h4>
              <p className="feature-description">Works on all devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage