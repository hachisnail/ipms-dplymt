import React, { useState, useRef, useEffect } from 'react';
import './Profile.css';
import { fetchProfile, saveProfile, uploadPhoto, removePhoto, changePassword, picUrl, syncLocalStorage } from '../profileApi';

const DEPARTMENTS = ['Patent Examination','Trademark Registry','Legal Services','Copyright Office','IT Services'];
const DEFAULT_PIC = 'https://placehold.co/140x140/0e7490/ffffff?text=User';

const Field = ({ label, name, type = 'text', value, onChange, options = [], disabled, placeholder, readOnly }) => (
    <div className="form-group">
        <label htmlFor={name}>{label}</label>
        {type === 'select' ? (
            <select id={name} name={name} value={value} onChange={onChange} disabled={disabled || readOnly}>
                <option value="" disabled>Select {label.toLowerCase()}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        ) : type === 'textarea' ? (
            <textarea id={name} name={name} value={value} onChange={onChange} rows={3} disabled={disabled} placeholder={placeholder} />
        ) : (
            <input id={name} name={name} type={type} value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} placeholder={placeholder}
                style={readOnly ? { background:'#f8fafc', cursor:'not-allowed' } : {}} />
        )}
    </div>
);

export default function ConsultantProfile() {
    const [data,    setData]    = useState({ fullName:'', email:'', employeeId:'', birthdate:'', department:'', role:'', specialization:'', address:'', about:'' });
    const [preview, setPreview] = useState(DEFAULT_PIC);
    const [imgFile, setImgFile] = useState(null);
    const [pwd,     setPwd]     = useState({ current:'', next:'', confirm:'' });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [msg,     setMsg]     = useState({ type:'', text:'' });
    const fileRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const u = await fetchProfile();
                setData({
                    fullName:       u.full_name     || '',
                    email:          u.email         || '',
                    employeeId:     String(u.id)    || '',
                    birthdate:      u.birthdate ? u.birthdate.substring(0,10) : '',
                    department:     u.department    || DEPARTMENTS[0],
                    role:           u.user_type     || 'Consultant',
                    specialization: u.ip_category   || '',
                    address:        u.address       || '',
                    about:          u.about         || '',
                });
                setPreview(picUrl(u.profile_picture) || DEFAULT_PIC);
            } catch (e) {
                setMsg({ type:'error', text: e.message });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const flash = (type, text) => {
        setMsg({ type, text });
        if (type === 'success') setTimeout(() => setMsg({ type:'', text:'' }), 4000);
    };

    const handleImgChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!['image/jpeg','image/png','image/webp'].includes(f.type)) return flash('error','Only JPG, PNG, WEBP allowed.');
        if (f.size > 2 * 1024 * 1024) return flash('error','Image must be 2 MB or smaller.');
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        setImgFile(f);
        setPreview(URL.createObjectURL(f));
        setMsg({ type:'', text:'' });
    };

    const handleRemovePhoto = async () => {
        if (imgFile) {
            if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
            setImgFile(null);
            setPreview(DEFAULT_PIC);
            if (fileRef.current) fileRef.current.value = '';
            return;
        }
        setSaving(true);
        try {
            await removePhoto();
            setPreview(DEFAULT_PIC);
            syncLocalStorage({ profilePicture: '' });
            window.dispatchEvent(new CustomEvent('profile-picture-updated', {
                detail: { filename: null }
            }));
            flash('success', 'Profile picture removed.');
        } catch (e) { flash('error', e.message); }
        finally { setSaving(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ type:'', text:'' });
        try {
            if (imgFile) {
                const r = await uploadPhoto(imgFile);
                setPreview(picUrl(r.filename));
                syncLocalStorage({ profilePicture: r.filename });
                // Notify Avatars in the same page to refresh photo immediately
                window.dispatchEvent(new CustomEvent('profile-picture-updated', {
                    detail: { filename: r.filename }
                }));
                setImgFile(null);
                if (fileRef.current) fileRef.current.value = '';
            }
            await saveProfile({
                full_name:      data.fullName,
                email:          data.email,
                birthdate:      data.birthdate,
                department:     data.department,
                address:        data.address,
                about:          data.about,
                specialization: data.specialization,
            });
            if (pwd.next) {
                if (pwd.next !== pwd.confirm) throw new Error('Passwords do not match.');
                if (!pwd.current) throw new Error('Enter your current password to change it.');
                await changePassword(pwd.current, pwd.next);
                setPwd({ current:'', next:'', confirm:'' });
            }
            syncLocalStorage({ fullName: data.fullName, email: data.email });
            flash('success', 'Profile updated successfully!');
        } catch (e) {
            flash('error', e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="profile-page-wrapper">
            <div className="profile-main-container">
                <div className="prof-loader">
                    <div className="prof-spinner" style={{ borderTopColor:'#0e7490' }}></div>
                    <p>Loading profile…</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="profile-page-wrapper">
            <div className="profile-main-container">
                <div className="profile-content">
                    <div className="profile-columns">

                        {/* ── Left: Photo ── */}
                        <aside className="profile-left">
                            <div className="profile-image-wrapper">
                                <img src={preview} alt="Profile"
                                    onError={e => { e.target.onerror=null; e.target.src=DEFAULT_PIC; }} />
                            </div>
                            <p className="prof-name">{data.fullName || 'Your Name'}</p>
                            <p className="prof-role">{data.role || 'IP Consultant'}</p>
                            <p className="prof-dept">{data.department}</p>

                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                                style={{ display:'none' }} onChange={handleImgChange} />
                            <div className="prof-photo-btns">
                                <button type="button" className="prof-btn prof-btn--teal"
                                    onClick={() => fileRef.current?.click()} disabled={saving}>
                                    <i className="bi bi-cloud-arrow-up"></i>
                                    {imgFile ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                <button type="button" className="prof-btn prof-btn--ghost"
                                    onClick={handleRemovePhoto} disabled={saving}>
                                    <i className="bi bi-trash3"></i> Remove
                                </button>
                            </div>
                            <p className="prof-hint">JPG, PNG or WEBP · max 2 MB</p>

                            <div className="prof-id-badge">
                                <i className="bi bi-person-badge"></i>
                                ID: {data.employeeId}
                            </div>
                        </aside>

                        {/* ── Right: Form ── */}
                        <section className="profile-right">
                            <form onSubmit={handleSave}>

                                <div className="prof-section-label">Personal Information</div>
                                <div className="form-grid">
                                    <Field label="Full Name"     name="fullName"  value={data.fullName}  onChange={e=>setData(p=>({...p,fullName:e.target.value}))}  />
                                    <Field label="Email"         name="email"     type="email" value={data.email} onChange={e=>setData(p=>({...p,email:e.target.value}))} />
                                    <Field label="Birthdate"     name="birthdate" type="date"  value={data.birthdate} onChange={e=>setData(p=>({...p,birthdate:e.target.value}))} />
                                    <Field label="Employee ID"   name="employeeId" value={data.employeeId} onChange={()=>{}} readOnly />
                                </div>

                                <div className="prof-section-label">Work Details</div>
                                <div className="form-grid">
                                    <Field label="Department"    name="department" type="select" options={DEPARTMENTS}
                                        value={data.department} onChange={e=>setData(p=>({...p,department:e.target.value}))} />
                                    <Field label="Role"          name="role"       value={data.role} onChange={()=>{}} readOnly />
                                    <Field label="Specialization / IP Category" name="specialization" value={data.specialization}
                                        onChange={e=>setData(p=>({...p,specialization:e.target.value}))} />
                                    <Field label="Address"       name="address"    value={data.address} onChange={e=>setData(p=>({...p,address:e.target.value}))} />
                                </div>
                                <Field label="About / Professional Summary" name="about" type="textarea" value={data.about}
                                    onChange={e=>setData(p=>({...p,about:e.target.value}))}
                                    placeholder="Brief description of your role and expertise…" />

                                <div className="prof-section-label">Change Password <span className="prof-section-hint">(leave blank to keep current)</span></div>
                                <div className="form-grid">
                                    <Field label="Current Password" name="current" type={showPwd?'text':'password'}
                                        value={pwd.current} onChange={e=>setPwd(p=>({...p,current:e.target.value}))} placeholder="Current password" />
                                    <Field label="New Password"     name="next"    type={showPwd?'text':'password'}
                                        value={pwd.next}    onChange={e=>setPwd(p=>({...p,next:e.target.value}))}    placeholder="Min 8 chars, 1 uppercase, 1 symbol" />
                                    <Field label="Confirm Password" name="confirm" type={showPwd?'text':'password'}
                                        value={pwd.confirm} onChange={e=>setPwd(p=>({...p,confirm:e.target.value}))} placeholder="Re-enter new password" />
                                </div>
                                <label className="prof-show-pwd">
                                    <input type="checkbox" checked={showPwd} onChange={()=>setShowPwd(v=>!v)} />
                                    Show passwords
                                </label>

                                {msg.text && (
                                    <div className={`prof-msg ${msg.type==='success' ? 'prof-msg--ok' : 'prof-msg--err'}`}>
                                        <i className={`bi ${msg.type==='success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                                        {msg.text}
                                    </div>
                                )}

                                <div className="profile-actions">
                                    <button type="submit" className="prof-btn prof-btn--save" disabled={saving}>
                                        {saving
                                            ? <><i className="bi bi-hourglass-split"></i> Saving…</>
                                            : <><i className="bi bi-floppy2-fill"></i> Save Changes</>
                                        }
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}