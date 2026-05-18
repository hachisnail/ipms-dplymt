// ============================================================
//  cms_routes.js  —  CNSC-IPMO Content Management System
//
//  Exported as a FACTORY FUNCTION that accepts the shared pool
//  from index.js — avoids creating a second DB connection with
//  missing env vars.
//
//  Usage in index.js:
//    import { createCmsRouter } from './cms_routes.js';
//    const cmsRouter = createCmsRouter(pool);
//    app.use('/api/cms/public', cmsRouter);
//    app.use('/api/cms', authMiddleware, isAdminMiddleware, cmsRouter);
// ============================================================

import express   from 'express';
import multer    from 'multer';
import path      from 'path';
import fs        from 'fs';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── File upload (cms logos / images) ─────────────────────────
const CMS_UPLOAD_DIR = path.resolve(__dirname, 'uploads', 'cms');
if (!fs.existsSync(CMS_UPLOAD_DIR)) fs.mkdirSync(CMS_UPLOAD_DIR, { recursive: true });

const cmsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CMS_UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage: cmsStorage,
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp|svg|pdf/.test(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error('Only images and PDFs allowed'), ok);
  },
});

// ── Audit log helper ─────────────────────────────────────────
async function auditLog(pool, adminId, adminName, component, action, previousValue = null) {
  await pool.execute(
    `INSERT INTO cms_audit_log (admin_id, admin_name, component, action, previous_value, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [adminId, adminName, component, action, previousValue ? JSON.stringify(previousValue) : null]
  );
}

// ── Admin identity — matches authMiddleware (req.userId) ─────
const who = req => ({
  id:   req.userId || 0,
  name: req.userName || req.userEmail || 'Admin',
});

// ── Factory: call with the shared pool from index.js ─────────
export function createCmsRouter(pool) {
  const router = express.Router();

// ============================================================
//  1. NAVIGATION  —  /api/cms/nav
// ============================================================

// GET  — load full nav tree
router.get('/nav', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM cms_nav ORDER BY sort_order ASC, id ASC`
    );
    // Build tree: top-level items + their children
    const topLevel = rows.filter(r => !r.parent_id && !r.parent_sub_id);
    const tree = topLevel.map(item => {
      const children = rows
        .filter(r => r.parent_id === item.id && !r.parent_sub_id)
        .map(child => {
          if (child.type === 'subdropdown') {
            return {
              ...child,
              children: rows.filter(r => r.parent_sub_id === child.id),
            };
          }
          return child;
        });
      return { ...item, children };
    });
    res.json(tree);
  } catch (e) {
    console.error('[CMS nav GET]', e);
    res.status(500).json({ error: 'Failed to load nav' });
  }
});

// PUT  — save entire nav tree (replace strategy)
router.put('/nav', async (req, res) => {
  const { nav } = req.body;
  if (!Array.isArray(nav)) return res.status(400).json({ error: 'nav must be an array' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM cms_nav`);

    const insertItem = async (item, parentId = null, parentSubId = null, order = 0) => {
      const [result] = await conn.execute(
        `INSERT INTO cms_nav (item_id, type, label, href, parent_id, parent_sub_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.type || 'link', item.label, item.href || null, parentId, parentSubId, order]
      );
      const dbId = result.insertId;

      if (Array.isArray(item.children)) {
        for (let i = 0; i < item.children.length; i++) {
          const child = item.children[i];
          if (child.type === 'subdropdown') {
            // Insert subdropdown row
            const [subResult] = await conn.execute(
              `INSERT INTO cms_nav (item_id, type, label, href, parent_id, parent_sub_id, sort_order)
               VALUES (?, 'subdropdown', ?, ?, ?, NULL, ?)`,
              [child.id, child.label, null, dbId, i]
            );
            const subDbId = subResult.insertId;
            // Insert subdropdown's nested links
            if (Array.isArray(child.children)) {
              for (let j = 0; j < child.children.length; j++) {
                const link = child.children[j];
                await conn.execute(
                  `INSERT INTO cms_nav (item_id, type, label, href, parent_id, parent_sub_id, sort_order)
                   VALUES (?, 'link', ?, ?, ?, ?, ?)`,
                  [link.id, link.label, link.href || '#', dbId, subDbId, j]
                );
              }
            }
          } else {
            await conn.execute(
              `INSERT INTO cms_nav (item_id, type, label, href, parent_id, parent_sub_id, sort_order)
               VALUES (?, 'link', ?, ?, ?, NULL, ?)`,
              [child.id, child.label, child.href || '#', dbId, i]
            );
          }
        }
      }
    };

    for (let i = 0; i < nav.length; i++) await insertItem(nav[i], null, null, i);

    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'Header', 'Nav links saved');
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[CMS nav PUT]', e);
    res.status(500).json({ error: 'Failed to save nav' });
  } finally {
    conn.release();
  }
});

// ============================================================
//  2. DISPLAY SLIDES  —  /api/cms/slides
// ============================================================

router.get('/slides', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM cms_slides ORDER BY sort_order ASC, id ASC`);
    res.json(rows.map(r => ({ ...r, imageUrl: r.image_url, ctaLabel: r.cta_label, ctaHref: r.cta_href })));
  } catch (e) { res.status(500).json({ error: 'Failed to load slides' }); }
});

router.put('/slides', async (req, res) => {
  const { slides } = req.body;
  if (!Array.isArray(slides)) return res.status(400).json({ error: 'slides must be an array' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM cms_slides`);
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      await conn.execute(
        `INSERT INTO cms_slides (slide_id, tag, headline, sub_text, emoji, image_url, cta_label, cta_href, bg_css, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id        ?? null,
          s.tag       ?? null,
          s.headline  ?? null,
          s.sub       ?? null,
          s.emoji     ?? '📌',
          s.imageUrl  ?? null,
          s.ctaLabel  ?? 'Learn More',
          s.ctaHref   ?? '#',
          s.bg        ?? '',
          i
        ]
      );
    }
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'Display', 'Slides saved');
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[CMS slides PUT]', e);
    res.status(500).json({ error: 'Failed to save slides' });
  } finally { conn.release(); }
});

// ============================================================
//  3. CATEGORIES  —  /api/cms/categories
// ============================================================

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM cms_categories ORDER BY sort_order ASC, id ASC`);
    const [services] = await pool.execute(`SELECT * FROM cms_category_services ORDER BY sort_order ASC`);
    const result = rows.map(r => ({
      id: r.cat_id, icon: r.icon, title: r.title, desc: r.description, pageSlug: r.page_slug || null,
      color: r.color, colorLight: r.color_light,
      services: services.filter(s => s.cat_id === r.cat_id).map(s => s.service_label),
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Failed to load categories' }); }
});

router.put('/categories', async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) return res.status(400).json({ error: 'categories must be an array' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM cms_category_services`);
    await conn.execute(`DELETE FROM cms_categories`);
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      await conn.execute(
        `INSERT INTO cms_categories (cat_id, icon, title, description, color, color_light, page_slug, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.icon || '★', c.title, c.desc || '', c.color || '#800000', c.colorLight || '', c.pageSlug || null, i]
      );
      if (Array.isArray(c.services)) {
        for (let j = 0; j < c.services.length; j++) {
          await conn.execute(
            `INSERT INTO cms_category_services (cat_id, service_label, sort_order) VALUES (?, ?, ?)`,
            [c.id, c.services[j], j]
          );
        }
      }
    }
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'Categories', 'Categories saved');
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[CMS categories PUT]', e);
    res.status(500).json({ error: 'Failed to save categories' });
  } finally { conn.release(); }
});

// ============================================================
//  4. NEWS & UPDATES  —  /api/cms/news
// ============================================================

router.get('/news', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM cms_news ORDER BY created_at DESC`);
    res.json(rows.map(r => ({
      id: r.news_id, type: r.type, tag: r.tag,
      date: r.date_label, emoji: r.emoji, imageUrl: r.image_url,
      title: r.title, subtitle: r.subtitle, excerpt: r.excerpt,
      content: r.content, color: r.color, colorLight: r.color_light,
    })));
  } catch (e) { res.status(500).json({ error: 'Failed to load news' }); }
});

// POST — create article
router.post('/news', async (req, res) => {
  const a = req.body;
  try {
    await pool.execute(
      `INSERT INTO cms_news (news_id, type, tag, date_label, emoji, image_url, title, subtitle, excerpt, content, color, color_light, page_slug, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [a.id, a.type || 'announcement', a.tag || 'Announcement',
       a.date || null, a.emoji || '📢', a.imageUrl || null,
       a.title, a.subtitle || null, a.excerpt || null,
       a.content || null, a.color || '#800000', a.colorLight || '', a.pageSlug || null]
    );
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'News & Updates', `Added: "${a.title}"`);
    res.json({ success: true });
  } catch (e) {
    console.error('[CMS news POST]', e);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// PUT — update article
router.put('/news/:newsId', async (req, res) => {
  const a = req.body;
  const { newsId } = req.params;
  try {
    await pool.execute(
      `UPDATE cms_news SET type=?, tag=?, date_label=?, emoji=?, image_url=?, page_slug=?,
       title=?, subtitle=?, excerpt=?, content=?, color=?, color_light=?
       WHERE news_id=?`,
      [a.type, a.tag, a.date, a.emoji, a.imageUrl, a.pageSlug || null,
       a.title, a.subtitle, a.excerpt, a.content, a.color, a.colorLight, newsId]
    );
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'News & Updates', `Updated: "${a.title}"`);
    res.json({ success: true });
  } catch (e) {
    console.error('[CMS news PUT]', e);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// DELETE — delete article
router.delete('/news/:newsId', async (req, res) => {
  try {
    await pool.execute(`DELETE FROM cms_news WHERE news_id = ?`, [req.params.newsId]);
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'News & Updates', `Deleted article ${req.params.newsId}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to delete article' }); }
});

// ============================================================
//  5. ISSUANCES  —  /api/cms/issuances
// ============================================================

router.get('/issuances', async (req, res) => {
  try {
    const [docs] = await pool.execute(`SELECT * FROM cms_issuances ORDER BY year DESC, sort_order ASC`);
    // Group by year
    const byYear = {};
    docs.forEach(d => {
      if (!byYear[d.year]) byYear[d.year] = [];
      byYear[d.year].push({ id: d.doc_id, name: d.name, title: d.title, href: d.href });
    });
    const result = Object.keys(byYear)
      .sort((a, b) => b - a)
      .map(year => ({ year: parseInt(year), docs: byYear[year] }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Failed to load issuances' }); }
});

router.put('/issuances', async (req, res) => {
  const { issuances } = req.body;
  if (!Array.isArray(issuances)) return res.status(400).json({ error: 'issuances must be an array' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM cms_issuances`);
    for (const yearGroup of issuances) {
      for (let j = 0; j < (yearGroup.docs || []).length; j++) {
        const d = yearGroup.docs[j];
        await conn.execute(
          `INSERT INTO cms_issuances (doc_id, year, name, title, href, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [d.id, yearGroup.year, d.name, d.title, d.href || '#', j]
        );
      }
    }
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'Issuances', 'Issuances saved');
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[CMS issuances PUT]', e);
    res.status(500).json({ error: 'Failed to save issuances' });
  } finally { conn.release(); }
});

// ============================================================
//  6. IP WALL  —  /api/cms/ipwall
// ============================================================

router.get('/ipwall', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM cms_ip_wall ORDER BY year DESC, sort_order ASC`);
    const byYear = {};
    rows.forEach(r => {
      if (!byYear[r.year]) byYear[r.year] = [];
      byYear[r.year].push({
        id: r.entry_id, title: r.title, inventor: r.inventor,
        type: r.type, status: r.status, regNo: r.reg_no,
        department: r.department || '', imgUrl: r.img_url,
      });
    });
    const result = Object.keys(byYear)
      .sort((a, b) => b - a)
      .map(year => ({ year: parseInt(year), entries: byYear[year] }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Failed to load IP wall' }); }
});

router.put('/ipwall', async (req, res) => {
  const { ipWall } = req.body;
  if (!Array.isArray(ipWall)) return res.status(400).json({ error: 'ipWall must be an array' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM cms_ip_wall`);
    for (const yearGroup of ipWall) {
      for (let j = 0; j < (yearGroup.entries || []).length; j++) {
        const e = yearGroup.entries[j];
        await conn.execute(
          `INSERT INTO cms_ip_wall (entry_id, year, title, inventor, type, status, reg_no, department, img_url, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [e.id, yearGroup.year, e.title, e.inventor || '', e.type || 'Copyright',
           e.status || 'Pending', e.regNo || '', e.department || '', e.imgUrl || null, j]
        );
      }
    }
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'IP Wall', 'IP Wall saved');
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[CMS ipwall PUT]', e);
    res.status(500).json({ error: 'Failed to save IP wall' });
  } finally { conn.release(); }
});

// ============================================================
//  7. COMPLIANCE  —  /api/cms/compliance
// ============================================================

router.get('/compliance', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM cms_compliance ORDER BY sort_order ASC`);
    res.json(rows.map(r => ({
      id: r.logo_id, abbr: r.abbr, label: r.label,
      detail: r.detail || '', bg: r.bg_color, logoUrl: r.logo_url,
    })));
  } catch (e) { res.status(500).json({ error: 'Failed to load compliance' }); }
});

router.put('/compliance', async (req, res) => {
  const { compliance } = req.body;
  if (!Array.isArray(compliance)) return res.status(400).json({ error: 'compliance must be an array' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM cms_compliance`);
    for (let i = 0; i < compliance.length; i++) {
      const c = compliance[i];
      await conn.execute(
        `INSERT INTO cms_compliance (logo_id, abbr, label, detail, bg_color, logo_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.abbr, c.label, c.detail || '', c.bg || '#374151', c.logoUrl || null, i]
      );
    }
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'Compliance', 'Compliance saved');
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[CMS compliance PUT]', e);
    res.status(500).json({ error: 'Failed to save compliance' });
  } finally { conn.release(); }
});

// ============================================================
//  8. APPEARANCE  —  /api/cms/appearance
// ============================================================

router.get('/appearance', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM cms_appearance LIMIT 1`);
    if (rows.length === 0) {
      return res.json({
        headerBg: '#ffffff', headerAccent: '#800000',
        pageBg: '#f2f2f2',  primaryColor: '#800000',
        schoolLogoUrl: '',  officeLogoUrl: '',
        officeName: 'Management Office', officeNameSub: 'Intellectual Property',
      });
    }
    const r = rows[0];
    res.json({
      headerBg:      r.header_bg,
      headerAccent:  r.header_accent,
      pageBg:        r.page_bg,
      primaryColor:  r.primary_color,
      schoolLogoUrl: r.school_logo_url || '',
      officeLogoUrl: r.office_logo_url || '',
      officeName:    r.office_name,
      officeNameSub: r.office_name_sub,
    });
  } catch (e) { res.status(500).json({ error: 'Failed to load appearance' }); }
});

router.put('/appearance', async (req, res) => {
  const a = req.body;
  try {
    const [existing] = await pool.execute(`SELECT id FROM cms_appearance LIMIT 1`);
    if (existing.length > 0) {
      await pool.execute(
        `UPDATE cms_appearance SET header_bg=?, header_accent=?, page_bg=?, primary_color=?,
         school_logo_url=?, office_logo_url=?, office_name=?, office_name_sub=?`,
        [a.headerBg, a.headerAccent, a.pageBg, a.primaryColor,
         a.schoolLogoUrl || null, a.officeLogoUrl || null,
         a.officeName, a.officeNameSub]
      );
    } else {
      await pool.execute(
        `INSERT INTO cms_appearance (header_bg, header_accent, page_bg, primary_color,
         school_logo_url, office_logo_url, office_name, office_name_sub)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.headerBg, a.headerAccent, a.pageBg, a.primaryColor,
         a.schoolLogoUrl || null, a.officeLogoUrl || null,
         a.officeName, a.officeNameSub]
      );
    }
    const adm = who(req);
    await auditLog(pool, adm.id, adm.name, 'Appearance', 'Appearance saved — homepage + dashboard updated');
    res.json({ success: true });
  } catch (e) {
    console.error('[CMS appearance PUT]', e);
    res.status(500).json({ error: 'Failed to save appearance' });
  }
});

// ── Logo upload endpoint ─────────────────────────────────────
router.post('/appearance/upload-logo', upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/cms/${req.file.filename}`;
  res.json({ success: true, url });
});

// ── Block image upload — used by Page Builder News Card block ─
// POST /api/cms/blocks/upload-image
// Returns a stable server URL so blocks_json stores a URL, not base64
router.post('/blocks/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const base = (process.env.VITE_API_URL || `http://localhost:${process.env.PORT || 3006}/api`)
    .replace(/\/api$/, '');
  const url = `${base}/uploads/cms/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
});

// ============================================================
//  9. AUDIT LOG  —  /api/cms/audit
// ============================================================

router.get('/audit', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM cms_audit_log ORDER BY created_at DESC LIMIT 200`
    );
    res.json(rows.map(r => ({
      id:            r.id,
      editor:        r.admin_name,
      component:     r.component,
      action:        r.action,
      previousValue: r.previous_value ? JSON.parse(r.previous_value) : null,
      ts:            new Date(r.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }),
    })));
  } catch (e) { res.status(500).json({ error: 'Failed to load audit log' }); }
});

// ============================================================
//  PUBLIC READ-ONLY ROUTE — for HomePage.jsx
//  Mounted separately in index.js at /api/cms/public/all
//  with NO auth middleware.
// ============================================================

// This is also registered on the main router so it works regardless of mount order
router.get('/public/all', async (req, res) => {
  // Returns all homepage data in one call — used by HomePage.jsx
  try {
    const [navRows]     = await pool.execute(`SELECT * FROM cms_nav ORDER BY sort_order ASC, id ASC`);
    const [slides]      = await pool.execute(`SELECT * FROM cms_slides ORDER BY sort_order ASC`);
    const [cats]        = await pool.execute(`SELECT * FROM cms_categories ORDER BY sort_order ASC`);
    const [catServices] = await pool.execute(`SELECT * FROM cms_category_services ORDER BY sort_order ASC`);
    const [news]        = await pool.execute(`SELECT * FROM cms_news ORDER BY created_at DESC LIMIT 20`);
    const [issuances]   = await pool.execute(`SELECT * FROM cms_issuances ORDER BY year DESC, sort_order ASC`);
    const [ipWall]      = await pool.execute(`SELECT * FROM cms_ip_wall ORDER BY year DESC, sort_order ASC`);
    const [compliance]  = await pool.execute(`SELECT * FROM cms_compliance ORDER BY sort_order ASC`);
    const [appearance]  = await pool.execute(`SELECT * FROM cms_appearance LIMIT 1`);

    // Build nav tree
    const topLevel = navRows.filter(r => !r.parent_id && !r.parent_sub_id);
    const navTree  = topLevel.map(item => {
      const children = navRows.filter(r => r.parent_id === item.id && !r.parent_sub_id)
        .map(child => {
          if (child.type === 'subdropdown') {
            return { ...child, children: navRows.filter(r => r.parent_sub_id === child.id) };
          }
          return child;
        });
      return { ...item, children };
    });

    // Group issuances by year
    const issuancesByYear = {};
    issuances.forEach(d => {
      if (!issuancesByYear[d.year]) issuancesByYear[d.year] = [];
      issuancesByYear[d.year].push({ id: d.doc_id, name: d.name, title: d.title, href: d.href });
    });
    const issuancesGrouped = Object.keys(issuancesByYear)
      .sort((a, b) => b - a)
      .map(y => ({ year: parseInt(y), docs: issuancesByYear[y] }));

    // Group IP wall by year
    const ipByYear = {};
    ipWall.forEach(r => {
      if (!ipByYear[r.year]) ipByYear[r.year] = [];
      ipByYear[r.year].push({
        id: r.entry_id, title: r.title, inventor: r.inventor,
        type: r.type, status: r.status, regNo: r.reg_no,
        department: r.department, imgUrl: r.img_url,
      });
    });
    const ipWallGrouped = Object.keys(ipByYear)
      .sort((a, b) => b - a)
      .map(y => ({ year: parseInt(y), entries: ipByYear[y] }));

    const app = appearance[0] || {};

    res.json({
      navItems:        navTree,
      displaySlides:   slides.map(s => ({
        id: s.slide_id, tag: s.tag, headline: s.headline, sub: s.sub_text,
        emoji: s.emoji, imageUrl: s.image_url, ctaLabel: s.cta_label,
        ctaHref: s.cta_href, bg: s.bg_css,
      })),
      categoryData:    cats.map(c => ({
        id: c.cat_id, icon: c.icon, title: c.title, desc: c.description, pageSlug: c.page_slug || null,
        color: c.color, colorLight: c.color_light,
        services: catServices.filter(s => s.cat_id === c.cat_id).map(s => s.service_label),
      })),
      newsData:        news.map(n => ({
        id: n.news_id, type: n.type, tag: n.tag, date: n.date_label, pageSlug: n.page_slug || null, pageSlug: n.page_slug || null,
        emoji: n.emoji, imageUrl: n.image_url, title: n.title,
        subtitle: n.subtitle, excerpt: n.excerpt, color: n.color, colorLight: n.color_light,
      })),
      issuancesData:   issuancesGrouped,
      ipWallData:      ipWallGrouped,
      complianceLogos: compliance.map(c => ({
        id: c.logo_id, abbr: c.abbr, label: c.label,
        detail: c.detail, bg: c.bg_color, logoUrl: c.logo_url,
      })),
      appearanceData: {
        headerBg:      app.header_bg      || '#ffffff',
        headerAccent:  app.header_accent  || '#800000',
        pageBg:        app.page_bg        || '#f2f2f2',
        primaryColor:  app.primary_color  || '#800000',
        schoolLogoUrl: app.school_logo_url || '',
        officeLogoUrl: app.office_logo_url || '',
        officeName:    app.office_name    || 'Management Office',
        officeNameSub: app.office_name_sub || 'Intellectual Property',
      },
    });
  } catch (e) {
    console.error('[CMS public/all]', e);
    res.status(500).json({ error: 'Failed to load homepage data' });
  }
});

  return router;
} // end createCmsRouter

// ============================================================
//  PUBLIC ROUTER — separate, no auth required
//  Mount in index.js as:
//    import { createPublicCmsRouter } from './cms_routes.js'
//    app.get('/api/cms/public/all', createPublicCmsHandler(pool))
// ============================================================
export function createPublicCmsRouter(pool) {
  const router = express.Router();

  router.get('/all', async (req, res) => {
    try {
      const [navRows]     = await pool.execute(`SELECT * FROM cms_nav ORDER BY sort_order ASC, id ASC`);
      const [slides]      = await pool.execute(`SELECT * FROM cms_slides ORDER BY sort_order ASC`);
      const [cats]        = await pool.execute(`SELECT * FROM cms_categories ORDER BY sort_order ASC`);
      const [catServices] = await pool.execute(`SELECT * FROM cms_category_services ORDER BY sort_order ASC`);
      const [news]        = await pool.execute(`SELECT * FROM cms_news ORDER BY created_at DESC LIMIT 20`);
      const [issuances]   = await pool.execute(`SELECT * FROM cms_issuances ORDER BY year DESC, sort_order ASC`);
      const [ipWall]      = await pool.execute(`SELECT * FROM cms_ip_wall ORDER BY year DESC, sort_order ASC`);
      const [compliance]  = await pool.execute(`SELECT * FROM cms_compliance ORDER BY sort_order ASC`);
      const [appearance]  = await pool.execute(`SELECT * FROM cms_appearance LIMIT 1`);

      const topLevel = navRows.filter(r => !r.parent_id && !r.parent_sub_id);
      const navTree  = topLevel.map(item => {
        const children = navRows.filter(r => r.parent_id === item.id && !r.parent_sub_id)
          .map(child => {
            if (child.type === 'subdropdown') {
              return { ...child, children: navRows.filter(r => r.parent_sub_id === child.id) };
            }
            return child;
          });
        return { ...item, children };
      });

      const issuancesByYear = {};
      issuances.forEach(d => {
        if (!issuancesByYear[d.year]) issuancesByYear[d.year] = [];
        issuancesByYear[d.year].push({ id: d.doc_id, name: d.name, title: d.title, href: d.href });
      });
      const issuancesGrouped = Object.keys(issuancesByYear)
        .sort((a, b) => b - a)
        .map(y => ({ year: parseInt(y), docs: issuancesByYear[y] }));

      const ipByYear = {};
      ipWall.forEach(r => {
        if (!ipByYear[r.year]) ipByYear[r.year] = [];
        ipByYear[r.year].push({
          id: r.entry_id, title: r.title, inventor: r.inventor,
          type: r.type, status: r.status, regNo: r.reg_no,
          department: r.department, imgUrl: r.img_url,
        });
      });
      const ipWallGrouped = Object.keys(ipByYear)
        .sort((a, b) => b - a)
        .map(y => ({ year: parseInt(y), entries: ipByYear[y] }));

      const app = appearance[0] || {};

      res.json({
        navItems:        navTree,
        displaySlides:   slides.map(s => ({
          id: s.slide_id, tag: s.tag, headline: s.headline, sub: s.sub_text,
          emoji: s.emoji, imageUrl: s.image_url, ctaLabel: s.cta_label,
          ctaHref: s.cta_href, bg: s.bg_css,
        })),
        categoryData:    cats.map(c => ({
          id: c.cat_id, icon: c.icon, title: c.title, desc: c.description, pageSlug: c.page_slug || null,
          color: c.color, colorLight: c.color_light,
          services: catServices.filter(s => s.cat_id === c.cat_id).map(s => s.service_label),
        })),
        newsData:        news.map(n => ({
          id: n.news_id, type: n.type, tag: n.tag, date: n.date_label, pageSlug: n.page_slug || null, pageSlug: n.page_slug || null,
          emoji: n.emoji, imageUrl: n.image_url, title: n.title,
          subtitle: n.subtitle, excerpt: n.excerpt, color: n.color, colorLight: n.color_light,
        })),
        issuancesData:   issuancesGrouped,
        ipWallData:      ipWallGrouped,
        complianceLogos: compliance.map(c => ({
          id: c.logo_id, abbr: c.abbr, label: c.label,
          detail: c.detail, bg: c.bg_color, logoUrl: c.logo_url,
        })),
        appearanceData: {
          headerBg:      app.header_bg      || '#ffffff',
          headerAccent:  app.header_accent  || '#800000',
          pageBg:        app.page_bg        || '#f2f2f2',
          primaryColor:  app.primary_color  || '#800000',
          schoolLogoUrl: app.school_logo_url || '',
          officeLogoUrl: app.office_logo_url || '',
          officeName:    app.office_name    || '',
          officeNameSub: app.office_name_sub || '',
        },
      });
    } catch (e) {
      console.error('[CMS public/all]', e);
      res.status(500).json({ error: 'Failed to load homepage data' });
    }
  });

  return router;
} // end createPublicCmsRouter