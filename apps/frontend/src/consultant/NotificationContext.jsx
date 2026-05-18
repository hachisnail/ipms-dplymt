/* ============================================================
   NotificationContext.jsx
   Shared notification state consumed by:
     - ConsultantNotice.jsx  (bell icon dropdown)
     - Sidebar nav items     (navDropList badges)

   Provides:
     unreadCount          — total unread (for bell badge)
     countByType          — { under_review: { id, um, cr, tm }, approved: { id, um, cr, tm }, assigned: N }
     notifications        — full list for the dropdown
     refresh()            — manual refetch
   ============================================================ */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3006/api')
  .replace(/\/$/, '')
  .replace(/\/api$/, '') + '/api';

const hdrs = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/* ── submission_type helpers ─────────────────────────────── */
const norm = (s = '') => s.toLowerCase().replace(/\s+/g, '_');

// Map submission_type string → short key (id | um | tm | cr)
const typeKey = (submission_type = '', ip_type = '') => {
  const s = norm(submission_type || ip_type);
  if (s.includes('industrial')) return 'id';
  if (s.includes('utility'))    return 'um';
  if (s.includes('trademark'))  return 'tm';
  if (s.includes('copyright'))  return 'cr';
  return null;
};

/* ── Default counts ─────────────────────────────────────── */
const empty = () => ({ id: 0, um: 0, tm: 0, cr: 0 });

const NotifCtx = createContext({
  unreadCount:  0,
  countByType:  { under_review: empty(), approved: empty(), assigned: 0 },
  notifications: [],
  loading:      true,
  refresh:      () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [countByType,   setCountByType]   = useState({
    under_review: empty(),
    approved:     empty(),
    assigned:     0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        fetch(`${API}/notifications`,             { headers: hdrs() }),
        fetch(`${API}/notifications/unread-count`,{ headers: hdrs() }),
      ]);
      if (!nRes.ok || !cRes.ok) return;

      const [nData, cData] = await Promise.all([nRes.json(), cRes.json()]);

      const list = Array.isArray(nData) ? nData : [];
      setNotifications(list);
      setUnreadCount(typeof cData.count === 'number' ? cData.count : 0);

      // ── Count unread notifications per nav category ──────
      const ur  = empty();
      const apv = empty();
      let assigned = 0;

      list.forEach(n => {
        if (n.is_read) return; // only count unread
        const t   = norm(n.type || '');
        const key = typeKey(n.submission_type, n.ip_type);

        if (t === 'assigned' || t === 'new_assignment') {
          assigned++;
        } else if (t.includes('under_review') || t.includes('review') || t.includes('resubmit')) {
          if (key) ur[key]++;
        } else if (t.includes('approved') || t.includes('filing')) {
          if (key) apv[key]++;
        }
      });

      setCountByType({ under_review: ur, approved: apv, assigned });
    } catch (e) {
      console.warn('[NotifCtx] fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <NotifCtx.Provider value={{ unreadCount, countByType, notifications, loading, refresh }}>
      {children}
    </NotifCtx.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifCtx);
}

export default NotifCtx;