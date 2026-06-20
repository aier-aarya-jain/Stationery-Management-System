import { useState, useEffect } from 'react';
import api from '../services/api';

const badge = (s) => {
  const cls = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected', FULFILLED: 'badge-fulfilled' };
  return <span className={`badge ${cls[s]}`}>{s}</span>;
};

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [inventoryMap, setInventoryMap] = useState({});
  const [sortBy, setSortBy] = useState('dateDesc');
  const [busy, setBusy] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadInventory = async () => {
    try {
      const res = await api.get('/inventory?page=0&size=1000');
      const map = {};
      res.data.content.forEach(i => map[i.id] = i.name);
      setInventoryMap(map);
    } catch { console.error('Failed to load inventory for mapping'); }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests?page=0&size=100');
      setRequests(res.data.content || []);
    } catch { setMsg({ text: 'Failed to load requests.', type: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); loadInventory(); }, []);

  const action = async (fn, successMsg) => {
    try { await fn(); setMsg({ text: successMsg, type: 'success' }); load(); }
    catch (e) { setMsg({ text: e.response?.data?.message || 'Action failed.', type: 'error' }); }
    finally { setBusy(null); }
  };

  const approve  = (id) => { setBusy(id); action(() => api.post(`/requests/${id}/approve`), 'Request approved!'); };
  const fulfill  = (id) => { setBusy(id); action(() => api.post(`/requests/${id}/fulfill`), 'Marked as fulfilled!'); };
  const reject   = async () => {
    setBusy(rejectId);
    await action(() => api.post(`/requests/${rejectId}/reject?reason=${encodeURIComponent(reason)}`), 'Request rejected.');
    setRejectId(null); setReason('');
  };

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
        <h1>📋 Manage Requests</h1>
        <p>Approve, reject or fulfill student requests.</p>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="toolbar">
        {['ALL','PENDING','APPROVED','REJECTED','FULFILLED'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary-admin' : 'btn-ghost'}`} onClick={() => { setFilter(s); setPage(1); }}>{s}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}>
            <option value="dateDesc">Date (Newest)</option>
            <option value="dateAsc">Date (Oldest)</option>
            <option value="status">Status</option>
            <option value="itemName">Item Name (A-Z)</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div>
          : shown.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📭</div><p>No requests.</p></div>
          : <>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ID</th><th>Student</th><th>Items</th><th>Status</th><th>Date & Time</th><th>Actions</th></tr></thead>
                  <tbody>
                    {paginatedShown.map(r => (
                      <tr key={r.requestId}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{r.requestId}</td>
                        <td>{r.studentEmail}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>👁 {r.items?.length}</button></td>
                        <td>{badge(r.status)}</td>
                        <td style={{ fontSize: 12 }}>{new Date(r.createdAt + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {r.status === 'PENDING' && <>
                              <button className="btn btn-success btn-sm" disabled={busy === r.requestId} onClick={() => approve(r.requestId)}>
                                {busy === r.requestId ? '…' : '✅ Approve'}
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => { setRejectId(r.requestId); setReason(''); }}>❌ Reject</button>
                            </>}
                            {r.status === 'APPROVED' && (
                              <button className="btn btn-warning btn-sm" disabled={busy === r.requestId} onClick={() => fulfill(r.requestId)}>
                                {busy === r.requestId ? '…' : '📦 Fulfill'}
                              </button>
                            )}
                          </div>
                        </td>
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

      {/* Reject Modal */}
      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">❌ Reject Request</h2>
              <button className="modal-close" onClick={() => setRejectId(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-textarea" placeholder="Reason for rejection…" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} disabled={!reason.trim() || busy} onClick={reject}>Confirm Reject</button>
              <button className="btn btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📦 Request Details</h2>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, marginBottom: 6 }}>Student: <strong>{detail.studentEmail}</strong></p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Status: {badge(detail.status)}</p>
            {detail.rejectionReason && <div className="alert alert-error">Reason: {detail.rejectionReason}</div>}
            <ul className="request-items-list">
              {detail.items?.map((item, i) => (
                <li key={i}><span>{inventoryMap[item.itemId] || `Item ID: ${item.itemId}`}</span><span className="badge badge-admin">× {item.quantity}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
