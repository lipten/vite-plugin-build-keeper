import React from 'react'
import './Page.css'
import { FEATURES } from '../utils'

function Home() {
  return (
    <div className="page">
      <h2>Home Page</h2>
      <p>Welcome to the Vite Plugin Build Keeper example!</p>
      <p>This page demonstrates lazy loading and code splitting.</p>
      <div className="feature-list">
        <h3>Features:</h3>
        <ul>
          {FEATURES.map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Home
