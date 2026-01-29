// Row.jsx

// Updated to accept onReceive prop instead of onView
const Row = ({ project, onReceive }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

    return (
        <tr>
            <td>{project.id}</td>
            <td>{project.title || 'N/A'}</td>
            <td>{project.description || 'N/A'}</td>
            <td>
                <span className={`status-badge ${project.submission_type?.toLowerCase().replace(' ', '-')}`}>
                    {project.submission_type || 'N/A'}
                </span>
            </td>
            <td>{project.design_type || 'N/A'}</td>
            <td>{project.filing_date ? new Date(project.filing_date).toLocaleDateString() : 'N/A'}</td>

            <td>
                {project.design_image_path ? (
                    <img
                        src={`${API_BASE_URL.replace('/api', '')}/uploads/${project.design_image_path}`}
                        alt="Design Preview"
                        className="table-image"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60?text=No+Image';
                            e.target.alt = 'Image not found';
                        }}
                    />
                ) : (
                    <span className="no-data">No image</span>
                )}
            </td>

            <td>
                {project.official_form_path ? (
                    <a
                        href={`${API_BASE_URL.replace('/api', '')}/uploads/${project.official_form_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-link"
                        download
                        aria-label="Download PDF"
                    >
                        <i className="bi bi-file-earmark-pdf-fill" aria-hidden="true"></i>
                        <span style={{ marginLeft: 8 }}>PDF</span>
                    </a>
                ) : (
                    <span className="no-data">No file</span>
                )}
            </td>

            <td>
                <button 
                    className="receive-btn" 
                    onClick={() => onReceive(project.id)}
                    aria-label="Receive submission"
                >
                    <i className="bi bi-check-lg me-1" aria-hidden="true"></i>
                    Receive
                </button>
            </td>
        </tr>
    );
};

export default Row;