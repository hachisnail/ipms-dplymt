import React, { useState } from 'react';
import './TermsConditions.css';

function TermsConditions() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSection, setExpandedSection] = useState(null);

    const termsData = {
        lastUpdated: 'January 10, 2026',
        sections: [
            {
                id: 1,
                title: 'Acceptance of Terms',
                icon: 'bi-check-circle',
                content: [
                    'By accessing and using the Intellectual Property Management System (IPMS), you agree to be bound by these Terms and Conditions.',
                    'If you do not agree with any part of these terms, you must not use this system.',
                    'These terms apply to all users, including administrators, consultants, and inventors.'
                ]
            },
            {
                id: 2,
                title: 'Administrator Responsibilities',
                icon: 'bi-shield-check',
                content: [
                    'Administrators must maintain the confidentiality of their account credentials.',
                    'Administrators are responsible for all activities conducted under their account.',
                    'Administrators must not share their login credentials with unauthorized persons.',
                    'Administrators must promptly report any security breaches or unauthorized access.',
                    'Administrators have the authority to manage users, review submissions, and maintain system integrity.'
                ]
            },
            {
                id: 3,
                title: 'Data Privacy and Protection',
                icon: 'bi-lock',
                content: [
                    'All intellectual property submissions are treated as confidential information.',
                    'User data is protected in accordance with applicable data protection laws.',
                    'The system implements industry-standard security measures to protect sensitive information.',
                    'Personal information will not be shared with third parties without explicit consent.',
                    'Users have the right to access, correct, or delete their personal data upon request.'
                ]
            },
            {
                id: 4,
                title: 'Intellectual Property Rights',
                icon: 'bi-file-earmark-lock',
                content: [
                    'All intellectual property submitted through the system remains the property of the submitter.',
                    'The system does not claim ownership of any submitted intellectual property.',
                    'Users grant the system limited access rights solely for the purpose of processing and evaluation.',
                    'Consultants and administrators must maintain confidentiality of all submitted IP.',
                    'Unauthorized disclosure or use of submitted IP is strictly prohibited.'
                ]
            },
            {
                id: 5,
                title: 'System Usage Guidelines',
                icon: 'bi-book',
                content: [
                    'The system must be used only for legitimate IP management purposes.',
                    'Users must not attempt to compromise system security or integrity.',
                    'Users must not upload malicious files, viruses, or harmful code.',
                    'Users must not attempt unauthorized access to other users\' data.',
                    'System resources must be used responsibly and not abused.',
                    'Spam, harassment, or inappropriate content is strictly prohibited.'
                ]
            },
            {
                id: 6,
                title: 'Submission Guidelines',
                icon: 'bi-upload',
                content: [
                    'All submissions must be original work or properly authorized.',
                    'Submitters must have the legal right to submit the intellectual property.',
                    'False or misleading information in submissions is prohibited.',
                    'Submissions must comply with all applicable laws and regulations.',
                    'The system reserves the right to reject submissions that violate these terms.'
                ]
            },
            {
                id: 7,
                title: 'Review and Evaluation Process',
                icon: 'bi-clipboard-check',
                content: [
                    'All submissions undergo review by qualified consultants.',
                    'The review process follows established evaluation criteria.',
                    'Review decisions are made in good faith based on available information.',
                    'The system does not guarantee approval of any submission.',
                    'Users may appeal decisions through the appropriate channels.',
                    'Review timelines are estimates and may vary based on complexity.'
                ]
            },
            {
                id: 8,
                title: 'Limitation of Liability',
                icon: 'bi-exclamation-triangle',
                content: [
                    'The system is provided "as is" without warranties of any kind.',
                    'The system is not liable for any direct, indirect, or consequential damages.',
                    'The system is not responsible for loss of data due to technical failures.',
                    'Users are responsible for maintaining backups of their submissions.',
                    'The system\'s liability is limited to the maximum extent permitted by law.'
                ]
            },
            {
                id: 9,
                title: 'Termination of Access',
                icon: 'bi-x-circle',
                content: [
                    'The system reserves the right to suspend or terminate user access.',
                    'Violation of these terms may result in immediate account suspension.',
                    'Users may request account deletion at any time.',
                    'Upon termination, users lose access to all system features and data.',
                    'The system may retain certain data as required by law or policy.'
                ]
            },
            {
                id: 10,
                title: 'Changes to Terms',
                icon: 'bi-arrow-repeat',
                content: [
                    'These terms may be updated periodically to reflect changes in the system or law.',
                    'Users will be notified of significant changes to these terms.',
                    'Continued use of the system after changes constitutes acceptance.',
                    'Users are responsible for reviewing terms regularly.',
                    'The date of last update is displayed at the top of this document.'
                ]
            },
            {
                id: 11,
                title: 'Contact and Support',
                icon: 'bi-envelope',
                content: [
                    'For questions about these terms, contact the system administrator.',
                    'Technical support is available through the system\'s support channels.',
                    'Feedback and suggestions are welcome and encouraged.',
                    'Security concerns should be reported immediately.',
                    'General inquiries will be responded to within 3 business days.'
                ]
            }
        ]
    };

    const toggleSection = (sectionId) => {
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
    };

    const filteredSections = termsData.sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="terms-container">
            {/* Header */}
            <div className="terms-header">
                <div className="header-content">
                    <h2>
                        <i className="bi bi-file-text"></i> Terms and Conditions
                    </h2>
                    <p className="subtitle">Please read these terms carefully before using the system</p>
                    <div className="last-updated">
                        <i className="bi bi-calendar-check"></i>
                        Last Updated: {termsData.lastUpdated}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="search-section">
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search terms and conditions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="btn-clear" onClick={() => setSearchTerm('')}>
                            <i className="bi bi-x"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Terms Sections */}
            <div className="terms-content">
                {filteredSections.length === 0 ? (
                    <div className="no-results">
                        <i className="bi bi-search"></i>
                        <p>No results found for "{searchTerm}"</p>
                    </div>
                ) : (
                    filteredSections.map((section) => (
                        <div 
                            key={section.id} 
                            className={`terms-section ${expandedSection === section.id ? 'expanded' : ''}`}
                        >
                            <div 
                                className="section-header"
                                onClick={() => toggleSection(section.id)}
                            >
                                <div className="header-left">
                                    <i className={section.icon}></i>
                                    <h3>{section.title}</h3>
                                </div>
                                <i className={`bi ${expandedSection === section.id ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                            </div>
                            
                            {expandedSection === section.id && (
                                <div className="section-content">
                                    <ul>
                                        {section.content.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Acceptance Footer */}
            <div className="terms-footer">
                <div className="footer-content">
                    <i className="bi bi-info-circle"></i>
                    <p>
                        By using this system, you acknowledge that you have read, understood, 
                        and agree to be bound by these Terms and Conditions.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TermsConditions;