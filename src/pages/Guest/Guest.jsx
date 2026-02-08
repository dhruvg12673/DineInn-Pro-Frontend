import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {  ArrowLeft } from 'lucide-react';
import MenuPage from './MenuPage';
import OrderPage from './OrderPage';
import './Guest.css';

// ✅ Define the API URL once using an environment variable for flexibility
const API_URL = process.env.REACT_APP_API_URL || 'https://dineinn-pro-backend.onrender.com';

const Guest = () => {
  const { restaurantId, categoryid, tableNo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [restaurantName, setRestaurantName] = useState(''); // Start with an empty name

  const [currentView, setCurrentView] = useState('grid');
  const [confirmedOrderData, setConfirmedOrderData] = useState(null);

  // ✅ This useEffect is updated to prevent timing issues.
  // It waits for BOTH validation and restaurant details to load before showing the page.
  useEffect(() => {
    const validateAndFetchData = async () => {
      setLoading(true);
      try {
        const decodedTableNo = decodeURIComponent(tableNo);

        // Use Promise.all to run both API requests at the same time
        const [restaurantResponse, validationResponse] = await Promise.all([
          axios.get(`${API_URL}/api/restaurants/${restaurantId}`),
          axios.get(`${API_URL}/api/validate-guest`, {
            params: {
              restaurantid: restaurantId,
              categoryid,
              tablenumber: decodedTableNo,
            },
          })
        ]);

        // Now that BOTH requests are finished, we can safely update the state
        if (restaurantResponse.data && restaurantResponse.data.name) {
          setRestaurantName(restaurantResponse.data.name);
        } else {
          setRestaurantName('Unknown Restaurant');
        }

        if (validationResponse.data.valid) {
          setValid(true);
        } else {
          setErrorMessage(validationResponse.data.message || 'Invalid guest credentials.');
        }

      } catch (error) {
        console.error('Validation or data fetching error:', error);
        setErrorMessage('Failed to load page. Please check your network or try again later.');
      } finally {
        // Set loading to false only after everything is finished
        setLoading(false);
      }
    };

    if (restaurantId && categoryid && tableNo) {
      validateAndFetchData();
    } else {
      setErrorMessage('Missing information in the URL.');
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

  const handleCallWaiter = async () => {
    const payload = {
      restaurantId: restaurantId,
      categoryId: categoryid,
      tableId: tableNo,
    };
    try {
      await axios.post(`${API_URL}/api/notify-waiter`, payload);
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
            restaurantName={restaurantName} // ✅ The correct name is now passed here
          />
        );
      case 'grid':
      default:
        return (
          <div className="app-container">
            <div className="app-header">
              <h1 className="logo">{restaurantName}</h1>
              <p className="welcome-text">Welcome, Guest!</p>
            </div>
            <div className="navigation-grid">
  <button className="nav-button menu" onClick={() => setCurrentView('menu')}>
    <div className="button-icon">🍽️</div>
    <div className="button-text">Menu</div>
  </button>
  
  {/* All these paths now pass the categoryid required by your server.js logic */}
  <button className="nav-button order" onClick={() => navigate(`/guest/YourOrders/${restaurantId}/${categoryid}/${tableNo}`)}>
    <div className="button-icon">📦</div>
    <div className="button-text">Your Orders</div>
  </button>

  <button className="nav-button feedback" onClick={() => navigate(`/guest/FeedbackPage/${restaurantId}/${categoryid}/${tableNo}`)}>
    <div className="button-icon">⭐</div>
    <div className="button-text">Feedback</div>
  </button>

  <button className="nav-button suggestion" onClick={() => navigate(`/guest/TipPage/${restaurantId}/${categoryid}/${tableNo}`)}>
    <div className="button-icon">💰</div>
    <div className="button-text">Add Tip</div>
  </button>

  <button className="nav-button poll" onClick={() => navigate(`/guest/PollsPage/${restaurantId}/${categoryid}/${tableNo}`)}>
    <div className="button-icon">📊</div>
    <div className="button-text">Live Polls</div>
  </button>

  
              <button className="nav-button call-waiter" onClick={handleCallWaiter}>
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

  return (
    <div className="guest-page">
      {renderCurrentView()}
    </div>
  );
};

export default Guest;