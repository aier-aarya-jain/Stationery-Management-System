import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Home, List, ShoppingCart, Plus, Minus } from 'lucide-react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const links = [
    { label: 'Inventory', path: '/student', icon: Home },
  ];

  useEffect(() => {
    fetchInventory();
    fetchRequests();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory?size=100');
      setInventory(res.data.content || []);
    } catch (error) {}
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/me?size=100');
      setRequests(res.data.content || []);
    } catch (error) {}
    setLoading(false);
  };

  const updateCart = (itemId, delta) => {
    setCart(prev => {
      const newQty = (prev[itemId] || 0) + delta;
      if (newQty <= 0) {
        const newCart = {...prev};
        delete newCart[itemId];
        return newCart;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const submitRequest = async () => {
    const items = Object.keys(cart).map(itemId => ({
      itemId: parseInt(itemId),
      quantity: cart[itemId]
    }));

    if (items.length === 0) {
      toast.warning('Please add items to your cart first.');
      return;
    }

    try {
      await api.post('/requests', { items });
      toast.success('Request submitted successfully!');
      setCart({});
      fetchRequests();
      setActiveTab('requests');
    } catch (error) {}
  };

  return (
    <div className="dashboard-layout">
      <Sidebar links={links} />
      <div className="dashboard-content">
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className={`btn-primary ${activeTab !== 'inventory' ? 'outline' : ''}`}
            style={{ width: 'auto', background: activeTab === 'inventory' ? '' : 'transparent', color: activeTab === 'inventory' ? '#fff' : 'var(--primary-indigo)' }}
            onClick={() => setActiveTab('inventory')}
          >
            <Home size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Browse Inventory
          </button>
          <button 
            className={`btn-primary ${activeTab !== 'requests' ? 'outline' : ''}`}
            style={{ width: 'auto', background: activeTab === 'requests' ? '' : 'transparent', color: activeTab === 'requests' ? '#fff' : 'var(--primary-indigo)' }}
            onClick={() => setActiveTab('requests')}
          >
            <List size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> My Requests
          </button>
        </div>

        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Available Stationery</h2>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={submitRequest}>
                <ShoppingCart size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                Submit Request ({Object.keys(cart).length} items)
              </button>
            </div>

            <div className="card-grid">
              {inventory.map(item => {
                const outOfStock = item.availableQuantity <= 0;
                const currentQty = cart[item.id] || 0;
                const limitReached = currentQty >= item.availableQuantity;

                return (
                <div key={item.id} className="glass-panel inventory-card" style={{ opacity: outOfStock ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>{item.name}</h3>
                    {outOfStock && <span style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Out of Stock</span>}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.category} • {item.unit}</p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Quantity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button 
                        onClick={() => updateCart(item.id, -1)} 
                        disabled={currentQty === 0}
                        style={{ border: 'none', background: currentQty === 0 ? '#f3f4f6' : 'rgba(0,0,0,0.05)', color: currentQty === 0 ? '#d1d5db' : 'inherit', borderRadius: '4px', padding: '0.25rem', cursor: currentQty === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{currentQty}</span>
                      <button 
                        onClick={() => updateCart(item.id, 1)} 
                        disabled={outOfStock || limitReached}
                        style={{ border: 'none', background: outOfStock || limitReached ? '#f3f4f6' : 'var(--primary-indigo)', color: outOfStock || limitReached ? '#d1d5db' : 'white', borderRadius: '4px', padding: '0.25rem', cursor: outOfStock || limitReached ? 'not-allowed' : 'pointer' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Request History</h2>
            {loading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>You haven't made any requests yet.</p> : null}
                {requests.map(req => (
                  <div key={req.requestId} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Request #{req.requestId}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {new Date(req.createdAt).toLocaleString()} • {req.items?.length || 0} items
                      </p>
                      {req.rejectionReason && (
                        <p style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.5rem' }}>
                          Reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>
                    <span className={`status-chip status-${req.status}`}>{req.status}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;
