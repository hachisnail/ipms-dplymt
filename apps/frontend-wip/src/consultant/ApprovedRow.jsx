import './TableView.css';

const ApprovedRow = ({ project }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

    // Handle downloading all files
    const handleDownloadAll = async () => {
        const hasFiles = project.official_form_path || project.design_image_path;
        
        if (!hasFiles) {
            alert('No files available for download');
            return;
        }

        // Helper function to download a file
        const downloadFile = (filePath, fileName) => {
            const fileUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${filePath}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName || filePath;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // Download official form if exists
        if (project.official_form_path) {
            downloadFile(
                project.official_form_path, 
                `${project.title}_Official_Form.pdf`
            );
            
            // Small delay between downloads to avoid browser blocking
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Download design image if exists
        if (project.design_image_path) {
            downloadFile(
                project.design_image_path, 
                `${project.title}_Design_Image`
            );
        }

        // Show success notification
        const fileCount = (project.official_form_path ? 1 : 0) + (project.design_image_path ? 1 : 0);
        alert(`✅ Downloading ${fileCount} file(s) for Project ${project.id}: ${project.title}`);
    };

    // Handle clicking on image thumbnail to view full size
    const handleImageClick = (imagePath) => {
        if (imagePath) {
            const imageUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${imagePath}`;
            window.open(imageUrl, '_blank');
        }
    };

    // Handle clicking on PDF to view
    const handlePDFClick = (pdfPath) => {
        if (pdfPath) {
            const pdfUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${pdfPath}`;
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <tr>
            {/* ID Column */}
            <td data-label="ID">
                <span className="id-badge">{project.id}</span>
            </td>

            {/* Title Column */}
            <td data-label="TITLE">
                <div className="title-cell">
                    {project.title || 'N/A'}
                </div>
            </td>

            {/* Description Column */}
            <td data-label="DESCRIPTION">
                <div className="description-cell">
                    {project.description || 'N/A'}
                </div>
            </td>
            
            {/* Status Column */}
            <td data-label="STATUS">
                <span className="status-badge approved-for-filing">
                    <i className="bi bi-check-circle me-1"></i>
                    Approved for Filing
                </span>
            </td>
            
            {/* Design Type Column */}
            <td data-label="DESIGN TYPE">
                <span className="type-cell">{project.design_type || 'N/A'}</span>
            </td>

            {/* Approval Date Column */}
            <td data-label="APPROVAL DATE">
                <span className="date-cell">
                    {project.approval_date ? new Date(project.approval_date).toLocaleDateString() : 'N/A'}
                </span>
            </td>

            {/* Image Column - Only Thumbnail (Clickable to View) */}
            <td data-label="IMAGE">
                {project.design_image_path ? (
                    <div className="image-preview-wrapper">
                        <img
                            src={`${API_BASE_URL.replace('/api', '')}/uploads/${project.design_image_path}`}
                            alt="Design Preview"
                            className="table-image clickable"
                            onClick={() => handleImageClick(project.design_image_path)}
                            title="Click to view full size"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/70?text=No+Image';
                                e.target.alt = 'Image not found';
                            }}
                        />
                        <div className="preview-overlay">
                            <i className="bi bi-zoom-in"></i>
                        </div>
                    </div>
                ) : (
                    <span className="no-data">No image</span>
                )}
            </td>

            {/* PDF Column - Only Icon (Clickable to View) */}
            <td data-label="PDF FILE">
                {project.official_form_path ? (
                    <div 
                        className="pdf-preview clickable" 
                        onClick={() => handlePDFClick(project.official_form_path)}
                        title="Click to view PDF"
                    >
                        <i className="bi bi-file-earmark-pdf-fill pdf-icon-large"></i>
                        <span className="pdf-text">PDF</span>
                    </div>
                ) : (
                    <span className="no-data">No file</span>
                )}
            </td>

            {/* Action Column - Only Download All button */}
            <td data-label="ACTION">
                <button 
                    className="download-all-btn" 
                    onClick={handleDownloadAll}
                    aria-label="Download all documents"
                    title="Download complete submission package"
                >
                    <i className="bi bi-download"></i>
                    <span>Download All</span>
                </button>
            </td>
        </tr>
    );
};

export default ApprovedRow;