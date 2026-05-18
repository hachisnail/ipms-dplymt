import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/main2.css'
import { fetchHomePageData } from '../components/homePageData'

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
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

/* ============================================================
   SCOPED STYLES — namespaced under .hp-root, no global leak
   ============================================================ */
const ScopedStyles = ({ primaryColor = T.maroon, pageBg = T.lightBg, headerAccent = T.maroon }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

    .hp-root { font-family: ${T.fontBody}; background: ${pageBg}; color: ${T.black}; }

    /* ── Scrolling: scoped ONLY to the homepage ── */
    /* index.css locks html/body/root to overflow:hidden for portal pages. */
    /* We undo that here — only for .hp-root — so the homepage scrolls     */
    /* while admin/consultant/inventor dashboards remain scroll-locked.     */
    .hp-root {
      height: auto;
      min-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    }

    /* Prevent inner elements from re-locking scroll */
    .hp-root main {
      overflow: visible;
      height: auto;
    }
    .hp-root * { box-sizing: border-box; }
    .hp-root a { text-decoration: none; color: inherit; }
    .hp-root button { cursor: pointer; }

    /* ── Header ── */
    .hp-header {
      position: sticky; width: 100%; top: 0;
      z-index: 200; background: ${T.white};
      border-bottom: 2.5px solid ${headerAccent};
      transition: box-shadow .3s;
    }
    .hp-header.scrolled { box-shadow: 0 2px 22px rgba(0,0,0,0.10); }
    .hp-header__inner {
      width: 100%; max-width: 1440px; padding: 0 24px; height: 66px;
      display: flex; align-items: center; justify-content: space-between;
      margin: 0 auto;
    }
    .hp-header__brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex: 1; text-decoration: none; }
    .hp-header__divider { width: 1px; height: 32px; background: ${T.darkerBg}; }
    .hp-header__name { line-height: 1.2; }
    .hp-header__name-sub  { font-size: 10.5px; font-weight: 400; color: #888; letter-spacing: .6px; text-transform: uppercase; }
    .hp-header__name-main { font-size: 14px; font-weight: 700; color: ${primaryColor}; font-family: ${T.font}; }
    .hp-header__nav { display: flex; align-items: center; gap: 26px; justify-content: center; }
    .hp-header__navlink { font-size: 13.5px; font-weight: 500; color: ${T.black}; transition: color .2s; position: relative; padding-bottom: 3px; }
    .hp-header__navlink::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: ${primaryColor}; transform: scaleX(0); transform-origin: left; transition: transform .22s; }
    .hp-header__navlink:hover { color: ${primaryColor}; }
    .hp-header__navlink:hover::after { transform: scaleX(1); }
    .hp-header__navlink.active { color: ${primaryColor}; font-weight: 700; }
    .hp-header__navlink.active::after { transform: scaleX(1); }
    .hp-header__actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; flex: 1; justify-content: flex-end; }
  
    .hp-signin-btn {
      background: ${primaryColor}; color: ${T.white}; padding: 8px 22px;
      border-radius: 24px; font-size: 13.5px; font-weight: 600; border: none;
      font-family: ${T.fontBody}; transition: all .2s;
      box-shadow: 0 2px 10px rgba(128,0,0,0.22); white-space: nowrap;
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
    .hp-dropdown__item { display: block; padding: 11px 20px; font-size: 13px; color: ${T.black}; border-bottom: 1px solid ${T.lightBg}; transition: background .15s, color .15s; font-family: ${T.fontBody}; line-height: 1.4; }
    .hp-dropdown__item:last-child { border-bottom: none; }
    .hp-dropdown__item:hover { background: ${T.lightBg}; color: ${primaryColor}; }
    /* ── Subdropdown / Flyout — IPOPHL-style ── */
    .hp-subdropdown { position: relative; }
    .hp-subdropdown__trigger {
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; padding: 11px 20px; font-size: 13px; color: ${T.black};
      border: none; background: none; text-align: left; cursor: pointer;
      border-bottom: 1px solid ${T.lightBg}; font-family: ${T.fontBody};
      transition: background .15s, color .15s;
    }
    .hp-subdropdown__trigger:hover { background: ${primaryColor}; color: ${T.white}; }
    .hp-subdropdown__trigger:hover .hp-subdropdown__arrow { color: ${T.white}; }
    .hp-subdropdown__arrow { font-size: 10px; color: #999; flex-shrink: 0; }
    .hp-subdropdown__menu {
      position: absolute; top: 0; left: 100%;
      background: ${T.white}; border: 1.5px solid ${T.darkerBg};
      border-radius: ${T.radius}; min-width: 260px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.14);
      display: none; z-index: 501;
    }
    .hp-subdropdown:hover .hp-subdropdown__menu { display: block; animation: hp-fadeup .15s ease; }
    .hp-subdropdown__item {
      display: block; padding: 11px 20px; font-size: 13px; color: ${T.black};
      border-bottom: 1px solid ${T.lightBg}; transition: background .15s, color .15s;
      font-family: ${T.fontBody}; line-height: 1.4;
    }
    .hp-subdropdown__item:last-child { border-bottom: none; }
    .hp-subdropdown__item:hover { background: ${primaryColor}; color: ${T.white}; }

    /* ── Hero / Display ── */
    .hp-display { position: relative; overflow: hidden; min-height: 440px; display: flex; align-items: center; transition: background 1s ease; padding: 72px 28px; }
    .hp-display__grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 44px 44px; pointer-events: none; }
    .hp-display__ring1 { position: absolute; right: -100px; top: -100px; width: 500px; height: 500px; border-radius: 50%; border: 72px solid rgba(255,255,255,0.05); pointer-events: none; }
    .hp-display__ring2 { position: absolute; left: -60px; bottom: -110px; width: 330px; height: 330px; border-radius: 50%; border: 50px solid rgba(255,255,255,0.04); pointer-events: none; }
    .hp-display__inner { max-width: 1280px; margin: 0 auto; padding: 68px 28px; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: center; }
    .hp-display__content { transition: opacity .28s, transform .28s; }
    .hp-display__content.animating { opacity: 0; transform: translateY(12px); }
    .hp-display__tag { display: inline-flex; align-items: center; background: rgba(255,255,255,0.16); color: ${T.white}; font-size: 10.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; margin-bottom: 20px; backdrop-filter: blur(8px); }
    .hp-display__headline { font-family: ${T.font}; font-size: clamp(26px, 3.5vw, 46px); font-weight: 700; color: ${T.white}; line-height: 1.14; margin-bottom: 16px; }
    .hp-display__sub { font-size: 15.5px; color: rgba(255,255,255,0.82); line-height: 1.73; margin-bottom: 32px; max-width: 500px; }
    .hp-display__actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .hp-display__btn-primary { background: ${T.white}; color: ${primaryColor}; padding: 11px 28px; border-radius: 28px; font-weight: 700; font-size: 14px; font-family: ${T.fontBody}; border: none; transition: all .2s; box-shadow: 0 4px 18px rgba(0,0,0,0.18); }
    .hp-display__btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(0,0,0,0.22); }
    .hp-display__btn-secondary { color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500; transition: color .2s; }
    .hp-display__btn-secondary:hover { color: ${T.white}; }
    .hp-display__imagebox { background: rgba(255,255,255,0.10); border-radius: ${T.radiusLg}; border: 1px solid rgba(255,255,255,0.18); min-height: 230px; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(6px); font-size: 84px; position: relative; overflow: hidden; transition: opacity .28s, transform .28s; }
    .hp-display__imagebox.animating { opacity: 0; transform: translateY(8px); }
    .hp-display__imagebox img { width: 100%; height: 100%; object-fit: cover; border-radius: 13px; }
    .hp-display__imagebox-hint { position: absolute; bottom: 10px; font-size: 10.5px; color: rgba(255,255,255,0.4); letter-spacing: 1px; text-transform: uppercase; }
    .hp-display__dots { display: flex; gap: 8px; margin-top: 38px; }
    .hp-display__dot { height: 8px; border-radius: 4px; border: none; background: rgba(255,255,255,0.33); transition: all .3s; padding: 0; }
    .hp-display__dot.active { background: ${T.white}; }

    /* ── Empty placeholder ── */
    .hp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 28px; text-align: center; }
    .hp-empty__icon { font-size: 48px; opacity: 0.35; }
    .hp-empty__text { font-size: 15px; color: #aaa; font-style: italic; }
    .hp-empty__sub { font-size: 12.5px; color: #ccc; }

    /* ── Section shared ── */
    .hp-section-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: ${T.green}; display: block; margin-bottom: 8px; }
    .hp-section-title { font-family: ${T.font}; font-size: clamp(22px, 3vw, 34px); font-weight: 700; color: ${T.black}; margin-bottom: 38px; }

    /* ── Categories ── */
    .hp-categories { background: ${pageBg}; padding: 72px 28px; }
    .hp-categories__inner { max-width: 1280px; margin: 0 auto; }
    .hp-categories__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(242px, 1fr)); gap: 20px; }
    .hp-catcard { background: ${T.white}; border-radius: ${T.radiusLg}; border: 1.5px solid ${T.darkerBg}; padding: 28px 24px; transition: all .25s; cursor: pointer; display: flex; flex-direction: column; gap: 13px; }
    .hp-catcard:hover { border-color: var(--cc, ${primaryColor}); transform: translateY(-5px); box-shadow: ${T.shadowHov}; }
    .hp-catcard__icon { width: 50px; height: 50px; border-radius: 10px; background: ${T.lightBg}; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: background .25s; }
    .hp-catcard:hover .hp-catcard__icon { background: var(--ccl, ${T.maroonLight}); }
    .hp-catcard__title { font-family: ${T.font}; font-size: 17px; font-weight: 700; color: ${T.black}; }
    .hp-catcard__desc { font-size: 13px; color: #555; line-height: 1.68; flex: 1; }
    .hp-catcard__services { display: flex; flex-direction: column; gap: 7px; }
    .hp-catcard__svc { font-size: 12.5px; color: #666; display: flex; align-items: center; gap: 8px; transition: color .2s; }
    .hp-catcard:hover .hp-catcard__svc { color: var(--cc, ${primaryColor}); }
    .hp-catcard__dot { width: 4px; height: 4px; border-radius: 50%; background: ${T.darkerBg}; flex-shrink: 0; transition: background .2s; }
    .hp-catcard:hover .hp-catcard__dot { background: var(--cc, ${primaryColor}); }
    .hp-catcard__cta { font-size: 13px; font-weight: 600; color: var(--cc, ${primaryColor}); opacity: 0; transition: opacity .22s; margin-top: 2px; }
    .hp-catcard:hover .hp-catcard__cta { opacity: 1; }

    /* ── News ── */
    .hp-news { background: ${T.white}; padding: 72px 28px; }
    .hp-news__inner { max-width: 1280px; margin: 0 auto; }
    .hp-news__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 38px; flex-wrap: wrap; gap: 12px; }
    .hp-news__viewall { font-size: 13.5px; font-weight: 600; color: ${primaryColor}; display: flex; align-items: center; gap: 5px; transition: gap .2s; }
    .hp-news__viewall:hover { gap: 10px; }
    .hp-news__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(256px, 1fr)); gap: 20px; }
    .hp-newscard { background: ${T.white}; border: 1.5px solid ${T.darkerBg}; border-radius: ${T.radius}; overflow: hidden; cursor: pointer; transition: all .25s; }
    .hp-newscard:hover { transform: translateY(-4px); box-shadow: ${T.shadowHov}; border-color: var(--nc, ${primaryColor}); }
    .hp-newscard__thumb { height: 160px; background: ${T.lightBg}; display: flex; align-items: center; justify-content: center; border-bottom: 3px solid transparent; transition: all .25s; overflow: hidden; }
    .hp-newscard:hover .hp-newscard__thumb { border-bottom-color: var(--nc, ${primaryColor}); }
    .hp-newscard__thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
    .hp-newscard:hover .hp-newscard__thumb img { transform: scale(1.04); }
    .hp-newscard__thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${T.lightBg}; }
    .hp-newscard__body { padding: 16px 18px 20px; }
    .hp-newscard__meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .hp-newscard__tag { font-size: 10.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 3px 10px; border-radius: 12px; }
    .hp-newscard__date { font-size: 11.5px; color: #888; }
    .hp-newscard__title { font-family: ${T.font}; font-size: 14.5px; font-weight: 600; color: ${T.black}; line-height: 1.45; margin-bottom: 7px; }
    .hp-newscard__excerpt { font-size: 12.5px; color: #666; line-height: 1.66; }

    /* ── Compliance ── */
    .hp-compliance { background: ${pageBg}; padding: 72px 28px; }
    .hp-compliance__inner { max-width: 1280px; margin: 0 auto; }
    .hp-compliance__card { background: ${T.white}; border-radius: ${T.radiusLg}; border: 1.5px solid ${T.darkerBg}; padding: 52px 40px; display: flex; flex-direction: column; align-items: center; gap: 36px; box-shadow: ${T.shadow}; }
    .hp-compliance__text { text-align: center; max-width: 580px; }
    .hp-compliance__sub { font-size: 14px; color: #666; line-height: 1.72; margin-top: 12px; }
    .hp-compliance__logos { display: flex; flex-wrap: wrap; justify-content: center; gap: 38px; }
    .hp-compliance__logoitem { display: flex; flex-direction: column; align-items: center; gap: 9px; }
    .hp-compliance__badge { width: 110px; height: 110px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #444; letter-spacing: .3px; transition: transform .2s; text-align: center; line-height: 1.2; padding: 8px; background: transparent !important; border: 1.5px solid #e8eaed; }
    .hp-compliance__badge:hover { transform: translateY(-4px); box-shadow: 0 6px 20px rgba(0,0,0,0.10); }
    .hp-compliance__badge img { width: 100%; height: 100%; object-fit: contain; }
    .hp-compliance__label { font-size: 11px; color: #666; text-align: center; max-width: 82px; line-height: 1.4; }
    .hp-compliance__notice { padding: 14px 22px; background: ${pageBg}; border-radius: 8px; border-left: 4px solid ${primaryColor}; font-size: 13px; color: #555; line-height: 1.72; max-width: 570px; width: 100%; }
    .hp-compliance__notice strong { color: ${primaryColor}; }

    /* ── Footer ── */
    .hp-footer { background: ${T.black}; color: ${T.white}; padding: 54px 28px 28px; }
    .hp-footer__inner { max-width: 1280px; margin: 0 auto; }
    .hp-footer__grid { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 36px; margin-bottom: 42px; }
    .hp-footer__brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .hp-footer__brand-name { font-family: ${T.font}; font-size: 15px; font-weight: 700; color: ${T.white}; }
    .hp-footer__brand-desc { font-size: 13px; color: rgba(255,255,255,0.48); line-height: 1.72; }
    .hp-footer__col-title { font-size: 10.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${T.darkerBg}; margin-bottom: 16px; }
    .hp-footer__link { display: block; font-size: 13px; color: rgba(255,255,255,0.48); margin-bottom: 9px; transition: color .15s; }
    .hp-footer__link:hover { color: ${T.white}; }
    .hp-footer__bottom { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 22px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .hp-footer__copy { font-size: 11.5px; color: rgba(255,255,255,0.28); }

    /* ── Keyframes ── */
    @keyframes hp-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Responsive ── */
    .hp-mobile-toggle { display: none; background: none; border: none; font-size: 22px; color: ${T.black}; cursor: pointer; padding: 4px 6px; line-height: 1; }
    .hp-mobile-menu { display: none; }

    @media (max-width: 960px) {
      .hp-header__nav { display: none; }
      .hp-mobile-toggle { display: flex; align-items: center; justify-content: center; }
      .hp-display__inner { grid-template-columns: 1fr; }
      .hp-display__imagebox { display: none; }
      .hp-footer__grid { grid-template-columns: 1fr 1fr; }

      /* Mobile slide-down menu */
      .hp-mobile-menu {
        position: absolute; top: 66px; left: 0; right: 0;
        background: ${T.white}; border-top: 1px solid ${T.darkerBg};
        box-shadow: 0 8px 24px rgba(0,0,0,0.10);
        z-index: 199; padding: 8px 0;
        animation: hp-fadeup .18s ease;
      }
      .hp-mobile-menu.open { display: block; }
      .hp-mobile-link {
        display: block; padding: 11px 22px; font-size: 14px; font-weight: 500;
        color: ${T.black}; border-bottom: 1px solid ${T.lightBg};
        text-decoration: none; transition: background .15s, color .15s;
        font-family: ${T.fontBody};
      }
      .hp-mobile-link:hover { background: ${T.lightBg}; color: ${primaryColor}; }
      .hp-mobile-section { padding: 6px 22px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9ca3af; margin-top: 4px; }
      .hp-mobile-child { display: block; padding: 9px 22px 9px 36px; font-size: 13px; color: #555; border-bottom: 1px solid ${T.lightBg}; font-family: ${T.fontBody}; transition: background .15s, color .15s; }
      .hp-mobile-child:hover { background: ${T.lightBg}; color: ${primaryColor}; }
    }
    @media (max-width: 600px) {
      .hp-header__inner { padding: 0 16px; }
      .hp-header__name { display: none; }
      .hp-compliance__card { padding: 32px 18px; }
      .hp-footer__grid { grid-template-columns: 1fr; }
    }
  `}</style>
)

/* ============================================================
   DROPDOWN COMPONENT — flyout subdropdown, matches IPOPHL reference design
   ============================================================ */
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
            // Subdropdown with flyout children (e.g. Forms → Registration → list)
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
            // Plain link — supports full URLs
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



/* ============================================================
   HEADER — driven entirely by CMS data
   Only hardcoded element: Sign In button
   ============================================================ */
const Header = ({ nav = [], appearance = {} }) => {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const headerRef = useRef()
  const location  = useLocation()

  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 24) }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close mobile menu on outside click
  useEffect(() => {
    const fn = e => { if (!headerRef.current?.contains(e.target)) setMobileOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const schoolLogoUrl = appearance.schoolLogoUrl || null
  const officeLogoUrl = appearance.officeLogoUrl || null
  const officeName    = appearance.officeName    || ''
  const officeNameSub = appearance.officeNameSub || ''

  return (
    <header className={`hp-header ${scrolled ? 'scrolled' : ''}`} ref={headerRef} style={{ position: 'sticky' }}>
      <div className="hp-header__inner">

        {/* Brand — clicking always navigates to Home */}
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

        {/* Desktop Nav — hidden on mobile via CSS */}
        {nav.length > 0 && (
          <nav className="hp-header__nav">
            {nav.map(item => {
              if (item.type === 'link') {
                const isInternal = item.href?.startsWith('/')
                // Active: exact match for '/', prefix match for all other routes
                const isActive = item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                return isInternal
                  ? <Link key={item.id} to={item.href}
                      className={`hp-header__navlink ${isActive ? 'active' : ''}`}>{item.label}</Link>
                  : <a key={item.id} href={item.href || '#'} className="hp-header__navlink"
                      target={item.href?.startsWith('http') ? '_blank' : undefined}
                      rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
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
        
          {/* Mobile hamburger */}
          <button className="hp-mobile-toggle" onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation">
            {mobileOpen ? '✕' : '☰'}
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
              const isInternal = item.href?.startsWith('/')
              return isInternal
                ? <Link key={item.id} to={item.href} className="hp-mobile-link" onClick={() => setMobileOpen(false)}>{item.label}</Link>
                : <a key={item.id} href={item.href || '#'} className="hp-mobile-link" onClick={() => setMobileOpen(false)}
                    target={item.href?.startsWith('http') ? '_blank' : undefined}
                    rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
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
                          <div className="hp-mobile-link" style={{ fontWeight: 600, fontSize: 13, paddingLeft: 36 }}>
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
                    const isInternal = child.href?.startsWith('/')
                    return isInternal
                      ? <Link key={ci} to={child.href} className="hp-mobile-child" onClick={() => setMobileOpen(false)}>{child.label}</Link>
                      : <a key={ci} href={child.href || '#'} className="hp-mobile-child"
                          target={child.href?.startsWith('http') ? '_blank' : undefined}
                          rel={child.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          onClick={() => setMobileOpen(false)}>
                          {child.label}
                        </a>
                  })}
                </div>
              )
            }
            return null
          })}
          {/* Sign in at bottom of mobile menu */}
          <div style={{ padding: '12px 22px', borderTop: '1px solid #e5e7eb' }}>
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <button className="hp-signin-btn" style={{ width: '100%' }}>Sign In</button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

/* ============================================================
   DISPLAY / HERO SECTION — CMS Display tab
   Shows placeholder when admin hasn't added slides yet
   ============================================================ */
const DisplaySection = ({ slides = [] }) => {
  const [current, setCurrent]   = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef()

  const goTo = i => {
    if (i === current || slides.length < 2) return
    setAnimating(true)
    setTimeout(() => { setCurrent(i); setAnimating(false) }, 280)
  }

  useEffect(() => {
    if (slides.length < 2) return
    timerRef.current = setInterval(() => {
      setAnimating(true)
      setTimeout(() => { setCurrent(c => (c + 1) % slides.length); setAnimating(false) }, 280)
    }, 5800)
    return () => clearInterval(timerRef.current)
  }, [slides.length])

  // Empty state — no slides added via CMS yet
  if (!slides.length) {
    return (
      <section className="hp-display" style={{ background: 'linear-gradient(135deg, #800000 0%, #3d0000 100%)' }}>
        <div className="hp-display__grid" />
        <div className="hp-display__ring1" />
        <div className="hp-display__ring2" />
        <div style={{ margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '80px 28px' }}>
        </div>
      </section>
    )
  }

  const s = slides[current]

  return (
    <section className="hp-display" style={{ background: s.bg || 'linear-gradient(135deg, #800000, #005555)' }}>
      <div className="hp-display__grid" />
      <div className="hp-display__ring1" />
      <div className="hp-display__ring2" />
      <div className="hp-display__inner">
        <div className={`hp-display__content ${animating ? 'animating' : ''}`}>
          {s.tag      && <div className="hp-display__tag">{s.tag}</div>}
          {s.headline && <h2 className="hp-display__headline">{s.headline}</h2>}
          {s.sub      && <p className="hp-display__sub">{s.sub}</p>}
          <div className="hp-display__actions">
            <Link to="/signup">
              <button className="hp-display__btn-primary">Get Started Free</button>
            </Link>
            {s.ctaHref && (
              <a href={s.ctaHref} className="hp-display__btn-secondary">{s.ctaLabel || 'Learn More'} →</a>
            )}
          </div>
          {slides.length > 1 && (
            <div className="hp-display__dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`hp-display__dot ${i === current ? 'active' : ''}`}
                  style={{ width: i === current ? 28 : 8 }}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className={`hp-display__imagebox ${animating ? 'animating' : ''}`}>
          {s.imageUrl
            ? <img src={s.imageUrl} alt={s.headline} />
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.3)' }}>
                <span style={{ fontSize: 52, opacity: 0.4 }}>🖼️</span>
                <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>No image set</span>
              </div>
          }
          {s.imageUrl && <div className="hp-display__imagebox-hint">Display Image</div>}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   CATEGORY CARDS — CMS Categories tab
   ============================================================ */
const CategoryCard = ({ icon, title, desc, services = [], color, colorLight, pageSlug }) => {
  const inner = (
    <div className="hp-catcard" style={{ '--cc': color, '--ccl': colorLight }}>
      <div className="hp-catcard__icon">{icon || '★'}</div>
      <h3 className="hp-catcard__title">{title}</h3>
      {desc && <p className="hp-catcard__desc">{desc}</p>}
      {services.length > 0 && (
        <div className="hp-catcard__services">
          {services.map((s, i) => (
            <span key={i} className="hp-catcard__svc">
              <span className="hp-catcard__dot" />{s}
            </span>
          ))}
        </div>
      )}
      <div className="hp-catcard__cta"></div>
    </div>
  )
  return pageSlug
    ? <Link to={pageSlug} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
    : inner
}

const CategoryCards = ({ cards = [] }) => (
  <section className="hp-categories">
    <div className="hp-categories__inner">
      <span className="hp-section-eyebrow">IP Categories</span>
      <h2 className="hp-section-title">What We Protect</h2>
      {cards.length > 0 ? (
        <div className="hp-categories__grid">
          {cards.map(card => <CategoryCard key={card.id} {...card} />)}
        </div>
      ) : (
        <div className="hp-empty">
          <div className="hp-empty__icon">🗂️</div>
          <p className="hp-empty__text">No IP categories added yet.</p>
          <p className="hp-empty__sub">Admin → Content Management → Categories</p>
        </div>
      )}
    </div>
  </section>
)

/* ============================================================
   NEWS & UPDATES — CMS News & Updates tab
   ============================================================ */
const NewsCard = ({ tag, date, imageUrl, title, excerpt, color, colorLight, pageSlug }) => {
  const inner = (
    <article className="hp-newscard" style={{ '--nc': color, '--ncl': colorLight }}>
      <div className="hp-newscard__thumb">
        {imageUrl
          ? <img src={imageUrl} alt={title} />
          : <div className="hp-newscard__thumb-placeholder">
              <span style={{ fontSize: 32, opacity: 0.25 }}>📄</span>
            </div>
        }
      </div>
      <div className="hp-newscard__body">
        <div className="hp-newscard__meta">
          <span className="hp-newscard__tag" style={{ color, background: colorLight }}>{tag}</span>
          <span className="hp-newscard__date">{date}</span>
        </div>
        <h4 className="hp-newscard__title">{title}</h4>
        {excerpt && <p className="hp-newscard__excerpt">{excerpt}</p>}
        {pageSlug && (
          <div className="hp-newscard__readmore">Read More →</div>
        )}
      </div>
    </article>
  )
  return pageSlug
    ? <Link to={pageSlug} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
    : inner
}

/* ── Helper: find a nav item href by label anywhere in the nav tree ── */
const findNavHref = (nav = [], labelMatch) => {
  const norm = l => (l || '').toLowerCase().trim()
  const target = norm(labelMatch)
  for (const item of nav) {
    if (item.type === 'link' && norm(item.label) === target) return item.href
    if (item.type === 'dropdown' && Array.isArray(item.children)) {
      for (const child of item.children) {
        if (norm(child.label) === target) return child.href
        // subdropdown
        if (child.type === 'subdropdown' && Array.isArray(child.children)) {
          for (const sub of child.children) {
            if (norm(sub.label) === target) return sub.href
          }
        }
      }
    }
  }
  return null
}

const NewsUpdates = ({ articles = [], nav = [] }) => {
  // Resolve "All Articles" link from the nav tree — looks for an item labelled "Articles"
  const articlesHref = findNavHref(nav, 'articles') || findNavHref(nav, 'all articles')
  const isInternal   = articlesHref && articlesHref.startsWith('/')

  return (
  <section className="hp-news">
    <div className="hp-news__inner">
      <div className="hp-news__header">
        <div>
          <span className="hp-section-eyebrow">Latest</span>
          <h2 className="hp-section-title" style={{ marginBottom: 0 }}>News &amp; Updates</h2>
        </div>
        {articlesHref
          ? isInternal
            ? <Link to={articlesHref} className="hp-news__viewall">All Articles →</Link>
            : <a href={articlesHref} className="hp-news__viewall"
                target={articlesHref.startsWith('http') ? '_blank' : undefined}
                rel={articlesHref.startsWith('http') ? 'noopener noreferrer' : undefined}>
                All Articles →
              </a>
          : <span className="hp-news__viewall" style={{ opacity: 0.35, cursor: 'default' }}>All Articles →</span>
        }
      </div>
      {articles.length > 0 ? (
        <div className="hp-news__grid">
          {articles.map(a => <NewsCard key={a.id} {...a} />)}
        </div>
      ) : (
        <div className="hp-empty">
          <div className="hp-empty__icon">📰</div>
          <p className="hp-empty__text">No news or announcements published yet.</p>
          <p className="hp-empty__sub">Admin → Content Management → News &amp; Updates</p>
        </div>
      )}
    </div>
  </section>
  )
}

/* ============================================================
   COMPLIANCE / PARTNERS — CMS Compliance tab
   ============================================================ */
const ComplianceBadge = ({ abbr, label, bg, logoUrl }) => (
  <div className="hp-compliance__logoitem">
    <div className="hp-compliance__badge">
      {logoUrl ? <img src={logoUrl} alt={label} /> : <span style={{ color: bg, fontWeight: 800, fontSize: 13 }}>{abbr}</span>}
    </div>
    <span className="hp-compliance__label">{label}</span>
  </div>
)

const ComplianceCard = ({ logos = [] }) => (
  <section className="hp-compliance">
    <div className="hp-compliance__inner">
      <div className="hp-compliance__card">
        <div className="hp-compliance__text">
          <span className="hp-section-eyebrow" style={{ textAlign: 'center', display: 'block' }}>
            Partners &amp; Compliance
          </span>
          <h2 className="hp-section-title" style={{ textAlign: 'center', marginBottom: 0 }}>
            Recognized &amp; Affiliated With
          </h2>
          <p className="hp-compliance__sub">
            Our IP Management Office operates in full compliance with national and international
            intellectual property frameworks and is affiliated with the following bodies.
          </p>
        </div>
        {logos.length > 0 ? (
          <div className="hp-compliance__logos">
            {logos.map(l => <ComplianceBadge key={l.id} {...l} />)}
          </div>
        ) : (
          <div className="hp-empty">
            <div className="hp-empty__icon">🤝</div>
            <p className="hp-empty__text">No partner logos added yet.</p>
            <p className="hp-empty__sub">Admin → Content Management → Compliance</p>
          </div>
        )}
        <div className="hp-compliance__notice">
          <strong>Republic Act 8293</strong> — All IP activities conducted by this office are governed
          by the Intellectual Property Code of the Philippines and applicable IPOPHL regulations.
        </div>
      </div>
    </div>
  </section>
)

/* ============================================================
   FOOTER — uses CMS appearance for office name
   ============================================================ */
const Footer = ({ appearance = {}, nav = [] }) => {
  const officeName = appearance.officeName || 'IP Management Office'

  // Build footer columns from CMS nav — pick Services + References if present
  const navServices   = nav.find(n => n.label?.toLowerCase().includes('service'))
  const navReferences = nav.find(n => n.label?.toLowerCase().includes('reference') || n.label?.toLowerCase().includes('update'))

  const footerCols = [
    navServices && {
      title: navServices.label,
      links: (navServices.children || []).filter(c => c.type !== 'subdropdown').slice(0, 5).map(c => ({ label: c.label, href: c.href || '#' })),
    },
    navReferences && {
      title: navReferences.label,
      links: (navReferences.children || []).filter(c => c.type !== 'subdropdown').slice(0, 5).map(c => ({ label: c.label, href: c.href || '#' })),
    },
    { title: 'Contact Us', links: [{ label: 'ipmo@cnsc.edu.ph', href: 'mailto:ipmo@cnsc.edu.ph' }, { label: 'Mon–Fri  8am–5pm', href: '#' }] },
  ].filter(Boolean)

  // Fallback if CMS nav is empty
  const cols = footerCols.length > 1 ? footerCols : [
    { title: 'Services',   links: [{ label: 'Registration', href: '#' }, { label: 'Application', href: '#' }, { label: 'Filing', href: '#' }] },
    { title: 'References', links: [{ label: 'FAQ', href: '#' }, { label: 'Glossary', href: '#' }, { label: 'Privacy Notice', href: '#' }] },
    { title: 'Contact Us', links: [{ label: 'ipmo@cnsc.edu.ph', href: 'mailto:ipmo@cnsc.edu.ph' }, { label: 'Mon–Fri  8am–5pm', href: '#' }] },
  ]

  return (
    <footer className="hp-footer">
      <div className="hp-footer__inner">
        <div className="hp-footer__grid">
          <div>
            <div className="hp-footer__brand-row">
              {appearance.officeLogoUrl && (
                <img src={appearance.officeLogoUrl} alt="IPMO" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain' }} />
              )}
              <span className="hp-footer__brand-name">{officeName}</span>
            </div>
            <p className="hp-footer__brand-desc">
              Protecting creativity and innovation within our academic community —
              registration, filing, and IP education all in one place.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div className="hp-footer__col-title">{col.title}</div>
              {col.links.map(l => (
                <a key={l.label} href={l.href} className="hp-footer__link"
                  target={l.href?.startsWith('http') ? '_blank' : undefined}
                  rel={l.href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="hp-footer__bottom">
          <span className="hp-footer__copy">© {new Date().getFullYear()} {officeName}. All rights reserved.</span>
          <span className="hp-footer__copy">Republic Act 8293 · IPOPHL Compliant</span>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   HOMEPAGE ROOT
   All content comes from CMS. Nothing is hardcoded.
   Sections show friendly empty states when CMS data is not set.
   ============================================================ */
const HomePage = () => {
  const [cms, setCms] = useState(null)

  useEffect(() => {
    fetchHomePageData().then(data => setCms(data))
  }, [])

  const nav        = cms?.navItems        || []
  const slides     = cms?.displaySlides   || []
  const cards      = cms?.categoryData    || []
  const articles   = cms?.newsData        || []
  const logos      = cms?.complianceLogos || []
  const appearance = cms?.appearanceData  || {}

  return (
    <div className="hp-root">
      <ScopedStyles
        primaryColor={appearance.primaryColor  || T.maroon}
        pageBg={appearance.pageBg              || T.lightBg}
        headerAccent={appearance.headerAccent  || T.maroon}
      />
      <Header nav={nav} appearance={appearance} />
      <main>
        <DisplaySection slides={slides}     />
        <CategoryCards  cards={cards}       />
        <NewsUpdates    articles={articles} nav={nav} />
        <ComplianceCard logos={logos}       />
      </main>
      <Footer appearance={appearance} nav={nav} />
    </div>
  )
}

export default HomePage