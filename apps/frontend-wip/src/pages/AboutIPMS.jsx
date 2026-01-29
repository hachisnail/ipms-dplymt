import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRocket, FaLightbulb, FaUserTie, FaShieldAlt } from 'react-icons/fa';

// Updated import path for styles
import '../styles/AboutIPMS.css';

const AboutIPMS = () => {
    const navigate = useNavigate();

    return (
        <div className="about-container">
            {/* Navigation Bar */}
            <nav className="about-nav">
                <div className="nav-logo">
                    <FaRocket className="logo-icon" />
                    <span>IPMS</span>
                </div>
                <button className="back-btn" onClick={() => navigate('/')}>
                    <FaArrowLeft /> Return Home
                </button>
            </nav>

            {/* Hero Section */}
            <header className="about-hero">
                <div className="hero-content">
                    <h1>About IPMS</h1>
                    <p className="subtitle">Revolutionizing Intellectual Property Management</p>
                    <div className="hero-shape"></div>
                </div>
            </header>

            {/* Main Content */}
            <main className="about-content">
                <section className="mission-vision">
                    <div className="mv-card">
                        <div className="icon-wrapper">
                            <FaLightbulb />
                        </div>
                        <h2>Our Mission</h2>
                        <p>To provide a streamlined, secure, and efficient platform for inventors and consultants to manage, protect, and commercialize intellectual property assets.</p>
                    </div>
                    <div className="mv-card">
                        <div className="icon-wrapper">
                            <FaShieldAlt />
                        </div>
                        <h2>Our Vision</h2>
                        <p>To be the leading digital ecosystem for intellectual property innovation, fostering creativity and technological advancement across institutions.</p>
                    </div>
                </section>

                <section className="core-features">
                    <h2>Core Features</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <h3>Secure Submission</h3>
                            <p>End-to-end encryption for all IP documents and disclosures.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Real-time Tracking</h3>
                            <p>Monitor the status of applications from submission to approval.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Expert Consultation</h3>
                            <p>Direct channel connecting inventors with certified IP consultants.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="about-footer">
                <p>&copy; {new Date().getFullYear()} IP Management System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AboutIPMS;