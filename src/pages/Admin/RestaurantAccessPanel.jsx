import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { PlanContext } from './PlanContext';
import plans from './PlanConfig';

import './RestaurantAccessPanel.css';

// The API base URL - adjust if your backend runs elsewhere
const API_URL = 'https://dineinn-pro-backend.onrender.com/api';

const RestaurantAccessPanel = () => {
  const { currentPlan, setCurrentPlan } = useContext(PlanContext);
  const [formData, setFormData] = useState({
    restaurantId: '',
    restaurantName: '',
    adminEmail: '',
    password: '',
    startDate: '',
    expiryDate: '',
    status: 'Active',
    plan: currentPlan
  });

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // State for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Fetch data from the backend when the component mounts
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await axios.get(`${API_URL}/restaurants`);
        
        const formattedRecords = response.data.map(r => ({
          id: r.id, 
          restaurantId: r.id,
          name: r.name,
          adminEmail: r.admin_email,
          startDate: new Date(r.start_date).toISOString().split('T')[0],
          expiryDate: new Date(r.expiry_date).toISOString().split('T')[0],
          status: r.status,
          plan: r.plan,
        }));
        setRecords(formattedRecords);
      } catch (err) {
        setError('Failed to fetch restaurant data. Is the server running?');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.restaurantId && 
           formData.restaurantName && 
           formData.adminEmail && 
           formData.password && 
           formData.startDate && 
           formData.expiryDate;
  };

  // Handle form submission to create a new restaurant
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Please fill out all fields in the form.');
      return;
    }

    try {
      // The backend expects integer ID for restaurantId
      const payload = {
          ...formData,
          restaurantId: parseInt(formData.restaurantId, 10)
      };

      const response = await axios.post(`${API_URL}/restaurants`, payload);
      const newRestaurant = response.data;
      
      const newRecord = {
        id: newRestaurant.id,
        restaurantId: newRestaurant.id,
        name: newRestaurant.name,
        adminEmail: newRestaurant.admin_email,
        startDate: new Date(newRestaurant.start_date).toISOString().split('T')[0],
        expiryDate: new Date(newRestaurant.expiry_date).toISOString().split('T')[0],
        status: newRestaurant.status,
        plan: newRestaurant.plan,
      };
      
      setRecords(prev => [...prev, newRecord]);
      setFormData({
        restaurantId: '', restaurantName: '', adminEmail: '',
        password: '', startDate: '', expiryDate: '',
        status: 'Active', plan: currentPlan
      });
      alert('Restaurant created successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create restaurant.');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // PERMANENTLY deletes a record
  const handleDelete = async (restaurantId, restaurantName) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${restaurantName}? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_URL}/restaurants/${restaurantId}`);
        setRecords(prev => prev.filter(record => record.id !== restaurantId));
        alert(`${restaurantName} has been permanently deleted.`);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Failed to delete restaurant.');
      }
    }
  };
  
  // Opens the modal to edit a record
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // Handles input changes within the edit modal
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingRecord(prev => ({...prev, [name]: value}));
  };

  // Submits the updated record data from the modal
  const handleUpdateRecord = async (e) => {
      e.preventDefault();
      if (!editingRecord) return;

      try {
          const payload = {
              name: editingRecord.name,
              admin_email: editingRecord.adminEmail,
              start_date: editingRecord.startDate,
              expiry_date: editingRecord.expiryDate,
              status: editingRecord.status,
              plan: editingRecord.plan
          };
          
          await axios.put(`${API_URL}/restaurants/${editingRecord.id}`, payload);
          
          // Update the record in the main list
          setRecords(prevRecords => prevRecords.map(rec => 
              rec.id === editingRecord.id ? editingRecord : rec
          ));
          
          // Close the modal
          setIsEditModalOpen(false);
          setEditingRecord(null);
          alert('Restaurant updated successfully!');

      } catch (err) {
          console.error('Failed to update restaurant', err);
          alert(err.response?.data?.error || 'Could not update the restaurant.');
      }
  };


  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'On-Hold': return 'status-on-hold';
      case 'Trial': return 'status-trial';
      case 'Suspended': return 'status-suspended';
      default: return '';
    }
  };

  return (
    <div className="restaurant-access-panel">
      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit: {editingRecord.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn"><X size={24}/></button>
            </div>
            <form onSubmit={handleUpdateRecord} className="modal-form">
              <div className="form-group">
                <label>Restaurant Name</label>
                <input type="text" name="name" value={editingRecord.name} onChange={handleModalInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>Admin Email</label>
                <input type="email" name="adminEmail" value={editingRecord.adminEmail} onChange={handleModalInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" name="startDate" value={editingRecord.startDate} onChange={handleModalInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input type="date" name="expiryDate" value={editingRecord.expiryDate} onChange={handleModalInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={editingRecord.status} onChange={handleModalInputChange} className="form-select">
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                  <option value="Suspended">Suspended</option>
                  <option value="On-Hold">On-Hold</option>
                </select>
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select name="plan" value={editingRecord.plan} onChange={handleModalInputChange} className="form-select">
                  {Object.keys(plans).map((planKey) => (
                    <option key={planKey} value={planKey}>{plans[planKey].name}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="panel-container">
        <h1 className="panel-title">Restaurant Access Panel</h1>
        
        <div className="form-card">
          <h2 className="form-title">Create Restaurant Access</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="restaurantId" className="form-label">Restaurant ID (Number)</label>
                <input type="number" id="restaurantId" name="restaurantId" value={formData.restaurantId} onChange={handleInputChange} className="form-input" placeholder="e.g., 101" required />
              </div>
              <div className="form-group">
                <label htmlFor="restaurantName" className="form-label">Restaurant Name</label>
                <input type="text" id="restaurantName" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} className="form-input" placeholder="Enter restaurant name" required />
              </div>
              <div className="form-group">
                <label htmlFor="adminEmail" className="form-label">Admin Email</label>
                <input type="email" id="adminEmail" name="adminEmail" value={formData.adminEmail} onChange={handleInputChange} className="form-input" placeholder="admin@restaurant.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" placeholder="Enter password" required />
              </div>
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">Starting Date</label>
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="status" className="form-label">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="form-select">
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="plan" className="form-label">Plan</label>
                <select id="plan" name="plan" value={formData.plan} onChange={handleInputChange} className="form-select">
                  {Object.keys(plans).map((planKey) => (
                    <option key={planKey} value={planKey}>{plans[planKey].name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className={`submit-btn ${!isFormValid() ? 'disabled' : ''}`} disabled={!isFormValid()}>
                Create Access
              </button>
            </div>
          </form>
        </div>

        <div className="logs-section">
          <div className="logs-header">
            <h2 className="logs-title">Access Records</h2>
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input type="text" placeholder="Search by name or status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            </div>
          </div>

          {isLoading && <p>Loading records...</p>}
          {error && <p className="error-message">{error}</p>}
          
          {!isLoading && !error && (
            <div className="table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('restaurantId')}>ID</th>
                    <th onClick={() => handleSort('name')}>Name</th>
                    <th onClick={() => handleSort('adminEmail')}>Admin Email</th>
                    <th onClick={() => handleSort('startDate')}>Start Date</th>
                    <th onClick={() => handleSort('expiryDate')}>Expiry Date</th>
                    <th onClick={() => handleSort('status')}>Status</th>
                    <th onClick={() => handleSort('plan')}>Plan</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.restaurantId}</td>
                      <td>{record.name}</td>
                      <td>{record.adminEmail}</td>
                      <td>{record.startDate}</td>
                      <td>{record.expiryDate}</td>
                      <td><span className={`status-badge ${getStatusClass(record.status)}`}>{record.status}</span></td>
                      <td>{plans[record.plan]?.name || record.plan}</td>
                      <td className="actions">
                        <button className="action-btn edit-btn" onClick={() => handleEditClick(record)} title="Edit / Suspend"><Edit size={16} /></button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(record.id, record.name)} title="Permanently Delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantAccessPanel;
