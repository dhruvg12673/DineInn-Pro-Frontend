import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, User, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import './OrderPage.css'; // Reuse the CSS from OrderPage

const YourOrdersPage = () => {
  const { restaurantId, categoryid, tableNo } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders function
  const fetchOrders = async () => {
    if (!restaurantId || !tableNo) {
      setError("Missing restaurant or table information.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get('https://dineinn-pro-backend.onrender.com/api/orders/by-table', {
        params: { restaurantId, tableNumber: tableNo }
      });

      const data = response.data;
      if (data && !Array.isArray(data)) {
        setOrders([data]); // normalize single object to array
      } else {
        setOrders(data || []);
      }
      setError(null);
    } catch (err) {
      setError('Could not fetch your orders. Please try again later.');
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch + auto refresh every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // auto-refresh every 5 sec
    return () => clearInterval(interval); // cleanup on unmount
  }, [restaurantId, tableNo]);

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
            <p className="page-subtitle">Bella Vista • Table {tableNo}</p>
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default YourOrdersPage;
