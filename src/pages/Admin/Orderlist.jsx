import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import './orderlistStyles.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dineinn-pro-backend.onrender.com';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Today');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [tempValue, setTempValue] = useState('');
  
  const [restaurantId, setRestaurantId] = useState(null);

  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const getInitialNewOrderState = () => ({
    customername: '',
    customerno: '',
    email_id: '', // ADD THIS
    totalamount: '',
    paymenttype: 'cash',
    deliverytype: 'dinein',
    ispaid: false,
    orderdate: new Date().toISOString().split('T')[0]
  });
  const [newOrder, setNewOrder] = useState(getInitialNewOrderState());

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.restaurantid) {
      setRestaurantId(user.restaurantid);
    } else {
      console.error("Restaurant ID not found. Please log in again.");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    let startDate, endDate;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (filterType) {
      case 'Today':
        startDate = endDate = todayStr;
        break;
      case 'Yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'Last 7 Days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        startDate = sevenDaysAgo.toISOString().split('T')[0];
        endDate = todayStr;
        break;
      case 'Custom Range':
        startDate = customFromDate;
        endDate = customToDate;
        break;
      default:
        startDate = endDate = todayStr;
    }
    
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/orders`, {
        params: { restaurantId, startDate, endDate }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      alert('Could not load orders.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, filterType, customFromDate, customToDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    const lowercaseSearch = searchTerm?.toLowerCase();
    return orders.filter(order =>
      Object.values(order).some(value =>
        value && value.toString()?.toLowerCase().includes(lowercaseSearch)
      )
    );
  }, [orders, searchTerm]);

  const handleNewOrderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddNewOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.customername || !newOrder.totalamount) {
      alert('Customer Name and Total Amount are required.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/orders/manual`, {
        ...newOrder,
        restaurantId: restaurantId
      });
      alert('Order added successfully!');
      setShowAddOrderModal(false);
      setNewOrder(getInitialNewOrderState());
      fetchOrders();
    } catch (error) {
      console.error("Failed to add new order:", error);
      alert('Failed to add order. Please try again.');
    }
  };

  const handleCellClick = (rowId, field, currentValue) => {
    setEditingCell({ rowId, field });
    setTempValue(currentValue || '');
  };

  const handleCellChange = (e) => {
    setTempValue(e.target.value);
  };

  const handleCellBlur = async () => {
    if (!editingCell.rowId || !editingCell.field) return;

    const { rowId, field } = editingCell;
    const originalOrder = orders.find(o => o.id === rowId);

    if (String(originalOrder[field] || '') === String(tempValue)) {
      setEditingCell({ rowId: null, field: null });
      return;
    }
    
    try {
        await axios.put(`${API_BASE}/api/orders/${rowId}`, {
            field: field,
            value: tempValue,
            restaurantId: restaurantId
        });
        
        setOrders(prevOrders =>
            prevOrders.map(order =>
            order.id === rowId
                ? { ...order, [field]: tempValue }
                : order
            )
        );
    } catch (error) {
        console.error("Failed to update order:", error);
        alert(`Failed to update ${field}. Please try again.`);
    } finally {
        setEditingCell({ rowId: null, field: null });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    }
    if (e.key === 'Escape') {
      setEditingCell({ rowId: null, field: null });
    }
  };
  
  const renderCell = (order, field) => {
    const isEditing = editingCell.rowId === order.id && editingCell.field === field;
    const value = order[field];
    
    if (isEditing) {
      if (field === 'ispaid') {
        return (
          <select
            className="orderlist-cell-input"
            value={String(tempValue)}
            onChange={handleCellChange}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyPress}
            autoFocus
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      }
      
      return (
        <input
          className="orderlist-cell-input"
          type={field === 'totalamount' ? 'number' : field === 'orderdate' ? 'date' : 'text'}
          value={tempValue}
          onChange={handleCellChange}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyPress}
          autoFocus
        />
      );
    }
    
    return (
      <span
        className="orderlist-cell-content"
        onClick={() => handleCellClick(order.id, field, value)}
      >
        {field === 'ispaid' 
          ? (value ? 'Yes' : 'No')
          : field === 'totalamount'
          ? `₹${parseFloat(value || 0).toFixed(2)}`
          : value || '-'}
      </span>
    );
  };

  const columns = [
    { key: 'billno', label: 'Bill No' },
    { key: 'customername', label: 'Customer Name' },
    { key: 'customerno', label: 'Customer No' },
    { key: 'deliverytype', label: 'Delivery Type' },
    { key: 'paymenttype', label: 'Payment Type' },
    { key: 'totalamount', label: 'Total Amount' },
    { key: 'orderdate', label: 'Order Date' },
    { key: 'ispaid', label: 'Paid' },
    { key: 'email_id', label: 'Email' },
    { key: 'tablenumber', label: 'Table No' },
    { key: 'status', label: 'Status' },
    { key: 'accepted_time', label: 'Accepted Time' },
  ];

  return (
    <div className="orderlist-container">
      <div className="orderlist-header">
        <h2 className="orderlist-title">Customer Orders</h2>
        
        <button className="orderlist-add-btn" onClick={() => setShowAddOrderModal(true)}>
          + Add Order
        </button>
        
        <div className="orderlist-controls">
          <div className="orderlist-search-container">
            <input
              type="text"
              placeholder="Search orders..."
              className="orderlist-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="orderlist-filter-container">
            <select
              className="orderlist-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Custom Range">Custom Range</option>
            </select>
            
            {filterType === 'Custom Range' && (
              <div className="orderlist-date-range">
                <input
                  type="date"
                  className="orderlist-date-input"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                />
                <span className="orderlist-date-separator">to</span>
                <input
                  type="date"
                  className="orderlist-date-input"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="orderlist-table-container">
        <table className="orderlist-table">
          <thead className="orderlist-thead">
            <tr className="orderlist-header-row">
              {columns.map(column => (
                <th key={column.key} className="orderlist-header-cell">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="orderlist-tbody">
            {filteredOrders.map(order => (
              <tr key={order.id} className="orderlist-row">
                {columns.map(column => (
                  <td key={column.key} className="orderlist-cell">
                    {renderCell(order, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {(isLoading) && <div className="orderlist-loading"><p>Loading orders...</p></div>}

        {(!isLoading && filteredOrders.length === 0) && (
          <div className="orderlist-no-data">
            <p>No orders found matching your criteria.</p>
          </div>
        )}
      </div>
      
      <div className="orderlist-footer">
        <p className="orderlist-count">
          Showing {filteredOrders.length} of {orders.length} total orders
        </p>
      </div>

      {showAddOrderModal && (
        <div className="orderlist-modal-overlay">
          <div className="orderlist-modal-content">
            <h3>Add New Order</h3>
            <form onSubmit={handleAddNewOrder} className="orderlist-modal-form">
              <div className="orderlist-form-group">
                <label>Customer Name *</label>
                <input type="text" name="customername" value={newOrder.customername} onChange={handleNewOrderChange} required />
              </div>
              <div className="orderlist-form-group">
                <label>Customer No</label>
                <input type="text" name="customerno" value={newOrder.customerno} onChange={handleNewOrderChange} />
              </div>
              {/* ADD THIS */}
              <div className="orderlist-form-group">
                <label>Email</label>
                <input type="email" name="email_id" value={newOrder.email_id} onChange={handleNewOrderChange} />
              </div>
              {/* --------- */}
              <div className="orderlist-form-group">
                <label>Total Amount *</label>
                <input type="number" name="totalamount" value={newOrder.totalamount} onChange={handleNewOrderChange} required />
              </div>
              <div className="orderlist-form-group">
                <label>Order Date</label>
                <input type="date" name="orderdate" value={newOrder.orderdate} onChange={handleNewOrderChange} />
              </div>
              <div className="orderlist-form-group">
                <label>Payment Type</label>
                <select name="paymenttype" value={newOrder.paymenttype} onChange={handleNewOrderChange}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="orderlist-form-group">
                <label>Delivery Type</label>
                <select name="deliverytype" value={newOrder.deliverytype} onChange={handleNewOrderChange}>
                  <option value="dinein">Dine-In</option>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              <div className="orderlist-form-group-checkbox">
                <label>
                  <input type="checkbox" name="ispaid" checked={newOrder.ispaid} onChange={handleNewOrderChange} />
                  Is Paid?
                </label>
              </div>
              <div className="orderlist-modal-actions">
                <button type="button" className="orderlist-btn-cancel" onClick={() => setShowAddOrderModal(false)}>Cancel</button>
                <button type="submit" className="orderlist-btn-save">Save Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderList;