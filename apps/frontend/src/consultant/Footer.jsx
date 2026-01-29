import'./Footer.css'; 
function Footer() {
  return (
    <footer id='footer' className="footer">
        <div className="copyright">
            &copy; Copyright {''}
            <strong>
                <span>Intellectual Property Management System</span>
            </strong>
            . All Rights Reserved
        </div>
        <div className="credits">
            Designed by <a href='#'>BSIS-4B</a>
        </div>
    </footer>
  )
}

export default Footer