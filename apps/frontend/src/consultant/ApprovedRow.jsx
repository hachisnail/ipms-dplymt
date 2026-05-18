// ApprovedRow.jsx — single table row for the Approved for Filing list.
// Table style matches UnderReview pages exactly (ur-* classes).
import { useState } from 'react';
import ApprovedReviewPanel from './ApprovedReviewPanel';
import './UnderReview.css';
import './ApprovedReview.css';

const fmt = d => d
    ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
    : 'N/A';

const IP_LABEL  = { um: 'Utility Model', id: 'Industrial Design', tm: 'Trademark', cr: 'Copyright' };
const REF_PREFIX = { um: 'UM', id: 'ID', tm: 'TM', cr: 'CR' };

export default function ApprovedRow({ project, ipType = 'um' }) {
    const [open, setOpen] = useState(false);

    const refId   = `${REF_PREFIX[ipType]}-${project.id}`;
    const subType = project.ip_type || project.mark_type || project.work_type || project.project_type || '—';

    return (
        <>
            <tr>
                <td>
                    <span className="ur-ref-badge">{refId}</span>
                </td>
                <td style={{ fontWeight: 700 }}>{project.title || 'N/A'}</td>
                <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{project.inventor_name || 'N/A'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>{project.inventor_email || ''}</div>
                </td>
                <td>
                    <span className="ur-status-badge ready">
                        <i className="bi bi-check-circle-fill"></i>Approved for Filing
                    </span>
                </td>
                <td>
                    <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        background: '#f1f5f9', borderRadius: 'var(--r-pill)',
                        fontSize: 12, fontWeight: 600, color: 'var(--text-mid)',
                    }}>{subType}</span>
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmt(project.approval_date)}</td>
                <td>
                    <button className="ur-review-btn" onClick={() => setOpen(true)}>
                        <i className="bi bi-file-earmark-arrow-up"></i>
                        View &amp; Submit PAS
                    </button>
                </td>
            </tr>

            {open && (
                <ApprovedReviewPanel
                    project={project}
                    ipType={ipType}
                    refId={refId}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}