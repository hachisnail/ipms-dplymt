import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/main2.css'

const DesignNav = () => {
  return (
    <div className="preview-nav">
      <h3>🎨 Design Preview:</h3>
      <Link to="/login" className="preview-nav-link">
        🔑 Login
      </Link>
      <Link to="/signup" className="preview-nav-link">
        📝 Sign Up
      </Link>
      <Link to="/about" className="preview-nav-link">
        📖 About IPMS
      </Link>
      <div className="preview-mode-badge">
        💡 Preview Mode (No Backend Needed)
      </div>
    </div>
  )
}

export default DesignNav