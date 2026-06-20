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
  const [inventoryMap, setInventoryMap] = useState({});
  const [sortBy, setSortBy] = useState('dateDesc');
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadRequests = () => {
    api.get('/requests/me?page=0&size=100')
      .then(r => setRequests(r.data.content || []))
      .finally(() => setLoading(false));
  };

  const loadInventory = async () => {
    try {
      const res = await api.get('/inventory?page=0&size=1000');
      const map = {};
      res.data.content.forEach(i => map[i.id] = i.name);
      setInventoryMap(map);
    } catch { console.error('Failed to load inventory for mapping'); }
  };

  useEffect(() => {
    loadRequests();
    loadInventory();
  }, []);

  const shown = (filter === 'ALL' ? requests : requests.filter(r => r.status === filter)).sort((a, b) => {
    if (sortBy === 'dateDesc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'dateAsc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'status') {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
      return a.status.localeCompare(b.status);
    } else if (sortBy === 'itemName') {
      const nameA = a.items && a.items.length > 0 ? (inventoryMap[a.items[0].itemId] || '') : '';
      const nameB = b.items && b.items.length > 0 ? (inventoryMap[b.items[0].itemId] || '') : '';
      return nameA.localeCompare(nameB);
    }
    return 0;
  });
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}>
            <option value="dateDesc">Date (Newest)</option>
            <option value="dateAsc">Date (Oldest)</option>
            <option value="status">Status</option>
            <option value="itemName">Item Name (A-Z)</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={loadRequests}>🔄</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div>
          : shown.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📭</div><p>No requests found.</p></div>
          : <>
              <div className="table-wrapper">
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
            </>
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
                <li key={i}><span>{inventoryMap[item.itemId] || `Item ID: ${item.itemId}`}</span><span className="badge badge-student">× {item.quantity}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
