import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const Sidebar = ({ links }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const token = localStorage.getItem('token');
  let name = "User";
  let role = "";
  if (token) {
    try {
      const decoded = jwtDecode(token);
      name = decoded.sub || "User";
      role = decoded.role === 'ROLE_ADMIN' ? 'Administrator' : 'Student';
    } catch(e) {}
  }

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>StationeryHub</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Welcome, <br/><strong style={{color: 'var(--text-primary)'}}>{name}</strong>
          <br/><span style={{fontSize: '0.75rem', opacity: 0.8}}>{role}</span>
        </p>
      </div>

      <ul className="sidebar-menu">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <li key={link.path}>
              <button 
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                <Icon size={20} />
                {link.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 'auto' }}>
        <button className="sidebar-item" onClick={handleLogout} style={{ color: '#dc2626' }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
