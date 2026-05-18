/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import "./Portal.css";

export function UMIDPortalSection() {
  return (
    <section className="portal-section">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <UMIDPortal />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STEPS:
   0 — Select IP Type
   1 — Application Details
   2 — Doc 1: Endorsement Letter
   3 — Doc 2: Technology Disclosure Form
   4 — Doc 3: Drawings / Illustrations
   5 — Doc 4: Government-Issued ID
   7 — Review & Submit
───────────────────────────────────────────── */

const LABELS = ["IP Type", "Details", "Doc 1", "Doc 2", "Doc 3", "Doc 4", "Review"];
const TOTAL  = LABELS.length;

const todayStr = () =>
  new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

const INIT = {
  ipType: "", title: "", date: todayStr(),
  doc1: null, doc2: null, doc3: null, doc4: null,
};

/* ── shared UI pieces ── */
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

function UploadZone({ fileRef, name, value, onChange, accept = ".pdf,.docx,image/*" }) {
  return (
    <>
      <input type="file" ref={fileRef} hidden name={name} accept={accept} onChange={onChange} />
      <div className={`upload-zone${value ? " filled" : ""}`} onClick={() => fileRef.current?.click()}>
        {value ? (
          <>
            <div className="uz-big-icon"><i className="bi bi-check-lg"></i></div>
            <div className="uz-filename">{value.name}</div>
            <div className="uz-change">Click to change file</div>
          </>
        ) : (
          <>
            <div className="uz-big-icon"><i className="bi bi-cloud-arrow-up"></i></div>
            <div className="uz-cta">Click to upload file</div>
            <div className="uz-types">PDF, DOCX, or image</div>
          </>
        )}
      </div>
    </>
  );
}

/* ── main component ── */
export default function UMIDPortal() {
  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState(INIT);
  const [errors, setErrors] = useState({});
  const [done,   setDone]   = useState(false);

  const refs = {
    doc1: useRef(), doc2: useRef(),
    doc3: useRef(), doc4: useRef(),
  };

  const set = (name, val) => {
    setForm(p  => ({ ...p, [name]: val }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const hc = (e) => {
    const { name, value, files, type } = e.target;
    set(name, type === "file" && files?.length ? files[0] : value);
  };

  const err  = (field, msg) => setErrors(p => ({ ...p, [field]: msg }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const isUM = form.ipType === "Utility Model";

  const submit = async () => {
    const BASE = import.meta.env?.VITE_API_URL || "http://localhost:3006/api";
    const fd = new FormData();
    fd.append("ipType", form.ipType);
    fd.append("title",  form.title);
    fd.append("date",   form.date);
    if (form.doc1) fd.append("endorsementLetter",  form.doc1);
    if (form.doc2) fd.append("disclosureForm",      form.doc2);
    if (form.doc3) fd.append("drawings",            form.doc3);
    if (form.doc4) fd.append("governmentId",        form.doc4);
    try {
      const res = await fetch(`${BASE}/umid/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      if (res.ok) setDone(true);
      else {
        const r = await res.json();
        alert(`Submission failed: ${r.error || "Unknown error."}`);
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const reset = () => { setForm(INIT); setErrors({}); setStep(0); setDone(false); };

  /* ── render ── */
  return (
    <div className="portal-wrap">
      <Progress step={step} />

      {/* ════════════════════════════════════════
          STEP 0 — IP Type
      ════════════════════════════════════════ */}
      {step === 0 && (
        <div className="step-card">
          <Head icon="🗂️" title="Select IP Type"
            sub="Choose the type of Intellectual Property you are submitting." />
          <div className="step-card-body">
            <div className="type-options">
              {[
                {
                  val: "Utility Model",
                  icon: "🔧",
                  desc: "A new technical solution to a problem — a device, tool, method, or mechanism. Focuses on FUNCTION. Protection: 7 years (non-renewable).",
                },
                {
                  val: "Industrial Design",
                  icon: <i className="bi bi-palette"></i>,
                  desc: "The visual or ornamental appearance of a product — shape, color, pattern, texture. Focuses on AESTHETICS. Protection: up to 15 years.",
                },
              ].map(o => (
                <label key={o.val} className={`type-opt${form.ipType === o.val ? " selected" : ""}`}>
                  <input type="radio" name="ipType" value={o.val}
                    checked={form.ipType === o.val} onChange={hc} />
                  <span className="type-opt-icon">{o.icon}</span>
                  <div className="type-opt-body">
                    <strong>{o.val}</strong>
                    <span>{o.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.ipType && (
              <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.ipType}</p>
            )}
            <div className="btn-row end">
              <button className="btn-next" type="button" onClick={() => {
                if (!form.ipType) { err("ipType", "Please select an IP type to continue."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 1 — Application Details
      ════════════════════════════════════════ */}
      {step === 1 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-card-list"></i>} title="Application Details"
            sub={`Basic information for your ${form.ipType} application.`} />
          <div className="step-card-body">
            <div className="inline-fields">
              <div className="field flex-2">
                <label>{isUM ? "Title of Invention" : "Design Title"}<span className="req">*</span></label>
                <input type="text" name="title" value={form.title} onChange={hc}
                  placeholder={isUM
                    ? "Enter a concise title for your invention"
                    : "Enter the name of your design"} />
                {errors.title && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.title}</p>}
              </div>
              <div className="field flex-1">
                <label>Filing Date</label>
                <input type="text" value={form.date} readOnly className="readonly-field" />
                <p className="field-note">Auto-set to today</p>
              </div>
            </div>
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.title.trim()) {
                  err("title", `${isUM ? "Title of invention" : "Design title"} is required.`);
                  return;
                }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — Doc 1: Endorsement Letter
      ════════════════════════════════════════ */}
      {step === 2 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-file-earmark-text"></i>} title="Document 1 — Endorsement Letter"
            sub="From Dean / Director / Office Head" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              A signed letter from your department head, dean, or office director endorsing and
              certifying the authenticity of your application. Must be on official letterhead.
            </div>
            <UploadZone fileRef={refs.doc1} name="doc1" value={form.doc1} onChange={hc} />
            {errors.doc1 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc1}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc1) { err("doc1", "Endorsement Letter is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — Doc 2: Technology Disclosure Form
      ════════════════════════════════════════ */}
      {step === 3 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-file-earmark-text"></i>} title="Document 2 — Technology Disclosure Form"
            sub="IP-Patterned Document" />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              {isUM
                ? "The completed IPMO or IPOPHL Technology Disclosure Form with full technical details — the problem addressed, the technical solution, and how it works."
                : "The completed IPMO or IPOPHL disclosure form focusing on the visual/ornamental features of the design, not its function."}
            </div>
            <UploadZone fileRef={refs.doc2} name="doc2" value={form.doc2} onChange={hc} />
            {errors.doc2 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc2}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc2) { err("doc2", "Technology Disclosure Form is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 4 — Doc 3: Drawings / Illustrations
      ════════════════════════════════════════ */}
      {step === 4 && (
        <div className="step-card">
          <Head
            icon="📐"
            title={isUM
              ? "Document 3 — Technical Drawings / Illustrations"
              : "Document 3 — Drawings / Photographs of the Design"}
            sub={isUM
              ? "Front, side, and cross-section views as applicable"
              : "All views: Front, Back, Top, Bottom, Left, Right"}
          />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              {isUM
                ? "Technical drawings or diagrams clearly showing the design and functionality. Must include relevant views (front, side, cross-section as applicable)."
                : "High-quality drawings or photographs showing all views: FRONT, BACK, TOP, BOTTOM, LEFT SIDE, and RIGHT SIDE."}
            </div>
            <UploadZone fileRef={refs.doc3} name="doc3" value={form.doc3} onChange={hc} />
            {errors.doc3 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc3}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc3) { err("doc3", "Drawings / Illustrations are required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 5 — Doc 4: Government-Issued ID
      ════════════════════════════════════════ */}
      {step === 5 && (
        <div className="step-card">
          <Head
            icon="🪪"
            title={isUM
              ? "Document 4 — Government-Issued ID of Inventor/s"
              : "Document 4 — Government-Issued ID of Designer/s"}
            sub="Valid ID for all inventors / designers listed in the application"
          />
          <div className="step-card-body">
            <div className="upload-hint">
              <strong>What to upload: </strong>
              A valid, clear photocopy or scanned copy of a government-issued ID for all
              inventors/designers listed in the application (e.g., passport, PhilSys ID,
              UMID, driver's license).
            </div>
            <UploadZone fileRef={refs.doc4} name="doc4" value={form.doc4} onChange={hc} />
            {errors.doc4 && <p className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.doc4}</p>}
            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-next" type="button" onClick={() => {
                if (!form.doc4) { err("doc4", "Government-Issued ID is required."); return; }
                next();
              }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 6 — Review & Submit
      ════════════════════════════════════════ */}
      {step === 6 && (
        <div className="step-card">
          <Head icon={<i className="bi bi-check-all"></i>} title="Review & Submit"
            sub="Review your application details before final submission." />
          <div className="step-card-body">
            <div className="review-grid">
              {[
                { label: "IP Type",                                         value: form.ipType },
                { label: isUM ? "Title of Invention" : "Design Title",     value: form.title },
                { label: "Filing Date",                                     value: form.date },
              ].map((r, i) => (
                <div className="review-row" key={i}>
                  <div className="review-num">{i + 1}</div>
                  <div className="review-content">
                    <strong>{r.label}</strong>
                    <span>{r.value}</span>
                  </div>
                </div>
              ))}

              {[
                {
                  n: 4,
                  label: "Endorsement Letter",
                  file: form.doc1,
                },
                {
                  n: 5,
                  label: "Technology Disclosure Form",
                  file: form.doc2,
                },
                {
                  n: 6,
                  label: isUM
                    ? "Technical Drawings / Illustrations"
                    : "Drawings / Photographs (All Views)",
                  file: form.doc3,
                },
                {
                  n: 7,
                  label: isUM
                    ? "Gov-Issued ID of Inventor/s"
                    : "Gov-Issued ID of Designer/s",
                  file: form.doc4,
                },
                {
                  n: 8,

                },
              ].map(r => (
                <div className="review-row" key={r.n}>
                  <div className="review-num">{r.n}</div>
                  <div className="review-content">
                    <strong>
                      {r.label}
                      {r.tag && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#fff7ed',
                          border: '1px solid #fed7aa',
                          color: '#92400e',
                          padding: '1px 7px',
                          borderRadius: 9999,
                          verticalAlign: 'middle',
                        }}>
                          {r.tag}
                        </span>
                      )}
                    </strong>
                    {r.file
                      ? (
                        <div className="review-file">
                          <span className="review-file-icon"><i className="bi bi-file-earmark"></i></span>
                          <span className="review-status">{r.file.name}</span>
                        </div>
                      ) : (
                        <span className="review-missing">No file uploaded</span>
                      )}
                  </div>
                </div>
              ))}
            </div>

            <div className="notice-box info">
              <span className="notice-icon"><i className="bi bi-info-circle-fill"></i></span>
              <p>
                After submission, the IPMO Director and IP Specialist will review your application
               . Your application will be
                filed to IPOPHL within <strong>15 working days</strong>.
              </p>
            </div>

            <div className="btn-row split">
              <button className="btn-back" type="button" onClick={back}>← Back</button>
              <button className="btn-submit" type="button" onClick={submit}>
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {done && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-icon"><i className="bi bi-check-lg"></i></div>
            <h3>Application Submitted!</h3>
            <p>
              Your <strong>{form.ipType}</strong> application has been received
              by IPMO
              within <strong>15 working days</strong>.
            </p>
            <button className="btn-next" style={{ margin: "0 auto" }} onClick={reset}>
              Submit Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}