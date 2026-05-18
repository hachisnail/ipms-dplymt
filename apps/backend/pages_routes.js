/* ============================================================
   pages_routes.js  —  CNSC-IPMO Page Builder backend
   Handles CRUD for custom pages built in the Page Builder.

   Mount in index.js:
     import { createPagesRouter } from './pages_routes.js'
     const pagesRouter = createPagesRouter(pool)
     app.use('/api/pages', authMiddleware, isAdminMiddleware, pagesRouter)
     app.use('/api/public/pages', createPublicPagesRouter(pool))
   ============================================================ */

import express from 'express'

/* ─── Admin router (auth-protected) ───────────────────────── */
export function createPagesRouter(pool) {
  const router = express.Router()

  /* GET /api/pages — list all pages */
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, page_id, title, slug, published, blocks_json, created_at, updated_at
         FROM cms_pages ORDER BY created_at DESC`
      )
      const pages = rows.map(r => ({
        id:        r.page_id,
        title:     r.title,
        slug:      r.slug,
        published: !!r.published,
        blocks:    JSON.parse(r.blocks_json || '[]'),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
      res.json(pages)
    } catch (e) {
      console.error('[pages GET /]', e)
      res.status(500).json({ error: 'Failed to fetch pages' })
    }
  })

  /* POST /api/pages — create new page */
  router.post('/', async (req, res) => {
    const { id, title, slug, published = false, blocks = [] } = req.body
    if (!id || !title) return res.status(400).json({ error: 'id and title are required' })
    try {
      await pool.execute(
        `INSERT INTO cms_pages (page_id, title, slug, published, blocks_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), slug=VALUES(slug),
           published=VALUES(published), blocks_json=VALUES(blocks_json), updated_at=NOW()`,
        [id, title, slug, published ? 1 : 0, JSON.stringify(blocks)]
      )
      // Audit log
      try {
        await pool.execute(
          `INSERT INTO cms_audit_log (admin_id, admin_name, component, action, created_at)
           VALUES (?, ?, 'Page Builder', ?, NOW())`,
          [req.user?.id || 0, req.user?.name || 'Admin', `Created page: "${title}" at ${slug}`]
        )
      } catch (_) {}
      res.json({ ok: true, id, slug })
    } catch (e) {
      console.error('[pages POST]', e)
      res.status(500).json({ error: 'Failed to create page' })
    }
  })

  /* PUT /api/pages/:pageId — update existing page */
  router.put('/:pageId', async (req, res) => {
    const { pageId } = req.params
    const { title, slug, published, blocks = [] } = req.body
    try {
      const [result] = await pool.execute(
        `UPDATE cms_pages SET title=?, slug=?, published=?, blocks_json=?, updated_at=NOW()
         WHERE page_id=?`,
        [title, slug, published ? 1 : 0, JSON.stringify(blocks), pageId]
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Page not found' })
      try {
        await pool.execute(
          `INSERT INTO cms_audit_log (admin_id, admin_name, component, action, created_at)
           VALUES (?, ?, 'Page Builder', ?, NOW())`,
          [req.user?.id || 0, req.user?.name || 'Admin',
           `${published ? 'Published' : 'Updated draft'}: "${title}" at ${slug}`]
        )
      } catch (_) {}
      res.json({ ok: true })
    } catch (e) {
      console.error('[pages PUT]', e)
      res.status(500).json({ error: 'Failed to update page' })
    }
  })

  /* DELETE /api/pages/:pageId */
  router.delete('/:pageId', async (req, res) => {
    const { pageId } = req.params
    try {
      await pool.execute(`DELETE FROM cms_pages WHERE page_id=?`, [pageId])
      res.json({ ok: true })
    } catch (e) {
      console.error('[pages DELETE]', e)
      res.status(500).json({ error: 'Failed to delete page' })
    }
  })

  return router
}

/* ─── Public router (no auth — serves published pages) ────── */
export function createPublicPagesRouter(pool) {
  const router = express.Router()

  /* GET /api/public/pages/:slug — serve a published page by slug */
  router.get('/:slug', async (req, res) => {
    // Match slug both with and without leading slash
    const rawSlug = req.params.slug.replace(/^\//, '')
    const slugWithSlash    = '/' + rawSlug   // e.g. /faq
    const slugWithoutSlash = rawSlug          // e.g. faq
    try {
      const [rows] = await pool.execute(
        `SELECT page_id, title, slug, blocks_json FROM cms_pages
         WHERE (slug=? OR slug=?) AND published=1 LIMIT 1`,
        [slugWithSlash, slugWithoutSlash]
      )
      if (!rows.length) return res.status(404).json({ error: 'Page not found' })
      const r = rows[0]

      // Parse blocks and enrich issuance / ipwall blocks with live DB data
      let blocks = JSON.parse(r.blocks_json || '[]')

      const hasIssuance = blocks.some(b => b.type === 'issuance')
      const hasIPWall   = blocks.some(b => b.type === 'ipwall')

      if (hasIssuance) {
        const [docs] = await pool.execute(
          `SELECT * FROM cms_issuances ORDER BY year DESC, sort_order ASC`
        )
        const byYear = {}
        docs.forEach(d => {
          if (!byYear[d.year]) byYear[d.year] = []
          byYear[d.year].push({ id: d.doc_id, name: d.name, title: d.title, href: d.href, imgUrl: d.img_url || null })
        })
        const issuanceData = Object.keys(byYear)
          .sort((a, b) => b - a)
          .map(year => ({ year: parseInt(year), docs: byYear[year] }))
        blocks = blocks.map(b => b.type === 'issuance' ? { ...b, data: issuanceData } : b)
      }

      if (hasIPWall) {
        const [rows2] = await pool.execute(
          `SELECT * FROM cms_ip_wall ORDER BY year DESC, sort_order ASC`
        )
        const byYear = {}
        rows2.forEach(r => {
          if (!byYear[r.year]) byYear[r.year] = []
          byYear[r.year].push({
            id: r.entry_id, title: r.title, inventor: r.inventor,
            type: r.type, status: r.status, regNo: r.reg_no,
            department: r.department || '', imgUrl: r.img_url,
          })
        })
        const ipWallData = Object.keys(byYear)
          .sort((a, b) => b - a)
          .map(year => ({ year: parseInt(year), entries: byYear[year] }))
        blocks = blocks.map(b => b.type === 'ipwall' ? { ...b, data: ipWallData } : b)
      }

      res.json({
        id:     r.page_id,
        title:  r.title,
        slug:   r.slug,
        blocks,
      })
    } catch (e) {
      console.error('[public pages GET slug]', e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}