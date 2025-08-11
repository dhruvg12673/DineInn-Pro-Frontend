import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import './orderlistStyles.css';

const API_BASE = 'https://dineinn-pro-backend.onrender.com'; // Your backend URL

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
        // By default, fetch today's orders if no range specified
        startDate = endDate = todayStr;
    }
    
    // Only fetch if we have a valid date range
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


  // Search filtering is done on the client-side after data is fetched
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return orders.filter(order =>
      Object.values(order).some(value =>
        value && value.toString().toLowerCase().includes(lowercaseSearch)
      )
    );
  }, [orders, searchTerm]);

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

    // If the value hasn't changed, do nothing
    if (String(originalOrder[field] || '') === String(tempValue)) {
      setEditingCell({ rowId: null, field: null });
      return;
    }
    
    try {
        // Send the update to the backend
        await axios.put(`${API_BASE}/api/orders/${rowId}`, {
            field: field,
            value: tempValue,
            restaurantId: restaurantId
        });
        
        // Update the local state on success
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
    </div>
  );
};

export default OrderList;