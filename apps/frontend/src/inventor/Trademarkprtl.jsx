/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import axios from "axios";
import "./Portal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3006/api";
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

export function TrademarkPortalSection() {
  return (
    <section className="portal-section">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <TrademarkPortal />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STEPS:
   0 — Application Details
   1 — Doc 1: Endorsement Letter
   2 — Doc 2: Completed IPOPHL Trademark Application Form
   3 — Doc 3: Specimen / Sample of the Mark
   4 — Doc 4: Government-Issued ID of Applicant
   5 — Doc 5: Proof of Use (optional)
   6 — Review & Submit
───────────────────────────────────────────── */

const LABELS = ["Details", "Doc 1", "Doc 2", "Doc 3", "Doc 4", "Doc 5", "Review"];
const TOTAL  = LABELS.length;

const todayStr = () =>
  new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

const INIT = {
  title: "", markType: "", date: todayStr(),
  doc1: null, doc2: null, doc3: null, doc4: null, doc5: null,
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
      <input type="file" ref={fileRef} hidden name={name} accept=".pdf,.docx,image/*" onChange={onChange} />
      <div className={`upload-zone${value ? " filled" : ""}`} onClick={() => fileRef.current?.click()}>
        {value ? (
          <><div className="uz-big-icon">✅</div><div className="uz-filename">{value.name}</div><div className="uz-change">Click to change file</div></>
        ) : (
          <><div className="uz-big-icon">📎</div><div className="uz-cta">Click to upload file</div><div className="uz-types">PDF, DOCX, or image</div></>
        )}
      </div>
    </>
  );
}

export default function TrademarkPortal() {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(INIT);
  const [errors, setErrors] = useState({});
  const [done, setDone]     = useState(false);

  const refs = { doc1: useRef(), doc2: useRef(), doc3: useRef(), doc4: useRef(), doc5: useRef() };

  const hc = (e) => {
    const { name, value, files, type } = e.target;
    setForm(p  => ({ ...p, [name]: type === "file" && files?.length ? files[0] : value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const err = (field, msg) => setErrors(p => ({ ...p, [field]: msg }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const fd = new FormData();
    fd.append("title",    form.title);
    fd.append("markType", form.markType);
    fd.append("date",     form.date);
    if (form.doc1) fd.append("endorsementLetter", form.doc1);
    if (form.doc2) fd.append("applicationForm",   form.doc2);
    if (form.doc3) fd.append("specimen",          form.doc3);
    if (form.doc4) fd.append("governmentId",      form.doc4);
    if (form.doc5) fd.append("proofOfUse",        form.doc5);
    try {
      await axios.post(`${API}/tm/submit`, fd, { headers: hdrs() });
      setDone(true);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setForm(INIT); setErrors({}); setStep(0); setDone(false); setSubmitting(false); setSubmitError(null); };

  return (
    <div className="portal-wrap">
      <Progress step={step} />

      {/* STEP 0 — Application Details */}
      {step === 0 && (
        <div className="step-card">
          <Head icon="📋" title="Application Details" sub="Enter the basic information for your Trademark application." />
          <div className="step-card-body">
            <div className="inline-fields">
              <div className="field flex-2">
                <label>Trademark Title / Brand Name<span className="req">*</span></label>
                <input type="text" name="title" value={form.title} onChange={hc}
                  placeholder="Enter the word, phrase, or brand name to be registered" />
                {errors.title && <p className="field-error">⚠ {errors.title}</p>}
              </div>
              <div className="field flex-1">
                <label>Filing Date</label>
                <input type="text" value={form.date} readOnly className="readonly-field" />
                <p className="field-note">Auto-set to today</p>
              </div>
            </div>
            <div className="field">
              <label>Type of Mark<span className="req">*</span></label>
              <select name="markType" value={form.markType} onChange={hc}>
                <option value="" disabled>Select the type of mark</option>
                <option value="Word Mark">Word Mark (Name)</option>
                <option value="Figurative Mark">Figurative Mark (Logo)</option>
                <option value="Figurative/Word Mark">Figurative/Word Mark (Logo + Name)</option>
                <option value="Collective Mark">Collective Mark</option>
                <option value="Three-Dimensional Mark">Three-Dimensional Mark</option>
                <option value="Supplemental Sheet">Supplemental Sheet / Additional Filing</option>
              </select>
              {errors.markType && <p className="field-error">⚠ {errors.markType}</p>}
            </div>
            <div className="btn-row end">
              <button className="btn-next" type="button" onClick={() => {
                if (!form.title.trim()) { err("title","Trademark title is required."); return; }
                if (!form.markType) { err("markType","Type of mark is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 — Endorsement Letter */}
      {step === 1 && (
        <div className="step-card">
          <Head icon="📄" title="Document 1 — Endorsement Letter" sub="From Dean / Director / Office Head" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              A signed endorsement letter from your department head, dean, or office director on official letterhead, authorizing the filing of the trademark application.
            </div>
            <UploadZone fileRef={refs.doc1} name="doc1" value={form.doc1} onChange={hc} />
            {errors.doc1 && <p className="field-error">⚠ {errors.doc1}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc1) { err("doc1","Endorsement Letter is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — IPOPHL Trademark Application Form */}
      {step === 2 && (
        <div className="step-card">
          <Head icon="📄" title="Document 2 — IPOPHL Trademark Application Form" sub="Official form, fully accomplished and signed" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              The official IPOPHL Trademark Application Form, fully accomplished and signed. Download from <strong>ipophil.gov.ph</strong> or request from the IPMO office. Ensure the mark, class, and goods/services description are accurately filled.
            </div>
            <UploadZone fileRef={refs.doc2} name="doc2" value={form.doc2} onChange={hc} />
            {errors.doc2 && <p className="field-error">⚠ {errors.doc2}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc2) { err("doc2","IPOPHL Trademark Application Form is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — Specimen / Sample of the Mark */}
      {step === 3 && (
        <div className="step-card">
          <Head icon="🖼️" title="Document 3 — Specimen / Sample of the Mark" sub="High-resolution image for logos; typed/printed text for word marks" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              For <strong>LOGO or DEVICE marks</strong>: high-resolution image file (PNG or JPG, minimum 300 DPI). For <strong>WORD marks</strong>: typed or printed representation of the exact word/phrase to be registered.
            </div>
            <UploadZone fileRef={refs.doc3} name="doc3" value={form.doc3} onChange={hc} />
            {errors.doc3 && <p className="field-error">⚠ {errors.doc3}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc3) { err("doc3","Specimen / Sample of the Mark is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Government-Issued ID */}
      {step === 4 && (
        <div className="step-card">
          <Head icon="🪪" title="Document 4 — Government-Issued ID of Applicant/s" sub="Valid ID for the applicant or all applicants" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              A valid, clear photocopy or scanned copy of a government-issued ID for the applicant or all applicants if more than one.
            </div>
            <UploadZone fileRef={refs.doc4} name="doc4" value={form.doc4} onChange={hc} />
            {errors.doc4 && <p className="field-error">⚠ {errors.doc4}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc4) { err("doc4","Government-Issued ID is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — Proof of Use (optional) */}
      {step === 5 && (
        <div className="step-card">
          <Head
            icon="📸"
            title={<>Document 5 — Proof of Use <span className="optional-tag">Optional</span></>}
            sub="Only required if the mark is already in use in commerce"
          />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              If the mark is already being used in commerce, submit supporting evidence such as a label, brochure, product packaging, advertisement, or photograph clearly showing the mark in actual use. <strong>NOT required for intent-to-use applications.</strong>
            </div>
            <UploadZone fileRef={refs.doc5} name="doc5" value={form.doc5} onChange={hc} />
            <div className="notice-box" style={{ marginTop: 14 }}>
              <span className="notice-icon">⚠️</span>
              <p>After filing, you must submit a <strong>Declaration of Actual Use (DAU)</strong> within <strong>3 years</strong> from the filing date. A second DAU is required within <strong>1 year after the 5th year</strong> from the date of registration.</p>
            </div>
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={next}>
                {form.doc5 ? "Next →" : "Skip →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6 — Review & Submit */}
      {step === 6 && (
        <div className="step-card">
          <Head icon="✅" title="Review & Submit" sub="Review your application details before final submission." />
          <div className="step-card-body">
            <div className="review-grid">
              {[
                { label: "Trademark Title",   value: form.title },
                { label: "Type of Mark",      value: form.markType },
                { label: "Filing Date",        value: form.date },
              ].map((r, i) => (
                <div className="review-row" key={i}>
                  <div className="review-num">{i + 1}</div>
                  <div className="review-content"><strong>{r.label}</strong><span>{r.value}</span></div>
                </div>
              ))}
              {[
                { n: 4, label: "Endorsement Letter",                  file: form.doc1 },
                { n: 5, label: "IPOPHL Trademark Application Form",   file: form.doc2 },
                { n: 6, label: "Specimen / Sample of the Mark",       file: form.doc3 },
                { n: 7, label: "Government-Issued ID of Applicant/s", file: form.doc4 },
                { n: 8, label: "Proof of Use (Optional)",              file: form.doc5, optional: true },
              ].map(r => (
                <div className="review-row" key={r.n}>
                  <div className="review-num">{r.n}</div>
                  <div className="review-content">
                    <strong>{r.label}</strong>
                    {r.file
                      ? <div className="review-file"><span className="review-file-icon">📎</span><span className="review-status">{r.file.name}</span></div>
                      : <span className="review-missing">{r.optional ? "Not submitted (optional)" : "No file uploaded"}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="notice-box info">
              <span className="notice-icon">ℹ️</span>
              <p>After submission, IPMO will file your application to IPOPHL within <strong>5 working days</strong>. Your acknowledgment receipt will be forwarded within <strong>3 working days</strong> of issuance.</p>
            </div>
            {submitError && (
              <div className="notice-box" style={{ background: "#fef2f2", border: "1px solid #fecaca", marginTop: 14 }}>
                <span className="notice-icon">⚠️</span>
                <p style={{ color: "#b91c1c" }}><strong>Submission failed:</strong> {submitError}</p>
              </div>
            )}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back} disabled={submitting}>← Back</button>
              <button className="btn-submit" type="button" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {done && (
        <div className="popup-overlay">
          <div className="popup-box">
            <span className="popup-icon">✅</span>
            <h3>Trademark Submitted!</h3>
            <p>Your Trademark application has been received. IPMO will file it to IPOPHL within <strong>5 working days</strong>. Acknowledgment receipt will be forwarded within <strong>3 working days</strong>.</p>
            <button className="btn-next" style={{ margin: "0 auto" }} onClick={reset}>Submit Another</button>
          </div>
        </div>
      )}
    </div>
  );
}