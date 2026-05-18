import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { fetchHomePageData } from '../components/homePageData'
import './Dynamicpage.css'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3006/api').replace(/\/$/, '')

/* ── Design tokens — identical to HomePage ── */
const T = {
  maroon:      '#800000',
  green:       '#005555',
  lightBg:     '#f2f2f2',
  darkerBg:    '#cbcbcb',
  black:       '#000000',
  white:       '#ffffff',
  maroonLight: 'rgba(128,0,0,0.08)',
  greenLight:  'rgba(0,85,85,0.08)',
  shadow:      '0 4px 24px rgba(0,0,0,0.07)',
  shadowHov:   '0 12px 36px rgba(0,0,0,0.13)',
  radius:      '10px',
  radiusLg:    '14px',
  font:        "'Playfair Display', serif",
  fontBody:    "'DM Sans', sans-serif",
}

/* ── Scoped styles — exact copy of HomePage ScopedStyles ── */
const ScopedStyles = ({ primaryColor = T.maroon, headerAccent = T.maroon }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

    /* ── Header ── */
    .hp-header {
      position: sticky; width: 100%; top: 0;
      z-index: 1000; background: ${T.white};
      border-bottom: 2.5px solid ${headerAccent};
      transition: box-shadow .3s;
    }
    .hp-header.scrolled { box-shadow: 0 2px 22px rgba(0,0,0,0.10); }
    .hp-header__inner {
      width: 100%; max-width: 1440px; padding: 0 24px; height: 66px;
      display: flex; align-items: center; justify-content: space-between;
      margin: 0 auto;
    }
    .hp-header__brand {
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0; flex: 1;
      text-decoration: none; cursor: pointer;
    }
    .hp-header__divider { width: 1px; height: 32px; background: ${T.darkerBg}; }
    .hp-header__name { line-height: 1.2; }
    .hp-header__name-sub  { font-size: 10.5px; font-weight: 400; color: #888; letter-spacing: .6px; text-transform: uppercase; }
    .hp-header__name-main { font-size: 14px; font-weight: 700; color: ${primaryColor}; font-family: ${T.font}; }
    .hp-header__nav { display: flex; align-items: center; gap: 26px; justify-content: center; }
    .hp-header__navlink { font-size: 13.5px; font-weight: 500; color: ${T.black}; text-decoration: none; transition: color .2s; position: relative; padding-bottom: 3px; }
    .hp-header__navlink::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: ${primaryColor}; transform: scaleX(0); transform-origin: left; transition: transform .22s; }
    .hp-header__navlink:hover { color: ${primaryColor}; }
    .hp-header__navlink:hover::after { transform: scaleX(1); }
    .hp-header__navlink.active { color: ${primaryColor}; }
    .hp-header__navlink.active::after { transform: scaleX(1); }
    .hp-header__actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; flex: 1; justify-content: flex-end; }
    .hp-signin-btn {
      background: ${primaryColor}; color: ${T.white}; padding: 8px 22px;
      border-radius: 24px; font-size: 13.5px; font-weight: 600; border: none;
      font-family: ${T.fontBody}; transition: all .2s;
      box-shadow: 0 2px 10px rgba(128,0,0,0.22); white-space: nowrap; cursor: pointer;
    }
    .hp-signin-btn:hover { filter: brightness(0.88); transform: translateY(-1px); }

    /* ── Dropdown ── */
    .hp-dropdown { position: relative; }
    .hp-dropdown__trigger { background: none; border: none; font-family: ${T.fontBody}; font-size: 13.5px; font-weight: 500; color: ${T.black}; display: flex; align-items: center; gap: 5px; padding: 0 0 3px 0; transition: color .2s; cursor: pointer; position: relative; }
    .hp-dropdown__trigger::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: ${primaryColor}; transform: scaleX(0); transform-origin: left; transition: transform .22s; }
    .hp-dropdown__trigger:hover, .hp-dropdown__trigger.open { color: ${primaryColor}; }
    .hp-dropdown__trigger:hover::after, .hp-dropdown__trigger.open::after { transform: scaleX(1); }
    .hp-dropdown__caret { font-size: 9px; transition: transform .22s; display: inline-block; line-height: 1; }
    .hp-dropdown__caret.open { transform: rotate(180deg); }
    .hp-dropdown__menu { position: absolute; top: calc(100% + 10px); left: 0; background: ${T.white}; border: 1.5px solid ${T.darkerBg}; border-radius: ${T.radius}; min-width: 220px; box-shadow: 0 12px 40px rgba(0,0,0,0.14); overflow: visible; z-index: 500; animation: hp-fadeup .15s ease; }
    .hp-dropdown__item { display: block; padding: 11px 20px; font-size: 13px; color: ${T.black}; border-bottom: 1px solid ${T.lightBg}; transition: background .15s, color .15s; font-family: ${T.fontBody}; line-height: 1.4; text-decoration: none; }
    .hp-dropdown__item:last-child { border-bottom: none; }
    .hp-dropdown__item:hover { background: ${T.lightBg}; color: ${primaryColor}; }
    /* Subdropdown / Flyout */
    .hp-subdropdown { position: relative; }
    .hp-subdropdown__trigger { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 11px 20px; font-size: 13px; color: ${T.black}; border: none; background: none; text-align: left; cursor: pointer; border-bottom: 1px solid ${T.lightBg}; font-family: ${T.fontBody}; transition: background .15s, color .15s; }
    .hp-subdropdown__trigger:hover { background: ${primaryColor}; color: ${T.white}; }
    .hp-subdropdown__trigger:hover .hp-subdropdown__arrow { color: ${T.white}; }
    .hp-subdropdown__arrow { font-size: 10px; color: #999; flex-shrink: 0; }
    .hp-subdropdown__menu { position: absolute; top: 0; left: 100%; background: ${T.white}; border: 1.5px solid ${T.darkerBg}; border-radius: ${T.radius}; min-width: 260px; box-shadow: 0 12px 40px rgba(0,0,0,0.14); display: none; z-index: 501; }
    .hp-subdropdown:hover .hp-subdropdown__menu { display: block; animation: hp-fadeup .15s ease; }
    .hp-subdropdown__item { display: block; padding: 11px 20px; font-size: 13px; color: ${T.black}; border-bottom: 1px solid ${T.lightBg}; transition: background .15s, color .15s; font-family: ${T.fontBody}; line-height: 1.4; text-decoration: none; }
    .hp-subdropdown__item:last-child { border-bottom: none; }
    .hp-subdropdown__item:hover { background: ${primaryColor}; color: ${T.white}; }

    /* Mobile */
    .hp-mobile-toggle { display: none; background: none; border: none; font-size: 22px; color: ${T.black}; cursor: pointer; padding: 4px 6px; line-height: 1; }
    .hp-mobile-menu { display: none; }

    @keyframes hp-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 960px) {
      .hp-header__nav { display: none; }
      .hp-mobile-toggle { display: flex; align-items: center; justify-content: center; }
      .hp-mobile-menu {
        position: absolute; top: 66px; left: 0; right: 0;
        background: ${T.white}; border-top: 1px solid ${T.darkerBg};
        box-shadow: 0 8px 24px rgba(0,0,0,0.10);
        z-index: 199; padding: 8px 0;
        animation: hp-fadeup .18s ease;
      }
      .hp-mobile-menu.open { display: block; }
      .hp-mobile-link { display: block; padding: 11px 22px; font-size: 14px; font-weight: 500; color: ${T.black}; border-bottom: 1px solid ${T.lightBg}; text-decoration: none; transition: background .15s, color .15s; font-family: ${T.fontBody}; }
      .hp-mobile-link:hover { background: ${T.lightBg}; color: ${primaryColor}; }
      .hp-mobile-section { padding: 6px 22px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9ca3af; margin-top: 4px; }
      .hp-mobile-child { display: block; padding: 9px 22px 9px 36px; font-size: 13px; color: #555; border-bottom: 1px solid ${T.lightBg}; font-family: ${T.fontBody}; transition: background .15s, color .15s; text-decoration: none; }
      .hp-mobile-child:hover { background: ${T.lightBg}; color: ${primaryColor}; }
    }
    @media (max-width: 600px) {
      .hp-header__inner { padding: 0 16px; }
      .hp-header__name { display: none; }
    }
  `}</style>
)

/* ── Dropdown — exact copy of HomePage Dropdown ── */
const Dropdown = ({ label, items = [] }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  if (!items.length) return null
  return (
    <div className="hp-dropdown" ref={ref}>
      <button
        className={`hp-dropdown__trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {label}
        <span className={`hp-dropdown__caret ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="hp-dropdown__menu">
          {items.map((item, i) => {
            if (item.type === 'subdropdown' && Array.isArray(item.children) && item.children.length > 0) {
              return (
                <div key={i} className="hp-subdropdown">
                  <button className="hp-subdropdown__trigger">
                    <span>{item.label}</span>
                    <span className="hp-subdropdown__arrow">▶</span>
                  </button>
                  <div className="hp-subdropdown__menu">
                    {item.children.map((sub, j) => {
                      const isInternal = sub.href?.startsWith('/')
                      return isInternal
                        ? <Link key={j} to={sub.href} className="hp-subdropdown__item" onClick={() => setOpen(false)}>{sub.label}</Link>
                        : <a key={j} href={sub.href || '#'} className="hp-subdropdown__item"
                            target={sub.href?.startsWith('http') ? '_blank' : undefined}
                            rel={sub.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                            onClick={() => setOpen(false)}>{sub.label}</a>
                    })}
                  </div>
                </div>
              )
            }
            const isInternal = item.href?.startsWith('/')
            return isInternal
              ? <Link key={i} to={item.href} className="hp-dropdown__item" onClick={() => setOpen(false)}>{item.label}</Link>
              : <a key={i} href={item.href || '#'} className="hp-dropdown__item"
                  target={item.href?.startsWith('http') ? '_blank' : undefined}
                  rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}>{item.label}</a>
          })}
        </div>
      )}
    </div>
  )
}


/* ── CMSHeader — identical layout to HomePage Header, brand is a Home link ── */
const CMSHeader = ({ nav = [], appearance = {}, currentSlug = '' }) => {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef()
  const location  = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = e => { if (!headerRef.current?.contains(e.target)) setMobileOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const {
    schoolLogoUrl, officeLogoUrl,
    officeName, officeNameSub,
    primaryColor, headerAccent,
  } = appearance

  return (
    <>
      <ScopedStyles primaryColor={primaryColor || T.maroon} headerAccent={headerAccent || T.maroon} />
      <header className={`hp-header ${scrolled ? 'scrolled' : ''}`} ref={headerRef}>
        <div className="hp-header__inner">

          {/* Brand — always navigates to Homepage */}
          <Link to="/" className="hp-header__brand" style={{ textDecoration: 'none' }}>
            {schoolLogoUrl && (
              <img src={schoolLogoUrl} alt="School Logo"
                style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }} />
            )}
            {officeLogoUrl && (
              <>
                {schoolLogoUrl && <div className="hp-header__divider" />}
                <img src={officeLogoUrl} alt="IPMO Logo"
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
              </>
            )}
            {(officeName || officeNameSub) && (
              <div className="hp-header__name">
                {officeNameSub && <div className="hp-header__name-sub">{officeNameSub}</div>}
                {officeName    && <div className="hp-header__name-main">{officeName}</div>}
              </div>
            )}
          </Link>

          {/* Desktop Nav */}
          {nav.length > 0 && (
            <nav className="hp-header__nav">
              {nav.map(item => {
                if (item.type === 'link') {
                  // Normalise — stored slugs may come without leading slash
                  const href = item.href === '/' || item.href === ''
                    ? '/'
                    : item.href?.startsWith('/') ? item.href : `/${item.href}`
                  const isInternal = href.startsWith('/')
                  // Home is active only on exact /, all others match current pathname
                  const isActive = href === '/'
                    ? location.pathname === '/'
                    : location.pathname === href || location.pathname.startsWith(href + '/')
                  return isInternal
                    ? <Link key={item.id} to={href}
                        className={`hp-header__navlink ${isActive ? 'active' : ''}`}>{item.label}</Link>
                    : <a key={item.id} href={href} className="hp-header__navlink"
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >{item.label}</a>
                }
                if (item.type === 'dropdown') {
                  return <Dropdown key={item.id} label={item.label} items={item.children || []} />
                }
                return null
              })}
            </nav>
          )}

          {/* Right actions */}
          <div className="hp-header__actions">
            <button className="hp-mobile-toggle" onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle navigation">
              {mobileOpen ? 'X' : '='}
            </button>
            <Link to="/login">
              <button className="hp-signin-btn">Sign In</button>
            </Link>
          </div>

        </div>

        {/* Mobile slide-down menu */}
        {nav.length > 0 && (
          <div className={`hp-mobile-menu ${mobileOpen ? 'open' : ''}`}>
            {nav.map(item => {
              if (item.type === 'link') {
                // Normalise slug hrefs to always have a leading slash
                const href = item.href === '/' || item.href === ''
                  ? '/'
                  : item.href?.startsWith('/') ? item.href : `/${item.href}`
                const isInternal = href.startsWith('/')
                return isInternal
                  ? <Link key={item.id} to={href} className="hp-mobile-link"
                      onClick={() => setMobileOpen(false)}>{item.label}</Link>
                  : <a key={item.id} href={href} className="hp-mobile-link"
                      onClick={() => setMobileOpen(false)}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                      {item.label}
                    </a>
              }
              if (item.type === 'dropdown') {
                return (
                  <div key={item.id}>
                    <div className="hp-mobile-section">{item.label}</div>
                    {(item.children || []).map((child, ci) => {
                      if (child.type === 'subdropdown') {
                        return (
                          <div key={ci}>
                            <div className="hp-mobile-link"
                              style={{ fontWeight: 600, fontSize: 13, paddingLeft: 36 }}>
                              {child.label}
                            </div>
                            {(child.children || []).map((sub, si) => (
                              <a key={si} href={sub.href || '#'} className="hp-mobile-child"
                                style={{ paddingLeft: 52 }}
                                target={sub.href?.startsWith('http') ? '_blank' : undefined}
                                rel={sub.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                onClick={() => setMobileOpen(false)}>
                                {sub.label}
                              </a>
                            ))}
                          </div>
                        )
                      }
                      const childHref = child.href?.startsWith('/') ? child.href : `/${child.href || '#'}`
                      const isChildInternal = !child.href?.startsWith('http')
                      return isChildInternal
                        ? <Link key={ci} to={childHref} className="hp-mobile-child"
                            onClick={() => setMobileOpen(false)}>{child.label}</Link>
                        : <a key={ci} href={child.href || '#'} className="hp-mobile-child"
                            onClick={() => setMobileOpen(false)}
                            target="_blank" rel="noopener noreferrer">
                            {child.label}
                          </a>
                    })}
                  </div>
                )
              }
              return null
            })}
          </div>
        )}
      </header>
    </>
  )
}

/* ── YouTube ID extractor ── */
const ytId = (url = '') => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

/* ── Block renderers ── */
function RenderBlock({ block }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level || 'h2'
      return <Tag className={`dp-heading dp-heading--${block.level || 'h2'}`}>{block.text}</Tag>
    }
    case 'paragraph':
      return (
        <p className="dp-paragraph">
          {(block.text || '').split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
          ))}
        </p>
      )
    case 'bullets':
      return (
        <ul className="dp-list dp-list--bullets">
          {(block.items || []).map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
    case 'numbered':
      return (
        <ol className="dp-list dp-list--numbered">
          {(block.items || []).map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      )
    case 'divider':
      return <hr className="dp-divider" />
    case 'callout': {
      const variantMap = {
        info:    { icon: 'i', bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
        tip:     { icon: '*', bg: '#f0fdf4', border: '#22c55e', color: '#166534' },
        warning: { icon: '!', bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
        note:    { icon: 'N', bg: '#fdf2f2', border: '#800000', color: '#800000' },
      }
      const v = variantMap[block.variant] || variantMap.info
      return (
        <div className="dp-callout" style={{ background: v.bg, borderColor: v.border, color: v.color }}>
          <span className="dp-callout__icon">{v.icon}</span>
          <div>
            {block.title && <strong className="dp-callout__title">{block.title}</strong>}
            {block.text && <p className="dp-callout__text">{block.text}</p>}
          </div>
        </div>
      )
    }
    case 'youtube': {
      const id = ytId(block.url)
      if (!id) return null
      return (
        <div className="dp-youtube">
          <div className="dp-youtube__frame">
            <iframe src={`https://www.youtube.com/embed/${id}`}
              title={block.caption || 'YouTube video'} frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
          {block.caption && <p className="dp-youtube__caption">{block.caption}</p>}
        </div>
      )
    }
    case 'code':
      return (
        <div className="dp-code">
          {block.language && <div className="dp-code__lang">{block.language}</div>}
          <pre className="dp-code__pre"><code>{block.code}</code></pre>
        </div>
      )
    case 'image':
      if (!block.url) return null
      return (
        <figure className="dp-image">
          <img src={block.url} alt={block.alt || ''} />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
    case 'news_card': {
      const imgSrc = block.imgUrl || block.imgDataUrl || ''
      const learnHref = block.learnMoreMode === 'file'
        ? (block.learnMoreFile || block.learnMoreUrl || '')
        : (block.learnMoreUrl || block.learnMoreFile || '')
      const btnLabel   = block.learnMoreLabel || 'Learn More'
      const isBase64   = learnHref && learnHref.startsWith('data:')
      const isInternal = learnHref && learnHref.startsWith('/')

      const openFile = (e) => {
        e.preventDefault()
        // Convert base64 data URL → Blob → object URL and open in new tab
        try {
          const [meta, b64] = learnHref.split(',')
          const mime = meta.match(/:(.*?);/)?.[1] || 'application/octet-stream'
          const bytes = atob(b64)
          const arr   = new Uint8Array(bytes.length)
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
          const blob    = new Blob([arr], { type: mime })
          const blobUrl = URL.createObjectURL(blob)
          const win = window.open(blobUrl, '_blank')
          // Revoke after short delay so the tab has time to load
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
          if (!win) {
            // Fallback: force download if popup blocked
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = block.learnMoreFileName || 'document'
            a.click()
          }
        } catch {
          // Last resort fallback
          window.open(learnHref, '_blank')
        }
      }

      return (
        <div className="dp-news-card">
          <div className="dp-news-card__content">
            {block.caption && <p className="dp-news-card__caption">{block.caption}</p>}
            {learnHref && (
              isBase64
                ? <button className="dp-news-card__btn" onClick={openFile}>{btnLabel}</button>
                : isInternal
                  ? <Link to={learnHref} className="dp-news-card__btn">{btnLabel}</Link>
                  : <a href={learnHref} className="dp-news-card__btn"
                      target="_blank" rel="noopener noreferrer">
                      {btnLabel}
                    </a>
            )}
          </div>
          {imgSrc && (
            <div className="dp-news-card__thumb-wrap">
              <img
                src={imgSrc}
                alt={block.caption || 'News image'}
                className="dp-news-card__thumb"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
          )}
        </div>
      )
    }
    case 'table':
      if (!block.rows?.length) return null
      return (
        <div className="dp-table-wrap">
          <table className="dp-table">
            <thead>
              <tr>{(block.rows[0] || []).map((cell, i) => <th key={i}>{cell}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'faq':
      return <FaqItem question={block.question} answer={block.answer} />
    case 'link_btn': {
      const isExternal = (block.url || '').startsWith('http')
      return (
        <div className="dp-link-btn-wrap">
          {isExternal
            ? <a href={block.url} target="_blank" rel="noopener noreferrer"
                className={`dp-link-btn dp-link-btn--${block.variant || 'primary'}`}>
                {block.label || 'Click Here'}</a>
            : <a href={block.url || '#'}
                className={`dp-link-btn dp-link-btn--${block.variant || 'primary'}`}>
                {block.label || 'Click Here'}</a>
          }
        </div>
      )
    }
    case 'issuance': {
      const years = block.years || block.data || []
      if (!years.length) return null
      return (
        <div className="dp-wall dp-wall--issuance">
          {years.map((yr, yi) => (
            <div key={yi} className="dp-wall__year-section">
              <div className="dp-wall__year-label">{yr.year}</div>
              <div className="dp-wall__grid">
                {(yr.docs || []).map((doc, di) => (
                  <div key={di} className="dp-wall__card">
                    {doc.imgDataUrl
                      ? <div className="dp-wall__card-img"><img src={doc.imgDataUrl} alt={doc.title || doc.name} /></div>
                      : <div className="dp-wall__card-img dp-wall__card-img--placeholder">[doc]</div>
                    }
                    <div className="dp-wall__card-body">
                      {doc.name && <div className="dp-wall__card-id">{doc.name}</div>}
                      <div className="dp-wall__card-title">{doc.title || 'Untitled Document'}</div>
                      {doc.fileDataUrl && (
                        <a href={doc.fileDataUrl} download={doc.fileName || 'document'}
                          className="dp-wall__card-dl">
                           Download {doc.fileName ? doc.fileName.split('.').pop().toUpperCase() : 'File'}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    case 'ipwall': {
      const STATUS_COLORS = {
        'Registered': { bg: '#f0fdf4', color: '#166534', border: '#22c55e' },
        'Pending':    { bg: '#fffbeb', color: '#92400e', border: '#f59e0b' },
        'Published':  { bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
        'Expired':    { bg: '#f9fafb', color: '#6b7280', border: '#d1d5db' },
      }
      const years = block.years || block.data || []
      if (!years.length) return null
      return (
        <div className="dp-wall dp-wall--ipwall">
          {years.map((yr, yi) => (
            <div key={yi} className="dp-wall__year-section">
              <div className="dp-wall__year-label">{yr.year}</div>
              <div className="dp-wall__grid">
                {(yr.entries || []).map((entry, ei) => {
                  const sc = STATUS_COLORS[entry.status] || STATUS_COLORS['Registered']
                  return (
                    <div key={ei} className="dp-wall__card dp-wall__card--ip">
                      {entry.imgDataUrl
                        ? <div className="dp-wall__card-img"><img src={entry.imgDataUrl} alt={entry.title} /></div>
                        : <div className="dp-wall__card-img dp-wall__card-img--placeholder" />
                      }
                      <div className="dp-wall__card-body">
                        <div className="dp-wall__card-badges">
                          <span className="dp-wall__badge dp-wall__badge--type">{entry.type}</span>
                          <span className="dp-wall__badge" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>{entry.status}</span>
                        </div>
                        <div className="dp-wall__card-title">{entry.title || 'Untitled IP'}</div>
                        {entry.inventor && <div className="dp-wall__card-meta">Inventor: {entry.inventor}</div>}
                        {entry.regNo && <div className="dp-wall__card-meta">Reg. No.: {entry.regNo}</div>}
                        {entry.department && <div className="dp-wall__card-meta">Dept.: {entry.department}</div>}
                        {entry.fileDataUrl && (
                          <a href={entry.fileDataUrl} download={entry.fileName || 'ip-document'}
                            className="dp-wall__card-dl">
                             Download {entry.fileName ? entry.fileName.split('.').pop().toUpperCase() : 'File'}
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )
    }
    default: return null
  }
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`dp-faq ${open ? 'dp-faq--open' : ''}`}>
      <button className="dp-faq__q" onClick={() => setOpen(o => !o)}>
        <span>{question}</span>
        <span className="dp-faq__arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="dp-faq__a">{answer}</div>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function DynamicPage() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const [page,     setPage]     = useState(null)
  const [cms,      setCms]      = useState({ navItems: [], appearanceData: {} })
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  /* Fetch CMS header data + page content in parallel */
  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    const pageUrl = `${API_BASE}/public/pages/${slug}`
    console.log('[DynamicPage] fetching:', pageUrl)

    Promise.all([
      fetchHomePageData(),
      fetch(pageUrl).then(res => {
        if (res.status === 404) return null
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
    ])
      .then(([cmsData, pageData]) => {
        setCms(cmsData || { navItems: [], appearanceData: {} })
        if (!pageData) setNotFound(true)
        else setPage(pageData)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  /* Always show header — even on loading/404 */
  const header = (
    <CMSHeader
      nav={cms.navItems || []}
      appearance={cms.appearanceData || {}}
      currentSlug={slug}
    />
  )

  if (loading) return (
    <>
      {header}
      <div className="dp-state">
        <div className="dp-state__spinner" />
        <p>Loading page…</p>
      </div>
    </>
  )

  if (notFound) return (
    <>
      {header}
      <div className="dp-state dp-state--404">
        <div className="dp-state__icon">404</div>
        <h2>Page not found</h2>
        <p>This page doesn't exist or hasn't been published yet.</p>
      </div>
    </>
  )

  return (
    <div className="dp-wrap">
      {header}

      {/* Rich editorial page title bar */}
      <div className="dp-page-header">
        <div className="dp-page-header__inner">
          <div className="dp-page-header__meta">
            <span className="dp-page-header__eyebrow">CNSC · IPMO</span>
          </div>
          <h1 className="dp-page-title">{page.title}</h1>
          <div className="dp-page-title-rule">
            <span className="dp-page-title-rule__line" />
            <span className="dp-page-title-rule__dot" />
            <span className="dp-page-title-rule__line-thin" />
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="dp-content">
        <div className="dp-content__inner">
          {(page.blocks || []).length === 0
            ? <p className="dp-empty">This page has no content yet.</p>
            : (page.blocks || []).map((block, i) => (
                <RenderBlock key={block.id || i} block={block} />
              ))
          }
        </div>
      </div>
    </div>
  )
}