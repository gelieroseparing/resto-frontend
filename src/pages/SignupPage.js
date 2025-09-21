import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';   // ✅ use shared api
import backgroundImage from '../assets/images/Background.jpg';

export default function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirm: '', position: 'cashier' });
  const [msg, setMsg] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setMsg('');
    if (!form.username || !form.password || !form.confirm) {
      return setMsg('All fields are required');
    }
    if (form.password !== form.confirm) {
      return setMsg('Passwords do not match');
    }
    try {
      await api.post('/auth/signup', {   // ✅ use api instance
        username: form.username,
        password: form.password,
        position: form.position,
      });
      setMsg('Account created! Redirecting...');
      setTimeout(() => nav('/login'), 1500);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div style={{
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
      <div style={{
        background: 'linear-gradient(135deg, #ffffff, #f0f4f8)',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        maxWidth: 380,
        width: '100%',
      }}>
        <h2 style={{
          marginBottom: '1.5rem',
          fontSize: '2rem',
          fontWeight: 700,
          color: '#e546b5ff',
          letterSpacing: 1,
        }}>Create Your Account</h2>
        {msg && <p style={{ color: msg.includes('created') ? '#16a34a' : '#ef4444', marginBottom: 12, fontWeight: 600 }}>{msg}</p>}
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handle}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '1rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <select
          name="position"
          value={form.position}
          onChange={handle}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '1rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem',
            outline: 'none',
            backgroundColor: '#fff',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          <option value="cashier">Cashier</option>
          <option value="chef">Chef</option>
          <option value="staff">Staff</option>
        </select>
        <input
          type="password"
          placeholder="Password"
          name="password"
          value={form.password}
          onChange={handle}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '1rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          name="confirm"
          value={form.confirm}
          onChange={handle}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          onClick={submit}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #e666eaff, #a24b9cff)',
            color: '#fff',
            fontSize: '1.1rem',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(63, 81, 181, 0.2)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 6px 20px rgba(63, 81, 181, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(63, 81, 181, 0.2)';
          }}
        >
          Create Account
        </button>
        <div style={{ marginTop: '1.2rem', fontSize: '0.95rem', color: '#555', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#d850b2ff', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
