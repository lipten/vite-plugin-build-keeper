import React from 'react'
import './Page.css'

function About() {
  return (
    <div className="page">
      <h2>About Page</h2>
      <p>This is the About page, loaded lazily when needed.</p>
      <p>The vite-plugin-build-keeper helps manage build versions and preserve assets.</p>
      <div className="info-box">
        <h3>How it works:</h3>
        <ol>
          <li>Track build versions and file history</li>
          <li>Preserve assets from recent builds</li>
          <li>Clean up unused files automatically</li>
          <li>Prevent 404 errors during deployments</li>
        </ol>
      </div>
    </div>
  )
}

export default About
