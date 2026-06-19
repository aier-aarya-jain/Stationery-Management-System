import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'http://localhost:8085/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401/403 and other errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Clear token and redirect if not already on login page
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        toast.error('Session expired or unauthorized access.');
        window.location.href = '/login';
      } else {
        // Show specific error on login/register
        if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Invalid credentials or unauthorized.');
        }
      }
    } else if (error.response && error.response.data) {
      if (error.response.data.message) {
        toast.error(error.response.data.message);
      } else if (typeof error.response.data === 'object' && Object.keys(error.response.data).length > 0) {
        if (error.response.data.error && error.response.data.status) {
          // It's a standard Spring Boot error payload
          toast.error(error.response.data.error === 'Service Unavailable' ? 'Service is temporarily unavailable, please try again.' : 'An unexpected error occurred.');
        } else {
          // Handle validation errors returned as { field: "error message" }
          const firstError = Object.values(error.response.data)[0];
          toast.error(firstError);
        }
      } else {
        toast.error('An unexpected error occurred.');
      }
    } else {
      toast.error('An unexpected error occurred. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default api;
