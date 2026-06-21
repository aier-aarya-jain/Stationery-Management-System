import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

// Basic function component for Login page
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Basic function to handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      const decoded = jwtDecode(token);
      toast.success('Login successful!');
      
      if (decoded.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (error) {
      // Error handled by interceptor or fallback
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-illustration">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '1rem' }}>Welcome Back!</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>Manage your stationery requests seamlessly with our intelligent dashboard.</p>
        </motion.div>
      </div>

      <div className="auth-form-wrapper">
        <motion.div 
          className="glass-panel auth-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Sign In</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Access your dashboard</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="student@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '2.1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" style={{ color: 'var(--primary-indigo)', textDecoration: 'none', fontWeight: '500' }}>Forgot Password?</a>
            </div>

            <button type="submit" className="btn-primary">Sign In</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-indigo)', fontWeight: '600', textDecoration: 'none' }}>Register</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
