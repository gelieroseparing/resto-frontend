import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import backgroundImage from '../assets/images/Background.jpg';

export default function LoginPage() {
  const nav = useNavigate();
  const { setToken, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setErr('');
    setLoading(true);

    if (!username || !password) {
      setErr('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/login', {
        username,
        password
      });

      if (res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user || { username });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user || { username }));

        nav('/home');
      } else {
        setErr('No token received from server');
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error.response) {
        if (error.response.status === 401) {
          setErr('Invalid username or password');
        } else {
          setErr(error.response.data?.message || 'Login failed. Please try again.');
        }
      } else if (error.request) {
        setErr('Network error. Please check if the server is running.');
      } else {
        setErr('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      login();
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
        backgroundColor: 'rgba(230, 230, 230, 0.92)',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        maxWidth: 380,
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <h2 style={{
          marginBottom: '1.5rem',
          fontSize: '2rem',
          fontWeight: 700,
          color: '#e546b5ff',
          letterSpacing: 1,
        }}>Login Your Account</h2>

        {err && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <FaExclamationTriangle />
            <span>{err}</span>
          </div>
        )}

        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Username
          </label>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          onClick={login}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #e546daff, #f63babff)',
            color: '#fff',
            fontSize: '1.1rem',
            border: 'none',
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(63, 81, 181, 0.2)',
            transition: 'all 0.3s',
            opacity: loading ? 0.8 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 6px 20px rgba(63, 81, 181, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(63, 81, 181, 0.2)';
            }
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <div style={{ marginTop: '1.2rem', fontSize: '0.95rem', color: '#555' }}>
          <span>No account? </span>
          <Link to="/signup" style={{ color: '#e546b3ff', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}