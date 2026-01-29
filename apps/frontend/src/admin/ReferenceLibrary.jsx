import React, { useState } from 'react';
import './ReferenceLibrary.css';

function ReferenceLibrary() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // IP Categories - Only 4 categories (removed Patent)
    const ipCategories = [
        {
            id: 1,
            name: 'Industrial Design (ID)',
            shortCode: 'ID',
            icon: 'bi-palette',
            color: '#1976d2',
            description: 'Industrial Design protects the visual design of objects that are not purely utilitarian. An industrial design consists of the creation of a shape, configuration, or composition of pattern or color in three-dimensional form containing aesthetic value.',
            protects: [
                'Shape and configuration of products',
                'Pattern, ornamentation, and lines',
                'Color combinations',
                'Three-dimensional features'
            ],
            examples: [
                'Furniture design',
                'Vehicle body design',
                'Product packaging',
                'Electronic device appearance'
            ],
            requirements: [
                'Must be new and original',
                'Must have aesthetic value',
                'Must be applicable to industrial production',
                'Cannot be purely functional'
            ],
            duration: '5 years, renewable for two 5-year periods (max 15 years)',
            filingProcess: [
                'Search for prior designs',
                'Prepare drawings/photos',
                'Submit to IPO',
                'Undergo examination'
            ]
        },
        {
            id: 2,
            name: 'Trademark (TM)',
            shortCode: 'TM',
            icon: 'bi-tag',
            color: '#7b1fa2',
            description: 'A trademark is any visible sign capable of distinguishing the goods or services of one enterprise from those of other enterprises. Trademarks help consumers identify and purchase products based on reputation and quality.',
            protects: [
                'Brand names and logos',
                'Slogans and taglines',
                'Product names',
                'Service marks'
            ],
            examples: [
                'Company logos',
                'Product names',
                'Slogans',
                'Service marks'
            ],
            requirements: [
                'Must be distinctive',
                'Must not be descriptive',
                'Must not be generic',
                'Must be used in commerce'
            ],
            duration: '10 years, renewable indefinitely every 10 years',
            filingProcess: [
                'Trademark search',
                'Determine classification',
                'File application',
                'Publication for opposition'
            ]
        },
        {
            id: 3,
            name: 'Copyright (CR)',
            shortCode: 'CR',
            icon: 'bi-file-earmark-text',
            color: '#e65100',
            description: 'Copyright is a legal term describing rights given to creators for their literary and artistic works. Copyright protection extends to expressions and not to ideas, procedures, or methods of operation.',
            protects: [
                'Literary works',
                'Musical works and lyrics',
                'Artistic works',
                'Software and programs'
            ],
            examples: [
                'Books and novels',
                'Songs and music',
                'Paintings and photos',
                'Software code'
            ],
            requirements: [
                'Must be original',
                'Must be fixed in tangible form',
                'Must show minimal creativity',
                'Automatic upon creation'
            ],
            duration: 'Life of author plus 50 years',
            filingProcess: [
                'Exists automatically upon creation',
                'Optional registration',
                'Deposit copies',
                'Receive certificate'
            ]
        },
        {
            id: 4,
            name: 'Utility Model (UM)',
            shortCode: 'UM',
            icon: 'bi-gear',
            color: '#2e7d32',
            description: 'A utility model protects mechanical innovations with a shorter term and simpler examination. Also known as a "petty patent" and is ideal for incremental innovations.',
            protects: [
                'New shapes of devices',
                'Practical improvements',
                'Simple mechanical inventions',
                'Product modifications'
            ],
            examples: [
                'Improved hand tools',
                'Modified utensils',
                'Enhanced containers',
                'Simple devices'
            ],
            requirements: [
                'Must be new',
                'Must be industrially applicable',
                'Must involve an inventive step',
                'Must be a device or product'
            ],
            duration: '7 years from filing (non-renewable)',
            filingProcess: [
                'Prior art search',
                'Prepare description',
                'File application',
                'Formal examination'
            ]
        }
    ];

    const handleViewDetails = (category) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCategory(null);
    };

    // Filter categories based on search
    const filteredCategories = ipCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reference-container">
            {/* Header */}
            <div className="reference-header">
                <div className="header-left">
                    <h2>
                        <i className="bi bi-book"></i> IP Reference Library
                    </h2>
                    <p className="subtitle">Guide to intellectual property categories</p>
                </div>
                <div className="header-right">
                    <span className="categories-count">
                        <i className="bi bi-collection"></i> {ipCategories.length} Categories
                    </span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search IP categories..."
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

            {/* Categories Grid - 2x2 */}
            <div className="categories-grid">
                {filteredCategories.length === 0 ? (
                    <div className="no-results">
                        <i className="bi bi-search"></i>
                        <p>No categories found</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => (
                        <div key={category.id} className="category-card">
                            <div className="card-header" style={{ borderLeftColor: category.color }}>
                                <div className="icon-circle" style={{ background: category.color }}>
                                    <i className={category.icon}></i>
                                </div>
                                <div className="card-title">
                                    <h3>{category.name}</h3>
                                    <span className="short-code" style={{ background: category.color }}>
                                        {category.shortCode}
                                    </span>
                                </div>
                            </div>

                            <div className="card-body">
                                <p className="description">{category.description.substring(0, 120)}...</p>
                                
                                <div className="quick-info">
                                    <div className="info-item">
                                        <i className="bi bi-shield-check"></i>
                                        <span>{category.protects.length} types</span>
                                    </div>
                                    <div className="info-item">
                                        <i className="bi bi-clock-history"></i>
                                        <span>{category.duration.split(',')[0]}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button 
                                    className="btn-view-details"
                                    onClick={() => handleViewDetails(category)}
                                >
                                    <i className="bi bi-book-half"></i> View Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Compact Details Modal */}
            {showModal && selectedCategory && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content reference-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="modal-header" style={{ background: selectedCategory.color }}>
                            <div className="modal-icon">
                                <i className={selectedCategory.icon}></i>
                            </div>
                            <h2>{selectedCategory.name}</h2>
                            <span className="modal-badge">{selectedCategory.shortCode}</span>
                        </div>

                        <div className="modal-body">
                            <section className="modal-section">
                                <h3><i className="bi bi-info-circle"></i> Description</h3>
                                <p>{selectedCategory.description}</p>
                            </section>

                            <section className="modal-section">
                                <h3><i className="bi bi-shield-check"></i> What It Protects</h3>
                                <ul className="compact-list">
                                    {selectedCategory.protects.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </section>

                            <section className="modal-section">
                                <h3><i className="bi bi-lightbulb"></i> Examples</h3>
                                <div className="compact-examples">
                                    {selectedCategory.examples.map((example, index) => (
                                        <span key={index} className="example-tag">{example}</span>
                                    ))}
                                </div>
                            </section>

                            <section className="modal-section">
                                <h3><i className="bi bi-clipboard-check"></i> Requirements</h3>
                                <ul className="compact-list">
                                    {selectedCategory.requirements.map((req, index) => (
                                        <li key={index}>{req}</li>
                                    ))}
                                </ul>
                            </section>

                            <div className="modal-footer-info">
                                <div className="info-box">
                                    <i className="bi bi-clock-history"></i>
                                    <div>
                                        <strong>Duration:</strong>
                                        <span>{selectedCategory.duration}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-close-modal">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReferenceLibrary;