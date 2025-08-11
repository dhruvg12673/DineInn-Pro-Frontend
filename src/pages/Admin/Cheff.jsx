import React, { useState, useEffect, useCallback } from 'react';
import { Search, Clock, User, MapPin } from 'lucide-react';
import { socketService } from '../../services/socketService'; // ✅ 1. ADD THIS IMPORT
import './ChefOrderDashboard.css';

// This should be your backend API base URL
const API_URL = 'https://dineinn-pro-backend.onrender.com'; 

const ChefOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    table: '',
    waiter: '',
    search: ''
  });
  const [timers, setTimers] = useState({});
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.restaurantid) {
        setRestaurantId(user.restaurantid);
      } else {
        setError("No restaurant ID found. Please log in again.");
        setLoading(false);
      }
    } catch (e) {
      setError("Could not read user data. Please log in again.");
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(`${API_URL}/api/kitchen-orders?restaurantId=${restaurantId}`);
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const sanitizedOrders = data.map(order => ({
        ...order,
        items: order.items || [] 
      }));
      setOrders(sanitizedOrders);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // ✅ 2. REPLACE your existing fetching useEffect with this new version
  useEffect(() => {
    if (restaurantId) {
      setLoading(true);
      fetchOrders(); // Initial fetch

      // Get the existing global socket connection
      const socket = socketService.getSocket();
      if (!socket) {
        return; // Do nothing if socket isn't ready
      }

      // This listener re-fetches orders to update the UI instantly
      const handleNewOrder = (data) => {
        // Check if the new order belongs to this restaurant
        if (Number(data.restaurant_id) === Number(restaurantId)) {
          fetchOrders();
        }
      };

      socket.on('new-order-for-kitchen', handleNewOrder);

      // Clean up this specific listener when the page is closed
      return () => {
        if (socket) {
          socket.off('new-order-for-kitchen', handleNewOrder);
        }
      };
    }
  }, [restaurantId, fetchOrders]);

  // This useEffect for the prep timers remains unchanged
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const newTimers = {};
        orders.forEach(order => {
          if (order.status === 'accepted' || order.status === 'preparing') {
            const startTime = new Date(order.acceptedTime || order.placedTime);
            const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
            newTimers[order.id] = elapsed;
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  // The rest of your component's functions (formatTime, updateOrderStatus, etc.) and JSX
  // remain exactly the same as in your provided file.
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimer = (seconds) => {
    if (typeof seconds !== 'number') return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'preparing': return 'status-preparing';
      case 'served': return 'status-served';
      default: return 'status-default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted':return 'Accepted';
      case 'preparing': return 'Preparing';
      case 'served': return 'Served';
      default: return status;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error(`Failed to update order status to ${newStatus}`);
      fetchOrders(); 
    } catch (err) {
      console.error("Update Error:", err);
      setError(`Failed to update order ${orderId}. Please try again.`);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.table && order.tablenumber && !order.tablenumber.toLowerCase().includes(filters.table.toLowerCase())) return false;
    if (filters.waiter && (!order.waiterName || !order.waiterName.toLowerCase().includes(filters.waiter.toLowerCase()))) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesItems = order.items.some(item => item.name.toLowerCase().includes(searchTerm));
      const matchesTable = order.tablenumber && order.tablenumber.toLowerCase().includes(searchTerm);
      const matchesWaiter = order.waiterName && order.waiterName.toLowerCase().includes(searchTerm);
      const matchesCategory = order.categoryName && order.categoryName.toLowerCase().includes(searchTerm);
      if (!matchesItems && !matchesTable && !matchesWaiter && !matchesCategory) return false;
    }
    return true;
  });

  const sortedOrders = filteredOrders.sort((a, b) => new Date(b.placedTime) - new Date(a.placedTime));

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🧾 Kitchen Order Dashboard</h1>
          <p className="dashboard-subtitle">Manage and track restaurant orders in real-time</p>
        </div>

        <div className="filters-container">
          <div className="filters-grid">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search orders, items, table..."
                className="search-input"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="served">Served</option>
            </select>

            <input
              type="text"
              placeholder="Filter by table"
              className="filter-input"
              value={filters.table}
              onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
            />

            <input
              type="text"
              placeholder="Filter by waiter"
              className="filter-input"
              value={filters.waiter}
              onChange={(e) => setFilters(prev => ({ ...prev, waiter: e.target.value }))}
            />
          </div>
        </div>

        {loading && <div className="loading-state">Loading orders...</div>}
        {error && <div className="error-state">Error: {error}</div>}

        {!loading && !error && (
          <div className="orders-grid">
            {sortedOrders.map(order => {
              const hasPendingItems = order.items && order.items.length > 0;
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-header-content">
                      <div className="table-info">
                        <MapPin className="table-icon" />
                        <span className="table-name">
                          {order.categoryName && `${order.categoryName} - `}
                          {order.tablenumber ? `Table ${order.tablenumber}` : 'Guest Order'}
                        </span>
                      </div>
                      <span className={`status-badge ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    {order.waiterName && (
                      <div className="waiter-info">
                        <User className="waiter-icon" />
                        <span>Waiter: {order.waiterName}</span>
                      </div>
                    )}
                    <div className="time-info">
                      <Clock className="time-icon" />
                      <span>Placed: {formatTime(order.placedTime)}</span>
                    </div>
                    {(order.status === 'accepted' || order.status === 'preparing') && timers[order.id] != null && (
                      <div className="timer-info">
                        <Clock className="timer-icon" />
                        <span>Prep Time: {formatTimer(timers[order.id])}</span>
                      </div>
                    )}
                  </div>

                  <div className="order-body">
                    <h4 className="items-title">Order Items:</h4>
                    <ul className="items-list">
                      {order.items.map((item, index) => (
                        <li key={`${order.id}-${index}`} className="item-row">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">×{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="action-buttons">
                      {hasPendingItems && (
                        <>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'accepted')}
                              className="btn btn-accept"
                            >
                              Accept Order
                            </button>
                          )}
                          {order.status === 'accepted' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="btn btn-preparing"
                            >
                              Mark Preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'served')}
                              className="btn btn-served"
                            >
                              Mark Prepared
                            </button>
                          )}
                        </>
                      )}
                      {order.status === 'served' && (
                          <div className="served-status">
                            ✓ All items served at {formatTime(order.servedTime)}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !error && sortedOrders.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3 className="empty-title">No active orders found</h3>
            <p className="empty-subtitle">All orders are served or no new orders have been placed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefOrderDashboard;