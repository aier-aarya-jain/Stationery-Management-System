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
  const [reqPage, setReqPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const itemsPerPage = 10;

  // Details Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const links = [
    { label: 'Inventory', path: '/student', icon: Home },
  ];

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory?size=100');
      setInventory(res.data.content || []);
    } catch (error) { console.error(error); }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/me?size=100');
      setRequests(res.data.content || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
    fetchRequests();
  }, []);

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
    } catch (error) { console.error(error); }
  };

  const openDetailsModal = (req) => {
    setSelectedRequest(req);
    setShowDetailsModal(true);
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
              {inventory.slice((invPage - 1) * itemsPerPage, invPage * itemsPerPage).map(item => {
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
            {Math.ceil(inventory.length / itemsPerPage) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <button className="btn-primary outline" disabled={invPage === 1} onClick={() => setInvPage(p => p - 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Prev</button>
                <span style={{ fontSize: '0.875rem' }}>Page {invPage} of {Math.ceil(inventory.length / itemsPerPage)}</span>
                <button className="btn-primary outline" disabled={invPage === Math.ceil(inventory.length / itemsPerPage)} onClick={() => setInvPage(p => p + 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Next</button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Request History</h2>
            {loading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>You haven't made any requests yet.</p> : null}
                {[...requests].sort((a, b) => {
                  if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                  if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
                  return new Date(b.createdAt) - new Date(a.createdAt);
                }).slice((reqPage - 1) * itemsPerPage, reqPage * itemsPerPage).map(req => (
                  <div key={req.requestId} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Request #{req.requestId}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {new Date(req.createdAt + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} • {req.items?.length || 0} items
                      </p>
                      <button 
                        onClick={() => openDetailsModal(req)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary-indigo)', cursor: 'pointer', padding: 0, marginTop: '0.5rem', fontSize: '0.875rem' }}
                      >
                        View Items
                      </button>
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
            {Math.ceil(requests.length / itemsPerPage) > 0 && !loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <button className="btn-primary outline" disabled={reqPage === 1} onClick={() => setReqPage(p => p - 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Prev</button>
                <span style={{ fontSize: '0.875rem' }}>Page {reqPage} of {Math.ceil(requests.length / itemsPerPage)}</span>
                <button className="btn-primary outline" disabled={reqPage === Math.ceil(requests.length / itemsPerPage)} onClick={() => setReqPage(p => p + 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Next</button>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Request Details #{selectedRequest.requestId}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedRequest.items?.map(item => {
                const invItem = inventory.find(i => i.id === item.itemId) || {};
                return (
                  <div key={item.id || item.itemId} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{invItem.name || `Item #${item.itemId}`}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Requested Quantity: {item.quantity}</p>
                    </div>
                    <span className={`status-chip status-${(item.status || 'PENDING').toLowerCase()}`}>{item.status || 'PENDING'}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;
