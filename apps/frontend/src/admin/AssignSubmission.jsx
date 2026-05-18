/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import "./AssignSubmission.css";

// ─── helpers ───────────────────────────────────────────────
const BASE  = import.meta.env?.VITE_API_URL || "http://localhost:3006/api";
const token = () => localStorage.getItem("token");

const IP_BADGE_CLASS = {
  "Utility Model":     "as-badge as-badge-um",
  "Industrial Design": "as-badge as-badge-id",
  "Trademark":         "as-badge as-badge-tm",
  "Copyright":         "as-badge as-badge-cr",
};

function IpBadge({ type }) {
  const cls = IP_BADGE_CLASS[type] || "as-badge as-badge-def";
  return <span className={cls}>{type || "—"}</span>;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── main component ─────────────────────────────────────────
export default function AssignSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [assigning,   setAssigning]   = useState(false);
  const [successMsg,  setSuccessMsg]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, conRes] = await Promise.all([
        fetch(`${BASE}/admin/pending-submissions`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${BASE}/admin/consultants`,          { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const subJson = await subRes.json();
      const conJson = await conRes.json();
      setSubmissions(subJson.success ? subJson.data : []);
      setConsultants(conJson.success ? conJson.data.filter(c => c.is_active) : []);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal  = (sub) => { setModal(sub); setSelected(null); };
  const closeModal = ()    => { setModal(null); setSelected(null); };

  const confirmAssign = async () => {
    if (!selected || !modal) return;
    setAssigning(true);
    try {
      const res = await fetch(`${BASE}/admin/assign-submission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          prefix:       modal.prefix,
          submissionId: modal.id,
          consultantId: selected,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const c = consultants.find(c => c.id === selected);
        setSuccessMsg(`✅ Assigned to ${c?.full_name || "consultant"} successfully.`);
        closeModal();
        load();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(`Assignment failed: ${json.message}`);
      }
    } catch {
      alert("Network error.");
    } finally {
      setAssigning(false);
    }
  };

  const selectedConsultant = consultants.find(c => c.id === selected);

  return (
    <div className="as-wrap">

      {/* ── Header ── */}
      <div className="as-header">
        <div className="as-header-left">
          <h2 className="as-title">Pending Submissions</h2>
          {!loading && (
            <span className="as-count-badge">{submissions.length} pending</span>
          )}
        </div>
        <button className="as-btn as-btn-refresh" onClick={load}>
          Refresh
        </button>
      </div>

      {/* ── Success toast ── */}
      {successMsg && <div className="as-toast">{successMsg}</div>}

      {/* ── Table ── */}
      <div className="as-table-wrap">
        {loading ? (
          <div className="as-empty">
            <div className="as-empty-icon"></div>
            <div className="as-empty-txt">Loading submissions…</div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="as-empty">
            <div className="as-empty-icon"></div>
            <div className="as-empty-txt">No pending submissions right now.</div>
          </div>
        ) : (
          <table className="as-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Inventor Name</th>
                <th>IP Type</th>
                <th>Type of Project</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th className="center">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr
                  key={`${s.prefix}-${s.id}`}
                  className={i % 2 === 0 ? "as-tr-even" : "as-tr-odd"}
                >
                  <td className="muted">{s.prefix.toUpperCase()}-{s.id}</td>

                  <td>
                    <div className="as-inventor-name">{s.inventor_name || "—"}</div>
                    <div className="as-inventor-unit">{s.delivery_unit || ""}</div>
                  </td>

                  <td><IpBadge type={s.ip_type} /></td>

                  <td className="secondary">{s.project_type || "—"}</td>

                  <td className="secondary">{fmtDate(s.date_submitted)}</td>

                  <td>
                    <span className={`as-status ${
                      s.status === "Submitted" || !s.status
                        ? "as-status-new"
                        : "as-status-review"
                    }`}>
                      {s.status || "Submitted"}
                    </span>
                  </td>

                  <td className="center">
                    {s.assigned_to_consultant ? (
                      <span className="as-assigned-label">Assigned</span>
                    ) : (
                      <button
                        className="as-btn as-btn-assign"
                        onClick={() => openModal(s)}
                      >
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Assign Modal ── */}
      {modal && (
        <div
          className="as-overlay"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="as-modal">

            <div className="as-modal-head">
              <h3 className="as-modal-title">Assign to Consultant</h3>
              <button className="as-modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="as-modal-body">
              {/* Submission info */}
              <div className="as-sub-info">
                <div className="as-sub-info-row">
                  <span className="as-sub-label">Reference</span>
                  <span className="as-sub-val">{modal.prefix.toUpperCase()}-{modal.id}</span>
                </div>
                <div className="as-sub-info-row">
                  <span className="as-sub-label">Inventor</span>
                  <span className="as-sub-val">{modal.inventor_name || "—"}</span>
                </div>
                <div className="as-sub-info-row">
                  <span className="as-sub-label">IP Type</span>
                  <IpBadge type={modal.ip_type} />
                </div>
                {modal.project_type && (
                  <div className="as-sub-info-row">
                    <span className="as-sub-label">Project Type</span>
                    <span className="as-sub-val">{modal.project_type}</span>
                  </div>
                )}
                <div className="as-sub-info-row">
                  <span className="as-sub-label">Submitted</span>
                  <span className="as-sub-val">{fmtDate(modal.date_submitted)}</span>
                </div>
              </div>

              {/* Consultant picker */}
              <div className="as-consult-heading">Select a Consultant</div>

              {consultants.length === 0 ? (
                <div className="as-consult-empty">
                  No active consultants available.
                </div>
              ) : (
                <div className="as-consult-list">
                  {consultants.map(c => (
                    <div
                      key={c.id}
                      className={`as-consult-card${selected === c.id ? " selected" : ""}`}
                      onClick={() => setSelected(c.id)}
                    >
                      <div className="as-consult-name">{c.full_name}</div>
                      {selected === c.id && (
                        <span className="as-consult-check">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="as-modal-footer">
              <button className="as-btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="as-btn-confirm"
                onClick={confirmAssign}
                disabled={!selected || assigning}
              >
                {assigning
                  ? "Assigning…"
                  : `Assign${selectedConsultant
                      ? ` to ${selectedConsultant.full_name.split(" ")[0]}`
                      : ""}`
                }
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}