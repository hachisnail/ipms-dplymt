import './Contact.css'
import florVegaImg from './Images/Flor Vega.jpg';
import ailynDeLarosaImg from './Images/Ailyn De Larosa.jpg';
import ipmo from './Images/ipmo logo.png';
import cirilo from './Images/cirilo.jpg';

// Team member data
const teamMembers = [
    {
        id: 1,
        name: 'Engr. Floradelle A. Vega',
        position: 'IPMO Director',
        // Using the imported variable
        image: florVegaImg, 
        contacts: {
            email: 'ipmo@cnsc.edu.ph',
            phone: '+1 123 456 7890',
            linkedin: 'https://linkedin.com/in/johndoe'
        }
    },
    {
        id: 2,
        name: 'Engr.Cirilo J. Castro',
        position: 'IP Specialist',
        // Using the imported variable
        image: cirilo, 
        contacts: {
            email: 'ipmo@cnsc.edu.ph',
            phone: '+1 987 654 3210',
            linkedin: 'https://linkedin.com/in/janesmith'
        }
    },
    
     {
        id: 3,
        name: 'Maria Ailyn S. De Larosa, LPT',
        position: 'Project Technical Assistant III',
        // Using the imported variable
        image: ailynDeLarosaImg, 
        contacts: {
            email: 'ipmo@cnsc.edu.ph',
            phone: '+1 987 654 3210',
            linkedin: 'https://linkedin.com/in/janesmith'
        }
    },
     
     {
        id: 4,
        name: 'Intellectual Property Management Office',
        position: 'Official IPMO Page',
        // Using the imported variable
        image: ipmo, 
        contacts: {
            email: 'ipmo@cnsc.edu.ph',
            phone: '+1 987 654 3210',
            linkedin: 'https://linkedin.com/in/janesmith'
        }
    },
];

const Contact = () => {
    return (
        <>
            <div className="contact-container">
                <h1>IP Management Office Team</h1>
                <p className="contact-description">
                    Reach out to our dedicated team members for assistance with copyright inquiries and services.
                </p>
                <div className="contact-card-list">
                    {teamMembers.map(member => (
                        <div key={member.id} className="contact-card">
                            <img 
                                src={member.image} 
                                alt={member.name} 
                                // Fallback ensures an image is always shown, even if the import fails.
                                onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src="https://placehold.co/80x80/A0A0A0/FFFFFF?text=IMG" 
                                }}
                            />
                            <h3>{member.name}</h3>
                            <p className="contact-position">{member.position}</p>
                            <div className="contact-details">
                                <p>
                                    <i className="bi bi-envelope-fill contact-icon"></i> 
                                    <a href={`mailto:${member.contacts.email}`}>{member.contacts.email}</a>
                                </p>
                                <p>
                                    <i className="bi bi-telephone-fill contact-icon"></i> 
                                    <a href={`tel:${member.contacts.phone}`}>{member.contacts.phone}</a>
                                </p>
                                {member.contacts.facebook && (
                                    <p>
                                        <i className="bi bi-linkedin contact-icon"></i> 
                                        <a href={member.contacts.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
export default Contact;