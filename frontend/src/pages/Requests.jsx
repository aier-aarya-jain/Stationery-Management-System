import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

/**
 * Requests Page.
 * Students can view their history and submit new requests.
 * Admins can review all requests and approve/reject them.
 */
const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const { user } = useContext(AuthContext);

  const fetchRequests = async () => {
    try {
      const endpoint = user.role === 'ROLE_ADMIN' ? '/requests?size=100' : '/requests/me?size=100';
      const res = await api.get(endpoint);
      setRequests(res.data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve. Make sure stock is available.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/requests/${id}/reject?reason=Out of stock`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container">
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="page-title">{user.role === 'ROLE_ADMIN' ? 'All Requests' : 'My Requests'}</h1>
          <p style={{color: 'var(--text-secondary)'}}>Manage stationery requests workflows.</p>
        </div>
        {user.role === 'ROLE_STUDENT' && (
          <button className="btn btn-primary" onClick={() => alert('New Request feature coming soon!')}>+ New Request</button>
        )}
      </div>

      <div className="glass-panel table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Req ID</th>
              {user.role === 'ROLE_ADMIN' && <th>Student Email</th>}
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.requestId}>
                <td>#{req.requestId}</td>
                {user.role === 'ROLE_ADMIN' && <td>{req.studentEmail}</td>}
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                <td>
                  {user.role === 'ROLE_ADMIN' && req.status === 'PENDING' && (
                    <>
                      <button 
                        className="btn btn-primary" 
                        style={{padding: '0.25rem 0.5rem', marginRight: '0.5rem', opacity: processingId === req.requestId ? 0.5 : 1}} 
                        disabled={processingId === req.requestId}
                        onClick={() => handleApprove(req.requestId)}
                      >
                        {processingId === req.requestId ? '...' : 'Approve'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{padding: '0.25rem 0.5rem', opacity: processingId === req.requestId ? 0.5 : 1}} 
                        disabled={processingId === req.requestId}
                        onClick={() => handleReject(req.requestId)}
                      >
                        {processingId === req.requestId ? '...' : 'Reject'}
                      </button>
                    </>
                  )}
                  {req.status === 'APPROVED' && user.role === 'ROLE_ADMIN' && (
                     <button className="btn" style={{padding: '0.25rem 0.5rem', background: 'var(--success)', color: 'white'}}>Fulfill</button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Requests;
