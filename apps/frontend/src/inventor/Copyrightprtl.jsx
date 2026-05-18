/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import "./Portal.css";

export function CopyrightPortalSection() {
  return (
    <section className="portal-section">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <CopyrightPortal />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STEPS:
   0 — Application Details
   1 — Doc 1: Endorsement Letter
   2 — Doc 2: BCRR Copyright Enrollment Form
   3 — Doc 3: BCRR Form 2 — Supplemental Form
   4 — Doc 4: Notarized Deed of Assignment
   5 — Doc 5: Photocopy of Author's Gov-ID
   6 — Doc 6: Copy of the Creative Work
   7 — Review & Submit
───────────────────────────────────────────── */

const LABELS = ["Details", "Doc 1", "Doc 2", "Doc 3", "Doc 4", "Doc 5", "Doc 6", "Review"];
const TOTAL  = LABELS.length;

const todayStr = () =>
  new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

const INIT = {
  title: "", workType: "", date: todayStr(),
  doc1: null, doc2: null, doc3: null, doc4: null, doc5: null, doc6: null,
};

function Progress({ step }) {
  return (
    <div className="step-progress">
      {LABELS.map((lbl, i) => (
        <div key={i} className={`sp-item${i === step ? " active" : ""}${i < step ? " done" : ""}`}>
          <div className="sp-circle">{i < step ? "✓" : i + 1}</div>
          <div className="sp-label">{lbl}</div>
        </div>
      ))}
    </div>
  );
}

function Head({ icon, title, sub }) {
  return (
    <div className="step-card-head">
      <div className="step-card-icon">{icon}</div>
      <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
    </div>
  );
}

function UploadZone({ fileRef, name, value, onChange }) {
  return (
    <>
      <input type="file" ref={fileRef} hidden name={name} accept=".pdf,.docx,image/*,.zip" onChange={onChange} />
      <div className={`upload-zone${value ? " filled" : ""}`} onClick={() => fileRef.current?.click()}>
        {value ? (
          <><div className="uz-big-icon"><i className="bi bi-check-lg"></i></div><div className="uz-filename">{value.name}</div><div className="uz-change">Click to change file</div></>
        ) : (
          <><div className="uz-big-icon"><i className="bi bi-cloud-arrow-up"></i></div><div className="uz-cta">Click to upload file</div><div className="uz-types">PDF, DOCX, image, or ZIP</div></>
        )}
      </div>
    </>
  );
}

export default function CopyrightPortal() {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(INIT);
  const [errors, setErrors] = useState({});
  const [done, setDone]     = useState(false);

  const refs = {
    doc1: useRef(), doc2: useRef(), doc3: useRef(),
    doc4: useRef(), doc5: useRef(), doc6: useRef(),
  };

  const hc = (e) => {
    const { name, value, files, type } = e.target;
    setForm(p  => ({ ...p, [name]: type === "file" && files?.length ? files[0] : value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const err  = (field, msg) => setErrors(p => ({ ...p, [field]: msg }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const requireDoc = (field, label) => {
    if (!form[field]) { err(field, `${label} is required.`); return false; }
    return true;
  };

  const submit = async () => {
    const BASE = import.meta.env?.VITE_API_URL || "http://localhost:3006/api";
    const fd = new FormData();
    fd.append("title",    form.title);
    fd.append("workType", form.workType);
    fd.append("date",     form.date);
    if (form.doc1) fd.append("endorsementLetter", form.doc1);
    if (form.doc2) fd.append("bcrrForm",          form.doc2);
    if (form.doc3) fd.append("bcrrForm2",         form.doc3);
    if (form.doc4) fd.append("deedOfAssignment",  form.doc4);
    if (form.doc5) fd.append("authorId",          form.doc5);
    if (form.doc6) fd.append("creativeWork",      form.doc6);
    try {
      const res = await fetch(`${BASE}/cr/submit`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: fd,
      });
      if (res.ok) setDone(true);
      else { const r = await res.json(); alert(`Submission failed: ${r.error || "Unknown."}`); }
    } catch { alert("Network error."); }
  };

  const reset = () => { setForm(INIT); setErrors({}); setStep(0); setDone(false); };

  return (
    <div className="portal-wrap">
      <Progress step={step} />

      {/* STEP 0 — Application Details */}
      {step === 0 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-card-list"></i>} title="Application Details" sub="Enter the basic information for your Copyright application." />
          <div className="step-card-body">
            <div className="notice-box info" style={{ marginBottom: 20 }}>
              <span className="notice-icon"><i className="bi bi-info-circle-fill"></i></span>
              <p>Copyright protection is <strong>automatic upon creation</strong>. Registration provides an official certificate that serves as <em>prima facie</em> evidence of ownership. Upload 1 file per document type.</p>
            </div>
            <div className="inline-fields">
              <div className="field flex-2">
                <label>Title of Work<span className="req">*</span></label>
                <input type="text" name="title" value={form.title} onChange={hc}
                  placeholder="Enter the full title of your work" />
                {errors.title && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.title}</p>}
              </div>
              <div className="field flex-1">
                <label>Filing Date</label>
                <input type="text" value={form.date} readOnly className="readonly-field" />
                <p className="field-note">Auto-set to today</p>
              </div>
            </div>
            <div className="field">
              <label>Type of Work<span className="req">*</span></label>
              <select name="workType" value={form.workType} onChange={hc}>
                <option value="" disabled>Select the type of creative work</option>
                <option>Literary Works</option>
                <option>Computer Programs / Software</option>
                <option>Musical Works</option>
                <option>Artistic Works</option>
                <option>Audio-Visual Works</option>
                <option>Photographic Works</option>
                <option>Research Papers / Theses</option>
                <option>Instructional Materials</option>
              </select>
              {errors.workType && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.workType}</p>}
            </div>
            <div className="btn-row end">
              <button className="btn-next" type="button" onClick={() => {
                if (!form.title.trim()) { err("title","Title of work is required."); return; }
                if (!form.workType) { err("workType","Type of work is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 — Endorsement Letter */}
      {step === 1 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-file-earmark-text"></i>} title="Document 1 — Endorsement Letter" sub="From Dean / Director / Office Head" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              A signed letter from your department head, dean, or office director endorsing and authorizing the filing of the copyright registration application on official letterhead.
            </div>
            <UploadZone fileRef={refs.doc1} name="doc1" value={form.doc1} onChange={hc} />
            {errors.doc1 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc1}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!requireDoc("doc1","Endorsement Letter")) return; next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — BCRR Form */}
      {step === 2 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-file-earmark-text"></i>} title="Document 2 — BCRR Copyright Enrollment Form" sub="Upload 1 file" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              The official Bureau of Copyright and Related Rights (BCRR) Copyright Enrollment Form. Must be completely filled out and signed. Upload 1 file. Download from <strong>ipophil.gov.ph</strong> or request from the IPMO.
            </div>
            <UploadZone fileRef={refs.doc2} name="doc2" value={form.doc2} onChange={hc} />
            {errors.doc2 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc2}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!requireDoc("doc2","BCRR Copyright Enrollment Form")) return; next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — BCRR Form 2 */}
      {step === 3 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-file-earmark-text"></i>} title="Document 3 — BCRR Form 2 (Supplemental Form)" sub="Upload 1 file" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              The supplemental form required alongside the main copyright enrollment form. Must also be fully accomplished and signed. Upload 1 file.
            </div>
            <UploadZone fileRef={refs.doc3} name="doc3" value={form.doc3} onChange={hc} />
            {errors.doc3 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc3}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!requireDoc("doc3","BCRR Form 2 — Supplemental Form")) return; next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Notarized Deed of Assignment */}
      {step === 4 && (
        <div className="step-card">
          <Head icon="⚖️" title="Document 4 — Notarized Deed of Assignment" sub="Prepare 4 notarized copies" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              Required if copyright ownership is being transferred (assigned) to the institution or another party. Must be properly notarized by a notary public before submission. Prepare <strong>4 notarized copies</strong> and combine into one file.
            </div>
            <UploadZone fileRef={refs.doc4} name="doc4" value={form.doc4} onChange={hc} />
            {errors.doc4 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc4}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!requireDoc("doc4","Notarized Deed of Assignment")) return; next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — Author's ID */}
      {step === 5 && (
        <div className="step-card">
          <Head icon="🪪" title="Document 5 — Photocopy of Author's Government-Issued ID" sub="Signed by the author" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              Photocopy of a valid government-issued ID of the author/s. The author must affix their signature on the photocopy. This applies to all co-authors as well. Upload 1 file.
            </div>
            <UploadZone fileRef={refs.doc5} name="doc5" value={form.doc5} onChange={hc} />
            {errors.doc5 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc5}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!requireDoc("doc5","Photocopy of Author's Government-Issued ID")) return; next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6 — Copy of Creative Work */}
      {step === 6 && (
        <div className="step-card">
          <Head icon="🎨" title="Document 6 — Copy of the Creative Work" sub="Prepare 4 complete copies" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              4 complete copies of the work being registered. Format depends on the work type: printed copies for books/papers, digital media for software or audiovisual works, printed/reproduced copies for artworks and instructional materials. Combine all into one file or ZIP.
            </div>
            <UploadZone fileRef={refs.doc6} name="doc6" value={form.doc6} onChange={hc} />
            {errors.doc6 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc6}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!requireDoc("doc6","Copy of the Creative Work")) return; next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7 — Review & Submit */}
      {step === 7 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-check-all"></i>} title="Review & Submit" sub="Review your application details before final submission." />
          <div className="step-card-body">
            <div className="review-grid">
              {[
                { label: "Title of Work",  value: form.title },
                { label: "Type of Work",   value: form.workType },
                { label: "Filing Date",    value: form.date },
              ].map((r, i) => (
                <div className="review-row" key={i}>
                  <div className="review-num">{i + 1}</div>
                  <div className="review-content"><strong>{r.label}</strong><span>{r.value}</span></div>
                </div>
              ))}
              {[
                { n: 4, label: "Endorsement Letter",                          file: form.doc1 },
                { n: 5, label: "BCRR Copyright Enrollment Form",               file: form.doc2 },
                { n: 6, label: "BCRR Form 2 — Supplemental Form",             file: form.doc3 },
                { n: 7, label: "Notarized Deed of Assignment",                 file: form.doc4 },
                { n: 8, label: "Author's Gov-Issued ID (signed)",              file: form.doc5 },
                { n: 9,  label: "Copy of the Creative Work",                    file: form.doc6 },

              ].map(r => (
                <div className="review-row" key={r.n}>
                  <div className="review-num">{r.n}</div>
                  <div className="review-content">
                    <strong>{r.label}</strong>
                    {r.tag && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#fff7ed', border: '1px solid #fed7aa', color: '#92400e', padding: '1px 7px', borderRadius: 9999, verticalAlign: 'middle' }}>
                          {r.tag}
                        </span>
                      )}
                    {r.file
                      ? <div className="review-file"><span className="review-file-icon"><i className="bi bi-file-earmark"></i></span><span className="review-status">{r.file.name}</span></div>
                      : <span className="review-missing">No file uploaded</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="notice-box info">
              <span className="notice-icon"><i className="bi bi-info-circle-fill"></i></span>
              <p>After submission, IPMO will review your application. Your application will then be filed to IPOPHL or the National Library of the Philippines (NLP) within <strong>5 working days</strong>. Acknowledgment receipt will be forwarded within <strong>3 working days</strong> of issuance. </p>
            </div>
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-submit" type="button" onClick={submit}>Submit Application</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {done && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-icon"><i className="bi bi-check-lg"></i></div>
            <h3>Copyright Submitted!</h3>
            <p>Your Copyright application has been received by IPMO. Your application will be filed to IPOPHL or the NLP within <strong>5 working days</strong>.</p>
            <button className="btn-next" style={{ margin: "0 auto" }} onClick={reset}>Submit Another</button>
          </div>
        </div>
      )}
    </div>
  );
}