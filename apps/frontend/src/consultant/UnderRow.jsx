// UnderRow.jsx
import './TableView.css';

// Designed specifically for the UnderReview table
const UnderRow = ({ project, onView }) => {

    const getStatusClass = (status) => {
        if (!status) return 'under-review';
        if (status === 'Ready for Review') return 'ready-for-review';
        if (status === 'Under Review') return 'under-review';
        return status.toLowerCase().replace(/\s+/g, '-');
    };

    const isReadyForReview =
        project.status === 'Ready for Review' ||
        (project.inventor_identified && project.design_views_complete && project.description_clear);

    const displayStatus = isReadyForReview ? 'Ready for Review' : (project.status || 'Under Review');
    const statusClass   = isReadyForReview ? 'ready-for-review' : getStatusClass(project.status);

    return (
        <tr>
            <td>
                <span className="id-badge">#{project.id}</span>
            </td>
            <td>
                <span className="title-cell" title={project.title}>
                    {project.title || 'N/A'}
                </span>
            </td>
            <td>
                <span className="description-cell" title={project.description}>
                    {project.description || 'N/A'}
                </span>
            </td>
            <td>
                <span className={`status-badge ${statusClass}`}>
                    {displayStatus === 'Ready for Review' && (
                        <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                    )}
                    {displayStatus === 'Under Review' && (
                        <i className="bi bi-hourglass-split" aria-hidden="true"></i>
                    )}
                    {displayStatus}
                </span>
            </td>
            <td>
                <span className="type-cell">{project.design_type || 'N/A'}</span>
            </td>
            <td>
                <span className="date-cell">
                    {project.filing_date
                        ? new Date(project.filing_date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                          })
                        : 'N/A'}
                </span>
            </td>
            <td>
                <button
                    className="view-btn"
                    onClick={() => onView(project)}
                    aria-label="View and Review Submission"
                >
                    <i className="bi bi-eye-fill" aria-hidden="true"></i>
                    Review
                </button>
            </td>
        </tr>
    );
};

export default UnderRow;