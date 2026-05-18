import React, { useState, useEffect, useCallback, useRef } from 'react'
import './ContentManagement.css'
import PageBuilder from './PageBuilder'

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3006/api'
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })
const jsonHdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

const TABS = ['Header','Display','Categories','News & Updates','Compliance','Appearance','Page Builder','Audit Log']
const IP_TYPES    = ['Copyright','Trademark','Utility Model','Industrial Design']

/* ── Nav link templates ── */
const NAV_LINK_TEMPLATES = [
  {
    key: 'blank',
    icon: '🔗',
    label: 'Blank Link',
    desc: 'Empty link — fill in label and URL yourself.',
    color: '#6b7280',
    data: { type: 'link', label: 'New Link', href: '#' },
  },
  {
    key: 'home',
    icon: '🏠',
    label: 'Home',
    desc: 'Standard home page link pointing to /.',
    color: '#800000',
    data: { type: 'link', label: 'Home', href: '/' },
  },
  {
    key: 'faq',
    icon: '❓',
    label: 'FAQ',
    desc: 'Frequently Asked Questions page.',
    color: '#1d4ed8',
    data: { type: 'link', label: 'FAQ', href: '/faq' },
  },
  {
    key: 'contact',
    icon: '📬',
    label: 'Contact',
    desc: 'Contact us page or anchor link.',
    color: '#065f46',
    data: { type: 'link', label: 'Contact', href: '#contact' },
  },
  {
    key: 'about',
    icon: '🏛️',
    label: 'About',
    desc: 'About the office or institution.',
    color: '#92400e',
    data: { type: 'link', label: 'About', href: '#about' },
  },
  {
    key: 'youtube',
    icon: '▶️',
    label: 'YouTube',
    desc: 'Link to your YouTube channel or a specific video.',
    color: '#dc2626',
    data: { type: 'link', label: 'Watch on YouTube', href: 'https://youtube.com/' },
  },
  {
    key: 'facebook',
    icon: '📘',
    label: 'Facebook Page',
    desc: 'Link to your official Facebook page.',
    color: '#1d4ed8',
    data: { type: 'link', label: 'Facebook', href: 'https://facebook.com/' },
  },
  {
    key: 'forms',
    icon: '📋',
    label: 'Downloadable Forms',
    desc: 'Points to the forms / downloads section.',
    color: '#005555',
    data: { type: 'link', label: 'Downloadable Forms', href: '/forms' },
  },
  {
    key: 'portal',
    icon: '🔐',
    label: 'Sign In / Portal',
    desc: 'Login or portal entry point.',
    color: '#800000',
    data: { type: 'link', label: 'Sign In', href: '/login' },
  },
  {
    key: 'dropdown_blank',
    icon: '📂',
    label: 'Blank Dropdown',
    desc: 'Empty dropdown menu — add child links after.',
    color: '#374151',
    data: { type: 'dropdown', label: 'New Dropdown', children: [] },
  },
  {
    key: 'dropdown_services',
    icon: '⚙️',
    label: 'Services Dropdown',
    desc: 'Pre-filled with Registration, Application, Filing.',
    color: '#005555',
    data: { type: 'dropdown', label: 'Services', children: [
      { label: 'Registration', href: '#' },
      { label: 'Application',  href: '#' },
      { label: 'Filing',       href: '#' },
    ]},
  },
  {
    key: 'dropdown_updates',
    icon: '📰',
    label: 'Updates Dropdown',
    desc: 'Pre-filled with Announcements, Events, Advisories, Articles.',
    color: '#800000',
    data: { type: 'dropdown', label: 'Updates', children: [
      { label: 'Announcements', href: '#' },
      { label: 'Advisories',    href: '#' },
      { label: 'Events',        href: '#' },
      { label: 'Articles',      href: '#' },
    ]},
  },
]
const IP_STATUSES = ['Approved','Registered','Pending']
const NEWS_TYPES  = ['Announcement','Event','Advisory','Issuance','Article']

const TYPE_STYLE = {
  Copyright:{ bg:'#fde8e8',color:'#6b0000' }, Trademark:{ bg:'#dbeafe',color:'#1e40af' },
  'Utility Model':{ bg:'#dcfce7',color:'#166534' }, 'Industrial Design':{ bg:'#f3f4f6',color:'#374151' },
  Announcement:{ bg:'#fde8e8',color:'#6b0000' }, Event:{ bg:'#dcfce7',color:'#166534' },
  Advisory:{ bg:'#fef9c3',color:'#854d0e' }, Issuance:{ bg:'#f3f4f6',color:'#374151' },
  Article:{ bg:'#dbeafe',color:'#1e40af' }, Reminder:{ bg:'#fde8e8',color:'#6b0000' },
}
const STATUS_STYLE = { Approved:{ bg:'#dcfce7',color:'#166534' }, Registered:{ bg:'#dbeafe',color:'#1e40af' }, Pending:{ bg:'#fef9c3',color:'#854d0e' } }

const TypeBadge   = ({ label })  => { const s=TYPE_STYLE[label]||{bg:'#f3f4f6',color:'#374151'}; return <span className="cm-badge-type"   style={{background:s.bg,color:s.color}}>{label}</span> }
const StatusBadge = ({ status }) => { const s=STATUS_STYLE[status]||{bg:'#f3f4f6',color:'#374151'}; return <span className="cm-status-pill" style={{background:s.bg,color:s.color}}>{status}</span> }

/* ── Image Uploader component ── */
const ImageUploader = ({ value, onChange, label='Image', height=100 }) => {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState(value || '')

  useEffect(() => { setPreview(value || '') }, [value])

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('logo', file)
    try {
      const res  = await fetch(`${API}/cms/appearance/upload-logo`, { method: 'POST', headers: hdrs(), body: fd })
      const data = await res.json()
      if (data.url) {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:3006').replace('/api','').replace(/\/$/, '')
        const full = data.url.startsWith('http') ? data.url : `${base}${data.url}`
        setPreview(full); onChange(full)
      }
    } catch (e) { console.error('Upload error', e) }
    finally { setUploading(false) }
  }

  return (
    <div className="cm-img-uploader">
      <div className="cm-img-preview" style={{ height }}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}>
        {preview
          ? <img src={preview} alt={label} />
          : <div className="cm-img-placeholder">
              <i className="bi bi-cloud-arrow-up"></i>
              <span>Drop image or click to upload</span>
            </div>
        }
        {uploading && <div className="cm-img-uploading">Uploading…</div>}
      </div>
      <div className="cm-img-actions">
        <button type="button" className="cm-btn cm-btn-sm" onClick={() => inputRef.current?.click()}>
          <i className="bi bi-upload"></i> Upload
        </button>
        {preview && <button type="button" className="cm-btn cm-btn-sm cm-btn-danger" onClick={() => { setPreview(''); onChange('') }}>
          <i className="bi bi-trash"></i> Remove
        </button>}
        <input className="cm-nav-input" style={{ flex:1, fontSize:11, fontFamily:'monospace' }}
          value={preview} placeholder="Or paste image URL…"
          onChange={e => { setPreview(e.target.value); onChange(e.target.value) }} />
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

/* ── Empty state placeholder ── */
const Placeholder = ({ icon, title, sub }) => (
  <div className="cm-placeholder-block">
    <i className={`bi ${icon}`}></i>
    <p>{title}</p>
    <span>{sub}</span>
  </div>
)

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

/* ============================================================ MAIN COMPONENT ============================================================ */
export default function ContentManagement() {
  const [tab, setTab] = useState('Header')
  const [nav, setNav] = useState([])
  const [slides, setSlides] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [cats, setCats] = useState([])
  const [news, setNews] = useState([])
  const [issuances, setIssuances] = useState([])
  const [ipWall, setIpWall] = useState([])
  const [compliance, setCompliance] = useState([])
  const [appearance, setAppearance] = useState({ headerBg:'#ffffff', headerAccent:'#800000', pageBg:'#f2f2f2', primaryColor:'#800000', schoolLogoUrl:'', officeLogoUrl:'', officeName:'Management Office', officeNameSub:'Intellectual Property' })
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [navExpanded, setNavExpanded] = useState({})
  const [editingCatId, setEditingCatId] = useState(null)
  const [newsMode, setNewsMode] = useState('list')
  const [newsForm, setNewsForm] = useState({})
  const [ipMode, setIpMode] = useState('list')
  const [ipForm, setIpForm] = useState({})
  const [toastMsg, setToastMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNavTemplates, setShowNavTemplates] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [nR,sR,cR,neR,iR,ipR,coR,aR,auR] = await Promise.all([
        fetch(`${API}/cms/nav`,        {headers:jsonHdrs()}), fetch(`${API}/cms/slides`,     {headers:jsonHdrs()}),
        fetch(`${API}/cms/categories`, {headers:jsonHdrs()}), fetch(`${API}/cms/news`,       {headers:jsonHdrs()}),
        fetch(`${API}/cms/issuances`,  {headers:jsonHdrs()}), fetch(`${API}/cms/ipwall`,     {headers:jsonHdrs()}),
        fetch(`${API}/cms/compliance`, {headers:jsonHdrs()}), fetch(`${API}/cms/appearance`, {headers:jsonHdrs()}),
        fetch(`${API}/cms/audit`,      {headers:jsonHdrs()}),
      ])
      const [nD,sD,cD,neD,iD,ipD,coD,aD,auD] = await Promise.all([nR.json(),sR.json(),cR.json(),neR.json(),iR.json(),ipR.json(),coR.json(),aR.json(),auR.json()])
      setNav(nD); setSlides(sD); setCats(cD); setNews(neD); setIssuances(iD); setIpWall(ipD); setCompliance(coD); setAppearance(aD); setAuditLog(auD)
    } catch (e) { console.error(e); toast('Failed to load CMS data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function toast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2600) }

  async function apiSave(endpoint, method='PUT', body=null, msg='Saved') {
    setSaving(true)
    try {
      const res  = await fetch(`${API}/cms/${endpoint}`, { method, headers: jsonHdrs(), body: body ? JSON.stringify(body) : undefined })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast(`✓ ${msg}`)
      const ar = await fetch(`${API}/cms/audit`, {headers:jsonHdrs()}); setAuditLog(await ar.json())
      return true
    } catch (e) { toast(`✗ ${e.message}`); return false }
    finally { setSaving(false) }
  }

  /* ── NAV ── */
  const toggleNav   = id => setNavExpanded(p => ({...p,[id]:!p[id]}))
  const setNavField = (id,f,v) => setNav(p => p.map(n => n.id===id?{...n,[f]:v}:n))
  const setChildField = (pid,cid,f,v) => setNav(p => p.map(n => n.id===pid?{...n,children:n.children.map(c=>c.id===cid?{...c,[f]:v}:c)}:n))
  const removeNavItem  = id  => setNav(p => p.filter(n => n.id!==id))
  const removeNavChild = (pid,cid) => setNav(p => p.map(n => n.id===pid?{...n,children:n.children.filter(c=>c.id!==cid)}:n))
  const addNavFromTemplate = (tpl) => {
    const newItem = { id: uid(), ...JSON.parse(JSON.stringify(tpl.data)) }
    if (newItem.children) newItem.children = newItem.children.map(c => ({...c, id: uid()}))
    setNav(p => [...p, newItem])
    setShowNavTemplates(false)
    toast(`✓ "${tpl.label}" added`)
  }
  const addNavLink     = () => setShowNavTemplates(true)
  const addNavDropdown = () => setShowNavTemplates(true)
  const addNavChild    = pid => setNav(p => p.map(n => n.id===pid?{...n,children:[...(n.children||[]),{id:uid(),label:'New Link',href:'#'}]}:n))
  const addNavSubdropdown = pid => { setNav(p => p.map(n => n.id===pid?{...n,children:[...(n.children||[]),{id:uid(),type:'subdropdown',label:'New Subdropdown',children:[]}]}:n)); toast('Subdropdown added') }
  const addSubdropdownLink = (pid,sid) => setNav(p => p.map(n => n.id===pid?{...n,children:n.children.map(c=>c.id===sid?{...c,children:[...(c.children||[]),{id:uid(),label:'New Link',href:'#'}]}:c)}:n))
  const setSubdropdownLinkField = (pid,sid,lid,f,v) => setNav(p => p.map(n => n.id===pid?{...n,children:n.children.map(c=>c.id===sid?{...c,children:c.children.map(l=>l.id===lid?{...l,[f]:v}:l)}:c)}:n))
  const removeSubdropdownLink   = (pid,sid,lid) => setNav(p => p.map(n => n.id===pid?{...n,children:n.children.map(c=>c.id===sid?{...c,children:c.children.filter(l=>l.id!==lid)}:c)}:n))

  /* ── SLIDES ── */
  const setSlideField = (idx,f,v) => setSlides(p => p.map((s,i) => i===idx?{...s,[f]:v}:s))
  const addSlide = () => { const s={id:uid(),tag:'New Slide',headline:'Headline',sub:'Subtext.',imageUrl:null,ctaLabel:'Learn More',ctaHref:'#',bg:'linear-gradient(135deg,#800000,#005555)'}; setSlides(p=>[...p,s]); setActiveSlide(slides.length); toast('Slide added') }
  const deleteSlide = idx => { if(slides.length<=1){toast('Cannot delete last slide');return}; setSlides(p=>p.filter((_,i)=>i!==idx)); setActiveSlide(Math.max(0,activeSlide-1)); toast('Slide deleted') }
  const importArticleToSlide = aid => { const a=news.find(x=>x.id===aid); if(!a)return; setSlideField(activeSlide,'headline',a.title); setSlideField(activeSlide,'sub',a.excerpt||a.subtitle||''); setSlideField(activeSlide,'tag',a.tag); if(a.imageUrl)setSlideField(activeSlide,'imageUrl',a.imageUrl); toast('Imported') }

  /* ── CATS ── */
  const setCatField    = (id,f,v) => setCats(p=>p.map(c=>c.id===id?{...c,[f]:v}:c))
  const addCategory    = () => { const nc={id:uid(),icon:'★',title:'New Category',desc:'Description.',services:['Service 1'],color:'#800000',colorLight:'rgba(128,0,0,0.09)'}; setCats(p=>[...p,nc]); setEditingCatId(nc.id); toast('Category added') }
  const deleteCategory = id => { setCats(p=>p.filter(c=>c.id!==id)); if(editingCatId===id)setEditingCatId(null); toast('Deleted') }

  /* ── NEWS ── */
  const openNewArticle  = () => { setNewsForm({id:uid(),type:'announcement',tag:'Announcement',title:'',subtitle:'',date:'',excerpt:'',content:'',imageUrl:null,color:'#800000',colorLight:'rgba(128,0,0,0.07)'}); setNewsMode('new') }
  const openEditArticle = a => { setNewsForm({...a}); setNewsMode(a.id) }
  const saveArticle     = async () => { const isNew=newsMode==='new'; const ok=await apiSave(isNew?'news':`news/${newsForm.id}`,isNew?'POST':'PUT',newsForm,isNew?'Article created':'Article updated'); if(ok){if(isNew)setNews(p=>[...p,newsForm]);else setNews(p=>p.map(a=>a.id===newsForm.id?newsForm:a));setNewsMode('list')} }
  const deleteArticle   = async id => { const ok=await apiSave(`news/${id}`,'DELETE',null,'Article deleted'); if(ok)setNews(p=>p.filter(a=>a.id!==id)) }
  const setNewsFormField = (f,v) => setNewsForm(p=>({...p,[f]:v}))

  /* ── ISSUANCES ── */
  const addIssuanceYear    = () => { const yr=new Date().getFullYear(); if(issuances.find(y=>y.year===yr)){toast('Year exists');return}; setIssuances(p=>[{year:yr,docs:[]},...p]); toast(`Year ${yr} added`) }
  const removeIssuanceYear = y => { setIssuances(p=>p.filter(g=>g.year!==y)); toast(`Year ${y} removed`) }
  const addIssuanceDoc     = y => { setIssuances(p=>p.map(g=>g.year===y?{...g,docs:[...g.docs,{id:uid(),name:'Document Name',title:'Document Title',href:'#'}]}:g)); toast('Doc added') }
  const setIssuanceDocField = (y,did,f,v) => setIssuances(p=>p.map(g=>g.year===y?{...g,docs:g.docs.map(d=>d.id===did?{...d,[f]:v}:d)}:g))
  const removeIssuanceDoc  = (y,did) => { setIssuances(p=>p.map(g=>g.year===y?{...g,docs:g.docs.filter(d=>d.id!==did)}:g)); toast('Doc removed') }

  /* ── IP WALL ── */
  const addIPYear    = () => { const yr=new Date().getFullYear(); if(ipWall.find(y=>y.year===yr)){toast('Year exists');return}; setIpWall(p=>[{year:yr,entries:[]},...p].sort((a,b)=>b.year-a.year)); toast(`Year ${yr} added`) }
  const removeIPYear = y => { setIpWall(p=>p.filter(g=>g.year!==y)); toast(`Year ${y} removed`) }
  const openIPForm   = (y,e=null) => { setIpForm(e?{...e,_year:y,_isNew:false}:{id:uid(),title:'',inventor:'',type:'Copyright',status:'Approved',regNo:'',department:'',imgUrl:null,_year:y,_isNew:true}); setIpMode('form') }
  const saveIPEntry  = () => { const{_year,_isNew,...entry}=ipForm; if(_isNew)setIpWall(p=>p.map(y=>y.year===_year?{...y,entries:[...y.entries,entry]}:y));else setIpWall(p=>p.map(y=>y.year===_year?{...y,entries:y.entries.map(e=>e.id===entry.id?entry:e)}:y));toast(_isNew?'Added':'Updated');setIpMode('list') }
  const removeIPEntry  = (y,id) => { setIpWall(p=>p.map(g=>g.year===y?{...g,entries:g.entries.filter(e=>e.id!==id)}:g)); toast('Removed') }
  const setIPFormField = (f,v) => setIpForm(p=>({...p,[f]:v}))

  /* ── COMPLIANCE ── */
  const setComplianceField = (id,f,v) => setCompliance(p=>p.map(l=>l.id===id?{...l,[f]:v}:l))
  const addComplianceLogo  = () => { setCompliance(p=>[...p,{id:uid(),abbr:'NEW',label:'New Partner',detail:'',bg:'#374151',logoUrl:null}]); toast('Partner added') }
  const removeComplianceLogo = id => { setCompliance(p=>p.filter(l=>l.id!==id)); toast('Partner removed') }

  /* ── APPEARANCE ── */
  const setAppearanceField = (f,v) => setAppearance(p=>({...p,[f]:v}))

  /* ── PAGE BUILDER auto-link: when a page is created, find a nav item with matching label and set its href ── */
  const handlePageCreated = (page) => {
    const slug = page.slug
    // Ensure href is always an absolute path like /faq, not a bare slug like faq
    const href = slug.startsWith('/') ? slug : `/${slug}`
    const titleNorm = (page.title || '').toLowerCase().trim()
    setNav(prev => prev.map(item => {
      const labelNorm = (item.label || '').toLowerCase().trim()
      if (item.type === 'link' && (item.href === '#' || item.href === '') && labelNorm === titleNorm) {
        return { ...item, href }
      }
      return item
    }))
    toast(`✓ Nav item auto-linked to ${href}`)
  }

  /* ======================================================== HEADER ======================================================== */
  const renderHeader = () => (
    <div>
      <div className="cm-notice">
        Edit nav link labels and full URLs — accepts <code>https://</code> links of any length.
        Click ▶ to expand dropdowns. Subdropdowns support flyout nested links (e.g. Forms → Registration → individual forms).
      </div>
      <span className="cm-sec">Navigation tree</span>
      {nav.length === 0 && <Placeholder icon="bi-list-ul" title="No navigation items yet." sub='Click "+ Add nav link" or "+ Add dropdown" to start building your menu.' />}
      {nav.map(item => (
        <div key={item.id} className="cm-nav-node">
          {item.type === 'link' ? (
            <div className="cm-nav-head" style={{cursor:'default'}}>
              <span className="cm-pill cm-pill-link">link</span>
              <input className="cm-nav-input" style={{flex:'0 0 130px'}} value={item.label} placeholder="Label"
                onChange={e=>setNavField(item.id,'label',e.target.value)} />
              <input className="cm-nav-input" style={{flex:1,fontFamily:'monospace',fontSize:11}}
                value={item.href} placeholder="https://... or /route"
                onChange={e=>setNavField(item.id,'href',e.target.value)} />
              <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeNavItem(item.id)}>×</button>
            </div>
          ) : (
            <>
              <div className="cm-nav-head" onClick={()=>toggleNav(item.id)}>
                <span style={{fontSize:10,color:'#6b7280',transition:'transform .2s',display:'inline-block',transform:navExpanded[item.id]?'rotate(90deg)':'none'}}>▶</span>
                <span className="cm-pill cm-pill-drop">dropdown</span>
                <input className="cm-nav-input" style={{flex:1}} value={item.label}
                  onClick={e=>e.stopPropagation()} onChange={e=>setNavField(item.id,'label',e.target.value)} />
                <span style={{fontSize:11,color:'#9ca3af',whiteSpace:'nowrap',flexShrink:0}}>{(item.children||[]).length} links</span>
                <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={e=>{e.stopPropagation();removeNavItem(item.id)}}>×</button>
              </div>
              {navExpanded[item.id] && (
                <div>
                  {(item.children||[]).length===0 && <div className="cm-nav-child" style={{color:'#9ca3af',fontSize:12,fontStyle:'italic'}}>No links yet — add a link or subdropdown below.</div>}
                  {(item.children||[]).map(child => (
                    <div key={child.id}>
                      {child.type !== 'subdropdown' ? (
                        <div className="cm-nav-child">
                          <span className="cm-dot" />
                          <input className="cm-nav-input" style={{flex:'0 0 130px'}} value={child.label} placeholder="Link label"
                            onChange={e=>setChildField(item.id,child.id,'label',e.target.value)} />
                          <input className="cm-nav-input" style={{flex:1,fontFamily:'monospace',fontSize:11}}
                            value={child.href||''} placeholder="https://... or /route"
                            onChange={e=>setChildField(item.id,child.id,'href',e.target.value)} />
                          <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeNavChild(item.id,child.id)}>×</button>
                        </div>
                      ) : (
                        <div style={{marginTop:4,marginBottom:4}}>
                          <div className="cm-nav-child" style={{background:'#f9fafb',borderTop:'1px solid #e5e7eb'}}>
                            <span style={{fontSize:10,color:'#800000',fontWeight:700,background:'#fff0f0',padding:'2px 8px',borderRadius:10,flexShrink:0}}>SUB</span>
                            <input className="cm-nav-input" style={{flex:1,fontWeight:500}} value={child.label} placeholder="Subdropdown label"
                              onChange={e=>setChildField(item.id,child.id,'label',e.target.value)} />
                            <button className="cm-btn cm-btn-sm" onClick={()=>addSubdropdownLink(item.id,child.id)}>+ Link</button>
                            <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeNavChild(item.id,child.id)}>×</button>
                          </div>
                          {(child.children||[]).length===0 && <div className="cm-nav-child" style={{paddingLeft:48,color:'#9ca3af',fontSize:11,fontStyle:'italic'}}>No links — click "+ Link" to add.</div>}
                          {(child.children||[]).map(link => (
                            <div key={link.id} className="cm-nav-child" style={{paddingLeft:48}}>
                              <span className="cm-dot" style={{width:4,height:4}} />
                              <input className="cm-nav-input" style={{flex:'0 0 130px',fontSize:12}} value={link.label} placeholder="Link label"
                                onChange={e=>setSubdropdownLinkField(item.id,child.id,link.id,'label',e.target.value)} />
                              <input className="cm-nav-input" style={{flex:1,fontFamily:'monospace',fontSize:11}}
                                value={link.href||''} placeholder="https://... or /route"
                                onChange={e=>setSubdropdownLinkField(item.id,child.id,link.id,'href',e.target.value)} />
                              <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeSubdropdownLink(item.id,child.id,link.id)}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="cm-nav-child" style={{cursor:'pointer',borderTop:'1px dashed #e5e7eb'}} onClick={()=>addNavChild(item.id)}>
                    <span className="cm-dot" style={{background:'#005555'}} /><span style={{fontSize:12,color:'#005555'}}>+ Add link under {item.label}</span>
                  </div>
                  <div className="cm-nav-child" style={{cursor:'pointer'}} onClick={()=>addNavSubdropdown(item.id)}>
                    <span className="cm-dot" style={{background:'#800000'}} /><span style={{fontSize:12,color:'#800000'}}>+ Add subdropdown under {item.label}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <div className="cm-btn-row">
        <button className="cm-btn" onClick={() => setShowNavTemplates(true)}>+ Add nav item</button>
        <button className="cm-btn cm-btn-primary" disabled={saving} onClick={()=>apiSave('nav','PUT',{nav},'Nav links saved')}>
          {saving?'Saving…':'Save nav'}
        </button>
      </div>

      {/* ── Template picker modal ── */}
      {showNavTemplates && (
        <div className="cm-tpl-overlay" onClick={() => setShowNavTemplates(false)}>
          <div className="cm-tpl-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-tpl-header">
              <div>
                <div className="cm-tpl-title">Choose a nav item template</div>
                <div className="cm-tpl-sub">All fields are editable after adding. Pick one to get started.</div>
              </div>
              <button className="cm-tpl-close" onClick={() => setShowNavTemplates(false)}>✕</button>
            </div>

            <div className="cm-tpl-section-label">🔗 Single Links</div>
            <div className="cm-tpl-grid">
              {NAV_LINK_TEMPLATES.filter(t => t.data.type === 'link').map(tpl => (
                <button key={tpl.key} className="cm-tpl-card" onClick={() => addNavFromTemplate(tpl)}>
                  <span className="cm-tpl-icon" style={{ background: tpl.color + '14', color: tpl.color }}>{tpl.icon}</span>
                  <div className="cm-tpl-card-body">
                    <div className="cm-tpl-card-label">{tpl.label}</div>
                    <div className="cm-tpl-card-desc">{tpl.desc}</div>
                    <div className="cm-tpl-card-preview">
                      <span className="cm-tpl-preview-href">{tpl.data.href}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="cm-tpl-section-label" style={{marginTop:16}}>📂 Dropdowns</div>
            <div className="cm-tpl-grid">
              {NAV_LINK_TEMPLATES.filter(t => t.data.type === 'dropdown').map(tpl => (
                <button key={tpl.key} className="cm-tpl-card" onClick={() => addNavFromTemplate(tpl)}>
                  <span className="cm-tpl-icon" style={{ background: tpl.color + '14', color: tpl.color }}>{tpl.icon}</span>
                  <div className="cm-tpl-card-body">
                    <div className="cm-tpl-card-label">{tpl.label}</div>
                    <div className="cm-tpl-card-desc">{tpl.desc}</div>
                    {tpl.data.children && tpl.data.children.length > 0 && (
                      <div className="cm-tpl-card-children">
                        {tpl.data.children.map((c,i) => <span key={i} className="cm-tpl-child-pill">{c.label}</span>)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  /* ======================================================== DISPLAY ======================================================== */
  const renderDisplay = () => {
    if (!slides.length) return (
      <div>
        <Placeholder icon="bi-images" title="No hero slides yet." sub='Click "+ Add first slide" to create your first banner.' />
        <div className="cm-btn-row" style={{justifyContent:'center'}}><button className="cm-btn cm-btn-primary" onClick={addSlide}>+ Add first slide</button></div>
      </div>
    )
    const s = slides[activeSlide] || slides[0]
    return (
      <div>
        <span className="cm-sec">Hero slides</span>
        <div className="cm-slide-row">
          {slides.map((sl,i)=>(
            <button key={sl.id} className={`cm-stab ${i===activeSlide?'active':''}`} onClick={()=>setActiveSlide(i)}>{(sl.tag||'Slide').substring(0,16)}</button>
          ))}
          <button className="cm-stab-add" onClick={addSlide}>+ Add slide</button>
        </div>
        <div className="cm-card">
          <div className="cm-row" style={{alignItems:'flex-start'}}>
            <label style={{paddingTop:8}}>Slide image</label>
            <div style={{flex:1}}>
              <ImageUploader value={s.imageUrl||''} label="slide image" height={130}
                onChange={v=>setSlideField(activeSlide,'imageUrl',v||null)} />
            </div>
          </div>
          {[
            {label:'Tag / label',field:'tag',    placeholder:'e.g. Announcement'},
            {label:'Headline',   field:'headline',placeholder:'Banner headline'},
            {label:'Subtext',    field:'sub',    type:'textarea',placeholder:'Supporting text…'},
            {label:'CTA label',  field:'ctaLabel',placeholder:'Learn More'},
            {label:'CTA link',   field:'ctaHref', placeholder:'https://... or /route'},
            {label:'Background', field:'bg',      placeholder:'CSS gradient or hex color'},
          ].map(({label,field,type,placeholder})=>(
            <div className="cm-row" key={field}>
              <label>{label}</label>
              {type==='textarea'
                ?<textarea value={s[field]||''} placeholder={placeholder} onChange={e=>setSlideField(activeSlide,field,e.target.value)} />
                :<input value={s[field]||''} placeholder={placeholder} onChange={e=>setSlideField(activeSlide,field,e.target.value||null)} />
              }
            </div>
          ))}
        </div>
        <div className="cm-btn-row">
          <button className="cm-btn cm-btn-danger" onClick={()=>deleteSlide(activeSlide)}>Delete this slide</button>
          <button className="cm-btn cm-btn-primary" disabled={saving} onClick={()=>apiSave('slides','PUT',{slides},'Slides saved')}>
            {saving?'Saving…':'Save slides'}
          </button>
        </div>
        {news.length>0&&(<>
          <div className="cm-divider"/><span className="cm-sec">Import from News &amp; Updates</span>
          <div className="cm-link-panel">
            {news.map(a=>(
              <div key={a.id} className="cm-item-row">
                <TypeBadge label={a.tag}/><span style={{flex:1,fontSize:13}}>{a.title}</span>
                <button className="cm-btn cm-btn-sm" onClick={()=>importArticleToSlide(a.id)}>Import</button>
              </div>
            ))}
          </div>
        </>)}
      </div>
    )
  }

  /* ======================================================== CATEGORIES ======================================================== */
  const renderCategories = () => (
    <div>
      {cats.length===0&&<Placeholder icon="bi-grid-3x3-gap" title="No IP categories yet." sub="Click '+ Add category' to create cards for Copyright, Trademark, Utility Model, or Industrial Design." />}
      {cats.map(c=>(
        <div key={c.id} className="cm-card">
          <div className="cm-item-row">
            <span style={{fontSize:22}}>{c.icon}</span>
            <span style={{fontWeight:600,flex:1}}>{c.title}</span>
            <button className="cm-btn cm-btn-sm" onClick={()=>setEditingCatId(editingCatId===c.id?null:c.id)}>{editingCatId===c.id?'Collapse':'Edit'}</button>
            <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>deleteCategory(c.id)}>Delete</button>
          </div>
          {editingCatId===c.id&&(
            <div className="cm-cat-edit">
              {[
                {label:'Icon',       field:'icon', placeholder:'© ™ ⚙️ 🎨'},
                {label:'Title',      field:'title'},
                {label:'Description',field:'desc'},
                {label:'Color',      field:'color',placeholder:'#800000'},
              ].map(({label,field,placeholder})=>(
                <div className="cm-row" key={field}><label>{label}</label>
                  <input value={c[field]||''} placeholder={placeholder} onChange={e=>setCatField(c.id,field,e.target.value)} />
                </div>
              ))}
              <div className="cm-row"><label>Services</label>
                <input value={(c.services||[]).join(', ')}
                  onChange={e=>setCatField(c.id,'services',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
                  placeholder="Registration, Licensing, Filing (comma-separated)" />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="cm-ghost" onClick={addCategory}>+ Add category</div>
      <div className="cm-btn-row">
        <button className="cm-btn cm-btn-primary" disabled={saving} onClick={()=>apiSave('categories','PUT',{categories:cats},'Categories saved')}>
          {saving?'Saving…':'Save categories'}
        </button>
      </div>
    </div>
  )

  /* ======================================================== NEWS ======================================================== */
  const renderNews = () => {
    if (newsMode !== 'list') return (
      <div>
        <div className="cm-form-header">
          <button className="cm-btn" onClick={()=>setNewsMode('list')}>← Back</button>
          <span className="cm-form-header-title">{newsMode==='new'?'New Article':'Edit Article'}</span>
        </div>
        <div className="cm-card">
          {/* IMAGE UPLOADER — replaces emoji */}
          <div className="cm-row" style={{alignItems:'flex-start'}}>
            <label style={{paddingTop:8}}>Article image</label>
            <div style={{flex:1}}>
              <ImageUploader value={newsForm.imageUrl||''} label="article image" height={110}
                onChange={v=>setNewsFormField('imageUrl',v||null)} />
            </div>
          </div>
          {[
            {label:'Type',    field:'type',    type:'select',options:NEWS_TYPES.map(t=>t.toLowerCase())},
            {label:'Tag',     field:'tag',     placeholder:'Announcement'},
            {label:'Title',   field:'title',   placeholder:'Article title'},
            {label:'Subtitle',field:'subtitle',placeholder:'Brief subtitle'},
            {label:'Date',    field:'date',    placeholder:'Mar 5, 2025'},
            {label:'Excerpt', field:'excerpt', type:'textarea',placeholder:'Short summary shown in the card…'},
          ].map(({label,field,type,options,placeholder})=>(
            <div className="cm-row" key={field}><label>{label}</label>
              {type==='select'
                ?<select value={newsForm[field]||''} onChange={e=>setNewsFormField(field,e.target.value)}>
                    {options.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                  </select>
                :type==='textarea'
                ?<textarea value={newsForm[field]||''} placeholder={placeholder} onChange={e=>setNewsFormField(field,e.target.value)} />
                :<input value={newsForm[field]||''} placeholder={placeholder} onChange={e=>setNewsFormField(field,e.target.value)} />
              }
            </div>
          ))}
        </div>
        <div className="cm-btn-row">
          <button className="cm-btn" onClick={()=>setNewsMode('list')}>Cancel</button>
          <button className="cm-btn cm-btn-primary" disabled={saving} onClick={saveArticle}>
            {saving?'Saving…':newsMode==='new'?'Create article':'Update article'}
          </button>
        </div>
      </div>
    )
    return (
      <div>
        {news.length===0&&<Placeholder icon="bi-newspaper" title="No news articles yet." sub="Click '+ Add article' to publish your first announcement, event, or advisory." />}
        {news.map(a=>(
          <div key={a.id} className="cm-card">
            <div className="cm-item-row">
              {a.imageUrl
                ?<img src={a.imageUrl} alt="" style={{width:38,height:38,borderRadius:6,objectFit:'cover',flexShrink:0}} />
                :<div style={{width:38,height:38,borderRadius:6,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><i className="bi bi-image" style={{color:'#9ca3af'}}></i></div>
              }
              <TypeBadge label={a.tag}/>
              <span style={{fontSize:12,color:'#9ca3af',whiteSpace:'nowrap'}}>{a.date}</span>
              <span style={{fontWeight:600,flex:1}}>{a.title}</span>
              <button className="cm-btn cm-btn-sm" onClick={()=>openEditArticle(a)}>Edit</button>
              <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>deleteArticle(a.id)}>Delete</button>
            </div>
          </div>
        ))}
        <div className="cm-ghost" onClick={openNewArticle}>+ Add article / announcement</div>
      </div>
    )
  }

  /* ======================================================== ISSUANCES ======================================================== */
  const renderIssuances = () => (
    <div>
      {issuances.length===0&&<Placeholder icon="bi-file-earmark-text" title="No issuances yet." sub="Click '+ Add year' to start, then add memoranda and office orders per year." />}
      {issuances.map(g=>(
        <div key={g.year}>
          <div className="cm-year-label">{g.year}
            <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeIssuanceYear(g.year)}>Remove year</button>
          </div>
          {g.docs.length===0&&<div className="cm-placeholder-block" style={{padding:'10px 0',fontSize:12}}><i className="bi bi-file-earmark-plus" style={{fontSize:20}}></i><span>No documents for {g.year}. Click "+ Add document" below.</span></div>}
          {g.docs.map(d=>(
            <div key={d.id} className="cm-card">
              <div className="cm-iss-row">
                <input className="cm-nav-input" style={{flex:'0 0 170px'}} value={d.name} placeholder="Memorandum No. 2026-01"
                  onChange={e=>setIssuanceDocField(g.year,d.id,'name',e.target.value)} />
                <input className="cm-nav-input" style={{flex:2}} value={d.title} placeholder="Document title"
                  onChange={e=>setIssuanceDocField(g.year,d.id,'title',e.target.value)} />
                <input className="cm-nav-input" style={{flex:1,fontFamily:'monospace',fontSize:11}} value={d.href} placeholder="https://... or #"
                  onChange={e=>setIssuanceDocField(g.year,d.id,'href',e.target.value)} />
                <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeIssuanceDoc(g.year,d.id)}>×</button>
              </div>
            </div>
          ))}
          <div className="cm-ghost" onClick={()=>addIssuanceDoc(g.year)}>+ Add document to {g.year}</div>
          <div className="cm-divider"/>
        </div>
      ))}
      <div className="cm-btn-row">
        <button className="cm-btn" onClick={addIssuanceYear}>+ Add year</button>
        <button className="cm-btn cm-btn-primary" disabled={saving} onClick={()=>apiSave('issuances','PUT',{issuances},'Issuances saved')}>
          {saving?'Saving…':'Save issuances'}
        </button>
      </div>
    </div>
  )

  /* ======================================================== IP WALL ======================================================== */
  const renderIPWall = () => {
    if (ipMode === 'form') return (
      <div>
        <div className="cm-form-header">
          <button className="cm-btn" onClick={()=>setIpMode('list')}>← Back</button>
          <span className="cm-form-header-title">{ipForm._isNew?'Add IP Entry':'Edit IP Entry'}</span>
        </div>
        <div className="cm-card">
          <div className="cm-row" style={{alignItems:'flex-start'}}>
            <label style={{paddingTop:8}}>Entry image</label>
            <div style={{flex:1}}>
              <ImageUploader value={ipForm.imgUrl||''} label="IP entry image" height={100}
                onChange={v=>setIPFormField('imgUrl',v||null)} />
            </div>
          </div>
          {[
            {label:'Title',     field:'title',     placeholder:'IP title or name'},
            {label:'Inventor',  field:'inventor',  placeholder:'Inventor / Author / Designer'},
            {label:'Reg. No.',  field:'regNo',     placeholder:'UM-2024-0012'},
            {label:'Department',field:'department',placeholder:'College or Department'},
          ].map(({label,field,placeholder})=>(
            <div className="cm-row" key={field}><label>{label}</label>
              <input value={ipForm[field]||''} placeholder={placeholder} onChange={e=>setIPFormField(field,e.target.value)} />
            </div>
          ))}
          <div className="cm-row"><label>IP Type</label>
            <select value={ipForm.type||'Copyright'} onChange={e=>setIPFormField('type',e.target.value)}>
              {IP_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="cm-row"><label>Status</label>
            <select value={ipForm.status||'Pending'} onChange={e=>setIPFormField('status',e.target.value)}>
              {IP_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="cm-btn-row">
          <button className="cm-btn" onClick={()=>setIpMode('list')}>Cancel</button>
          <button className="cm-btn cm-btn-primary" onClick={saveIPEntry}>{ipForm._isNew?'Add entry':'Update entry'}</button>
        </div>
      </div>
    )
    return (
      <div>
        {ipWall.length===0&&<Placeholder icon="bi-trophy" title="No IP Wall entries yet." sub="Click '+ Add year' to showcase approved IP registrations." />}
        {ipWall.map(g=>(
          <div key={g.year}>
            <div className="cm-year-label">{g.year}
              <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeIPYear(g.year)}>Remove year</button>
            </div>
            {g.entries.length===0&&<div className="cm-placeholder-block" style={{padding:'10px 0',fontSize:12}}><i className="bi bi-plus-circle" style={{fontSize:20}}></i><span>No entries for {g.year}. Click "+ Add entry" below.</span></div>}
            {g.entries.map(e=>(
              <div key={e.id} className="cm-ipw-entry">
                <div className="cm-ipw-thumb">
                  {e.imgUrl?<img src={e.imgUrl} alt={e.title} />:<span style={{padding:6,fontSize:10}}>No image</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{e.title}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>{e.inventor}</div>
                  <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                    <TypeBadge label={e.type}/><StatusBadge status={e.status}/>
                    {e.regNo&&<span style={{fontSize:11,color:'#9ca3af'}}>{e.regNo}</span>}
                  </div>
                </div>
                <button className="cm-btn cm-btn-sm" onClick={()=>openIPForm(g.year,e)}>Edit</button>
                <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeIPEntry(g.year,e.id)}>×</button>
              </div>
            ))}
            <div className="cm-ghost" onClick={()=>openIPForm(g.year)}>+ Add entry to {g.year}</div>
            <div className="cm-divider"/>
          </div>
        ))}
        <div className="cm-btn-row">
          <button className="cm-btn" onClick={addIPYear}>+ Add year</button>
          <button className="cm-btn cm-btn-primary" disabled={saving} onClick={()=>apiSave('ipwall','PUT',{ipWall},'IP Wall saved')}>
            {saving?'Saving…':'Save IP Wall'}
          </button>
        </div>
      </div>
    )
  }

  /* ======================================================== COMPLIANCE ======================================================== */
  const renderCompliance = () => (
    <div>
      {compliance.length===0&&<Placeholder icon="bi-patch-check" title="No compliance partners yet." sub="Click '+ Add partner' to add affiliated organizations like IPOPHL, WIPO, CHED." />}
      {compliance.map(l=>(
        <div key={l.id} className="cm-comp-entry">
          <div className="cm-logo-prev" style={{background:l.bg||'#374151',borderRadius:8}}>
            {l.logoUrl?<img src={l.logoUrl} alt={l.abbr} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:6}} />
              :<span style={{fontSize:11,color:'#fff',fontWeight:700}}>{l.abbr}</span>}
          </div>
          <div style={{flex:1}}>
            {[
              {label:'Abbreviation',field:'abbr', placeholder:'IPOPHL'},
              {label:'Full name',   field:'label',placeholder:'IP Office of the Philippines'},
              {label:'Detail',      field:'detail',placeholder:'Address or contact (optional)'},
              {label:'BG color',    field:'bg',    placeholder:'#6b0000'},
            ].map(({label,field,placeholder})=>(
              <div className="cm-row" key={field}><label>{label}</label>
                <input value={l[field]||''} placeholder={placeholder} onChange={e=>setComplianceField(l.id,field,e.target.value)} />
              </div>
            ))}
            <div className="cm-row" style={{alignItems:'flex-start'}}>
              <label style={{paddingTop:8}}>Logo</label>
              <div style={{flex:1}}>
                <ImageUploader value={l.logoUrl||''} label="partner logo" height={72}
                  onChange={v=>setComplianceField(l.id,'logoUrl',v||null)} />
              </div>
            </div>
          </div>
          <button className="cm-btn cm-btn-danger cm-btn-sm" onClick={()=>removeComplianceLogo(l.id)}>×</button>
        </div>
      ))}
      <div className="cm-ghost" style={{marginTop:6}} onClick={addComplianceLogo}>+ Add partner</div>
      <div className="cm-btn-row">
        <button className="cm-btn cm-btn-primary" disabled={saving} onClick={()=>apiSave('compliance','PUT',{compliance},'Compliance saved')}>
          {saving?'Saving…':'Save compliance'}
        </button>
      </div>
    </div>
  )

  /* ======================================================== APPEARANCE ======================================================== */
  const renderAppearance = () => (
    <div>
      <span className="cm-sec">Colors</span>
      <div className="cm-card" style={{marginBottom:14}}>
        {[
          {field:'headerBg',    label:'Header background',note:'Applied to the sticky top bar'},
          {field:'headerAccent',label:'Header accent',    note:'Bottom border stripe color'},
          {field:'pageBg',      label:'Page background',  note:'Homepage + dashboard bg'},
          {field:'primaryColor',label:'Primary color',    note:'Buttons, links, accents'},
        ].map(({field,label,note})=>(
          <div key={field} className="cm-swatch-row">
            <label>{label}</label>
            <input type="color" value={appearance[field]||'#000000'} onChange={e=>setAppearanceField(field,e.target.value)} />
            <input className="cm-swatch-hex" value={appearance[field]||''} onChange={e=>setAppearanceField(field,e.target.value)} />
            <span className="cm-swatch-note">{note}</span>
          </div>
        ))}
      </div>
      <span className="cm-sec">Logos</span>
      <div className="cm-card" style={{marginBottom:14}}>
        {[
          {field:'schoolLogoUrl',label:'School logo',      desc:'Shown in header (left side) and footer.'},
          {field:'officeLogoUrl',label:'Office logo (IPMO)',desc:'Shown beside the school logo.'},
        ].map(({field,label,desc})=>(
          <div className="cm-logo-box" key={field}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{label}</div>
              <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}>{desc}</div>
              <ImageUploader value={appearance[field]||''} label={label} height={90}
                onChange={v=>setAppearanceField(field,v)} />
            </div>
          </div>
        ))}
      </div>
      <span className="cm-sec">Office name</span>
      <div className="cm-card" style={{marginBottom:14}}>
        <div className="cm-row"><label>Main name</label>
          <input value={appearance.officeName||''} placeholder="Management Office" onChange={e=>setAppearanceField('officeName',e.target.value)} />
        </div>
        <div className="cm-row"><label>Sub-label</label>
          <input value={appearance.officeNameSub||''} placeholder="Intellectual Property" onChange={e=>setAppearanceField('officeNameSub',e.target.value)} />
        </div>
      </div>
      <div className="cm-notice">Saving appearance updates both the public homepage and the admin dashboard simultaneously.</div>
      <div className="cm-btn-row">
        <button className="cm-btn cm-btn-primary" disabled={saving}
          onClick={()=>apiSave('appearance','PUT',appearance,'Appearance saved — homepage + dashboard updated')}>
          {saving?'Saving…':'Save appearance'}
        </button>
      </div>
    </div>
  )

  /* ======================================================== AUDIT LOG ======================================================== */
  const renderAuditLog = () => (
    <div>
      <div className="cm-notice">Every save records the editor, component changed, and timestamp — persisted to the database.</div>
      {auditLog.length===0
        ?<Placeholder icon="bi-clock-history" title="No changes recorded yet." sub="Make edits and click Save in any tab to see entries appear here." />
        :<div className="cm-card">
          <div className="cm-audit-grid cm-audit-header"><span>Editor</span><span>Component</span><span>Change</span><span>Timestamp</span></div>
          {auditLog.map(entry=>(
            <div key={entry.id} className="cm-audit-grid">
              <span style={{fontWeight:500}}>{entry.editor}</span>
              <span style={{color:'#6b7280'}}>{entry.component}</span>
              <span>{entry.action}</span>
              <span style={{color:'#9ca3af',fontSize:11.5}}>{entry.ts}</span>
            </div>
          ))}
        </div>
      }
    </div>
  )

  if (loading) return (
    <div className="cm-wrap" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{textAlign:'center',color:'#9ca3af'}}>
        <div style={{fontSize:28,marginBottom:10}}></div><p style={{fontSize:14}}>Loading CMS data…</p>
      </div>
    </div>
  )

  return (
    <div className="cm-wrap">
      <div className="cm-topbar">
        <h2 className="cm-title">Content Management</h2>
        <span className="cm-topbar-badge">Homepage CRM</span>
      </div>
      <div className="cm-tabs">
        {TABS.map(t=><button key={t} className={`cm-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>
      <div className="cm-body">
        {tab==='Header'         && renderHeader()}
        {tab==='Display'        && renderDisplay()}
        {tab==='Categories'     && renderCategories()}
        {tab==='News & Updates' && renderNews()}
        {tab==='Compliance'     && renderCompliance()}
        {tab==='Appearance'     && renderAppearance()}
        {tab==='Page Builder'   && <PageBuilder onPageCreated={handlePageCreated} />}
        {tab==='Audit Log'      && renderAuditLog()}
      </div>
      {toastMsg && <div className="cm-toast">{toastMsg}</div>}
    </div>
  )
}