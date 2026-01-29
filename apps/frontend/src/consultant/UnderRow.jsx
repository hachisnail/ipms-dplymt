// UnderRow.jsx
import './TableView.css'; // <-- Add this line for the styles

// Designed specifically for the UnderReview table
// Updated to accept onView prop (to trigger the ReviewPopup)
const UnderRow = ({ project, onView }) => {
    
    // Helper function to determine the status badge class
    const getStatusClass = (status) => {
        if (!status) return 'under-review';
        if (status === 'Ready for Review') return 'ready-for-review';
        // Ensure status name is CSS-friendly
        return status.toLowerCase().replace(' ', '-');
    };
    
    // Check if the submission is ready for final review (all checklist items complete)
    const isReadyForReview = project.status === 'Ready for Review' || (project.inventor_identified && project.design_views_complete && project.description_clear);

    return (
        <tr>
            <td>{project.id}</td>
            <td>{project.title || 'N/A'}</td>
            <td>{project.description || 'N/A'}</td>
            
            {/* The submission status, which includes the checklist gate status */}
            <td>
                <span className={`status-badge ${getStatusClass(project.status)}`}>
                    {isReadyForReview ? 'Ready for Review' : project.status || 'Under Review'}
                </span>
            </td>
            
            <td>{project.design_type || 'N/A'}</td>
            <td>{project.filing_date ? new Date(project.filing_date).toLocaleDateString() : 'N/A'}</td>

            {/* ACTION COLUMN */}
            <td>
                <button 
                    className="view-btn" // Reusing or styling this class similar to 'receive-btn' but for viewing
                    onClick={() => onView(project)} // Passes the entire project object to open the popup
                    aria-label="View and Review Submission"
                >
                    <i className="bi bi-eye-fill me-1" aria-hidden="true"></i>
                    Review
                </button>
            </td>
        </tr>
    );
};

export default UnderRow;