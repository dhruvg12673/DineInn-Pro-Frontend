import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, User, MapPin, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons
import './OrderPage.css'; // Reuse the CSS from OrderPage

const YourOrdersPage = () => {
  const { restaurantId, categoryid, tableNo } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantName, setRestaurantName] = useState('Your Restaurant'); // New state for restaurant name
  const [visibleItemsOrderId, setVisibleItemsOrderId] = useState(null); // State to track which order's items are visible

  // Fetch orders and restaurant name function
  const fetchData = async () => {
    if (!restaurantId || !tableNo) {
      setError("Missing restaurant or table information.");
      setIsLoading(false);
      return;
    }
    try {
      // Fetch restaurant name
      const restaurantResponse = await axios.get(`https://dineinn-pro-backend.onrender.com/api/restaurants/${restaurantId}`);
      if (restaurantResponse.data && restaurantResponse.data.name) {
        setRestaurantName(restaurantResponse.data.name);
      } else {
        setRestaurantName('Unknown Restaurant');
      }

      // Fetch orders
      const ordersResponse = await axios.get('https://dineinn-pro-backend.onrender.com/api/orders/by-table', {
        params: { restaurantId, tableNumber: tableNo }
      });

      const data = ordersResponse.data;
      if (data && !Array.isArray(data)) {
        setOrders([data]); // normalize single object to array
      } else {
        setOrders(data || []);
      }
      setError(null);
    } catch (err) {
      setError('Could not fetch your orders or restaurant details. Please try again later.');
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch + auto refresh every 5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // auto-refresh every 5 sec
    return () => clearInterval(interval); // cleanup on unmount
  }, [restaurantId, tableNo]); // Re-run effect if these params change

  // Function to toggle visibility of ordered items for a specific order
  const toggleItemsVisibility = (orderId) => {
    setVisibleItemsOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  if (isLoading) {
    return <div className="loading">Loading your orders...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="order-page-container">
      <div className="order-header">
        <div className="header-top">
          <button 
            onClick={() => navigate(`/guest/${restaurantId}/${categoryid}/${tableNo}`)} 
            className="back-btn"
          >
            <ArrowLeft className="back-icon" />
            Back to Options
          </button>
          <div className="header-content">
            <h1 className="page-title">Your Orders</h1>
            <p className="page-subtitle">{restaurantName} • {tableNo}</p> {/* Display dynamic restaurant name */}
          </div>
        </div>
      </div>

      <div className="orders-content">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No orders found for this table.</h3>
            <p>Place an order from the menu to see it here.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card single-order" style={{ marginBottom: '20px' }}>
              <div className="order-header-section">
                <div className="order-main-info">
                  <div className="order-id-section">
                    <h3 className="order-id">{order.billno}</h3>
                    <div className={`order-status status-${order.status}`}>
                      {order.ispaid ? (
                        <CheckCircle className="status-icon" />
                      ) : (
                        <Clock className="status-icon" />
                      )}
                      <span className="status-text">
                        {order.ispaid
                          ? 'Paid'
                          : order.status
                            ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                            : 'Preparing'}
                      </span>
                    </div>
                  </div>
                  <div className="order-details">
                    <div className="detail-item">
                      <User className="detail-icon" />
                      <span>{order.customername || 'Guest'}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin className="detail-icon" />
                      <span>Table {order.tablenumber}</span>
                    </div>
                    <div className="detail-item">
                      <Clock className="detail-icon" />
                      <span>
                        {order.orderdate
                          ? new Date(order.orderdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="order-summary">
                  <div className="order-amount">
                    ₹{parseFloat(order.totalamount || 0).toFixed(2)}
                  </div>
                  <div className="order-items-count">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  {/* Eye button to toggle ordered items visibility */}
                  <button 
                    className="view-items-button" 
                    onClick={() => toggleItemsVisibility(order.id)}
                    title={visibleItemsOrderId === order.id ? "Hide Items" : "View Items"}
                  >
                    {visibleItemsOrderId === order.id ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Display Ordered Items - conditionally rendered */}
              {order.items && order.items.length > 0 && visibleItemsOrderId === order.id && (
                <div className="ordered-items-section">
                  <h4 className="items-section-title">Ordered Items:</h4>
                  <ul className="ordered-items-list">
                    {order.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="ordered-item">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.item_name}</span>
                        <span className="item-price">₹{parseFloat(item.price_at_order * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default YourOrdersPage;
