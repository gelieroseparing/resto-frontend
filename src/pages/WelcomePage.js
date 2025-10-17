import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#790707ff',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Poppins', sans-serif",
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          borderRadius: '25px',
          padding: '3rem 3.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          color: '#fff',
          maxWidth: '480px',
          width: '100%',
          transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
        }}
      >
        {/* Logo-like Circle */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e666eaff, #a24b9cff)',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(255, 255, 255, 0.2)',
          }}
        >
          POS
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.8rem',
            marginBottom: '1rem',
            background: 'linear-gradient(90deg, #f6b0f8, #c173d9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700',
            lineHeight: 1.3,
          }}
        >
          Welcome to Point on Sale & Inventory Management
        </h1>

        {/* Subtitle */}
        <h2
          style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            color: '#f1f1f1',
            letterSpacing: '0.5px',
          }}
        >
          Bits and Bites Resto
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '1rem',
            color: '#e0e0e0',
            marginBottom: '2rem',
          }}
        >
          Manage your restaurant effortlessly — track sales, control inventory,
          and keep your business thriving!
        </p>

        {/* Button */}
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #e666eaff, #a24b9cff)',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 5px 15px rgba(226, 102, 234, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 8px 25px rgba(226, 102, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 5px 15px rgba(226, 102, 234, 0.3)';
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
