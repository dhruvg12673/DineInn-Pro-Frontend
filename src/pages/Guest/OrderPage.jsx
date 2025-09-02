import React, { useState } from 'react';
import { Clock, CheckCircle, User, MapPin, ChevronDown, ChevronUp, Eye, ArrowLeft } from 'lucide-react';
import './OrderPage.css';

// ✅ 1. ACCEPT 'restaurantName' AS A PROP
const OrderPage = ({ onBackToMenu, orderData, tableNo, restaurantName }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (!orderData) return null;

  return (
    <div className="order-page-container">
      <div className="order-header">
        <div className="header-top">
          <button onClick={onBackToMenu} className="back-btn">
            <ArrowLeft className="back-icon" />
            Back to Options
          </button>
          <div className="header-content">
            <h1 className="page-title">Order Confirmation</h1>
            
            {/* ✅ 2. DISPLAY THE DYNAMIC RESTAURANT NAME */}
            <p className="page-subtitle">{restaurantName || 'Restaurant'} • {tableNo || ''}</p>

          </div>
        </div>
        
        <div className="success-message">
          <CheckCircle className="success-icon" />
          <div className="success-content">
            <h3>Order Placed Successfully!</h3>
            <p>Your order has been sent to the kitchen. Estimated preparation time: 20-25 minutes.</p>
          </div>
        </div>
      </div>

      {/* ... (rest of the JSX is unchanged) ... */}
       <div className="orders-content">
        <div className="order-card single-order">
          <div className="order-header-section">
            <div className="order-main-info">
              <div className="order-id-section">
                <h3 className="order-id">{orderData.id}</h3>
                <div className="order-status status-preparing">
                  <Clock className="status-icon" />
                  <span className="status-text">Preparing</span>
                </div>
              </div>
              <div className="order-details">
                <div className="detail-item">
                  <User className="detail-icon" />
                  <span>{orderData.customerName}</span>
                </div>
                <div className="detail-item">
                  <MapPin className="detail-icon" />
                  <span>Table {tableNo || ''}</span>
                </div>
                <div className="detail-item">
                  <Clock className="detail-icon" />
                  <span>{new Date(orderData.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <div className="order-summary">
              <div className="order-amount">${orderData.totalAmount.toFixed(2)}</div>
              <div className="order-items-count">{orderData.itemCount} items</div>
            </div>
            <button 
              onClick={() => toggleOrderExpansion(orderData.id)}
              className="expand-btn"
            >
              <Eye className="expand-icon" />
              {expandedOrder === orderData.id ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
          {expandedOrder === orderData.id && (
            <div className="order-expanded-content">
              <h4 className="section-title">Order Items</h4>
              <div className="items-list">
                {orderData.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">×{item.quantity}</span>
                    </div>
                    <div className="item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPage;