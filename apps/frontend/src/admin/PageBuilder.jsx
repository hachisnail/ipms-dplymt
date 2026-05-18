import React, { useState, useEffect, useCallback, useRef } from 'react'
import './PageBuilder.css'

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api'
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })
const jsonHdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` })
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

/* ─── Block type definitions ──────────────────────────────── */
const BLOCK_TYPES = [
  { type: 'heading',   icon: 'H',   label: 'Heading',      desc: 'Section title (H1 / H2 / H3 / H4)' },
  { type: 'paragraph', icon: '¶',   label: 'Paragraph',    desc: 'Rich text paragraph' },
  { type: 'bullets',   icon: '•',   label: 'Bullet List',  desc: 'Unordered list items' },
  { type: 'numbered',  icon: '1.',  label: 'Numbered List',desc: 'Ordered list items' },
  { type: 'divider',   icon: '─',   label: 'Divider',      desc: 'Horizontal separator' },
  { type: 'callout',   icon: '!',   label: 'Callout Box',  desc: 'Highlighted info / tip / warning' },
  { type: 'youtube',   icon: '▶',   label: 'YouTube Embed',desc: 'Paste a YouTube URL' },
  { type: 'code',      icon: '</>',  label: 'Code Block',   desc: 'Monospace code snippet' },
  { type: 'image',     icon: 'IMG', label: 'Image',        desc: 'Upload or paste image URL' },
  { type: 'news_card', icon: 'NC',  label: 'News Card',    desc: 'Image, caption & Learn More file/link' },
  { type: 'table',     icon: '⊞',   label: 'Table',        desc: '2-column key/value table' },
  { type: 'faq',       icon: 'FAQ', label: 'FAQ Item',     desc: 'Collapsible question + answer' },
  { type: 'link_btn',  icon: 'CTA', label: 'Link Button',  desc: 'CTA button with label + URL' },
  { type: 'issuance',  icon: 'ISS', label: 'Issuance Wall', desc: 'Year-grouped document cards with image & file upload' },
  { type: 'ipwall',    icon: 'IP',  label: 'IP Wall',       desc: 'Year-grouped IP entries with image & file upload' },
]

const CALLOUT_VARIANTS = [
  { key: 'info',    icon: 'i',  label: 'Info',    bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
  { key: 'tip',     icon: '*',  label: 'Tip',     bg: '#f0fdf4', border: '#22c55e', color: '#166534' },
  { key: 'warning', icon: '!',  label: 'Warning', bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
  { key: 'note',    icon: 'N',  label: 'Note',    bg: '#fdf2f2', border: '#800000', color: '#800000' },
]

/* ─── Default block builders ──────────────────────────────── */
function makeBlock(type) {
  const base = { id: uid(), type }
  switch (type) {
    case 'heading':   return { ...base, level: 'h2', text: 'Section Title' }
    case 'news_card': return { ...base, imgUrl: '', imgDataUrl: '', caption: '', learnMoreLabel: 'Learn More', learnMoreUrl: '', learnMoreFile: '', learnMoreFileName: '', learnMoreMode: 'url' }
    case 'paragraph': return { ...base, text: 'Write your paragraph here. You can edit this text freely.' }
    case 'bullets':   return { ...base, items: ['First item', 'Second item', 'Third item'] }
    case 'numbered':  return { ...base, items: ['First step', 'Second step', 'Third step'] }
    case 'divider':   return { ...base }
    case 'callout':   return { ...base, variant: 'info', title: 'Did you know?', text: 'Add a helpful tip or important notice here.' }
    case 'youtube':   return { ...base, url: '', caption: '' }
    case 'code':      return { ...base, language: 'plaintext', code: '// paste your code here' }
    case 'image':     return { ...base, url: '', alt: '', caption: '' }
    case 'table':     return { ...base, rows: [['Label', 'Value'], ['Office', 'IPMO'], ['Email', 'ipmo@cnsc.edu.ph']] }
    case 'faq':       return { ...base, question: 'What is Intellectual Property?', answer: 'Intellectual property (IP) refers to creations of the mind...' }
    case 'link_btn':  return { ...base, label: 'Click Here', url: '#', variant: 'primary' }
    case 'issuance':  return { ...base, years: [{ year: new Date().getFullYear(), docs: [{ id: uid(), name: '', title: '', imgDataUrl: '', fileDataUrl: '', fileName: '' }] }] }
    case 'ipwall':    return { ...base, years: [{ year: new Date().getFullYear(), entries: [{ id: uid(), title: '', inventor: '', type: 'Utility Model', status: 'Registered', regNo: '', department: '', imgDataUrl: '', fileDataUrl: '', fileName: '' }] }] }
    default:          return base
  }
}

/* ─── YouTube ID extractor ────────────────────────────────── */
function ytId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

/* ─── Individual block editors ───────────────────────────── */
function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const upd = (fields) => onChange({ ...block, ...fields })

  const renderEditor = () => {
    switch (block.type) {

      case 'heading': return (
        <div className="pb-block-body">
          <div className="pb-heading-controls">
            <select className="pb-select pb-select-sm" value={block.level} onChange={e => upd({ level: e.target.value })}>
              <option value="h1">H1 — Title</option>
              <option value="h2">H2 — Large</option>
              <option value="h3">H3 — Medium</option>
              <option value="h4">H4 — Small</option>
            </select>
            <input className="pb-input pb-heading-input" value={block.text}
              placeholder="Type your heading here…"
              onChange={e => upd({ text: e.target.value })} />
          </div>
          <div className="pb-preview pb-preview-heading" data-level={block.level}>{block.text || 'Heading preview'}</div>
        </div>
      )

      case 'paragraph': return (
        <div className="pb-block-body">
          <textarea className="pb-textarea" value={block.text} rows={4}
            placeholder="Write your paragraph content here…"
            onChange={e => upd({ text: e.target.value })} />
          <div className="pb-hint">Tip: use line breaks to separate ideas. Plain text only — formatting comes from your site's stylesheet.</div>
        </div>
      )

      case 'bullets':
      case 'numbered': return (
        <div className="pb-block-body">
          <div className="pb-list-hint">{block.type === 'bullets' ? '• Bullet list' : '1. Numbered list'} — one item per line</div>
          {(block.items || []).map((item, i) => (
            <div key={i} className="pb-list-item-row">
              <span className="pb-list-marker">{block.type === 'bullets' ? '•' : `${i+1}.`}</span>
              <input className="pb-input" value={item} placeholder={`Item ${i+1}…`}
                onChange={e => { const items=[...block.items]; items[i]=e.target.value; upd({ items }) }} />
              <button className="pb-icon-btn pb-danger" onClick={() => { const items=block.items.filter((_,j)=>j!==i); upd({ items }) }}>×</button>
            </div>
          ))}
          <button className="pb-add-item-btn" onClick={() => upd({ items: [...(block.items||[]), 'New item'] })}>+ Add item</button>
        </div>
      )

      case 'divider': return (
        <div className="pb-block-body">
          <div className="pb-divider-preview" />
          <div className="pb-hint">A horizontal rule will appear here between sections.</div>
        </div>
      )

      case 'callout': {
        const v = CALLOUT_VARIANTS.find(x => x.key === block.variant) || CALLOUT_VARIANTS[0]
        return (
          <div className="pb-block-body">
            <div className="pb-inline-row" style={{ marginBottom: 8 }}>
              {CALLOUT_VARIANTS.map(cv => (
                <button key={cv.key} className={`pb-callout-variant ${block.variant === cv.key ? 'active' : ''}`}
                  style={{ '--cv-border': cv.border, '--cv-bg': cv.bg }}
                  onClick={() => upd({ variant: cv.key })}>
                  {cv.icon} {cv.label}
                </button>
              ))}
            </div>
            <input className="pb-input" value={block.title} placeholder="Callout title…"
              style={{ marginBottom: 6 }}
              onChange={e => upd({ title: e.target.value })} />
            <textarea className="pb-textarea" value={block.text} rows={3}
              placeholder="Callout body text…"
              onChange={e => upd({ text: e.target.value })} />
            <div className="pb-callout-preview" style={{ background: v.bg, borderColor: v.border, color: v.color }}>
              <span className="pb-callout-icon">{v.icon}</span>
              <div><strong>{block.title || 'Title'}</strong><br />{block.text || 'Body text…'}</div>
            </div>
          </div>
        )
      }

      case 'youtube': {
        const id = ytId(block.url || '')
        return (
          <div className="pb-block-body">
            <input className="pb-input" value={block.url}
              placeholder="Paste YouTube URL — e.g. https://youtu.be/dQw4w9WgXcQ"
              onChange={e => upd({ url: e.target.value })} />
            <input className="pb-input" value={block.caption} placeholder="Caption (optional)…"
              style={{ marginTop: 6 }}
              onChange={e => upd({ caption: e.target.value })} />
            {id
              ? <div className="pb-yt-preview">
                  <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="YouTube thumbnail" />
                  <div className="pb-yt-play">▶</div>
                  {block.caption && <div className="pb-yt-caption">{block.caption}</div>}
                </div>
              : <div className="pb-hint" style={{ marginTop: 6 }}>Paste a valid YouTube URL above to see a preview.</div>
            }
          </div>
        )
      }

      case 'code': return (
        <div className="pb-block-body">
          <div className="pb-inline-row" style={{ marginBottom: 6 }}>
            <select className="pb-select" value={block.language}
              onChange={e => upd({ language: e.target.value })}>
              {['plaintext','javascript','python','html','css','sql','bash','json'].map(l =>
                <option key={l} value={l}>{l}</option>
              )}
            </select>
            <span className="pb-hint" style={{ margin: 0 }}>Language for syntax label</span>
          </div>
          <textarea className="pb-textarea pb-code-textarea" value={block.code} rows={6}
            placeholder="// paste your code here"
            onChange={e => upd({ code: e.target.value })} />
          <div className="pb-code-preview">
            <div className="pb-code-lang">{block.language}</div>
            <pre>{block.code || '// empty'}</pre>
          </div>
        </div>
      )

      case 'image': return (
        <div className="pb-block-body">
          <input className="pb-input" value={block.url} placeholder="Paste image URL — https://…"
            onChange={e => upd({ url: e.target.value })} />
          <input className="pb-input" value={block.alt} placeholder="Alt text (for accessibility)…"
            style={{ marginTop: 6 }}
            onChange={e => upd({ alt: e.target.value })} />
          <input className="pb-input" value={block.caption} placeholder="Caption (optional)…"
            style={{ marginTop: 6 }}
            onChange={e => upd({ caption: e.target.value })} />
          {block.url
            ? <div className="pb-img-preview">
                <img src={block.url} alt={block.alt} onError={e => e.target.style.display='none'} />
                {block.caption && <div className="pb-img-caption">{block.caption}</div>}
              </div>
            : <div className="pb-hint" style={{ marginTop: 6 }}>Paste an image URL above to preview it.</div>
          }
        </div>
      )


      case 'news_card': {
        const uploadImgNC = async (file) => {
          const fd = new FormData()
          fd.append('image', file)
          try {
            const res  = await fetch(`${API}/cms/blocks/upload-image`, { method: 'POST', headers: hdrs(), body: fd })
            const data = await res.json()
            if (data.url) { upd({ imgUrl: data.url, imgDataUrl: '' }); return }
          } catch (_) {}
          const r = new FileReader()
          r.onload = e => upd({ imgDataUrl: e.target.result, imgUrl: '' })
          r.readAsDataURL(file)
        }
        const uploadFileNC = (file) => {
          const r = new FileReader()
          r.onload = e => upd({ learnMoreFile: e.target.result, learnMoreFileName: file.name })
          r.readAsDataURL(file)
        }
        const imgSrc = block.imgUrl || block.imgDataUrl || ''
        return (
          <div className="pb-block-body">
            <div className="pb-nc-hint">News Card — image banner, caption text, and a Learn More button or file.</div>

            <div className="pb-nc-section-label">IMAGE</div>
            <div className="pb-nc-img-row">
              <label className="pb-upload-btn pb-nc-upload-img">
                {imgSrc ? '\u2713 Image uploaded' : '+ Upload image'}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) uploadImgNC(e.target.files[0]) }} />
              </label>
              <span className="pb-nc-or">or</span>
              <input className="pb-input" value={block.imgUrl || ''}
                placeholder="Paste image URL — https://\u2026"
                onChange={e => upd({ imgUrl: e.target.value, imgDataUrl: '' })} />
              {imgSrc && (
                <button className="pb-icon-btn pb-danger" title="Remove image"
                  onClick={() => upd({ imgDataUrl: '', imgUrl: '' })}>×</button>
              )}
            </div>
            {imgSrc && <div className="pb-nc-img-preview"><img src={imgSrc} alt="card preview" /></div>}

            <div className="pb-nc-section-label" style={{ marginTop: 12 }}>CAPTION</div>
            <textarea className="pb-textarea" value={block.caption || ''} rows={2}
              placeholder="Short caption or description shown below the image\u2026"
              onChange={e => upd({ caption: e.target.value })} />

            <div className="pb-nc-section-label" style={{ marginTop: 12 }}>LEARN MORE BUTTON</div>
            <div className="pb-nc-lm-row">
              <input className="pb-input pb-nc-lm-label" value={block.learnMoreLabel || ''}
                placeholder="Button label e.g. Read More"
                onChange={e => upd({ learnMoreLabel: e.target.value })} />
              <div className="pb-nc-mode-toggle">
                <button className={`pb-nc-mode-btn ${block.learnMoreMode !== 'file' ? 'active' : ''}`}
                  onClick={() => upd({ learnMoreMode: 'url' })}>URL</button>
                <button className={`pb-nc-mode-btn ${block.learnMoreMode === 'file' ? 'active' : ''}`}
                  onClick={() => upd({ learnMoreMode: 'file' })}>File Upload</button>
              </div>
            </div>
            {block.learnMoreMode === 'file' ? (
              <div className="pb-nc-file-row">
                <label className="pb-upload-btn">
                  {block.learnMoreFile ? `\u2713 ${block.learnMoreFileName || 'File uploaded'}` : '+ Upload PDF / DOC'}
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files[0]) uploadFileNC(e.target.files[0]) }} />
                </label>
                {block.learnMoreFile && (
                  <button className="pb-icon-btn pb-danger"
                    onClick={() => upd({ learnMoreFile: '', learnMoreFileName: '' })}>×</button>
                )}
                {block.learnMoreFileName && <span className="pb-nc-filename">{block.learnMoreFileName}</span>}
              </div>
            ) : (
              <input className="pb-input" value={block.learnMoreUrl || ''}
                placeholder="URL — https://\u2026 or /route"
                style={{ marginTop: 6 }}
                onChange={e => upd({ learnMoreUrl: e.target.value })} />
            )}

            <div className="pb-nc-preview">
              {imgSrc && <img src={imgSrc} alt="preview" className="pb-nc-preview-img" />}
              {block.caption && <p className="pb-nc-preview-caption">{block.caption}</p>}
              {block.learnMoreLabel && <button className="pb-nc-preview-btn">{block.learnMoreLabel} →</button>}
            </div>
          </div>
        )
      }

      case 'table': return (
        <div className="pb-block-body">
          <div className="pb-hint" style={{ marginBottom: 8 }}>First row is the header. Add rows as needed.</div>
          <table className="pb-table-editor">
            <tbody>
              {(block.rows || []).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      <input className="pb-input pb-table-cell"
                        value={cell}
                        placeholder={ri === 0 ? `Header ${ci+1}` : `Cell ${ri},${ci+1}`}
                        onChange={e => {
                          const rows = block.rows.map((r,i) => i===ri ? r.map((c,j) => j===ci ? e.target.value : c) : r)
                          upd({ rows })
                        }} />
                    </td>
                  ))}
                  <td>
                    <button className="pb-icon-btn pb-danger"
                      onClick={() => upd({ rows: block.rows.filter((_,i) => i!==ri) })}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pb-table-actions">
            <button className="pb-add-item-btn" onClick={() => {
              const cols = (block.rows[0]||[]).length || 2
              upd({ rows: [...block.rows, Array(cols).fill('')] })
            }}>+ Add row</button>
            <button className="pb-add-item-btn" onClick={() => upd({ rows: block.rows.map(r => [...r, '']) })}>+ Add column</button>
          </div>
        </div>
      )

      case 'faq': return (
        <div className="pb-block-body">
          <input className="pb-input" value={block.question}
            placeholder="Question — e.g. What is Intellectual Property?"
            onChange={e => upd({ question: e.target.value })} />
          <textarea className="pb-textarea" value={block.answer} rows={3}
            placeholder="Answer to this question…"
            style={{ marginTop: 6 }}
            onChange={e => upd({ answer: e.target.value })} />
          <div className="pb-faq-preview">
            <div className="pb-faq-q">{block.question || 'Question preview'} <span>▼</span></div>
            <div className="pb-faq-a">{block.answer || 'Answer preview…'}</div>
          </div>
        </div>
      )

      case 'link_btn': return (
        <div className="pb-block-body">
          <div className="pb-inline-row">
            <input className="pb-input" value={block.label} placeholder="Button label…"
              onChange={e => upd({ label: e.target.value })} />
            <select className="pb-select" value={block.variant}
              onChange={e => upd({ variant: e.target.value })}>
              <option value="primary">Primary (maroon)</option>
              <option value="secondary">Secondary (outline)</option>
              <option value="teal">Teal</option>
            </select>
          </div>
          <input className="pb-input" value={block.url}
            placeholder="URL — https://… or /route"
            style={{ marginTop: 6 }}
            onChange={e => upd({ url: e.target.value })} />
          <div style={{ marginTop: 10 }}>
            <button className={`pb-btn-preview pb-btn-preview--${block.variant}`}>
              {block.label || 'Button'}
            </button>
          </div>
        </div>
      )

      case 'issuance': {
        const readFile = (file, cb) => {
          const r = new FileReader()
          r.onload = e => cb(e.target.result)
          r.readAsDataURL(file)
        }
        const updYear = (yi, fields) => {
          const years = block.years.map((y, i) => i === yi ? { ...y, ...fields } : y)
          upd({ years })
        }
        const updDoc = (yi, di, fields) => {
          const years = block.years.map((y, i) => i === yi ? {
            ...y, docs: y.docs.map((d, j) => j === di ? { ...d, ...fields } : d)
          } : y)
          upd({ years })
        }
        return (
          <div className="pb-block-body">
            <div className="pb-wall-hint">[doc] Issuance Wall — upload image thumbnails and PDF files for each document entry.</div>
            {(block.years || []).map((yr, yi) => (
              <div key={yi} className="pb-wall-year-group">
                <div className="pb-wall-year-header">
                  <input className="pb-input pb-wall-year-input" type="number"
                    value={yr.year} placeholder="Year"
                    onChange={e => updYear(yi, { year: parseInt(e.target.value) || yr.year })} />
                  <button className="pb-icon-btn pb-danger" onClick={() => upd({ years: block.years.filter((_, i) => i !== yi) })}>×</button>
                </div>
                {(yr.docs || []).map((doc, di) => (
                  <div key={di} className="pb-wall-entry">
                    <div className="pb-wall-entry-row">
                      <input className="pb-input" value={doc.name} placeholder="Doc ID / Number (e.g. RA 11232)…"
                        onChange={e => updDoc(yi, di, { name: e.target.value })} />
                      <input className="pb-input" value={doc.title} placeholder="Document title…"
                        onChange={e => updDoc(yi, di, { title: e.target.value })} />
                    </div>
                    <div className="pb-wall-upload-row">
                      <div className="pb-wall-upload-col">
                        <label className="pb-upload-label">[img] Thumbnail Image</label>
                        <label className="pb-upload-btn">
                          {doc.imgDataUrl ? 'Image uploaded' : '+ Upload image'}
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => { if (e.target.files[0]) readFile(e.target.files[0], v => updDoc(yi, di, { imgDataUrl: v })) }} />
                        </label>
                        {doc.imgDataUrl && <img src={doc.imgDataUrl} className="pb-wall-thumb" alt="thumb" />}
                      </div>
                      <div className="pb-wall-upload-col">
                        <label className="pb-upload-label">[page] Document File (PDF/DOC)</label>
                        <label className="pb-upload-btn">
                          {doc.fileDataUrl ? `${doc.fileName || 'File uploaded'}` : '+ Upload file'}
                          <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                            onChange={e => { if (e.target.files[0]) readFile(e.target.files[0], v => updDoc(yi, di, { fileDataUrl: v, fileName: e.target.files[0].name })) }} />
                        </label>
                        {doc.fileDataUrl && <span className="pb-wall-filename"> {doc.fileName}</span>}
                      </div>
                      <button className="pb-icon-btn pb-danger" style={{ alignSelf: 'flex-end' }}
                        onClick={() => updYear(yi, { docs: yr.docs.filter((_, j) => j !== di) })}>×</button>
                    </div>
                  </div>
                ))}
                <button className="pb-add-item-btn" onClick={() => updYear(yi, { docs: [...(yr.docs || []), { id: uid(), name: '', title: '', imgDataUrl: '', fileDataUrl: '', fileName: '' }] })}>+ Add document</button>
              </div>
            ))}
            <button className="pb-add-item-btn pb-wall-add-year" onClick={() => upd({ years: [...(block.years || []), { year: new Date().getFullYear() - (block.years?.length || 0), docs: [] }] })}>+ Add year</button>
          </div>
        )
      }

      case 'ipwall': {
        const readFile = (file, cb) => {
          const r = new FileReader()
          r.onload = e => cb(e.target.result)
          r.readAsDataURL(file)
        }
        const updYear = (yi, fields) => {
          const years = block.years.map((y, i) => i === yi ? { ...y, ...fields } : y)
          upd({ years })
        }
        const updEntry = (yi, ei, fields) => {
          const years = block.years.map((y, i) => i === yi ? {
            ...y, entries: y.entries.map((e, j) => j === ei ? { ...e, ...fields } : e)
          } : y)
          upd({ years })
        }
        const IP_TYPES = ['Utility Model', 'Invention Patent', 'Industrial Design', 'Copyright', 'Trademark']
        const IP_STATUSES = ['Registered', 'Pending', 'Published', 'Expired']
        return (
          <div className="pb-block-body">
            <div className="pb-wall-hint">i IP Wall — upload images and files for each intellectual property entry.</div>
            {(block.years || []).map((yr, yi) => (
              <div key={yi} className="pb-wall-year-group">
                <div className="pb-wall-year-header">
                  <input className="pb-input pb-wall-year-input" type="number"
                    value={yr.year} placeholder="Year"
                    onChange={e => updYear(yi, { year: parseInt(e.target.value) || yr.year })} />
                  <button className="pb-icon-btn pb-danger" onClick={() => upd({ years: block.years.filter((_, i) => i !== yi) })}>×</button>
                </div>
                {(yr.entries || []).map((entry, ei) => (
                  <div key={ei} className="pb-wall-entry">
                    <div className="pb-wall-entry-row">
                      <input className="pb-input" value={entry.title} placeholder="IP Title…"
                        onChange={e => updEntry(yi, ei, { title: e.target.value })} />
                      <input className="pb-input" value={entry.inventor} placeholder="Inventor / Author…"
                        onChange={e => updEntry(yi, ei, { inventor: e.target.value })} />
                    </div>
                    <div className="pb-wall-entry-row">
                      <input className="pb-input" value={entry.regNo} placeholder="Reg. / App. No.…"
                        onChange={e => updEntry(yi, ei, { regNo: e.target.value })} />
                      <input className="pb-input" value={entry.department} placeholder="Department / College…"
                        onChange={e => updEntry(yi, ei, { department: e.target.value })} />
                      <select className="pb-select" value={entry.type} onChange={e => updEntry(yi, ei, { type: e.target.value })}>
                        {IP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select className="pb-select" value={entry.status} onChange={e => updEntry(yi, ei, { status: e.target.value })}>
                        {IP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="pb-wall-upload-row">
                      <div className="pb-wall-upload-col">
                        <label className="pb-upload-label">[img] IP Image / Certificate</label>
                        <label className="pb-upload-btn">
                          {entry.imgDataUrl ? 'Image uploaded' : '+ Upload image'}
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => { if (e.target.files[0]) readFile(e.target.files[0], v => updEntry(yi, ei, { imgDataUrl: v })) }} />
                        </label>
                        {entry.imgDataUrl && <img src={entry.imgDataUrl} className="pb-wall-thumb" alt="IP thumb" />}
                      </div>
                      <div className="pb-wall-upload-col">
                        <label className="pb-upload-label">[page] Supporting File (PDF/DOC)</label>
                        <label className="pb-upload-btn">
                          {entry.fileDataUrl ? `${entry.fileName || 'File uploaded'}` : '+ Upload file'}
                          <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                            onChange={e => { if (e.target.files[0]) readFile(e.target.files[0], v => updEntry(yi, ei, { fileDataUrl: v, fileName: e.target.files[0].name })) }} />
                        </label>
                        {entry.fileDataUrl && <span className="pb-wall-filename"> {entry.fileName}</span>}
                      </div>
                      <button className="pb-icon-btn pb-danger" style={{ alignSelf: 'flex-end' }}
                        onClick={() => updYear(yi, { entries: yr.entries.filter((_, j) => j !== ei) })}>×</button>
                    </div>
                  </div>
                ))}
                <button className="pb-add-item-btn" onClick={() => updYear(yi, { entries: [...(yr.entries || []), { id: uid(), title: '', inventor: '', type: 'Utility Model', status: 'Registered', regNo: '', department: '', imgDataUrl: '', fileDataUrl: '', fileName: '' }] })}>+ Add IP entry</button>
              </div>
            ))}
            <button className="pb-add-item-btn pb-wall-add-year" onClick={() => upd({ years: [...(block.years || []), { year: new Date().getFullYear() - (block.years?.length || 0), entries: [] }] })}>+ Add year</button>
          </div>
        )
      }

      default: return <div className="pb-block-body pb-hint">Unknown block type: {block.type}</div>
    }
  }

  const typeInfo = BLOCK_TYPES.find(b => b.type === block.type) || {}

  return (
    <div className="pb-block">
      <div className="pb-block-header">
        <div className="pb-block-type-badge">
          <span className="pb-block-icon">{typeInfo.icon}</span>
          <span className="pb-block-type-label">{typeInfo.label}</span>
        </div>
        <div className="pb-block-controls">
          <button className="pb-icon-btn" disabled={isFirst} onClick={onMoveUp} title="Move up">↑</button>
          <button className="pb-icon-btn" disabled={isLast}  onClick={onMoveDown} title="Move down">↓</button>
          <button className="pb-icon-btn pb-danger" onClick={onDelete} title="Delete block">del</button>
        </div>
      </div>
      {renderEditor()}
    </div>
  )
}

/* ─── Add Block Panel ─────────────────────────────────────── */
function AddBlockPanel({ onAdd }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="pb-add-panel">
      <button className="pb-add-trigger" onClick={() => setOpen(o => !o)}>
        <span className="pb-add-trigger-icon">{open ? '−' : '+'}</span>
        {open ? 'Cancel' : 'Add block'}
      </button>
      {open && (
        <div className="pb-block-picker">
          {BLOCK_TYPES.map(bt => (
            <button key={bt.type} className="pb-block-type-btn"
              onClick={() => { onAdd(bt.type); setOpen(false) }}>
              <span className="pb-bt-icon">{bt.icon}</span>
              <div>
                <div className="pb-bt-label">{bt.label}</div>
                <div className="pb-bt-desc">{bt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Page list item ──────────────────────────────────────── */
function PageListItem({ page, onEdit, onDelete }) {
  return (
    <div className="pb-page-row">
      <div className="pb-page-info">
        <div className="pb-page-title">{page.title || 'Untitled Page'}</div>
        <div className="pb-page-meta">
          <span className="pb-page-slug">{page.slug || '/untitled'}</span>
          <span className="pb-page-blocks">{(page.blocks || []).length} block{(page.blocks||[]).length !== 1 ? 's' : ''}</span>
          {page.published
            ? <span className="pb-page-status pb-page-status--live">● Live</span>
            : <span className="pb-page-status pb-page-status--draft">○ Draft</span>
          }
        </div>
      </div>
      <div className="pb-page-actions">
        <button className="pb-btn pb-btn-sm" onClick={() => onEdit(page)}>Edit</button>
        <button className="pb-btn pb-btn-sm pb-btn-danger" onClick={() => onDelete(page.id)}>Delete</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function PageBuilder({ onPageCreated }) {
  const [pages, setPages]       = useState([])
  const [mode, setMode]         = useState('list')   // 'list' | 'edit'
  const [editingPage, setEditingPage] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [loading, setLoading]   = useState(true)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false)
  const [pageToDelete, setPageToDelete]             = useState(null)

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2800) }

  /* ── Fetch pages ── */
  const fetchPages = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/pages`, { headers: jsonHdrs() })
      const data = await res.json()
      setPages(Array.isArray(data) ? data : [])
    } catch {
      setPages([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPages() }, [fetchPages])

  /* ── Slug generator ── */
  const slugify = (title) =>
    '/' + title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

  /* ── New page ── */
  const createPage = () => {
    const page = {
      id: uid(),
      title: '',
      slug: '',
      published: false,
      blocks: [makeBlock('heading'), makeBlock('paragraph')],
    }
    setEditingPage(page)
    setMode('edit')
  }

  /* ── Save page ── */
  const savePage = async (publish = false) => {
    if (!editingPage.title.trim()) { toast('Please enter a page title'); return }
    setSaving(true)
    const pageToSave = {
      ...editingPage,
      slug: editingPage.slug || slugify(editingPage.title),
      published: publish ?? editingPage.published,
    }
    try {
      const isNew = !pages.find(p => p.id === pageToSave.id)
      const res = await fetch(
        isNew ? `${API}/pages` : `${API}/pages/${pageToSave.id}`,
        { method: isNew ? 'POST' : 'PUT', headers: jsonHdrs(), body: JSON.stringify(pageToSave) }
      )
      if (!res.ok) throw new Error('Save failed')
      toast(publish ? 'Page published' : 'Draft saved')
      if (isNew) setPages(p => [...p, pageToSave])
      else setPages(p => p.map(pg => pg.id === pageToSave.id ? pageToSave : pg))
      setEditingPage(pageToSave)
      // Notify parent (ContentManagement) so nav items can auto-link
      if (onPageCreated && isNew) onPageCreated(pageToSave)
    } catch (e) {
      toast('Error: ' + e.message)
    }
    setSaving(false)
    setShowPublishConfirm(false)
  }

  /* ── Delete page ── */
  const confirmDeletePage = (id) => {
    setPageToDelete(id)
    setShowDeleteConfirm(true)
  }

  const deletePage = async () => {
    const id = pageToDelete
    setShowDeleteConfirm(false)
    setPageToDelete(null)
    try {
      await fetch(`${API}/pages/${id}`, { method: 'DELETE', headers: jsonHdrs() })
      setPages(p => p.filter(pg => pg.id !== id))
      toast('Page deleted')
    } catch { toast('Delete failed') }
  }

  /* ── Block ops ── */
  const addBlock    = (type) => setEditingPage(p => ({ ...p, blocks: [...(p.blocks||[]), makeBlock(type)] }))
  const updateBlock = (idx, data) => setEditingPage(p => ({ ...p, blocks: p.blocks.map((b,i) => i===idx ? data : b) }))
  const deleteBlock = (idx) => setEditingPage(p => ({ ...p, blocks: p.blocks.filter((_,i) => i!==idx) }))
  const moveBlock   = (idx, dir) => setEditingPage(p => {
    const blocks = [...p.blocks]
    const swap = idx + dir
    if (swap < 0 || swap >= blocks.length) return p
    ;[blocks[idx], blocks[swap]] = [blocks[swap], blocks[idx]]
    return { ...p, blocks }
  })

  /* ── Title change → auto slug ── */
  const handleTitleChange = (title) => {
    setEditingPage(p => ({
      ...p,
      title,
      slug: slugify(title),
    }))
  }

  /* ════ LIST VIEW ════════════════════════════════════════════ */
  if (mode === 'list') return (
    <div className="pb-wrap">
      <div className="pb-list-header">
        <div>
          <div className="pb-list-title">Page Builder</div>
          <div className="pb-list-sub">Create standalone pages for your nav items — FAQ, About, Contact, and more.</div>
        </div>
        <button className="pb-btn pb-btn-primary" onClick={createPage}>+ New page</button>
      </div>

      {loading
        ? <div className="pb-loading">Loading pages…</div>
        : pages.length === 0
          ? <div className="pb-empty">
              <div className="pb-empty-icon">&#9633;</div>
              <div className="pb-empty-title">No pages yet</div>
              <div className="pb-empty-sub">Click "New page" to create your first page — like an FAQ, About, or Contact page. It will auto-link to your nav.</div>
              <button className="pb-btn pb-btn-primary" style={{ marginTop: 14 }} onClick={createPage}>+ Create first page</button>
            </div>
          : <div className="pb-page-list">
              {pages.map(pg => (
                <PageListItem key={pg.id} page={pg}
                  onEdit={pg => { setEditingPage(pg); setMode('edit') }}
                  onDelete={confirmDeletePage} />
              ))}
            </div>
      }
      {toastMsg && <div className="pb-toast">{toastMsg}</div>}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="pb-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="pb-confirm-box pb-confirm-box--danger" onClick={e => e.stopPropagation()}>
            <div className="pb-confirm-icon">🗑️</div>
            <div className="pb-confirm-title">Delete this page?</div>
            <div className="pb-confirm-sub">
              This action <strong>cannot be undone.</strong> The page and all its content will be permanently removed.
            </div>
            <div className="pb-confirm-actions">
              <button className="pb-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="pb-btn pb-btn-danger" onClick={deletePage}>Yes, delete page</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  /* ════ EDIT VIEW ════════════════════════════════════════════ */
  return (
    <div className="pb-wrap">
      {/* Top bar */}
      <div className="pb-edit-topbar">
        <button className="pb-btn" onClick={() => setMode('list')}>← All pages</button>
        <div className="pb-edit-title-area">
          <span className="pb-edit-status">
            {editingPage.published
              ? <span className="pb-status-live">● Live</span>
              : <span className="pb-status-draft">○ Draft</span>
            }
          </span>
        </div>
        <div className="pb-edit-actions">
          <button className="pb-btn" disabled={saving} onClick={() => savePage(false)}>
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button className="pb-btn pb-btn-primary" disabled={saving} onClick={() => setShowPublishConfirm(true)}>
            {editingPage.published ? 'Update live' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Page meta */}
      <div className="pb-page-meta-card">
        <div className="pb-meta-row">
          <label>Page title</label>
          <input className="pb-input pb-title-input"
            value={editingPage.title}
            placeholder="e.g. Frequently Asked Questions"
            onChange={e => handleTitleChange(e.target.value)} />
        </div>
        <div className="pb-meta-row">
          <label>URL slug</label>
          <div className="pb-slug-row">
            <span className="pb-slug-base">your-site.com</span>
            <input className="pb-input pb-slug-input"
              value={editingPage.slug}
              placeholder="/faq"
              onChange={e => setEditingPage(p => ({ ...p, slug: e.target.value }))} />
          </div>
          <div className="pb-slug-hint">This URL will auto-fill when you link this page in a nav item.</div>
        </div>
      </div>

      {/* Blocks */}
      <div className="pb-canvas">
        <div className="pb-canvas-label">PAGE CONTENT</div>
        {(editingPage.blocks || []).length === 0
          ? <div className="pb-canvas-empty">Your page is empty — add a block below to start.</div>
          : (editingPage.blocks || []).map((block, idx) => (
            <BlockEditor
              key={block.id}
              block={block}
              isFirst={idx === 0}
              isLast={idx === (editingPage.blocks.length - 1)}
              onChange={data => updateBlock(idx, data)}
              onDelete={() => deleteBlock(idx)}
              onMoveUp={() => moveBlock(idx, -1)}
              onMoveDown={() => moveBlock(idx, 1)}
            />
          ))
        }
        <AddBlockPanel onAdd={addBlock} />
      </div>

      {/* Publish confirm */}
      {showPublishConfirm && (
        <div className="pb-confirm-overlay" onClick={() => setShowPublishConfirm(false)}>
          <div className="pb-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="pb-confirm-title">
              {editingPage.published ? 'Update live page?' : 'Publish this page?'}
            </div>
            <div className="pb-confirm-sub">
              It will be accessible at <code>{editingPage.slug || slugify(editingPage.title || 'page')}</code> and auto-linked to any matching nav item.
            </div>
            <div className="pb-confirm-actions">
              <button className="pb-btn" onClick={() => setShowPublishConfirm(false)}>Cancel</button>
              <button className="pb-btn pb-btn-primary" onClick={() => savePage(true)}>
                {editingPage.published ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="pb-toast">{toastMsg}</div>}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="pb-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="pb-confirm-box pb-confirm-box--danger" onClick={e => e.stopPropagation()}>
            <div className="pb-confirm-icon">🗑️</div>
            <div className="pb-confirm-title">Delete this page?</div>
            <div className="pb-confirm-sub">
              This action <strong>cannot be undone.</strong> The page and all its content will be permanently removed.
            </div>
            <div className="pb-confirm-actions">
              <button className="pb-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="pb-btn pb-btn-danger" onClick={deletePage}>Yes, delete page</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}