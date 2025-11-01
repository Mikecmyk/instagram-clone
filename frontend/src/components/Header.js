import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/logout/', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
      window.location.reload(); // Refresh to update like buttons
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">Instagram</div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <span style={{ color: '#262626', marginLeft: '20px' }}>
                Welcome, {user.username}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#262626',
                  cursor: 'pointer',
                  marginLeft: '20px',
                  fontSize: '14px'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;