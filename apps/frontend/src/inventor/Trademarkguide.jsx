import React, { useState } from 'react';
import BenefitsImage from './Images/Benefits.png';
import EligibilityImage from './Images/Eligibility.png';
import ProtectionImage from './Images/Protection.png';
import Part1Industrialguidepdf from './pdfguides/ASEAN-GUIDELINESExaminationMarksABSOLUTE-Part1.pdf';
import Part2Industrialguidepdf from './pdfguides/ASEAN-GUIDELINESExaminationMarksRELATIVE-Part2.pdf';
import './Examguide.css';

const Trademarkguide = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1, 
      title: 'Benefits',
      image: BenefitsImage,
      description: 'What are the benefits of Applying for Trademark?',
      popupContent: 'A trademark safeguards a business brand identity, granting the owner exclusive rights to prevent others from using it. Beyond serving as a source identifier and quality indicator, a trademark can generate additional income through licensing or franchising.',
    },
    {
      id: 2,
      title: 'Eligibility',
      image: EligibilityImage,
      description: 'What are the eligibility criteria for trademark registration?',
      popupContent: 'Eligibility for trademark registration based on IPOPHIL guidelines includes several key criteria. First, the mark must possess distinctiveness, meaning it can effectively distinguish the goods or services of one business from those of others. It should not be generic or merely descriptive of the products or services it represents. Additionally, the mark must be non-deceptive, ensuring it does not mislead consumers about the nature or quality of the goods or services. Furthermore, it should not conflict with existing registered marks, meaning it cannot be identical or confusingly similar to them. Lastly, the mark must comply with all applicable laws and public policy. These criteria collectively ensure that trademarks protect brand identity while safeguarding consumer interests.',
    },
    {
      id: 3,
      title: 'Term and Protection',
      image: ProtectionImage,
      description: 'What are the Term and Protection for Trademark?',
      popupContent: 'A trademark can be protected in perpetuity if regularly monitored and properly maintained. The period of protection is ten (10) years from the date of registration and is renewable for a period of ten (10) years at a time.',
      pdfUrl: '',
    },
  ];
  
  const tableData = [
    {
      title: 'ASEAN GUIDELINES - Examination of Marks (ABSOLUTE) - Part 1',
      description: 'Common guidelines for the substantive examination of trademarks focusing on absolute grounds for refusal. This guide provides comprehensive standards for evaluating trademark applications.',
      pdfUrl: Part1Industrialguidepdf,
    },
    {
      title: 'ASEAN GUIDELINES - Examination of Marks (RELATIVE) - Part 2',
      description: 'Common guidelines for the substantive examination of trademarks focusing on relative grounds for refusal and comparative assessment with existing marks.',
      pdfUrl: Part2Industrialguidepdf,
    },
  ];

  const handleOpenPopup = (content) => {
    setSelectedCard(content);
  };

  const handleClosePopup = () => {
    setSelectedCard(null);
  };

  return (
    <div className="container">
      <div className="card-container">
        {cards.map(card => (
          <div key={card.id} className="card">
            <img src={card.image} alt={card.title} />
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <button className="view-btn" onClick={() => handleOpenPopup(card.popupContent)}>Click Me!</button>
          </div>
        ))}
      </div>
      {selectedCard && (
        <div className="popup">
          <div className="popup-content">
            <span className="close" onClick={handleClosePopup}>&times;</span>
            <h2 style={{ textAlign: 'center' }}>Details</h2>
            <p style={{ textAlign: 'center' }}>{selectedCard}</p>
          </div>
        </div>
      )}
      <table className="examination-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>View Guide</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((item, index) => (
            <tr key={index}>
              <td>{item.title}</td>
              <td>{item.description}</td>
              <td>
                <button 
                  className="view-btn" 
                  onClick={() => window.open(item.pdfUrl, '_blank')}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Trademarkguide;