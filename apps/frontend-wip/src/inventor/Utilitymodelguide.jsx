import React, { useState } from 'react';
import BenefitsImage from './Images/Benefits.png'; // Correct path to the image
import EligibilityImage from './Images/Eligibility.png';
import ProtectionImage from './Images/Protection.png';
import Industrialguidepdf from './pdfguides/IDED INTERIM GUIDELINES IN NOVELTY EXAMINATION.pdf';
import './Examguide.css';

const Utilitymodelguide = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1,
      title: 'Benefits',
      image: BenefitsImage, // Use the imported image
      description: 'What are the benefits of Applying for Utility Model?',
      popupContent: 'A Utility Model (UM) allows the right holder to prevent others from commercially using the registered UM without his authorization, provided that the UM is new based on the Registrability Report. Compared with invention patents, it is relatively inexpensive, faster to obtain, and with less stringent patentability requirements.',
    },
    {
      id: 2,
      title: 'Eligibility',
      image: EligibilityImage,
      description: 'What specific criteria must a technical solution meet to be considered eligible for registration as a utility model?',
      popupContent: 'Any new and industrially applicable technical solution to a problem is registrable as a utility model. However, certain inventions are non-registrable, including discoveries, scientific theories, mathematical methods, and methods for treatment of humans or animals. Additionally, schemes for performing mental acts, plant varieties, animal breeds, and aesthetic creations are excluded. The regulations also allow Congress to enact laws for the protection of plant varieties and animal breeds. Finally, anything contrary to public order or morality is not eligible for registration.',
    },
    {
      id: 3,
      title: 'Term and Protection',
      image: ProtectionImage,
      description: 'What are the Term and Protection for Utility Model?',
      popupContent: 'A utility model is entitled to seven (7) years of protection from the date of filing, with no possibility of renewal.',
      pdfUrl: '',
    },
  ];

  const tableData = [
    {
      title: 'INTERIM GUIDELINES FOR NOVELTY ASSESSMENT AND VISIBILITY REQUIREMENTS FOR INDUSTRIAL DESIGNS ',
      description: 'These Interim Guidelines establish the criteria for determining if an industrial design is new (novelty assessment) and what requirements must be met for its visual features to be considered adequately visible for protection.',
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

export default Utilitymodelguide;