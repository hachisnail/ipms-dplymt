import React, { useState } from 'react';
import BenefitsImage from './Images/Benefits.png'; // Correct path to the image
import EligibilityImage from './Images/Eligibility.png';
import ProtectionImage from './Images/Protection.png';
import Copyrightguidepdf from './pdfguides/BCRR_Guidelines_No._2025-01_v2.pdf'
import './Examguide.css'; // Importing the CSS file

const Copyrightguide = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1,
      title: 'Benefits',
      image: BenefitsImage, // Use the imported image
      description: 'What are the benefits of Applying for Copyright?',
      popupContent: 'Creators of copyright-protected works have exclusive rights to use their creations and can authorize or prohibit various activities, including reproduction in any form, public performance, broadcasting, translation, and adaptations, such as converting a novel into a screenplay..',
    },
    {
      id: 2,
      title: 'Eligibility',
      image: EligibilityImage,
      description: 'What types of works can be deposited with IPOPHIL for copyright protection?',
      popupContent: 'Works covered by copyright that can be deposited with IPOPHL are, but are not limited to: novels, poems, plays, reference works, newspapers, advertisements, computer programs, databases, films, musical compositions, choreography, paintings, drawings, photographs, sculpture, architecture, maps and technical drawings.',
    },
    {
      id: 3,
      title: 'Term and Protection',
      image: ProtectionImage,
      description: 'What are the Term and Protection for Copyright?',
      popupContent: 'The term of protection for copyright in literary and artistic works, as well as derivative works, typically lasts for the lifetime of the author plus fifty years. However, this duration may vary based on specific circumstances, such as in the case of works of joint authorship, anonymous or pseudonymous works, photographic works, applied art, and audio-visual works, which may be governed by different rules regarding the length of protection.',
    },
  ];

  const tableData = [
    {
      title: 'Copyright Registration and Recordation Guidelines',
      description: 'These guidelines outline the official procedures and requirements for formally registering a work of authorship with a government office (like the U.S. Copyright Office) and for recording transfers of ownership (such as assignments or licenses) of existing copyrights.',
      pdfUrl: 'Copyrightguidepdf',
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

export default Copyrightguide;