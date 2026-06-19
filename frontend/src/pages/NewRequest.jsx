import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NewRequest() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([{ itemId: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/inventory?page=0&size=100').then(r => setInventory(r.data.content || []));
  }, []);

  const update = (i, field, val) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: val };
    setItems(copy);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.itemId)) { setError('Please select an item for every row.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post('/requests', { items: items.map(i => ({ itemId: i.itemId, quantity: Number(i.quantity) })) });
      setSuccess('Request submitted! Redirecting…');
      setTimeout(() => navigate('/requests'), 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1>➕ New Request</h1>
        <p>Pick items and quantities, then submit for admin approval.</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={submit}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Item</label>}
                <select className="form-select" value={item.itemId} onChange={e => update(i, 'itemId', e.target.value)} required>
                  <option value="">— Select —</option>
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id} disabled={inv.availableQuantity === 0}>
                      {inv.name}{inv.availableQuantity === 0 ? ' (Out of Stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Qty</label>}
                <input className="form-input" type="number" min="1" value={item.quantity}
                  onChange={e => update(i, 'quantity', e.target.value)} required />
              </div>
              <button type="button" className="btn btn-danger btn-sm"
                style={{ height: 42, marginBottom: 0 }}
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                disabled={items.length === 1}>✕</button>
            </div>
          ))}

          <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}
            onClick={() => setItems([...items, { itemId: '', quantity: 1 }])}>
            ➕ Add Item
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary-student" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Submitting…' : '🚀 Submit Request'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/requests')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
