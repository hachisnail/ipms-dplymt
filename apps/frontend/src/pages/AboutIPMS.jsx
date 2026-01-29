//AboutIPMS.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaRocket, FaShieldAlt, FaUsers, FaChartLine, 
  FaLightbulb, FaCertificate, FaBook, FaAward,
  FaCheckCircle, FaArrowRight, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import '../styles/AboutIPMS.css';
import IPMS from '../image/Intellectual Property Management System.png';
import Tracking from '../image/Real-Time Tracking.png';
import Portal from '../image/Easy Submission Process.png';
const AboutIPMS = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Placeholder images - You can replace these URLs with your own images later
  const carouselImages = [
    {
      url: IPMS,
      title: 'Intellectual Property Management System',
      description: 'Streamlined IP protection for innovators'
    },
    {
      url: Portal,
      title: 'Easy Submission Process',
      description: 'Submit your innovations in just a few clicks'
    },
    {
      url: Tracking,
      title: 'Real-time Tracking',
      description: 'Monitor your IP submissions every step of the way'
    },
    {
      url: 'https://via.placeholder.com/1200x500/7c3aed/FFFFFF?text=Expert+Review',
      title: 'Expert Consultation',
      description: 'Get feedback from IP specialists'
    }
  ];

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="about-ipms-container">
      <div className="about-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Hero Section with Carousel */}
      <section className="hero-section">
        <div className="carousel-container">
          <div className="carousel-slides">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              >
                <img src={image.url} alt={image.title} />
                <div className="carousel-caption">
                  <h2>{image.title}</h2>
                  <p>{image.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button className="carousel-btn prev" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          <button className="carousel-btn next" onClick={nextSlide}>
            <FaChevronRight />
          </button>

          {/* Dots Indicator */}
          <div className="carousel-dots">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="about-content">
        {/* What is IPMS Section */}
        <section className="section what-is-ipms">
          <div className="section-header">
            <FaRocket className="section-icon" />
            <h2>What is IPMS?</h2>
          </div>
          <div className="content-card">
            <p className="lead-text">
              The <strong>Intellectual Property Management System (IPMS)</strong> is a comprehensive 
              digital platform designed to streamline the process of protecting and managing intellectual 
              property rights for innovators, researchers, and creators.
            </p>
            <p>
              Our system provides a secure, efficient, and user-friendly environment where inventors can 
              submit their innovations, track the progress of their applications, and receive expert 
              guidance from IP consultants and administrators.
            </p>
          </div>
        </section>

        {/* Key Features */}
        <section className="section key-features">
          <div className="section-header">
            <FaLightbulb className="section-icon" />
            <h2>Key Features</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper inventor">
                <FaCertificate />
              </div>
              <h3>Easy Submission</h3>
              <p>Submit patents, trademarks, copyrights, and industrial designs through our intuitive interface</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper consultant">
                <FaUsers />
              </div>
              <h3>Expert Review</h3>
              <p>Get your submissions reviewed by qualified IP consultants and specialists</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper admin">
                <FaShieldAlt />
              </div>
              <h3>Secure Platform</h3>
              <p>Enterprise-grade security to protect your intellectual property data</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper tracking">
                <FaChartLine />
              </div>
              <h3>Real-time Tracking</h3>
              <p>Monitor the status of your submissions at every stage of the process</p>
            </div>
          </div>
        </section>

        {/* IP Types Supported */}
        <section className="section ip-types">
          <div className="section-header">
            <FaAward className="section-icon" />
            <h2>Types of IP We Support</h2>
          </div>
          <div className="ip-types-grid">
            <div className="ip-type-card">
              <div className="ip-icon">🎨</div>
              <h3>Industrial Design</h3>
              <p>Protect the aesthetic aspects of your products and designs</p>
            </div>

            <div className="ip-type-card">
              <div className="ip-icon">⚙️</div>
              <h3>Utility Model</h3>
              <p>Secure protection for functional innovations and inventions</p>
            </div>

            <div className="ip-type-card">
              <div className="ip-icon">®</div>
              <h3>Trademark</h3>
              <p>Register your brand names, logos, and distinctive marks</p>
            </div>

            <div className="ip-type-card">
              <div className="ip-icon">©</div>
              <h3>Copyright</h3>
              <p>Protect your original creative works and content</p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section benefits">
          <div className="section-header">
            <FaCheckCircle className="section-icon" />
            <h2>Why Choose IPMS?</h2>
          </div>
          <div className="benefits-list">
            <div className="benefit-item">
              <FaCheckCircle className="check-icon" />
              <div>
                <h4>Streamlined Process</h4>
                <p>Reduce paperwork and processing time with our digital platform</p>
              </div>
            </div>

            <div className="benefit-item">
              <FaCheckCircle className="check-icon" />
              <div>
                <h4>Expert Guidance</h4>
                <p>Access to qualified IP consultants for professional advice</p>
              </div>
            </div>

            <div className="benefit-item">
              <FaCheckCircle className="check-icon" />
              <div>
                <h4>Transparent Tracking</h4>
                <p>Real-time visibility into your submission status</p>
              </div>
            </div>

            <div className="benefit-item">
              <FaCheckCircle className="check-icon" />
              <div>
                <h4>Secure Storage</h4>
                <p>Your intellectual property data is encrypted and protected</p>
              </div>
            </div>

            <div className="benefit-item">
              <FaCheckCircle className="check-icon" />
              <div>
                <h4>User-Friendly Interface</h4>
                <p>Intuitive design makes IP management accessible to everyone</p>
              </div>
            </div>

            <div className="benefit-item">
              <FaCheckCircle className="check-icon" />
              <div>
                <h4>Comprehensive Support</h4>
                <p>Dedicated support team to help you every step of the way</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="section cta-section">
          <div className="cta-card">
            <h2>Ready to Protect Your Innovation?</h2>
            <p>Join thousands of innovators who trust IPMS to protect their intellectual property</p>
            <div className="cta-buttons">
              <Link to="/signup" className="cta-button primary">
                Get Started <FaArrowRight />
              </Link>
              <Link to="/login" className="cta-button secondary">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutIPMS;