import React from 'react'
import './Page.css'
import { CONTACT_INFO } from '../utils'

function Contact() {
  return (
    <div className="page">
      <h2>Contact Page</h2>
      <p>This is the Contact page, also loaded lazily.</p>
      <p>Each page component is split into separate chunks for better performance.</p>
      <div className="contact-info">
        <h3>Contact Information:</h3>
        <p>📧 Email: {CONTACT_INFO.email}</p>
        <p>🌐 Website: {CONTACT_INFO.website}</p>
        <p>📦 NPM: {CONTACT_INFO.npm}</p>
      </div>
    </div>
  )
}

export default Contact
