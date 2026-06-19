import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Main application navigation bar.
 */
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)'}}>
      <h2 style={{margin:0, color: 'var(--accent-primary)'}}>StationeryHub</h2>
      <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
        <Link to="/dashboard" style={{color: 'var(--text-primary)', textDecoration: 'none'}}>Dashboard</Link>
        <Link to="/inventory" style={{color: 'var(--text-primary)', textDecoration: 'none'}}>Inventory</Link>
        <Link to="/requests" style={{color: 'var(--text-primary)', textDecoration: 'none'}}>Requests</Link>
        <div style={{borderLeft: '1px solid var(--text-secondary)', paddingLeft: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{user.email} <span className={`badge badge-${user.role === 'ROLE_ADMIN' ? 'APPROVED' : 'PENDING'}`}>{user.role === 'ROLE_ADMIN' ? 'Admin' : 'Student'}</span></span>
          <button className="btn btn-danger" style={{padding: '0.4rem 1rem'}} onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
