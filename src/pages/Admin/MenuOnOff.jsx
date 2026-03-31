import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, List } from 'lucide-react';
import './MenuOnOff.css';

const API_URL = 'https://dineinn-pro-backend.onrender.com'; // Your backend URL

const MenuOnOff = () => {
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantId = user?.restaurantid;

  const fetchMenuData = useCallback(async () => {
    if (!restaurantId) {
      setError("Login session expired or Restaurant ID not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/menuitems-grouped`, {
        params: {
          restaurantId,
          show_all: true, // This ensures we fetch both available and unavailable items
        },
      });
      setMenuData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch menu data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const handleToggle = async (itemId) => {
    try {
      // Optimistic UI update for instant feedback
      setMenuData(prevData =>
        prevData.map(category => ({
          ...category,
          items: category.items.map(item =>
            item.id === itemId ? { ...item, is_available: !item.is_available } : item
          ),
        }))
      );

      // Make the API call to update the backend
      await axios.put(`${API_URL}/api/menuitems/${itemId}/toggle`, { restaurantId });
      setLastUpdated(new Date());
    } catch (err) {
      alert(`Error updating item: ${err.response?.data?.error || err.message}`);
      // If the API call fails, revert the change by re-fetching data
      fetchMenuData();
    }
  };

  const getStats = () => {
    let total = 0;
    let available = 0;
    menuData.forEach(category => {
      total += category.items.length;
      available += category.items.filter(item => item.is_available).length;
    });
    const unavailable = total - available;
    return { total, available, unavailable };
  };

  const stats = getStats();

  if (!restaurantId) {
    return <div className="menu-manager empty-state">Please log in to manage your menu.</div>;
  }

  if (isLoading) {
    return <div className="menu-manager empty-state">Loading menu...</div>;
  }

  if (error) {
    return <div className="menu-manager empty-state">{error}</div>;
  }

  return (
    <div className="menu-manager">
      <header className="header">
        <div className="header-content">
          <h1><List /> Menu Availability</h1>
          <div className="header-actions">
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button onClick={fetchMenuData} className="refresh-btn">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </header>
      
      <div className="stats-summary">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>{stats.total}</h3>
            <p>Total Items</p>
          </div>
          <div className="stat-item">
            <h3 style={{ color: '#059669' }}>{stats.available}</h3>
            <p>Available</p>
          </div>
          <div className="stat-item">
            <h3 style={{ color: '#dc2626' }}>{stats.unavailable}</h3>
            <p>Unavailable</p>
          </div>
        </div>
      </div>

      {menuData.length === 0 ? (
        <div className="empty-state">No menu items found. Add items in the Menu Editor.</div>
      ) : (
        <div className="categories-grid">
          {menuData.map((category) => (
            <section key={category.category} className="category-section">
              <div className="category-header">
                <h2>{category.category}</h2>
                <span className="category-count">{category.items.length} items</span>
              </div>
              <div className="items-container">
                {category.items.length > 0 ? (
                  category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`item-card ${item.is_available ? 'available' : 'unavailable'}`}
                    >
                      <div className="item-info">
                        <p className={`item-name ${!item.is_available ? 'unavailable' : ''}`}>
                          {item.name}
                        </p>
                         <div className={`status-label ${item.is_available ? 'available' : 'unavailable'}`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`toggle-switch ${item.is_available ? 'active' : ''}`}
                        aria-label={`Toggle ${item.name}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No items in this category.</div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuOnOff;