// profileApi.js — shared helpers for all profile pages

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3006/api').replace('/api', '');
const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

export const getToken = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').token || localStorage.getItem('token') || ''; }
    catch { return localStorage.getItem('token') || ''; }
};

export const hdrs = (extra = {}) => ({
    Authorization: `Bearer ${getToken()}`,
    ...extra,
});

/** Build full URL for a stored profile picture filename */
export const picUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${BASE}/uploads/profile-pictures/${filename}`;
};

/** GET /api/auth/profile */
export const fetchProfile = async () => {
    const res = await fetch(`${API}/auth/profile`, { headers: hdrs() });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load profile');
    return json.data;
};

/** PUT /api/users/profile — text fields */
export const saveProfile = async (fields) => {
    const res = await fetch(`${API}/users/profile`, {
        method: 'PUT',
        headers: hdrs({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(fields),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to save profile');
    return json;
};

/** POST /api/users/profile-picture — upload photo */
export const uploadPhoto = async (file) => {
    const fd = new FormData();
    fd.append('profilePicture', file);
    const res = await fetch(`${API}/users/profile-picture`, {
        method: 'POST',
        headers: hdrs(),
        body: fd,
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Upload failed');
    return json; // { filename, url }
};

/** DELETE /api/users/profile-picture */
export const removePhoto = async () => {
    const res = await fetch(`${API}/users/profile-picture`, {
        method: 'DELETE',
        headers: hdrs(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to remove photo');
    return json;
};

/** PUT /api/users/change-password */
export const changePassword = async (currentPassword, newPassword) => {
    const res = await fetch(`${API}/users/change-password`, {
        method: 'PUT',
        headers: hdrs({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to change password');
    return json;
};

/** Update localStorage after profile save so Avatars refresh */
export const syncLocalStorage = (updates) => {
    try {
        const key  = localStorage.getItem('user') ? 'user' : null;
        if (!key) return;
        const curr = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({ ...curr, ...updates }));
    } catch {}
};