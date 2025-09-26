import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // your shared API
import backgroundImage from '../assets/images/Background.jpg';

export default function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirm: '', position: 'cashier' });
  const [msg, setMsg] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const handle = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };
  const submit = async () => {
    setMsg('');
    if (!form.username || !form.password || !form.confirm) {
      return setMsg('All fields are required');
    }
    if (form.password !== form.confirm) {
      return setMsg('Passwords do not match');
    }
    const data = new FormData();
    data.append('username', form.username);
    data.append('password', form.password);
    data.append('position', form.position);
    if (profileImage) data.append('profileImage', profileImage);
    try {
      const response = await api.post('/auth/signup', data);
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

  return (
    <div style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 400,
        width: '90%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '2rem',
        borderRadius: '15px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#e546b5ff', fontSize: '2rem', fontWeight: 700 }}>
          Create Your Account
        </h2>
        {msg && (
          <p style={{ textAlign: 'center', color: msg.includes('failed') ? '#ef4444' : '#16a34a', fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
            {msg}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }}
            type="text"
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handle}
          />
          <input
            style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }}
            type="password"
            placeholder="Password"
            name="password"
            value={form.password}
            onChange={handle}
          />
          <input
            style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }}
            type="password"
            placeholder="Confirm Password"
            name="confirm"
            value={form.confirm}
            onChange={handle}
          />
          <select
            style={{ ...{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' } }}
            name="position"
            value={form.position}
            onChange={handle}
          >
            <option value="cashier">Cashier</option>
            <option value="chef">Chef</option>
            <option value="staff">Staff</option>
          </select>
          {/* Profile Image Upload */}
          <div style={{ marginBottom: 15, marginTop: 15, textAlign: 'center' }}>
            <label style={{ cursor: 'pointer', color: '#e75480', fontWeight: 'bold' }}>Upload Profile Image</label>
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'block', marginTop: 8, marginLeft: 'auto', marginRight: 'auto' }} />
          </div>
          {/* Submit Button */}
          <button
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #e546daff, #f63babff)',
              color: '#fff',
              fontSize: '1.1rem',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(63, 81, 181, 0.2)',
              transition: 'all 0.3s',
            }}
            onClick={submit}
          >
            Sign Up
          </button>
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: '#e546b5ff', textDecoration: 'underline' }}>Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}