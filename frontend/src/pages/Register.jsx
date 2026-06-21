import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

// Basic function component for Registration page
const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ROLE_STUDENT'
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Basic function to handle form input changes
  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // Basic function to handle registration submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      const response = await api.post('/auth/register', payload);
      const { token, refreshToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      toast.success('Account Created Successfully! Welcome aboard.');
      
      const decoded = jwtDecode(token);
      if (decoded.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (error) {}
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <motion.div 
          className="glass-panel auth-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: '480px' }}
        >
          <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join the system today.</p>

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" name="fullName"
                className="input-field" placeholder="John Doe"
                value={formData.fullName} onChange={handleChange} required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" name="email"
                className="input-field" placeholder="student@college.edu"
                value={formData.email} onChange={handleChange} required
              />
            </div>

            <div className="input-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input 
                type={showPassword ? 'text' : 'password'} name="password"
                className="input-field" placeholder="••••••••"
                value={formData.password} onChange={handleChange} required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '2.1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input 
                type={showPassword ? 'text' : 'password'} name="confirmPassword"
                className="input-field" placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange} required
              />
            </div>

            <div className="input-group">
              <label>Role</label>
              <select name="role" className="input-field" value={formData.role} onChange={handleChange}>
                <option value="ROLE_STUDENT">Student</option>
                <option value="ROLE_ADMIN">Administrator</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Register</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-indigo)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </motion.div>
      </div>

      <div className="auth-illustration">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '1rem' }}>Get Started</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>Register to request supplies instantly.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
