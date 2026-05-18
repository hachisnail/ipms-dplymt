/* ============================================================
   homePageData.js  —  Live data fetcher for HomePage.jsx
   Fetches all homepage content from the CMS backend in one call.
   No auth required — uses the public endpoint.
   ============================================================ */

// ── URL normalizer ────────────────────────────────────────────
const _RAW     = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace(/\/$/, '');
const API_BASE = _RAW.endsWith('/api') ? _RAW : `${_RAW}/api`;

/* ─────────────────────────────────────────────────────────────
   DEFAULT / SEED DATA
   Must be declared FIRST — used by getStaticDefaults()
   and the named exports below.
──────────────────────────────────────────────────────────────── */
const defaultNav = [
  { id: 'home',       type: 'link',     label: 'Home',       href: '/' },
  { id: 'services',   type: 'dropdown', label: 'Services',   children: [
    { id: 'svc-registration', label: 'Registration', href: '#' },
    { id: 'svc-application',  label: 'Application',  href: '#' },
    { id: 'svc-filing',       label: 'Filing',        href: '#' },
  ]},
  { id: 'references', type: 'dropdown', label: 'References', children: [
    { id: 'ref-copyright',   label: 'Copyright',              href: '#' },
    { id: 'ref-trademark',   label: 'Trademark',              href: '#' },
    { id: 'ref-utility',     label: 'Utility Model',          href: '#' },
    { id: 'ref-industrial',  label: 'Industrial Design',      href: '#' },
    { id: 'ref-statistics',  label: 'Statistics',             href: '#' },
    { id: 'ref-laws',        label: 'Laws & Rules',           href: '#' },
    { id: 'ref-faq',         label: 'FAQ',                    href: '#' },
    { id: 'ref-privacy',     label: 'Privacy Notice',         href: '#' },
    { id: 'ref-glossary',    label: 'Glossary of Terms',      href: '#' },
    { id: 'ref-issuances',   label: 'Issuances',              href: '#' },
  ]},
  { id: 'forms',   type: 'dropdown', label: 'Forms',    children: [] },
  { id: 'updates', type: 'dropdown', label: 'Updates',  children: [
    { id: 'upd-announcements', label: 'Announcements', href: '#' },
    { id: 'upd-advisories',    label: 'Advisories',    href: '#' },
    { id: 'upd-events',        label: 'Events',        href: '#' },
    { id: 'upd-articles',      label: 'Articles',      href: '#' },
  ]},
  { id: 'contact', type: 'link', label: 'Contact', href: '#contact' },
  { id: 'about',   type: 'link', label: 'About',   href: '#about'   },
];

const defaultSlides = [
  {
    id: 'womens-month-2025',
    tag: "March · Women's Month 2025",
    headline: 'Celebrating Women in Innovation',
    sub: 'IPMO honors the groundbreaking contributions of women inventors, creators, and IP rights holders.',
    emoji: '🌸', imageUrl: null, ctaLabel: 'Learn More', ctaHref: '#',
    bg: 'linear-gradient(135deg, #800000 0%, #a03030 55%, #005555 100%)',
  },
  {
    id: 'online-reg-live',
    tag: 'New Service',
    headline: 'Online Registration Now Live',
    sub: 'Students and faculty can now register their intellectual property online 24/7.',
    emoji: '🚀', imageUrl: null, ctaLabel: 'Register', ctaHref: '#',
    bg: 'linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 55%, #005555 100%)',
  },
];

const defaultCategories = [
  { id: 'copyright',         icon: '©',  title: 'Copyright',         desc: 'Protects original literary, artistic, musical, and other creative works.', services: ['Registration','Licensing','Infringement Filing'],          color: '#800000', colorLight: 'rgba(128,0,0,0.09)'  },
  { id: 'utility-model',     icon: '⚙️', title: 'Utility Model',     desc: 'Covers functional inventions and technical innovations.',                  services: ['Application','Technical Review','Renewal'],                color: '#005555', colorLight: 'rgba(0,85,85,0.09)'   },
  { id: 'industrial-design', icon: '🎨', title: 'Industrial Design',  desc: 'Safeguards the aesthetic and ornamental aspects of products.',             services: ['Design Registration','Portfolio Filing','Status Check'],    color: '#333333', colorLight: 'rgba(51,51,51,0.09)'  },
  { id: 'trademark',         icon: '™',  title: 'Trademark',          desc: 'Distinguishes goods and services through brand identifiers.',              services: ['Trademark Search','Registration','Opposition Filing'],       color: '#800000', colorLight: 'rgba(128,0,0,0.09)'  },
];

const defaultNews = [
  {
    id: 'news-001', type: 'announcement', tag: 'Announcement', date: 'Mar 5, 2025',
    emoji: '📢', imageUrl: null,
    title: 'IP Registration Opens for AY 2025–2026',
    subtitle: 'Academic Year Registration Window Now Active',
    excerpt: 'Faculty and student researchers may now file their IP registrations.',
    color: '#800000', colorLight: 'rgba(128,0,0,0.07)',
  },
  {
    id: 'news-002', type: 'event', tag: 'Event', date: 'Mar 1, 2025',
    emoji: '🗓️', imageUrl: null,
    title: 'Free IP Consultation — March 18',
    subtitle: 'Walk-In Day for All Community Members',
    excerpt: 'Walk-in consultation day for all members of the academic community.',
    color: '#005555', colorLight: 'rgba(0,85,85,0.07)',
  },
];

const defaultIssuances = [
  { year: 2026, docs: [
    { id: 'iss-2026-001', name: 'Memorandum No. 2026-01', title: 'Guidelines on Online IP Filing Procedures', href: '#' },
  ]},
  { year: 2025, docs: [
    { id: 'iss-2025-001', name: 'Memorandum No. 2025-01', title: 'Annual IP Awareness Campaign Guidelines',   href: '#' },
  ]},
];

const defaultIPWall = [
  { year: 2025, entries: [
    { id: 'ip-2025-01', title: 'Ergonomic Harvesting Tool Design', inventor: 'Ana Reyes',
      type: 'Industrial Design', status: 'Approved', regNo: 'ID-2025-0003', department: '', imgUrl: null },
  ]},
];

const defaultCompliance = [
  { id: 'school',  abbr: 'SU',     label: 'School / University',            bg: '#800000', logoUrl: null },
  { id: 'ipophl',  abbr: 'IPOPHL', label: 'IP Office of the Philippines',   bg: '#6b0000', logoUrl: null },
  { id: 'wipo',    abbr: 'WIPO',   label: 'World IP Organization',          bg: '#005555', logoUrl: null },
  { id: 'ched',    abbr: 'CHED',   label: 'Commission on Higher Education', bg: '#333',    logoUrl: null },
  { id: 'dost',    abbr: 'DOST',   label: 'Dept. of Science & Technology',  bg: '#005580', logoUrl: null },
];

const defaultAppearance = {
  headerBg:      '#ffffff',
  headerAccent:  '#800000',
  pageBg:        '#f2f2f2',
  primaryColor:  '#800000',
  schoolLogoUrl: '',
  officeLogoUrl: '',
  officeName:    'Management Office',
  officeNameSub: 'Intellectual Property',
};

/* ─────────────────────────────────────────────────────────────
   STATIC FALLBACK BUILDER
──────────────────────────────────────────────────────────────── */
function getStaticDefaults() {
  // Return seed nav so the Home link always renders even when the backend is unreachable.
  // All other sections show friendly empty states until admin adds content via CMS.
  return {
    navItems:        defaultNav,
    displaySlides:   [],
    categoryData:    [],
    newsData:        [],
    issuancesData:   [],
    ipWallData:      [],
    complianceLogos: [],
    appearanceData:  {
      headerBg:      '#ffffff',
      headerAccent:  '#800000',
      pageBg:        '#f2f2f2',
      primaryColor:  '#800000',
      schoolLogoUrl: '',
      officeLogoUrl: '',
      officeName:    '',
      officeNameSub: '',
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   LIVE FETCHER
   Calls /api/cms/public/all — no auth required.
   Falls back to static defaults if the backend is unreachable.
──────────────────────────────────────────────────────────────── */
export async function fetchHomePageData() {
  try {
    const url = `${API_BASE}/cms/public/all`;
    const res = await fetch(url, {
      method:  'GET',
      headers: { 'Cache-Control': 'no-cache' },
      // No Authorization header — this is a public endpoint
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`CMS fetch failed: ${res.status} — ${text.slice(0, 120)}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[homePageData] falling back to static defaults:', err.message);
    return getStaticDefaults();
  }
}

/* ─────────────────────────────────────────────────────────────
   NAMED EXPORTS — backward compat for any direct imports
──────────────────────────────────────────────────────────────── */
export const navItems         = defaultNav;
export const displaySlides    = defaultSlides;
export const categoryData     = defaultCategories;
export const newsData         = defaultNews;
export const issuancesData    = defaultIssuances;
export const ipWallData       = defaultIPWall;
export const complianceLogos  = defaultCompliance;
export const appearanceData   = defaultAppearance;