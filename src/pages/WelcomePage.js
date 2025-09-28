import React from 'react';
import { useNavigate } from 'react-router-dom';

import backgroundImage from '../assets/images/Background.jpg';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            fontFamily: "'Poppins', sans-serif",
          }}>
      <div
        style={{
          background: 'rgba(230, 230, 230, 0.95)',
          padding: '3rem 2.5rem',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(10, 10, 10, 0.15)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Title with custom font and gradient text */}
        <h1
          style={{
            fontSize: '2.5rem',
            background: 'linear-gradient(90deg, #e666eaff, #a24b9cff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            fontWeight: 700,
          }}
        >
          Welcome to Point On Sale & Inventory Management
          <br />
          <span style={{ fontSize: '1.8rem', opacity: 0.9 }}>Bits and Bites Resto</span>
        </h1>
        {/* Subtitle with softer color */}
        <p style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Embark on a delightful journey of flavors. Let's get started!
        </p>
        {/* Animated Button with hover effect */}
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #e666eaff, #a24b9cff)',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}