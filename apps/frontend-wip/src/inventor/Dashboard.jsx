// Dashboard.jsx
// ✅ THIS FILE IS ALREADY CORRECT - NO CHANGES NEEDED!

import './Dashboard.css'; 
import Tracker from './Tracker';
import Portfolio from './Portfolio';

function Dashboard() {
    return (
        <>
        <section className="dashboard section">
          <div className="row">
            <div className="col-lg-8">
                <div className="row">
                  <Portfolio/>
                </div>
            </div>
            <div className='col-lg-4'>
              <Tracker/>
            </div>
          </div>
        </section>         
        </>
    );
}

export default Dashboard;