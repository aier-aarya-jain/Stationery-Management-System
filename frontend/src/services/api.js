/**
 * api.js — Axios HTTP Client for Backend Communication
 *
 * Purpose:
 * Creates a pre-configured Axios instance for all API calls from the frontend
 * to the backend API Gateway. Centralises base URL and authentication header
 * injection so individual pages/components do not need to handle these concerns.
 *
 * Base URL:
 * All requests go to http://localhost:8085/api — the API Gateway's entry point.
 * The gateway routes requests to the appropriate microservice:
 *   /api/auth/**      → auth-service
 *   /api/inventory/** → inventory-service
 *   /api/requests/**  → request-service
 *
 * JWT Injection:
 * A request interceptor automatically attaches the JWT from localStorage
 * to the Authorization header of every outgoing request.
 * This means authenticated API calls work without any extra setup in components.
 *
 * Usage:
 * import api from '../services/api';
 * const res = await api.get('/inventory');
 * const res = await api.post('/requests', payload);
 */

import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * All API calls in the application use this instance.
 */
const api = axios.create({
  baseURL: 'http://localhost:8085/api',
});

/**
 * Request interceptor — attaches JWT Bearer token to every request.
 *
 * If no token exists in localStorage (unauthenticated), the header is
 * not set and the request proceeds without authentication.
 * The API Gateway or downstream services will reject protected endpoints
 * with 401 Unauthorized in that case.
 *
 * Security Note:
 * localStorage is used for token storage for simplicity in this context.
 * In higher-security applications, HttpOnly cookies would be preferred
 * to mitigate XSS-based token theft.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
