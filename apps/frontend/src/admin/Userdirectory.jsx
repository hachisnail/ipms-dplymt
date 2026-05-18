import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Directory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const BASE_URL = API_URL.replace('/api', '');

const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided';
const ROLE_CONFIG = {
    INVENTOR:    { label: 'Inventor',    icon: 'bi-person-fill',       badgeClass: 'inventor',    color: '#800000' },
    CONSULTANT:  { label: 'Specialist',  icon: 'bi-award-fill',         badgeClass: 'consultant',  color: '#005555' },
    ADMIN:       { label: 'Admin',       icon: 'bi-shield-lock-fill',   badgeClass: 'admin',       color: '#6d28d9' },
};

const resolveRole = (user) => {
    const t = (user.user_type || '').toUpperCase();
    if (t === 'INVENTOR')                 return 'INVENTOR';
    if (t === 'CONSULTANT' || t === 'SPECIALIST') return 'CONSULTANT';
    if (t === 'ADMIN')                    return 'ADMIN';
    return 'INVENTOR';
};

const avatarBg = (role) => role === 'CONSULTANT' ? '005555' : role === 'ADMIN' ? '6d28d9' : '800000';

/* ── Toast component ──────────────────────────────────────── */
function Toast({ message, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`ud-toast ud-toast--${type}`}>
            <i className={`bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
            {message}
        </div>
    );
}

/* ── Deactivate/Activate confirm modal ────────────────────── */
function ToggleModal({ user, onConfirm, onCancel, loading }) {
    const isActive = user.status === 'active' || user.is_active;
    const role = resolveRole(user);
    const cfg  = ROLE_CONFIG[role];
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content deactivate-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header-action">
                    <div className={`icon-circle ${isActive ? 'reject' : 'approve'}`}>
                        <i className={`bi ${isActive ? 'bi-person-x-fill' : 'bi-person-check-fill'}`}></i>
                    </div>
                    <h2>{isActive ? 'Deactivate' : 'Activate'} Account</h2>
                </div>
                <p className="confirmation-text">
                    Are you sure you want to <strong>{isActive ? 'deactivate' : 'activate'}</strong> the account of{' '}
                    <strong>{user.full_name}</strong>?{' '}
                    {isActive
                        ? 'This will prevent them from logging in.'
                        : 'This will restore their access to the system.'}
                </p>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
                    <button
                        className={isActive ? 'btn-reject' : 'btn-approve'}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? <><i className="bi bi-arrow-repeat ud-spin"></i> Processing…</> :
                            isActive ? <><i className="bi bi-person-x-fill"></i> Deactivate</> :
                                       <><i className="bi bi-person-check-fill"></i> Activate</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Profile modal ────────────────────────────────────────── */
function ProfileModal({ user, onClose, onToggle }) {
    const role = resolveRole(user);
    const cfg  = ROLE_CONFIG[role];
    const isActive = user.status === 'active' || user.is_active;

    const avatarSrc = user.profile_picture
        ? `${BASE_URL}/uploads/profile-pictures/${user.profile_picture}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'U')}&background=${avatarBg(role)}&color=fff&size=120`;

    const details = [
        { icon: 'bi-envelope-fill',      cls: 'email',     label: 'Email Address',   value: user.email },
        { icon: 'bi-telephone-fill',     cls: 'phone',     label: 'Contact Number',  value: user.contact },
        { icon: 'bi-building',           cls: 'building',  label: 'Delivery Unit',   value: user.delivery_unit },
        { icon: 'bi-briefcase-fill',     cls: 'briefcase', label: 'Position',        value: user.position },
        { icon: 'bi-award-fill',         cls: 'building',  label: 'Expertise Area',  value: user.expertise_area || user.specialization || user.ip_category },
        { icon: 'bi-shield-fill',        cls: 'status',    label: 'Admin Level',     value: user.admin_level },
        { icon: 'bi-calendar-event',     cls: 'calendar',  label: 'Age',             value: user.age },
        { icon: 'bi-gift-fill',          cls: 'birthday',  label: 'Birthdate',       value: user.birthdate ? fmt(user.birthdate) : null },
        { icon: 'bi-calendar-plus-fill', cls: 'joined',    label: 'Joined Date',     value: user.created_at ? fmt(user.created_at) : null },
        { icon: 'bi-geo-alt-fill',       cls: 'location',  label: 'Address',         value: user.address, full: true },
    ].filter(d => d.value);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modern-profile-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>

                <div className="modern-profile-header">
                    <div className="profile-header-bg"></div>
                    <div className="profile-header-content">
                        <img src={avatarSrc} alt={user.full_name} className="modern-profile-image"
                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'U')}&background=${avatarBg(role)}&color=fff&size=120`; }} />
                        <h2>{user.full_name}</h2>
                        <span className={`user-type-badge ${cfg.badgeClass} large`}>
                            <i className={`bi ${cfg.icon}`}></i> {cfg.label}
                        </span>
                        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`} style={{ marginTop: 8 }}>
                            <i className={`bi ${isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="modern-profile-body">
                    <div className="detail-grid">
                        {details.map((d, i) => (
                            <div className={`detail-card${d.full ? ' full-width' : ''}`} key={i}>
                                <div className={`detail-icon ${d.cls}`}>
                                    <i className={`bi ${d.icon}`}></i>
                                </div>
                                <div className="detail-content">
                                    <label>{d.label}</label>
                                    <p>{d.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className={isActive ? 'btn-deactivate' : 'btn-activate'}
                        onClick={() => { onClose(); onToggle(user); }}
                    >
                        <i className={`bi ${isActive ? 'bi-person-x-fill' : 'bi-person-check-fill'}`}></i>
                        {isActive ? 'Deactivate Account' : 'Activate Account'}
                    </button>
                    <button className="btn-close-modal" onClick={onClose}>
                        <i className="bi bi-x-circle"></i> Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT — UserDirectory
════════════════════════════════════════════════════════ */
export default function UserDirectory() {
    const [users,       setUsers]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [searchTerm,  setSearchTerm]  = useState('');
    const [roleFilter,  setRoleFilter]  = useState('ALL');
    const [statusFilter,setStatusFilter]= useState('ALL');
    const [selected,    setSelected]    = useState(null);
    const [toggleUser,  setToggleUser]  = useState(null);
    const [actLoading,  setActLoading]  = useState(false);
    const [toast,       setToast]       = useState(null);

    /* ── Fetch all users ───────────────────────────────── */
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const hdrs  = { Authorization: `Bearer ${token}` };

            const [invRes, specRes, approvedRes] = await Promise.all([
                axios.get(`${API_URL}/admin/inventors`,   { headers: hdrs }),
                axios.get(`${API_URL}/admin/consultants`, { headers: hdrs }),
                axios.get(`${API_URL}/admin/users/approved`, { headers: hdrs }),
            ]);

            const inventors    = (invRes.data.data    || []).map(u => ({ ...u, _role: 'INVENTOR'   }));
            const specialists  = (specRes.data.data   || []).map(u => ({ ...u, _role: 'CONSULTANT' }));
            const admins       = (approvedRes.data.data || [])
                .filter(u => u.user_type === 'ADMIN')
                .map(u => ({ ...u, _role: 'ADMIN' }));

            // Deduplicate by id (use a Map keyed by id)
            const map = new Map();
            [...inventors, ...specialists, ...admins].forEach(u => {
                if (!map.has(u.id)) map.set(u.id, u);
            });

            const combined = Array.from(map.values())
                .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

            setUsers(combined);
            setError(null);
        } catch (err) {
            console.error('UserDirectory fetch error:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Toggle active/inactive ────────────────────────── */
    const confirmToggle = async () => {
        if (!toggleUser) return;
        try {
            setActLoading(true);
            const token = localStorage.getItem('token');
            const isActive  = toggleUser.status === 'active' || toggleUser.is_active;
            const newStatus = isActive ? 'inactive' : 'active';

            await axios.put(
                `${API_URL}/admin/users/${toggleUser.id}/toggle-access`,
                { is_active: !isActive },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUsers(prev => prev.map(u =>
                u.id === toggleUser.id
                    ? { ...u, status: newStatus, is_active: !isActive }
                    : u
            ));

            setToast({ message: `${toggleUser.full_name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`, type: 'success' });
            setToggleUser(null);
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to update account status.', type: 'error' });
        } finally {
            setActLoading(false);
        }
    };

    /* ── Derived stats ─────────────────────────────────── */
    const total      = users.length;
    const activeCount= users.filter(u => u.status === 'active' || u.is_active).length;
    const invCount   = users.filter(u => u._role === 'INVENTOR').length;
    const specCount  = users.filter(u => u._role === 'CONSULTANT').length;
    const admCount   = users.filter(u => u._role === 'ADMIN').length;

    /* ── Filtering ─────────────────────────────────────── */
    const visible = users.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.delivery_unit?.toLowerCase().includes(q) ||
            u.contact?.includes(q) ||
            u.expertise_area?.toLowerCase().includes(q) ||
            u.admin_level?.toLowerCase().includes(q);

        const matchRole = roleFilter === 'ALL' || u._role === roleFilter;
        const isActive  = u.status === 'active' || u.is_active;
        const matchStatus = statusFilter === 'ALL'
            || (statusFilter === 'ACTIVE'   &&  isActive)
            || (statusFilter === 'INACTIVE' && !isActive);

        return matchSearch && matchRole && matchStatus;
    });

    if (error) return (
        <div className="directory-container">
            <div className="error-message">
                <i className="bi bi-exclamation-triangle"></i>
                <p>{error}</p>
                <button onClick={fetchAll} className="btn-retry"><i className="bi bi-arrow-repeat"></i> Retry</button>
            </div>
        </div>
    );

    /* ── Render ────────────────────────────────────────── */
    return (
        <div className="directory-container">

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── Header ── */}
            <div className="directory-header">
                <div className="header-left">
                    <h2><i className="bi bi-people-fill"></i> User Directory</h2>
                    <p className="subtitle">All registered system users — Inventors, Specialists, and Administrators</p>
                </div>
                <div className="header-right">
                    <button onClick={fetchAll} className="btn-refresh">
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            {/* ── Summary stats ── */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-people-fill"></i></div>
                    <div className="stat-content"><h3>{total}</h3><p>Total Users</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active"><i className="bi bi-check-circle-fill"></i></div>
                    <div className="stat-content"><h3>{activeCount}</h3><p>Active</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#800000,#660000)' }}>
                        <i className="bi bi-person-fill"></i>
                    </div>
                    <div className="stat-content"><h3>{invCount}</h3><p>Inventors</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#005555,#004444)' }}>
                        <i className="bi bi-award-fill"></i>
                    </div>
                    <div className="stat-content"><h3>{specCount}</h3><p>Specialists</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6d28d9,#5b21b6)' }}>
                        <i className="bi bi-shield-lock-fill"></i>
                    </div>
                    <div className="stat-content"><h3>{admCount}</h3><p>Admins</p></div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="filters-row">
                <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search by name, email, unit, or contact…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label><i className="bi bi-person-badge"></i> Role:</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="ALL">All Roles</option>
                        <option value="INVENTOR">Inventor / Applicant</option>
                        <option value="CONSULTANT">Specialist</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label><i className="bi bi-activity"></i> Status:</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                <span className="ud-result-count">
                    Showing <strong>{visible.length}</strong> of <strong>{total}</strong> user{total !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Table ── */}
            <div className="table-wrap">
                {visible.length === 0 ? (
                    <div className="no-data">
                        <i className="bi bi-inbox"></i>
                        <p>{users.length === 0 ? 'No users found.' : 'No users match your current filters.'}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Profile</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Unit / Expertise</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((user, idx) => {
                                const role    = user._role || resolveRole(user);
                                const cfg     = ROLE_CONFIG[role];
                                const isActive= user.status === 'active' || user.is_active;
                                const unit    = user.delivery_unit || user.expertise_area || user.specialization || user.ip_category || user.admin_level || '—';
                                const avatar  = user.profile_picture
                                    ? `${BASE_URL}/uploads/profile-pictures/${user.profile_picture}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'U')}&background=${avatarBg(role)}&color=fff&size=40`;

                                return (
                                    <tr key={user.id}>
                                        <td style={{ color: 'var(--dir-text-muted)', fontSize: 12 }}>{idx + 1}</td>
                                        <td>
                                            <img
                                                src={avatar}
                                                alt={user.full_name}
                                                className="profile-thumb"
                                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'U')}&background=${avatarBg(role)}&color=fff&size=40`; }}
                                            />
                                        </td>
                                        <td className="name-cell">{user.full_name || '—'}</td>
                                        <td style={{ fontSize: 13, color: 'var(--dir-text-soft)' }}>{user.email || '—'}</td>
                                        <td>
                                            <span className={`role-badge ${cfg.badgeClass}`}>
                                                <i className={`bi ${cfg.icon}`}></i> {cfg.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="unit-badge">{unit}</span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--dir-text-muted)', whiteSpace: 'nowrap' }}>
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                                                <i className={`bi bi-circle-fill`} style={{ fontSize: 7 }}></i>
                                                {isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-view" onClick={() => setSelected(user)} title="View Profile">
                                                    <i className="bi bi-eye"></i> View
                                                </button>
                                                {isActive ? (
                                                    <button className="btn-deactivate" onClick={() => setToggleUser(user)} title="Deactivate Account">
                                                        <i className="bi bi-person-x-fill"></i> Deactivate
                                                    </button>
                                                ) : (
                                                    <button className="btn-activate" onClick={() => setToggleUser(user)} title="Activate Account">
                                                        <i className="bi bi-person-check-fill"></i> Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Profile Modal ── */}
            {selected && (
                <ProfileModal
                    user={selected}
                    onClose={() => setSelected(null)}
                    onToggle={(u) => { setSelected(null); setToggleUser(u); }}
                />
            )}

            {/* ── Toggle Confirm Modal ── */}
            {toggleUser && (
                <ToggleModal
                    user={toggleUser}
                    onConfirm={confirmToggle}
                    onCancel={() => setToggleUser(null)}
                    loading={actLoading}
                />
            )}
        </div>
    );
}