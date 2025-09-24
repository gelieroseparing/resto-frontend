import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Your shared API instance
import backgroundImage from '../assets/images/Background.jpg';

export default function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirm: '', position: 'cashier' });
  const [msg, setMsg] = useState('');

  const handle = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async () => {
    setMsg(''); // Clear previous messages

    // Basic validation
    if (!form.username || !form.password || !form.confirm) {
      return setMsg('All fields are required');
    }
    if (form.password !== form.confirm) {
      return setMsg('Passwords do not match');
    }

    try {
      const response = await api.post('/signup', form);
      if (response.status === 201) {
        setMsg('Signup successful! Redirecting...');
        setTimeout(() => {
          nav('/login');
        }, 1500);
      } else {
        setMsg(`Signup failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      setMsg(`Signup failed: ${error.response?.data?.message || error.message || 'An error occurred'}`);
    }
  };

  // Inline styles
  const containerStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const formBoxStyle = {
    maxWidth: '400px',
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '2rem',
    borderRadius: '15px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#e546b5ff',
    fontSize: '2rem',
    fontWeight: 700,
  };

  const msgStyle = {
    textAlign: 'center',
    color: msg.includes('failed') ? '#ef4444' : '#16a34a',
    fontWeight: 600,
    marginBottom: '1rem',
    fontSize: '1rem',
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  };

  const selectStyle = {
    ...inputStyle,
    backgroundColor: '#fff',
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#e546b5ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h2 style={titleStyle}>Create Your Account</h2>
        {msg && (
          <p style={msgStyle}>{msg}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handle}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            name="password"
            value={form.password}
            onChange={handle}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Confirm Password"
            name="confirm"
            value={form.confirm}
            onChange={handle}
          />
          <select
            style={selectStyle}
            name="position"
            value={form.position}
            onChange={handle}
          >
            <option value="cashier">Cashier</option>
            <option value="chef">Chef</option>
            <option value="staff">Staff</option>
          </select>
          <button
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
            onClick={submit}
          >
            Sign Up
          </button>
        </div>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#e546b5ff', textDecoration: 'underline' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}