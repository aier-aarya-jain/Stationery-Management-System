/**
 * AuthContext.jsx
 *
 * Global authentication context for the React frontend.
 *
 * Purpose:
 * Provides authentication state (current user, role) and actions
 * (login, register, logout) to any component in the application
 * via React Context API — no prop drilling required.
 *
 * State:
 * - user    : { email, role } decoded from JWT, or null if not authenticated
 * - loading : true while the app checks localStorage for an existing token on startup
 *
 * Token Storage:
 * JWT is persisted in localStorage under the key "token".
 * On app load, the token is decoded and validated (expiry check) to restore session.
 * Expired tokens are automatically removed.
 *
 * Security:
 * The role stored in user state is decoded from the JWT payload (not trusted user input).
 * The JWT is signed by the auth-service and cannot be tampered with without invalidating
 * the signature — so role-based UI decisions based on decoded role are reliable.
 *
 * API Interactions:
 * - POST /auth/login    → receives { token, email, role }
 * - POST /auth/register → receives { token, email, role }
 *
 * Usage:
 * const { user, login, logout } = useContext(AuthContext);
 */

import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

/**
 * AuthProvider — Context provider component.
 *
 * Wraps the entire application (in main.jsx) to make auth state globally available.
 * Children are not rendered until the initial token check completes (loading = false)
 * to prevent protected routes from flashing before the auth state is known.
 *
 * Props:
 * - children: React node tree to render once auth state is resolved
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Prevents flash of unauthenticated UI while the stored token is being validated
  const [loading, setLoading] = useState(true);

  /**
   * On mount, check localStorage for an existing JWT token.
   * If found and valid (not expired), restore the user session.
   * If expired or malformed, clear the token and stay logged out.
   *
   * This allows users to remain logged in across browser refreshes
   * for the duration of the token's validity period.
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);

        // JWT expiry is in seconds; Date.now() is in milliseconds
        if (decoded.exp * 1000 < Date.now()) {
          // Token has expired — clean up and force re-login
          localStorage.removeItem('token');
        } else {
          // Valid token — restore session from decoded payload
          setUser({ email: decoded.sub, role: decoded.role });
        }
      } catch (err) {
        // Malformed token — remove it to prevent future errors
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Authenticates the user with email and password.
   * Stores the returned JWT in localStorage and updates user state.
   *
   * @param {string} email    User's email address
   * @param {string} password User's plaintext password (sent over HTTPS)
   * @throws API error if credentials are invalid (handled by calling component)
   */
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, role } = res.data;
    localStorage.setItem('token', token);
    setUser({ email, role });
  };

  /**
   * Registers a new user and automatically logs them in.
   * Stores the returned JWT and updates user state.
   *
   * @param {Object} userData { email, password, fullName, role }
   * @throws API error if email is already taken (handled by calling component)
   */
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, email, role } = res.data;
    localStorage.setItem('token', token);
    setUser({ email, role });
  };

  /**
   * Logs the user out by clearing the JWT from storage and resetting state.
   * The calling component is responsible for redirecting to /login.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {/* Delay rendering children until auth state is resolved to prevent route flickering */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
