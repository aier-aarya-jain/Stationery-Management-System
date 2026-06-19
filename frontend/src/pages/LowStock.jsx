import { useState, useEffect } from 'react';
import api from '../services/api';

export default function LowStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory/low-stock?page=0&size=100')
      .then(r => setItems(r.data.content || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>⚠️ Low Stock Alerts</h1>
        <p>Items that have fallen below their minimum required quantity.</p>
      </div>

      {items.length > 0 && (
        <div className="alert alert-warning">⚠️ {items.length} item(s) need restocking.</div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div>
          : items.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">✅</div><p>All items are sufficiently stocked!</p></div>
            : <div className="table-wrapper">
                <table>
                  <thead><tr><th>Item</th><th>Category</th><th>Available</th><th>Minimum</th><th>Deficit</th></tr></thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700 }}>{item.name}</td>
                        <td><span className="badge badge-admin">{item.category}</span></td>
                        <td style={{ fontWeight: 700, color: item.availableQuantity === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                          {item.availableQuantity}
                        </td>
                        <td>{item.minimumQuantity}</td>
                        <td>
                          <span className="badge badge-rejected">
                            -{item.minimumQuantity - item.availableQuantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>
    </div>
  );
}
