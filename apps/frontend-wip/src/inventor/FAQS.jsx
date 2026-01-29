import React, { useState, useMemo } from 'react';
import './FAQS.css';

// ✅ WRAPPER COMPONENT WITH BOOTSTRAP GRID FOR CENTERING
export function FAQSSection() {
    return (
        <section className="faqs section">
            <div className="container">
                <div className="row">
                    <div className='col-lg-10 offset-lg-1'>
                        <IPMSFaqs/>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function IPMSFaqs() {
  const [search, setSearch] = useState('');
  const [openSet, setOpenSet] = useState(new Set());
  
  const faqData = useMemo(() => [
    {
      category: 'Submission and IP Scope',
      faqs: [
        { 
          question: 'What types of IP can I submit through the system?', 
          answer: 'You can submit applications for Industrial Design, Copyright, Trademark, and Utility Model.' 
        },
        { 
          question: 'How do I submit a new invention or creative work?', 
          answer: 'The system uses downloadable forms and a dedicated Submission Portal for each IP category. You must download, fill out, and upload the completed form.' 
        },
        { 
          question: 'Can I file a full Patent application using this system?', 
          answer: 'No, the IPMS expressly excludes the management of full Patent applications.' 
        },
        { 
          question: 'Can I register my IP online directly within the system?', 
          answer: 'No, the system does not function as an online registration platform. It is a management system that utilizes downloadable forms for submission.' 
        },
        { 
          question: 'Can I renew an existing IP through the IPMS?', 
          answer: 'No, the system focuses exclusively on new submissions, which restricts its application to renewal processes.' 
        },
        { 
          question: 'What file formats are supported for my submissions?', 
          answer: 'The system supports a restricted range of file formats, requiring users to convert files before uploading.' 
        },
      ],
    },
    {
      category: 'Review, Tracking, and Communication',
      faqs: [
        { 
          question: 'How long should I expect the submission review process to take?', 
          answer: 'The submission review process is expected to take 3–5 months. It relies on manual review by IPMO personnel.' 
        },
        { 
          question: 'How do I check the status of my submitted application?', 
          answer: 'The system features a centralized case management module that tracks submissions. Both consultants and inventors can get real-time status updates.' 
        },
        { 
          question: 'Where is all the IP information stored?', 
          answer: 'The system provides a centralized database for storing all intellectual property information.' 
        },
        { 
          question: 'How do I communicate with the IPMO staff or my Consultant?', 
          answer: 'Communication is enhanced through integrated messaging and notification features. Inventors can communicate directly with office staff.' 
        },
        { 
          question: 'I am a Consultant, what is my main function in the system?', 
          answer: 'Your crucial role is reviewing and validating invention submissions from CNSC inventors, ensuring each idea is thoroughly assessed.' 
        },
      ],
    },
    {
      category: 'System Limitations and Access',
      faqs: [
        { 
          question: 'Will there be a dedicated mobile app for the IPMS?', 
          answer: 'While the system is designed to be mobile-friendly, it does not currently have a dedicated mobile application.' 
        },
        { 
          question: 'Are there advanced features for generating custom reports or analytics?', 
          answer: 'Reporting capabilities are limited to basic functions and do not include advanced analytics or custom report generation.' 
        },
      ],
    },
  ], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqData;
    return faqData
      .map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(
          f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.faqs.length > 0);
  }, [search, faqData]);

  const toggle = (cIdx, iIdx) => {
    const key = `${cIdx}-${iIdx}`;
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h2>IPMS Frequently Asked Questions</h2>
        <div className="faq-controls">
          <input
            aria-label="Search FAQs"
            className="faq-search"
            placeholder="Search questions or answers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 && <div className="faq-empty">No results found for "{search}".</div>}

      {filtered.map((cat, cIdx) => (
        <div key={cat.category} className="faq-category">
          <div className="faq-category-row">
            <h3 className="faq-category-title">{cat.category}</h3>
            {/* Toggle button removed from here */}
          </div>

          <div className="accordion" role="presentation">
            {cat.faqs.map((faq, iIdx) => {
              const key = `${cIdx}-${iIdx}`;
              const isOpen = openSet.has(key);
              return (
                <div key={key} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    onClick={() => toggle(cIdx, iIdx)}
                  >
                    <span className="faq-q-text">{faq.question}</span>
                    <span className="faq-q-state">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer" role="region">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}