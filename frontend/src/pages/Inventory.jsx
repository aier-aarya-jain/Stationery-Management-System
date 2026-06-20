import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CATEGORIES = ['All', 'Writing', 'Paper', 'Filing', 'Printing', 'Art & Craft', 'Office Supplies', 'Other'];

export default function Inventory() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Writing', unit: '', availableQuantity: '', minimumQuantity: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory?page=0&size=100');
      setItems(res.data.content || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEdit(null); setForm({ name: '', category: 'Writing', unit: '', availableQuantity: '', minimumQuantity: '' }); setModal(true); };
  const openEdit = (item) => { setEdit(item); setForm({ name: item.name, category: item.category, unit: item.unit, availableQuantity: item.availableQuantity, minimumQuantity: item.minimumQuantity }); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form, availableQuantity: Number(form.availableQuantity), minimumQuantity: Number(form.minimumQuantity) };
      edit ? await api.put(`/inventory/${edit.id}`, data) : await api.post('/inventory', data);
      setMsg({ text: edit ? 'Item updated!' : 'Item added!', type: 'success' });
      setModal(false); load();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Failed to save.', type: 'error' });
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/inventory/${id}`); setMsg({ text: 'Deleted.', type: 'success' }); load(); }
    catch { setMsg({ text: 'Delete failed.', type: 'error' }); }
  };

  const shown = items.filter(i =>
    (i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())) &&
    (category === 'All' || i.category === category)
  );

  const pct = (i) => i.minimumQuantity ? Math.min(100, Math.round(i.availableQuantity / (i.minimumQuantity * 5) * 100)) : 100;
  const barClass = (i) => i.availableQuantity <= i.minimumQuantity ? 'critical' : i.availableQuantity <= i.minimumQuantity * 2 ? 'low' : 'ok';

  return (
    <div>
      <div className="page-header">
        <h1>{isAdmin ? '📦 Inventory Management' : '🔍 Browse Inventory'}</h1>
        <p>{isAdmin ? 'Add, edit or remove stationery items.' : 'Browse available stationery items.'}</p>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {isAdmin && <button className="btn btn-primary-admin" onClick={openAdd}>➕ Add Item</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div>
          : shown.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📭</div><p>No items found.</p></div>
          : <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Category</th><th>Unit</th>
                    {isAdmin ? <><th>Stock</th><th>Min</th><th>Level</th><th>Status</th><th>Actions</th></> : <th>Availability</th>}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td><span className="badge badge-admin">{item.category}</span></td>
                      <td>{item.unit}</td>
                      {isAdmin ? <>
                        <td style={{ fontWeight: 800, color: item.availableQuantity <= item.minimumQuantity ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {item.availableQuantity}
                        </td>
                        <td>{item.minimumQuantity}</td>
                        <td style={{ minWidth: 100 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{pct(item)}%</div>
                          <div className="stock-bar"><div className={`stock-bar-fill ${barClass(item)}`} style={{ width: `${pct(item)}%` }} /></div>
                        </td>
                        <td>
                          {item.availableQuantity === 0
                            ? <span className="badge badge-rejected">Out of Stock</span>
                            : item.availableQuantity <= item.minimumQuantity
                              ? <span className="badge badge-low">⚠️ Low</span>
                              : <span className="badge badge-ok">✅ OK</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => del(item.id)}>🗑️</button>
                          </div>
                        </td>
                      </> : <td>
                        {item.availableQuantity <= 0 && <span className="badge badge-low">🔴 Out of Stock</span>}
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{edit ? '✏️ Edit Item' : '➕ Add Item'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <input className="form-input" placeholder="Box, Piece, Ream…" required value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Available Qty *</label>
                  <input className="form-input" type="number" min="0" required value={form.availableQuantity} onChange={e => setForm({ ...form, availableQuantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Qty *</label>
                  <input className="form-input" type="number" min="0" required value={form.minimumQuantity} onChange={e => setForm({ ...form, minimumQuantity: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary-admin" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving…' : edit ? 'Update' : 'Add Item'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
