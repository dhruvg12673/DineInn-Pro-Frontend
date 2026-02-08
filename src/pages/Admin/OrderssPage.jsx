import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderPage.css';

const API_BASE_URL = 'http://localhost:5000';

// Orders Page Component with Final Functionality
const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantId = user?.restaurantid;

  useEffect(() => {
    if (!restaurantId) {
      setError('Restaurant ID not found. Please log in.');
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/orders`, { params: { restaurantId } });
        
        // Final Filter: Shows active (unpaid) OR recently delivered orders that are for Delivery/Pickup
        const relevantOrders = response.data.filter(order =>
          (!order.ispaid || order.status?.toLowerCase() === 'delivered') &&
          (order.deliverytype?.toLowerCase() === 'delivery' || order.deliverytype?.toLowerCase() === 'pickup')
        );

        setAllOrders(relevantOrders);
        setFilteredOrders(relevantOrders);
      } catch (err) {
        setError('Could not load orders from the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [restaurantId]);

  useEffect(() => {
    const filtered = allOrders.filter(order =>
      (order.billno?.toString() || '')?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      (order.customername || '')?.toLowerCase().includes(searchTerm?.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchTerm, allOrders]);

  /**
   * Navigates to the main BillingPage.js, behaving like TableManager.jsx.
   */
  const handleOrderClick = (billno) => {
    if (!billno) return;
    window.location.assign(`/admin/billing?billno=${billno}`);
  };

  // Helper function to get a CSS class for styling the status
  const getStatusClass = (status) => {
    if (!status) return 'pending';
    return status?.toLowerCase().replace(/\s+/g, '-');
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="empty-state error-state"><h3>Error</h3><p>{error}</p></div>;

  return (
    // THE UI RENDERED BELOW IS IDENTICAL TO YOUR ORIGINAL FILE
    <div className="orders-container">
      <div className="orders-header">
        <div className="header-content">
          <h1 className="page-title">Active Orders</h1>
          <p className="page-subtitle">Manage and track your current orders</p>
        </div>
        <div className="header-actions">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-number">{filteredOrders.length}</div>
          <div className="stat-label">Active Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            ₹{filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalamount || 0), 0).toLocaleString()}
          </div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>
      <div className="orders-grid">
        {filteredOrders.map(order => (
          <div
            key={order.id}
            className="order-card"
            onClick={() => handleOrderClick(order.billno)}
          >
            <div className="order-header">
              <span className="order-id">ORD-{order.billno || order.id}</span>
              <span className={`order-status ${getStatusClass(order.status)}`}>
                <span className="status-dot"></span>
                {order.status || 'Pending'}
              </span>
            </div>
            <div className="order-details">
              <div className="order-amount">₹{parseFloat(order.totalamount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="order-date">{new Date(order.orderdate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</div>
            </div>
            <div className="order-actions">
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </div>
          </div>
        ))}
      </div>
      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No orders found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

// The components below are preserved to maintain your original file structure.
// The main navigation now happens in the handleOrderClick function above.
const BillingPage = ({ orderId, onNavigate }) => (
  <div>Placeholder Billing Page for Order #{orderId}.</div>
);

const App = () => {
  const [currentPath, setCurrentPath] = useState('');
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.hash.slice(1) || '';
      setCurrentPath(path);
    };
    window.addEventListener('popstate', handlePopState);
    const initialPath = window.location.hash.slice(1) || '';
    setCurrentPath(initialPath);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    setCurrentPath(path);
    window.history.pushState(null, '', path ? `#${path}` : '#');
  };
  const pathParts = currentPath.split('/');
  const isOrders = currentPath === '' || currentPath === '/';
  const isBilling = pathParts[0] === 'billing';
  const orderId = isBilling ? pathParts[1] : null;

  return (
    <div className="orders-app">
      {isOrders && <OrdersPage onNavigate={navigate} />}
      {isBilling && orderId && <BillingPage orderId={orderId} onNavigate={navigate} />}
    </div>
  );
};

export default App;