import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

/**
 * Dashboard Page.
 * Greets the user and provides quick links based on their role.
 */
const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}>Welcome back, {user.email}!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Inventory Overview</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {user.role === 'ROLE_ADMIN' ? 'Manage stationery stock, view low stock alerts, and update the university catalog.' : 'Browse available stationery items and check current stock levels.'}
          </p>
          <Link to="/inventory" className="btn btn-primary" style={{textDecoration: 'none', display: 'inline-block'}}>View Inventory</Link>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Request Management</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {user.role === 'ROLE_ADMIN' ? 'Review pending requests, approve, reject, or mark them as fulfilled.' : 'Submit new stationery requests and track your request history.'}
          </p>
          <Link to="/requests" className="btn btn-primary" style={{textDecoration: 'none', display: 'inline-block'}}>Manage Requests</Link>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
