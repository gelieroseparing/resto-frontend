import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MenuPage from './pages/MenuPage';           // Home
import CategoryPage from './pages/CategoryPage';
import OrderPage from './pages/OrderPage';
import HistoryTransaction from './pages/HistoryTransaction';
import ProfilePage from './pages/ProfilePage';
import SettingPage from './pages/SettingPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // ✅ Keep localStorage in sync when token or user changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [token, user]);

  // ✅ Logout clears both state and storage
  const logout = () => { 
    setToken(''); 
    setUser(null); 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, logout }}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route path="/add" element={<Protected><MenuPage /></Protected>} />
          <Route path="/category/:name" element={<Protected><CategoryPage /></Protected>} />
          <Route path="/order" element={<Protected><OrderPage /></Protected>} />
          <Route path="/history" element={<Protected><HistoryTransaction /></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/settingpage" element={<Protected><SettingPage /></Protected>} />
          <Route path="/home" element={<Protected><HomePage /></Protected>} />
          <Route path="/about" element={<Protected><AboutPage /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}
