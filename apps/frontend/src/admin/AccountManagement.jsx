import { useState, useEffect, useCallback } from "react";

// ── URL normalizer ───────────────────────────────────────────
const _RAW = (import.meta.env.VITE_API_URL || "http://localhost:3006").replace(/\/$/, "");
const API_BASE = _RAW.endsWith("/api") ? _RAW.slice(0, -4) : _RAW;

const getToken = () => localStorage.getItem("token");
const authHdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Inject keyframes and Bootstrap Icons CSS ─────────────────
if (typeof document !== "undefined") {
  if (!document.getElementById("acm-kf")) {
    const s = document.createElement("style");
    s.id = "acm-kf";
    s.textContent = `
      @keyframes acm-spin  { to { transform:rotate(360deg); } }
      @keyframes acm-slide { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
    `;
    document.head.appendChild(s);
  }
  if (!document.getElementById("bs-icons")) {
    const l = document.createElement("link");
    l.id = "bs-icons";
    l.rel = "stylesheet";
    l.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
    document.head.appendChild(l);
  }
}

// ── Tiny helpers ─────────────────────────────────────────────
function initials(name = "") {
  return name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

// Gradient generator based on logo color (light yellow/gold)
function grad(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  // Based on logo gold/yellow: hsl(51, 100%, 50%)
  return `linear-gradient(135deg, hsl(${hue}, 80%, 65%), hsl(${(hue + 20) % 360}, 80%, 55%))`;
}

// ── Password Gate ────────────────────────────────────────────
function PasswordGate({ onSuccess, onCancel }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (!pw.trim()) { setErr("Please enter your password."); return; }
    setBusy(true); setErr("");
    try {
      const raw = JSON.parse(localStorage.getItem("user") || "{}");
      const me = raw.data || raw;
      if (!me?.email) { setErr("Session expired – please log in again."); setBusy(false); return; }
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: me.email, password: pw }),
      });
      const d = await res.json();
      if (res.ok && d.success) onSuccess();
      else setErr(d.message || "Incorrect password.");
    } catch { setErr("Network error. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <div style={S.overlay}>
      <div style={S.gateCard}>
        <div style={S.lockCircle}>
          <i className="bi bi-lock-fill" style={{ fontSize: '2rem', color: '#fff' }}></i>
        </div>
        <h2 style={S.gateTitle}>Admin Verification</h2>
        <p style={S.gateSub}>Re-enter your password to access<br /><strong>User Accounts</strong>.</p>
        <div style={S.inputWrap}>
          <input
            autoFocus
            type={show ? "text" : "password"}
            placeholder="Your password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && verify()}
            style={{ ...S.input, borderColor: err ? "#ef4444" : "#d1d5db", paddingRight: 44 }}
          />
          <button onClick={() => setShow(v => !v)} style={S.eyeBtn} type="button">
            {show ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
          </button>
        </div>
        {err && <p style={S.gateErr}>{err}</p>}
        <div style={S.gateRow}>
          <button onClick={onCancel} style={S.btnCancel} type="button">Cancel</button>
          <button onClick={verify} disabled={busy} style={S.btnConfirm} type="button">
            {busy ? <><span style={S.spin} />&nbsp;Verifying…</> : "Confirm Access"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: user.full_name || "", email: user.email || "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setErr("");
    if (!form.fullName.trim() || !form.email.trim()) { setErr("Name and email are required."); return; }
    if (form.newPassword && form.newPassword !== form.confirmPassword) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      const body = { fullName: form.fullName, email: form.email };
      if (form.newPassword) body.newPassword = form.newPassword;
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: "PUT", headers: authHdrs(), body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok && d.success) onSaved();
      else setErr(d.message || "Update failed.");
    } catch { setErr("Network error. Please try again."); }
    finally { setBusy(false); }
  };

  const rc = ({ ADMIN: { bg: "#fef3c7", text: "#a16207", dot: "#eab308" }, CONSULTANT: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" }, INVENTOR: { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" } }[user.user_type]) || { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" };

  return (
    <div style={S.overlay}>
      <div style={S.editCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827" }}>Edit User Account</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <span style={{ ...S.badge, background: rc.bg, color: rc.text }}><span style={{ ...S.dot, background: rc.dot }} />{user.user_type}</span>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>ID #{user.id}</span>
            </div>
          </div>
          <button onClick={onClose} style={S.closeBtn} type="button">
            <i className="bi bi-x-lg" style={{ fontSize: '1rem' }}></i>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ ...S.avLg, background: grad(user.full_name) }}>{initials(user.full_name)}</div>
          <div><div style={{ fontWeight: 600, color: "#111827" }}>{user.full_name}</div><div style={{ fontSize: 13, color: "#6b7280" }}>{user.email}</div></div>
        </div>
        <div style={{ height: 1, background: "#f3f4f6", marginBottom: 20 }}/>
        <div style={S.grid2}>
          <div style={S.fGroup}><label style={S.label}>Full Name</label><input style={S.input} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Full name" /></div>
          <div style={S.fGroup}><label style={S.label}>Email Address</label><input style={S.input} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="Email" /></div>
        </div>
        <div style={{ ...S.grid2, marginTop: 12 }}>
          <div style={S.fGroup}>
            <label style={S.label}>New Password <span style={{ fontWeight: 400, color: "#9ca3af" }}>(leave blank to keep)</span></label>
            <div style={S.inputWrap}>
              <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? "text" : "password"} value={form.newPassword} onChange={e => set("newPassword", e.target.value)} placeholder="New password" />
              <button onClick={() => setShowPw(v => !v)} style={S.eyeBtn} type="button">
                {showPw ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
              </button>
            </div>
          </div>
          <div style={S.fGroup}><label style={S.label}>Confirm Password</label><input style={S.input} type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Confirm password" /></div>
        </div>
        {err && <div style={S.errBox}><i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1rem', color: '#ef4444' }}></i>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={S.btnCancel2} type="button">Cancel</button>
          <button onClick={save} disabled={busy} style={S.btnSave} type="button">
            {busy ? <><span style={S.spin} />&nbsp;Saving…</> : <><i className="bi bi-floppy-fill" style={{ fontSize: '1rem' }}></i>Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function AccountManagement() {
  const [gated, setGated] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [revealPw, setRevealPw] = useState({});

  const flash = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: authHdrs() });
      if (res.status === 401) { flash("Session expired. Please log in again.", "err"); return; }
      if (res.status === 403) { flash("Access denied.", "err"); return; }
      const d = await res.json();
      if (d.success) setUsers(d.data || []);
      else flash(d.message || "Failed to load users.", "err");
    } catch { flash("Network error loading users.", "err"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!gated) fetchUsers(); }, [gated, fetchUsers]);

  const RC = { ADMIN: { bg: "#fef3c7", text: "#a16207", dot: "#eab308" }, CONSULTANT: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" }, INVENTOR: { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" } };
  const counts = { ALL: users.length };
  users.forEach(u => { counts[u.user_type] = (counts[u.user_type] || 0) + 1; });

  const shown = users.filter(u => {
    const q = search.toLowerCase();
    return (roleFilter === "ALL" || u.user_type === roleFilter) &&
      ((u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  });

  if (gated) return <PasswordGate onSuccess={() => setGated(false)} onCancel={() => window.history.back()} />;

  return (
    <div style={S.page}>
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "err" ? "#fef2f2" : "#f0fdf4", borderColor: toast.type === "err" ? "#fecaca" : "#bbf7d0", color: toast.type === "err" ? "#dc2626" : "#15803d" }}>
          {toast.type === "err"
            ? <i className="bi bi-x-circle-fill" style={{ fontSize: '1rem' }}></i>
            : <i className="bi bi-check-circle-fill" style={{ fontSize: '1rem' }}></i>
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={S.pageTitle}>
            <i className="bi bi-people-fill" style={{ fontSize: '1.8rem', marginRight: 12, color: '#eab308' }}></i>
            User Accounts
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>Manage all registered accounts</p>
        </div>
        <button onClick={fetchUsers} style={S.btnRefresh} type="button">
          <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }}></i>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={S.statGrid}>
        {[
          { label: "Total Users", count: counts.ALL || 0, color: "#eab308" },
          { label: "Admins", count: counts.ADMIN || 0, color: "#eab308" },
          { label: "Consultants", count: counts.CONSULTANT || 0, color: "#3b82f6" },
          { label: "Inventors", count: counts.INVENTOR || 0, color: "#22c55e" }
        ].map(c => (
          <div key={c.label} style={{ ...S.statCard, borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: c.color }}>{c.count}</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: '0.9rem' }}></i>
          <input style={S.searchInput} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }} type="button"><i className="bi bi-x"></i></button>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ALL", "ADMIN", "CONSULTANT", "INVENTOR"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{ ...S.filterBtn, ...(roleFilter === r ? S.filterBtnOn : {}) }} type="button">
              {r === "ALL" ? `All (${counts.ALL || 0})` : `${r} (${counts[r] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80 }}>
            <span style={{ ...S.spin, width: 36, height: 36, borderWidth: 3, borderTopColor: '#eab308' }} />
            <p style={{ color: "#6b7280", marginTop: 16 }}>Loading users…</p>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 80, color: "#9ca3af" }}>
            <i className="bi bi-person-slash" style={{ fontSize: '3rem', color: '#d1d5db' }}></i>
            <p style={{ marginTop: 12 }}>No users found.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["#", "User", "Email", "Password", "Role", "Status", "Joined", "Actions"].map((h, i) => (
                  <th key={h} style={{ ...S.th, textAlign: i === 7 ? "center" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((u, i) => {
                const rc = RC[u.user_type] || { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" };
                const rev = revealPw[u.id];
                const stBg = u.approval_status === "approved" ? "#dcfce7" : u.approval_status === "pending" ? "#fef3c7" : "#fee2e2";
                const stC = u.approval_status === "approved" ? "#15803d" : u.approval_status === "pending" ? "#92400e" : "#dc2626";
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ ...S.td, color: "#9ca3af", fontWeight: 500, width: 46 }}>{i + 1}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...S.avSm, background: grad(u.full_name) }}>{initials(u.full_name)}</div>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td style={S.td}><span style={{ background: "#f1f5f9", padding: "3px 10px", borderRadius: 20, fontSize: 13, color: "#4b5563" }}>{u.email || "—"}</span></td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: rev ? 12 : 17, letterSpacing: rev ? 0 : 3, color: "#374151" }}>{rev ? "••••••• (bcrypt)" : "•".repeat(12)}</span>
                        <button onClick={() => setRevealPw(r => ({ ...r, [u.id]: !r[u.id] }))} style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "3px 7px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }} title={rev ? "Hide" : "Show"} type="button">
                          {rev ? <i className="bi bi-eye-slash-fill" style={{ fontSize: '0.9rem' }}></i> : <i className="bi bi-eye-fill" style={{ fontSize: '0.9rem' }}></i>}
                        </button>
                      </div>
                    </td>
                    <td style={S.td}><span style={{ ...S.badge, background: rc.bg, color: rc.text }}><span style={{ ...S.dot, background: rc.dot }} />{u.user_type}</span></td>
                    <td style={S.td}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize", background: stBg, color: stC }}>{u.approval_status || "—"}</span></td>
                    <td style={{ ...S.td, color: "#6b7280", fontSize: 13 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <button onClick={() => setEditUser(u)} style={S.editBtn} type="button">
                        <i className="bi bi-pencil-square" style={{ fontSize: '0.9rem' }}></i>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, color: "#9ca3af", fontSize: 13, textAlign: "right" }}>
        Showing <strong>{shown.length}</strong> of <strong>{users.length}</strong> users
      </div>

      {editUser && (
        <EditModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetchUsers(); flash("User updated successfully!"); }} />
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "#f1f5f9", padding: "32px 40px", fontFamily: "'Inter',-apple-system,sans-serif", boxSizing: "border-box" },
  pageTitle: { fontSize: 25, fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center" },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.08)" },
  tableWrap: { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.08)", overflowX: "auto" },
  th: { padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  td: { padding: "13px 16px", fontSize: 14, color: "#374151", verticalAlign: "middle" },
  avSm: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  avLg: { width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 },
  badge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  dot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  editBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "#fef3c7", color: "#a16207", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnRefresh: { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 500 },
  searchInput: { width: "100%", padding: "10px 36px 10px 38px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none", boxSizing: "border-box", color: "#111827" },
  filterBtn: { padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  filterBtnOn: { background: "#eab308", color: "#fff", borderColor: "#eab308" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  gateCard: { background: "#fff", borderRadius: 20, padding: "40px 44px", width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,.2)", textAlign: "center" },
  lockCircle: { width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#eab308, #854d0e)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 20px rgba(234,179,8,.35)" },
  gateTitle: { fontSize: 21, fontWeight: 700, color: "#111827", margin: "0 0 8px" },
  gateSub: { color: "#6b7280", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" },
  gateErr: { color: "#dc2626", fontSize: 13, marginTop: 8, marginBottom: 0 },
  gateRow: { display: "flex", gap: 12, marginTop: 22 },
  editCard: { background: "#fff", borderRadius: 18, padding: "32px 36px", width: "100%", maxWidth: 580, boxShadow: "0 20px 50px rgba(0,0,0,.16)" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  errBox: { display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginTop: 14 },
  closeBtn: { background: "#f3f4f6", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#6b7280", display: "flex" },
  inputWrap: { position: "relative" },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#111827", background: "#fff" },
  eyeBtn: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, color: "#6b7280" },
  btnCancel: { flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnCancel2: { padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnConfirm: { flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#eab308, #854d0e)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSave: { padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#eab308, #854d0e)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
  toast: { position: "fixed", bottom: 28, right: 28, zIndex: 99999, display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 10, border: "1px solid", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,.12)", animation: "acm-slide .25s ease" },
  spin: { display: "inline-block", width: 17, height: 17, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "acm-spin .7s linear infinite", flexShrink: 0 },
};