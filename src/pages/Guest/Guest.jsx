import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import MenuPage from './MenuPage'; // Make sure path is correct
import OrderPage from './OrderPage'; // Make sure path is correct
import './Guest.css';

const Guest = () => {
  const { restaurantId, categoryid, tableNo } = useParams();
  const navigate = useNavigate();

  // State for the initial validation flow
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [restaurantName, setRestaurantName] = useState('The Bistro');

  // New state to manage which view to show after validation
  const [currentView, setCurrentView] = useState('grid'); // 'grid', 'menu', or 'order'
  const [confirmedOrderData, setConfirmedOrderData] = useState(null);

  useEffect(() => {
    const validateGuest = async () => {
      try {
        const decodedTableNo = decodeURIComponent(tableNo);
        const restaurantResponse = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}`);
if (restaurantResponse.data && restaurantResponse.data.name) {
  setRestaurantName(restaurantResponse.data.name);
} else {
  setRestaurantName('Unknown Restaurant'); // Fallback if name not found
}
        const response = await axios.get('https://dineinn-pro-backend.onrender.com/api/validate-guest', {
          params: {
            restaurantid: restaurantId,
            categoryid,
            tablenumber: decodedTableNo,
          },
        });
        if (response.data.valid) {
          setValid(true);
        } else {
          setErrorMessage(response.data.message || 'Invalid guest credentials.');
        }
      } catch (error) {
        console.error('Validation error:', error);
        setErrorMessage('Failed to validate guest. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId && categoryid && tableNo) {
      validateGuest();
    } else {
      setErrorMessage('Missing URL parameters.');
      setLoading(false);
    }
  }, [restaurantId, categoryid, tableNo]);

  const handleOrderSuccess = (orderData) => {
    setConfirmedOrderData(orderData);
    setCurrentView('order'); // Switch to the order confirmation view
  };

  const handleBackToMenu = () => {
    setConfirmedOrderData(null);
    setCurrentView('grid'); // Go back to the main navigation grid
  };

  // Function to call the waiter
  const handleCallWaiter = async () => {
    const payload = {
      restaurantId: restaurantId,
      categoryId: categoryid,
      tableId: tableNo,
    };

    try {
      await axios.post('https://dineinn-pro-backend.onrender.com/api/notify-waiter', payload);
      alert('Waiter has been called.');
    } catch (error) {
      console.error('Error calling waiter:', error);
      alert('Failed to call waiter.');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <MenuPage
            restaurantId={restaurantId}
            categoryid={categoryid}
            tableNo={tableNo}
            onOrderSuccess={handleOrderSuccess}
          />
        );
      case 'order':
        return (
          <OrderPage
            orderData={confirmedOrderData}
            onBackToMenu={handleBackToMenu}
            tableNo={tableNo}
          />
        );
      case 'grid':
      default:
        // This is your original navigation grid UI
        return (
          <div className="app-container">
            <div className="app-header">
              <h1 className="logo">{restaurantName}</h1>
              <p className="welcome-text">Welcome, Guest!</p>
            </div>
            <div className="navigation-grid">
              <button
                className="nav-button menu"
                onClick={() => setCurrentView('menu')} // Clicking this switches to the MenuPage
              >
                <div className="button-icon">🍽️</div>
                <div className="button-text">Menu</div>
              </button>
              <button
                className="nav-button order"
                onClick={() => navigate(`/guest/YourOrders/${restaurantId}/${categoryid}/${tableNo}`)}
              >
                <div className="button-icon">📦</div>
                <div className="button-text">Your Order</div>
              </button>
              <button
                className="nav-button feedback"
                onClick={() => navigate(`/guest/FeedbackPage/${restaurantId}/${categoryid}/${tableNo}`)}
              >
                <div className="button-icon">⭐</div>
                <div className="button-text">Feedback</div>
              </button>
              <button
                className="nav-button suggestion"
                onClick={() => navigate(`/guest/TipPage/${restaurantId}/${categoryid}/${tableNo}`)}
              >
                <div className="button-icon">💡</div>
                <div className="button-text">Tip</div>
              </button>
              <button
                className="nav-button poll"
                onClick={() => navigate(`/guest/PollsPage/${restaurantId}/${categoryid}/${tableNo}`)}
              >
                <div className="button-icon">📊</div>
                <div className="button-text">Poll</div>
              </button>
              {/* Added "Call Waiter" button */}
              <button
                className="nav-button call-waiter"
                onClick={handleCallWaiter}
              >
                <div className="button-icon">🛎️</div>
                <div className="button-text">Call Waiter</div>
              </button>
            </div>
            <div className="footer-text">Enjoy your dining experience with us!</div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="guest-page">
        <div className="loading">Validating access, please wait...</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="guest-page">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>{errorMessage}</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  // If validated, render the view based on the current state
  return (
    <div className="guest-page">
      {renderCurrentView()}
    </div>
  );
};

export default Guest;