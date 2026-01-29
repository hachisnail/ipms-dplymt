import React, { useState } from 'react';
import BenefitsImage from './Images/Benefits.png'; // Correct path to the image
import EligibilityImage from './Images/Eligibility.png';
import ProtectionImage from './Images/Protection.png';
import Industrialguidepdf from './pdfguides/IDED INTERIM GUIDELINES IN NOVELTY EXAMINATION.pdf';
import './Examguide.css'; // Importing the CSS file

const Industrialdesignguide = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1, 
      title: 'Benefits',
      image: BenefitsImage, // Use the imported image
      description: 'What are the benefits of Applying for Trademark?',
      popupContent: 'The owner of a registered industrial design has the right to prevent third parties from making, selling or importing articles bearing or embodying a design which is a copy, or substantially a copy, of the protected design, when such acts are undertaken for commercial purposes.',
    },
    {
      id: 2,
      title: 'Eligibility',
      image: EligibilityImage,
      description: 'What are the three patentability criteria under the Philippine IP Code?',
      popupContent: 'In order to be registrable, an industrial design must be a new or original creation. The following industrial designs shall not be registrable: (a) Industrial designs that are dictated essentially by technical or functional considerations to obtain a technical result; (b) Industrial designs which are mere schemes of surface ornamentations existing separately from the industrial product or handicraft; and (c) Industrial designs which are contrary to public order, health, or morals..',
    },
    {
      id: 3,
      title: 'Term and Protection',
      image: ProtectionImage,
      description: 'What are the Term and Protection of Industrial Design ?',
      popupContent: 'A trademark can be protected in perpetuity if regularly monitored and properly maintained.The period of protection is ten (10) years from the date of registration and is renewable for a period of ten (10) years at a time.',
      pdfUrl: '',
    },
  ];
  
  const tableData = [
    {
      title: 'IDED INTERIM GUIDELINES IN NOVELTY EXAMINATION',
      description: 'The IDED Interim Guidelines in Novelty Examination establish a standardized framework for evaluating the originality of inventions. They emphasize thorough research and documentation, ensuring consistent and high-quality novelty assessments. These guidelines aim to enhance innovation and protect intellectual property rights.',
      pdfUrl: Industrialguidepdf,
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

export default Industrialdesignguide;