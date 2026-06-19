import { useState, useEffect } from 'react';
import api from '../services/api';

const badge = (s) => {
  const cls = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected', FULFILLED: 'badge-fulfilled' };
  const icon = { PENDING: '⏳', APPROVED: '✅', REJECTED: '❌', FULFILLED: '📦' };
  return <span className={`badge ${cls[s]}`}>{icon[s]} {s}</span>;
};

export default function StudentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    api.get('/requests/me?page=0&size=100')
      .then(r => setRequests(r.data.content || []))
      .finally(() => setLoading(false));
  }, []);

  const shown = (filter === 'ALL' ? requests : requests.filter(r => r.status === filter)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const paginatedShown = shown.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <h1>📄 My Requests</h1>
        <p>Track your stationery request history.</p>
      </div>

      <div className="toolbar">
        {['ALL','PENDING','APPROVED','REJECTED','FULFILLED'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary-student' : 'btn-ghost'}`} onClick={() => { setFilter(s); setPage(1); }}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div>
          : shown.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📭</div><p>No requests found.</p></div>
          : <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Items</th><th>Status</th><th>Date & Time</th><th></th></tr></thead>
                <tbody>
                  {paginatedShown.map(r => (
                    <tr key={r.requestId}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{r.requestId}</td>
                      <td>{r.items?.length} item(s)</td>
                      <td>{badge(r.status)}</td>
                      <td style={{ fontSize: 12 }}>{new Date(r.createdAt + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(shown.length / itemsPerPage) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', alignItems: 'center', padding: '0 16px 16px' }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span style={{ fontSize: '13px' }}>Page {page} of {Math.ceil(shown.length / itemsPerPage)}</span>
                <button className="btn btn-ghost btn-sm" disabled={page === Math.ceil(shown.length / itemsPerPage)} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
        }
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Details</h2>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, marginBottom: 8 }}>Status: {badge(detail.status)}</p>
            {detail.rejectionReason && <div className="alert alert-error" style={{ marginBottom: 12 }}>Rejected: {detail.rejectionReason}</div>}
            <ul className="request-items-list">
              {detail.items?.map((item, i) => (
                <li key={i}><span>Item ID: {item.itemId}</span><span className="badge badge-student">× {item.quantity}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
