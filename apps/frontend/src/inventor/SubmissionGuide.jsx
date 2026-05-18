import { useState, useEffect } from "react";
import "./Submissionguide.css";

/* ── Bootstrap Icon component ─────────────────────────────── */
const BI = ({ name, className = "", style = {} }) => (
  <i className={`bi bi-${name} ${className}`} style={style}></i>
);

/* ── Data ─────────────────────────────────────────────────── */
const ipTypes = [
  {
    id: "utility", cls: "ip-utility",
    biIcon: "wrench-adjustable-circle-fill",
    label: "Utility Model", tagline: "Technical Solutions",
    protection: "7 Years", renewInfo: "No renewal",
    steps: [
      {
        num: 1, title: "Prepare Documents", biIcon: "folder2-open",
        items: [
          "<strong>Endorsement Letter</strong> — signed by Dean, Director, or Office Head on official letterhead",
          "<strong>Technology Disclosure Form / IP-Patterned Document</strong> — fully accomplished with complete technical details",
          "<strong>Technical Drawings / Illustrations</strong> — front, side, and cross-section views as applicable",
          "<strong>Government-Issued ID</strong> of all inventors — clear photocopy or scanned copy",
        ],
      },
      {
        num: 2, title: "Submit via Portal", biIcon: "cloud-upload-fill",
        items: [
          "Log in to the <strong>CNSC-IPMO Submission Portal</strong> using your institutional account",
          "Select IP Type: <strong>Utility Model</strong> from the application form",
          "Upload all required documents in the prescribed format",
          "Submit the application and retain your <strong>confirmation reference number</strong>",
        ],
      },
      {
        num: 3, title: "IPMO Review & PAS", biIcon: "search",
        items: [
          "IP Specialist verifies document completeness against <strong>11 checklist items</strong>",
          "Incomplete submissions — a <strong>Deficiency Notice</strong> is issued; application placed on hold",
          "Complete submissions — <strong>Prior Art Search (PAS)</strong> is initiated by IPMO",
          "PAS Report is assessed and released within <strong>15 working days</strong> of receipt",
        ],
      },
      {
        num: 4, title: "Filing to IPOPHL", biIcon: "bank",
        items: [
          "Satisfactory PAS — IPMO drafts and files the application to <strong>IPOPHL</strong>",
          "Filing is completed within <strong>15 working days</strong> from satisfactory PAS",
          "IPOPHL Acknowledgment Receipt is forwarded to applicant within <strong>3 working days</strong>",
          "IPOPHL proceeds with formal and substantive examination independently",
        ],
      },
    ],
    timeline: [
      { label: "PAS Report",     days: "15 working days", biIcon: "file-earmark-text" },
      { label: "File to IPOPHL", days: "15 working days", biIcon: "send"              },
      { label: "Acknowledgment", days: "3 working days",  biIcon: "envelope-check"   },
    ],
    note: "Utility Model protection lasts 7 years from the date of filing with NO possibility of renewal. Plan commercialization and use of your invention accordingly.",
  },
  {
    id: "industrial", cls: "ip-industrial",
    biIcon: "palette-fill",
    label: "Industrial Design", tagline: "Aesthetic & Visual Features",
    protection: "Up to 15 Years", renewInfo: "Renewable every 5 yrs",
    steps: [
      {
        num: 1, title: "Prepare Documents", biIcon: "folder2-open",
        items: [
          "<strong>Endorsement Letter</strong> — signed by Dean, Director, or Office Head on official letterhead",
          "<strong>Technology Disclosure Form / IP-Patterned Document</strong> — focusing on visual and ornamental features",
          "<strong>Multi-view Drawings or Photographs</strong> — Front, Back, Top, Bottom, Left Side, Right Side (high quality)",
          "<strong>Government-Issued ID</strong> of all designers — clear photocopy or scanned copy",
        ],
      },
      {
        num: 2, title: "Submit via Portal", biIcon: "cloud-upload-fill",
        items: [
          "Log in to the <strong>CNSC-IPMO Submission Portal</strong> using your institutional account",
          "Select IP Type: <strong>Industrial Design</strong> from the application form",
          "Upload all required documents including all <strong>six required views</strong>",
          "Submit the application and retain your <strong>confirmation reference number</strong>",
        ],
      },
      {
        num: 3, title: "IPMO Review & PAS", biIcon: "search",
        items: [
          "IP Specialist verifies document completeness against <strong>10 checklist items</strong>",
          "Incomplete submissions — a <strong>Deficiency Notice</strong> is issued; application placed on hold",
          "Complete submissions — <strong>Prior Art Search (PAS)</strong> is initiated by IPMO",
          "PAS Report is assessed and released within <strong>15 working days</strong> of receipt",
        ],
      },
      {
        num: 4, title: "Filing to IPOPHL", biIcon: "bank",
        items: [
          "Satisfactory PAS — IPMO drafts and files the application to <strong>IPOPHL</strong>",
          "Filing is completed within <strong>15 working days</strong> from satisfactory PAS",
          "IPOPHL Acknowledgment Receipt is forwarded to applicant within <strong>3 working days</strong>",
          "IPOPHL proceeds with formal and substantive examination independently",
        ],
      },
    ],
    timeline: [
      { label: "PAS Report",     days: "15 working days", biIcon: "file-earmark-text" },
      { label: "File to IPOPHL", days: "15 working days", biIcon: "send"              },
      { label: "Acknowledgment", days: "3 working days",  biIcon: "envelope-check"   },
    ],
    note: "Industrial design registration is valid for 5 years and may be renewed twice in 5-year intervals for a maximum protection of 15 years. File renewal before each period expires.",
  },
  {
    id: "trademark", cls: "ip-trademark",
    biIcon: "patch-check-fill",
    label: "Trademark", tagline: "Brand Identity & Marks",
    protection: "10 Years", renewInfo: "Renewable indefinitely",
    steps: [
      {
        num: 1, title: "Prepare Documents", biIcon: "folder2-open",
        items: [
          "<strong>Endorsement Letter</strong> — signed by Dean, Director, or Office Head on official letterhead",
          "<strong>Completed IPOPHL Trademark Application Form</strong> — fully accomplished and signed by applicant",
          "<strong>Specimen / Sample of the Mark</strong> — PNG or JPG at minimum 300 DPI for logos; typed text for word marks",
          "<strong>Government-Issued ID</strong> of all applicants — clear photocopy or scanned copy",
          "<strong>Proof of Use</strong> — label, brochure, packaging, or photo showing actual use (only if mark is currently in use)",
        ],
      },
      {
        num: 2, title: "Submit via Portal", biIcon: "cloud-upload-fill",
        items: [
          "Log in to the <strong>CNSC-IPMO Submission Portal</strong> using your institutional account",
          "Select IP Type: <strong>Trademark</strong> from the application form",
          "Upload all required documents including high-resolution mark specimen",
          "Submit the application — note the strict <strong>5-working-day filing deadline</strong>",
        ],
      },
      {
        num: 3, title: "IPMO Review", biIcon: "search",
        items: [
          "IP Specialist verifies document completeness against <strong>11 checklist items</strong>",
          "Incomplete submissions — a <strong>Deficiency Notice</strong> is issued; resubmit promptly due to filing deadline",
          "<strong>No Prior Art Search (PAS)</strong> is required for Trademark applications",
          "Complete submissions proceed directly to filing with IPOPHL",
        ],
      },
      {
        num: 4, title: "Filing to IPOPHL", biIcon: "bank",
        items: [
          "IPMO files the Trademark application to <strong>IPOPHL within 5 working days</strong> of receipt",
          "IPOPHL Acknowledgment Receipt is forwarded to applicant within <strong>3 working days</strong>",
          "Applicant must file a <strong>Declaration of Actual Use (DAU)</strong> within 3 years from filing date",
          "A second DAU is required within <strong>1 year after the 5th year</strong> from date of registration",
        ],
      },
    ],
    timeline: [
      { label: "No PAS Required", days: "—", biIcon: "slash-circle", muted: true },
      { label: "File to IPOPHL",  days: "5 working days", biIcon: "send"         },
      { label: "Acknowledgment",  days: "3 working days", biIcon: "envelope-check"},
    ],
    note: "Failure to file the Declaration of Actual Use (DAU) within 3 years from the filing date will result in automatic removal of the mark from the register. Trademark is renewable indefinitely every 10 years.",
  },
  {
    id: "copyright", cls: "ip-copyright",
    biIcon: "c-circle-fill",
    label: "Copyright", tagline: "Creative & Literary Works",
    protection: "Life + 50 Years", renewInfo: "No renewal needed",
    steps: [
      {
        num: 1, title: "Prepare Documents", biIcon: "folder2-open",
        items: [
          "<strong>Endorsement Letter</strong> — signed by Dean, Director, or Office Head on official letterhead",
          "<strong>BCRR Copyright Enrollment Form</strong> — 4 complete sets, fully accomplished and signed",
          "<strong>BCRR Form 2 (Supplemental Form)</strong> — 4 complete sets, fully accomplished and signed",
          "<strong>Notarized Deed of Assignment</strong> — 4 notarized original copies (if rights are being assigned)",
          "<strong>Author's Government-Issued ID</strong> — 4 photocopies, each bearing the author's signature 3 times",
          "<strong>Copy of the Creative Work</strong> — 4 complete sets in appropriate format (print, digital, or reproduced)",
        ],
      },
      {
        num: 2, title: "Submit via Portal", biIcon: "cloud-upload-fill",
        items: [
          "Log in to the <strong>CNSC-IPMO Submission Portal</strong> using your institutional account",
          "Select IP Type: <strong>Copyright</strong> from the application form",
          "Upload all required documents — the <strong>4-set requirement</strong> is strictly enforced",
          "Physical submission of the 4-set documents may additionally be required at the <strong>IPMO office</strong>",
        ],
      },
      {
        num: 3, title: "IPMO Review", biIcon: "search",
        items: [
          "IP Specialist verifies document completeness against <strong>12 checklist items</strong>",
          "Each document set is checked individually — all <strong>4 sets of every document</strong> are required",
          "Incomplete or missing sets — a <strong>Deficiency Notice</strong> is issued; application placed on hold",
          "<strong>No Prior Art Search (PAS)</strong> is required for Copyright applications",
        ],
      },
      {
        num: 4, title: "Filing to IPOPHL / NLP", biIcon: "bank",
        items: [
          "IPMO files the application to <strong>IPOPHL or the National Library of the Philippines (NLP)</strong>",
          "Filing is completed within <strong>5 working days</strong> of receipt",
          "IPOPHL or NLP Acknowledgment Receipt is forwarded to applicant within <strong>3 working days</strong>",
          "The issued certificate serves as <strong>prima facie evidence</strong> of authorship and ownership",
        ],
      },
    ],
    timeline: [
      { label: "No PAS Required",    days: "—",              biIcon: "slash-circle", muted: true },
      { label: "File to IPOPHL/NLP", days: "5 working days", biIcon: "send"                      },
      { label: "Acknowledgment",     days: "3 working days", biIcon: "envelope-check"             },
    ],
    note: "Copyright is automatic upon creation — registration provides an official certificate and constitutes prima facie evidence of ownership in legal proceedings.",
  },
];

/* ── Flow node definitions ─────────────────────────────────── */
const getFlowNodes = (ipId) => [
  { biIcon: "upload",            label: "Submit"           },
  { biIcon: "clipboard2-check",  label: "IPMO Review"      },
  { biIcon: ipId === "trademark" || ipId === "copyright" ? "lightning-charge" : "file-earmark-text",
    label: ipId === "trademark" || ipId === "copyright" ? "Direct Filing" : "PAS Report" },
  { biIcon: "bank",              label: "File to IPOPHL"   },
  { biIcon: "envelope-open",     label: "Acknowledgment"   },
  { biIcon: "shield-check",      label: "IPOPHL Processing"},
];

/* ── Main Component ─────────────────────────────────────────── */
export default function SubmissionGuide() {
  const [active, setActive]   = useState("utility");
  const [stepIdx, setStepIdx] = useState(0);
  const ip = ipTypes.find((t) => t.id === active);

  useEffect(() => { setStepIdx(0); }, [active]);

  const step     = ip.steps[stepIdx];
  const total    = ip.steps.length;
  const progress = ((stepIdx + 1) / total) * 100;
  const flowNodes = getFlowNodes(ip.id);

  return (
    <div className="sg-page">

      {/* ── Tab Navigation ── */}
      <nav className="sg-tabs">
        {ipTypes.map((t) => (
          <button key={t.id}
            className={`sg-tab ${t.cls}${active === t.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            <span className="sg-tab-icon"><BI name={t.biIcon} /></span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className={`sg-content ${ip.cls}`}>

        {/* Hero */}
        <section className="sg-hero">
          <div className="sg-hero-inner">
            <div className="sg-hero-icon-box">
              <BI name={ip.biIcon} style={{ fontSize: 34 }} />
            </div>
            <div className="sg-hero-body">
              <span className="sg-hero-eyebrow">{ip.tagline}</span>
              <h2 className="sg-hero-title">{ip.label} Registration</h2>
              <p className="sg-hero-sub">
                Protect your {ip.label.toLowerCase()} through the CNSC-IPMO Submission Portal
              </p>
              <div className="sg-hero-pills">
                <div className="sg-hero-pill">
                  <div className="sg-pill-label">Protection Period</div>
                  <div className="sg-pill-val">{ip.protection}</div>
                </div>
                <div className="sg-hero-pill">
                  <div className="sg-pill-label">Renewal</div>
                  <div className="sg-pill-sub">{ip.renewInfo}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Steps Carousel ── */}
        <div className="sg-carousel">

          {/* Step header tabs */}
          <div className="sg-step-tabs">
            {ip.steps.map((s, i) => (
              <button key={s.num}
                className={`sg-step-tab${i === stepIdx ? " active" : i < stepIdx ? " done" : ""}`}
                onClick={() => setStepIdx(i)}
              >
                <span className="sg-stab-num">
                  {i < stepIdx ? <BI name="check2" style={{ fontSize: 11 }} /> : s.num}
                </span>
                <span className="sg-stab-label">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Card body */}
          <div className="sg-card-body">
            <div className="sg-progress-bar">
              <div className="sg-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="sg-slide-wrap">
              <div className="sg-slide" key={stepIdx}>
                <div className="sg-card-head">
                  <div className="sg-card-icon">
                    <BI name={step.biIcon} style={{ fontSize: 20 }} />
                  </div>
                  <div className="sg-card-step-meta">
                    <div className="sg-card-step-label">Step {step.num} of {total}</div>
                    <div className="sg-card-step-title">{step.title}</div>
                  </div>
                </div>

                <ul className="sg-items">
                  {step.items.map((item, j) => (
                    <li className="sg-item" key={j}>
                      <span className="sg-item-check">
                        <BI name="check2" />
                      </span>
                      <span className="sg-item-text" dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Nav row */}
          <div className="sg-nav">
            <div className="sg-nav-dots">
              {ip.steps.map((_, i) => (
                <button key={i}
                  className={`sg-nav-dot${i === stepIdx ? " active" : ""}`}
                  onClick={() => setStepIdx(i)}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>
            <div className="sg-nav-btns">
              <button className="sg-btn"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                disabled={stepIdx === 0}
              >
                <BI name="arrow-left" /> Previous
              </button>
              <button className="sg-btn next"
                onClick={() => setStepIdx((i) => Math.min(total - 1, i + 1))}
                disabled={stepIdx === total - 1}
              >
                Next <BI name="arrow-right" />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="sg-timeline-card">
          <p className="sg-section-label">Processing Timeline</p>
          <div className="sg-timeline-row">
            {ip.timeline.map((t, i) => (
              <>
                <div className="sg-tl-node" key={i}>
                  <div className="sg-tl-label">{t.label}</div>
                  <div className={`sg-tl-days${t.muted ? " muted" : ""}`}>{t.days}</div>
                </div>
                <BI name="chevron-right" className="sg-tl-arrow" key={`a${i}`} />
              </>
            ))}
            <div className="sg-tl-end">
              <div className="sg-tl-end-label">IPOPHL Examination</div>
              <div className="sg-tl-end-val">
                <BI name="check-circle-fill" style={{ marginRight: 4, color: 'var(--c)' }} />
                Begins
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="sg-note">
          <span className="sg-note-icon"><BI name="exclamation-triangle-fill" /></span>
          <div>
            <div className="sg-note-head">Important Note</div>
            <p className="sg-note-text">{ip.note}</p>
          </div>
        </div>

        {/* Flow */}
        <div className="sg-flow">
          <p className="sg-section-label" style={{ justifyContent: "center" }}>Application Review Flow</p>
          <div className="sg-flow-row">
            {flowNodes.map((node, i) => (
              <>
                <div className="sg-flow-node" key={i}>
                  <div className="sg-flow-icon"><BI name={node.biIcon} /></div>
                  <div className="sg-flow-label">{node.label}</div>
                </div>
                {i < flowNodes.length - 1 && (
                  <BI name="chevron-right" className="sg-flow-arrow" key={`fa${i}`} />
                )}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="sg-footer">
        <BI name="shield-check" style={{ marginRight: 6 }} />
        CNSC-IPMO Submission Guide &nbsp;·&nbsp; Based on CNSC Quality Control Plan (QCP) &amp; IPOPHL Guidelines &nbsp;·&nbsp;
        For use by CNSC Innovators, Faculty, Researchers &amp; Students
      </footer>
    </div>
  );
}