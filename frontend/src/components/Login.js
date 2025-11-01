import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Function to get CSRF token
  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('🔍 LOGIN DEBUG:');
    console.log('Username:', username);
    console.log('Password:', '[HIDDEN]');
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/posts/auth/login/', {
        username,
        password
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        }
      });
      
      console.log('✅ LOGIN SUCCESS:', response.data);
      
      localStorage.setItem('user', JSON.stringify(response.data));
      alert('Login successful!');
      navigate('/');
      
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      alert('Login failed! Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/posts/auth/register/', {
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'demopass123',
        password2: 'demopass123'
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        }
      });
      alert('Demo user created! You can now login with username: demo_user, password: demopass123');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.status === 400) {
        alert('User might already exist. Try logging in with: demo_user / demopass123');
      } else {
        alert('Registration failed!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Instagram</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p>Don't have an account? <button onClick={handleRegister} style={{background: 'none', border: 'none', color: '#0095f6', cursor: 'pointer', fontWeight: '600'}}>Create demo user</button></p>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#8e8e8e' }}>
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: demo_user</p>
          <p>Password: demopass123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;