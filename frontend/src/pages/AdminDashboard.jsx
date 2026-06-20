import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { LayoutDashboard, Package, ClipboardList, AlertTriangle, CheckCircle, XCircle, Archive, Trash2, Edit2, FileText } from 'lucide-react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [lowStock, setLowStock] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const [reqPage, setReqPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Details Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    unit: 'pcs',
    availableQuantity: 0,
    minimumQuantity: 0
  });

  // Edit Item Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState({
    id: null,
    name: '',
    category: '',
    unit: 'pcs',
    availableQuantity: 0,
    minimumQuantity: 0
  });

  const links = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, lowStockRes, reqRes, invLogsRes, reqLogsRes, authLogsRes] = await Promise.all([
        api.get('/inventory?size=100').catch(e => { console.error(e); return { data: { content: [] } }; }),
        api.get('/inventory/low-stock').catch(e => { console.error(e); return { data: { content: [] } }; }),
        api.get('/requests?size=100').catch(e => { console.error(e); return { data: { content: [] } }; }),
        api.get('/inventory/logs').catch(() => ({ data: [] })),
        api.get('/requests/logs').catch(() => ({ data: [] })),
        api.get('/auth/logs').catch(() => ({ data: [] }))
      ]);
      setInventory(invRes.data.content || []);
      setLowStock(lowStockRes.data.content || []);
      setRequests(reqRes.data.content || []);
      
      const combinedLogs = [
        ...(invLogsRes.data || []).map(l => ({ ...l, service: 'Inventory', timestamp: l.timestamp })),
        ...(reqLogsRes.data || []).map(l => ({ ...l, service: 'Requests', timestamp: l.timestamp })),
        ...(authLogsRes.data || []).map(l => ({ ...l, service: 'Auth', timestamp: l.createdAt, performedBy: l.email }))
      ];
      combinedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(combinedLogs);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const approveRequest = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/requests/${id}/approve`);
      toast.success('Request approved', { toastId: `approve-success-${id}` });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to approve request';
      toast.error(errorMsg, { toastId: `error-${errorMsg}` });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openDetailsModal = (req) => {
    setSelectedRequest(req);
    setShowDetailsModal(true);
  };

  const approveItem = async (reqId, itemId) => {
    try {
      await api.post(`/requests/${reqId}/items/${itemId}/approve`);
      toast.success('Item approved');
      fetchData();
      // Optimistically update selectedRequest
      setSelectedRequest(prev => {
        if (!prev) return prev;
        return { ...prev, items: prev.items.map(i => i.itemId === itemId ? { ...i, status: 'APPROVED' } : i) };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve item');
    }
  };

  const rejectItem = async (reqId, itemId) => {
    const reason = window.prompt("Reason for rejecting item?");
    if (!reason) return;
    try {
      await api.post(`/requests/${reqId}/items/${itemId}/reject?reason=${encodeURIComponent(reason)}`);
      toast.success('Item rejected');
      fetchData();
      // Optimistically update selectedRequest
      setSelectedRequest(prev => {
        if (!prev) return prev;
        return { ...prev, items: prev.items.map(i => i.itemId === itemId ? { ...i, status: 'REJECTED' } : i) };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject item');
    }
  };

  const confirmReject = async () => {
    if (!rejectReason) {
      toast.warning('Reason is required');
      return;
    }
    try {
      await api.post(`/requests/${rejectId}/reject?reason=${encodeURIComponent(rejectReason)}`);
      toast.success('Request rejected');
      setShowRejectModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const fulfillRequest = async (id) => {
    try {
      await api.post(`/requests/${id}/fulfill`);
      toast.success('Request fulfilled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fulfill request');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', newItem);
      toast.success('Item added successfully');
      setShowAddModal(false);
      setNewItem({ name: '', category: '', unit: 'pcs', availableQuantity: 0, minimumQuantity: 0 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  const openEditModal = (item) => {
    setEditItem({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      availableQuantity: item.availableQuantity,
      minimumQuantity: item.minimumQuantity
    });
    setShowEditModal(true);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/inventory/${editItem.id}`, editItem);
      toast.success('Item updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted successfully');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete item');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar links={links} />
      <div className="dashboard-content">

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className={`btn-primary ${activeTab !== 'requests' ? 'outline' : ''}`}
            style={{ width: 'auto', background: activeTab === 'requests' ? '' : 'transparent', color: activeTab === 'requests' ? '#fff' : 'var(--primary-indigo)' }}
            onClick={() => setActiveTab('requests')}
          >
            <ClipboardList size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Requests
          </button>
          <button 
            className={`btn-primary ${activeTab !== 'inventory' ? 'outline' : ''}`}
            style={{ width: 'auto', background: activeTab === 'inventory' ? '' : 'transparent', color: activeTab === 'inventory' ? '#fff' : 'var(--primary-indigo)' }}
            onClick={() => setActiveTab('inventory')}
          >
            <Package size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Inventory Mgt
          </button>
          <button 
            className={`btn-primary ${activeTab !== 'logs' ? 'outline' : ''}`}
            style={{ width: 'auto', background: activeTab === 'logs' ? '' : 'transparent', color: activeTab === 'logs' ? '#fff' : 'var(--primary-indigo)' }}
            onClick={() => setActiveTab('logs')}
          >
            <FileText size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Logs
          </button>
        </div>

        {/* Low Stock Alerts */}
        {lowStock.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fee2e2', borderRadius: '12px', border: '1px solid #fca5a5' }}>
            <h3 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <AlertTriangle size={18} /> Low Stock Alerts
            </h3>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', fontSize: '0.875rem', color: '#991b1b' }}>
              {lowStock.map(item => (
                <li key={item.id}>{item.name} ({item.availableQuantity} {item.unit} left) - below min {item.minimumQuantity}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>All Requests</h2>
            <div className="glass-panel data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...requests].sort((a, b) => {
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  }).slice((reqPage - 1) * itemsPerPage, reqPage * itemsPerPage).map(req => (
                    <tr key={req.requestId}>
                      <td>#{req.requestId}</td>
                      <td>{req.studentEmail}</td>
                      <td>{new Date(req.createdAt + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                      <td><span className={`status-chip status-${req.status}`}>{req.status}</span></td>
                      <td>
                        <button 
                          className="action-btn" 
                          style={{ color: 'var(--primary-indigo)', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }} 
                          title="View Details" 
                          onClick={() => openDetailsModal(req)}
                        >
                          View Details
                        </button>
                        {req.status === 'PENDING' && (
                          <>
                            <button 
                              className="action-btn success" 
                              title="Approve All" 
                              onClick={() => approveRequest(req.requestId)}
                              disabled={processingId === req.requestId}
                              style={{ opacity: processingId === req.requestId ? 0.5 : 1, cursor: processingId === req.requestId ? 'not-allowed' : 'pointer' }}
                            >
                              {processingId === req.requestId ? <div className="spinner" style={{width: 18, height: 18, borderWidth: 2}}></div> : <CheckCircle size={18}/>}
                            </button>
                            <button 
                              className="action-btn danger" 
                              title="Reject All" 
                              onClick={() => openRejectModal(req.requestId)}
                              disabled={processingId === req.requestId}
                              style={{ opacity: processingId === req.requestId ? 0.5 : 1, cursor: processingId === req.requestId ? 'not-allowed' : 'pointer' }}
                            >
                              <XCircle size={18}/>
                            </button>
                          </>
                        )}
                        {req.status === 'APPROVED' && (
                          <button className="action-btn" style={{ color: 'var(--primary-indigo)' }} title="Fulfill" onClick={() => fulfillRequest(req.requestId)}><Archive size={18}/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(requests.length / itemsPerPage) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                <button className="btn-primary outline" disabled={reqPage === 1} onClick={() => setReqPage(p => p - 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Prev</button>
                <span style={{ fontSize: '0.875rem' }}>Page {reqPage} of {Math.ceil(requests.length / itemsPerPage)}</span>
                <button className="btn-primary outline" disabled={reqPage === Math.ceil(requests.length / itemsPerPage)} onClick={() => setReqPage(p => p + 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Next</button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Inventory Items</h2>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddModal(true)}>
                + Add Item
              </button>
            </div>
            <div className="glass-panel data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Min</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.slice((invPage - 1) * itemsPerPage, invPage * itemsPerPage).map((item, index) => (
                    <tr key={item.id}>
                      <td>#{(invPage - 1) * itemsPerPage + index + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td style={{ color: item.availableQuantity <= item.minimumQuantity ? '#dc2626' : 'inherit' }}>
                        {item.availableQuantity} {item.unit}
                      </td>
                      <td>{item.minimumQuantity}</td>
                      <td>
                        <button className="action-btn" style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', marginRight: '0.5rem' }} title="Edit" onClick={() => openEditModal(item)}>
                          <Edit2 size={18} />
                        </button>
                        <button className="action-btn danger" style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }} title="Delete" onClick={() => deleteItem(item.id)}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(inventory.length / itemsPerPage) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                <button className="btn-primary outline" disabled={invPage === 1} onClick={() => setInvPage(p => p - 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Prev</button>
                <span style={{ fontSize: '0.875rem' }}>Page {invPage} of {Math.ceil(inventory.length / itemsPerPage)}</span>
                <button className="btn-primary outline" disabled={invPage === Math.ceil(inventory.length / itemsPerPage)} onClick={() => setInvPage(p => p + 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Next</button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Audit Logs</h2>
            <div className="glass-panel data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Who (Performed By)</th>
                    <th>When (Date & Time)</th>
                    <th>Action</th>
                    <th>What (Details)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage).map((log, index) => (
                    <tr key={log.id || `log-${index}`}>
                      <td><span style={{ fontSize: '0.8rem', padding: '2px 6px', background: '#e5e7eb', borderRadius: '4px' }}>{log.service}</span></td>
                      <td>{log.performedBy}</td>
                      <td>{new Date(log.timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                      <td><span className={`status-chip status-${log.action?.toLowerCase() || 'pending'}`}>{log.action}</span></td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(logs.length / itemsPerPage) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                <button className="btn-primary outline" disabled={logsPage === 1} onClick={() => setLogsPage(p => p - 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Prev</button>
                <span style={{ fontSize: '0.875rem' }}>Page {logsPage} of {Math.ceil(logs.length / itemsPerPage)}</span>
                <button className="btn-primary outline" disabled={logsPage === Math.ceil(logs.length / itemsPerPage)} onClick={() => setLogsPage(p => p + 1)} style={{ width: 'auto', padding: '0.25rem 0.75rem' }}>Next</button>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Reject Request</h3>
            <div className="input-group">
              <label>Reason for Rejection</label>
              <textarea 
                className="input-field" 
                rows="3" 
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Item out of budget..."
              ></textarea>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-primary outline" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid #d1d5db', width: 'auto' }} onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ width: 'auto', background: '#dc2626' }} onClick={confirmReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Request Details #{selectedRequest.requestId}</h3>
            <p style={{ marginBottom: '1rem' }}><strong>Student:</strong> {selectedRequest.studentEmail}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedRequest.items?.map(item => {
                const invItem = inventory.find(i => i.id === item.itemId) || {};
                return (
                  <div key={item.id || item.itemId} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{invItem.name || `Item #${item.itemId}`}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Requested: {item.quantity} | Available: <span style={{ color: invItem.availableQuantity < item.quantity ? '#dc2626' : 'inherit', fontWeight: 500 }}>{invItem.availableQuantity || 0}</span></p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Status: <span className={`status-chip status-${(item.status || 'PENDING').toLowerCase()}`}>{item.status || 'PENDING'}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(item.status === 'PENDING' || !item.status) && selectedRequest.status === 'PENDING' && (
                        <>
                          <button className="action-btn success" title="Approve Item" onClick={() => approveItem(selectedRequest.requestId, item.itemId)}><CheckCircle size={18}/></button>
                          <button className="action-btn danger" title="Reject Item" onClick={() => rejectItem(selectedRequest.requestId, item.itemId)}><XCircle size={18}/></button>
                        </>
                      )}
                    </div>
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Inventory Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="input-group">
                <label>Item Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                  placeholder="e.g. A4 Paper Rim"
                />
              </div>
              <div className="input-group">
                <label>Category</label>
                <input 
                  type="text" className="input-field" required
                  value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                  placeholder="e.g. Paper"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Initial Stock</label>
                  <input 
                    type="number" className="input-field" required min="0"
                    value={newItem.availableQuantity} onChange={e => setNewItem({...newItem, availableQuantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Min Threshold</label>
                  <input 
                    type="number" className="input-field" required min="0"
                    value={newItem.minimumQuantity} onChange={e => setNewItem({...newItem, minimumQuantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Unit</label>
                  <input 
                    type="text" className="input-field" required
                    value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    placeholder="e.g. pcs, boxes"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-primary outline" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid #d1d5db', width: 'auto' }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Edit Inventory Item</h3>
            <form onSubmit={handleEditItem}>
              <div className="input-group">
                <label>Item Name</label>
                <input 
                  type="text" className="input-field" required
                  value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})}
                  placeholder="e.g. A4 Paper Rim"
                />
              </div>
              <div className="input-group">
                <label>Category</label>
                <input 
                  type="text" className="input-field" required
                  value={editItem.category} onChange={e => setEditItem({...editItem, category: e.target.value})}
                  placeholder="e.g. Paper"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Stock</label>
                  <input 
                    type="number" className="input-field" required min="0"
                    value={editItem.availableQuantity} onChange={e => setEditItem({...editItem, availableQuantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Min Threshold</label>
                  <input 
                    type="number" className="input-field" required min="0"
                    value={editItem.minimumQuantity} onChange={e => setEditItem({...editItem, minimumQuantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Unit</label>
                  <input 
                    type="text" className="input-field" required
                    value={editItem.unit} onChange={e => setEditItem({...editItem, unit: e.target.value})}
                    placeholder="e.g. pcs, boxes"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-primary outline" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid #d1d5db', width: 'auto' }} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Update Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
