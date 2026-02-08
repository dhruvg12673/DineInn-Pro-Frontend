import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socketService } from '../../services/socketService'; // Adjust path if needed
import './NotificationLog.css'; // Adjust path if needed

// Helper function to get the current user's restaurant ID
const getRestaurantId = () => {
  try {
    // Make sure the key 'user' matches what you use in localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.restaurantid : null;
  } catch (error) {
    console.error("Could not parse user from localStorage", error);
    return null;
  }
};

const NotificationLog = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const restaurantId = getRestaurantId();

  // Handles the "Done" button click to delete a notification
  const handleMarkAsDone = async (idToDelete) => {
    if (!idToDelete) {
      console.error("Delete failed: ID is undefined.");
      return;
    }

    const originalNotifications = [...notifications];
    // Optimistically remove from UI for a responsive feel
    setNotifications(prev => prev.filter(n => n.id !== idToDelete));

    try {
      await axios.delete(`http://localhost:5000/api/waiter-calls/${idToDelete}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // If the server fails, restore the notification to the UI
      setNotifications(originalNotifications);
    }
  };

  useEffect(() => {
    // 1. Fetch historical notifications from the database when the page loads
    const fetchStoredNotifications = async () => {
      if (!restaurantId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/waiter-calls', {
          params: { restaurantId },
        });
        const formatted = response.data.map(call => ({
          id: call.id,
          restaurantId: call.restaurant_id,
          categoryId: call.category_id,
          tableId: call.table_id,
          timestamp: new Date(call.created_at),
        }));
        setNotifications(formatted);
      } catch (error) {
        console.error('Failed to fetch stored notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoredNotifications();

    // 2. Get the existing global socket connection from the service
    const socket = socketService.getSocket();
    if (!socket) {
      console.log("NotificationLog: Socket not yet connected.");
      return;
    }

    // 3. Add a listener specifically to update this component's UI
    const handleUiUpdate = (newCallData) => {
      // Check if the incoming notification belongs to this restaurant
      if (newCallData.restaurant_id === restaurantId) {
        const newNotification = {
          id: newCallData.id,
          restaurantId: newCallData.restaurant_id,
          categoryId: newCallData.category_id,
          tableId: newCallData.table_id,
          timestamp: new Date(newCallData.created_at),
        };
        // Add the new notification to the top of the list
        setNotifications(prev => [newNotification, ...prev]);
      }
    };

    socket.on('waiter-call', handleUiUpdate);

    // 4. Clean up this specific listener when the component unmounts
    return () => {
      if (socket) {
        socket.off('waiter-call', handleUiUpdate);
      }
    };
  }, [restaurantId]); // Re-run effect if the user/restaurant changes

  if (loading) {
    return <div className="notification-log-container"><p>Loading notifications...</p></div>;
  }

  return (
    <div className="notification-log-container">
      <div className="notification-log-header">
        <h1>Notification Log</h1>
        {restaurantId && <p>Showing "Call Waiter" requests for Restaurant ID: {restaurantId}.</p>}
      </div>
      <div className="notification-log-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-log-item">
              <div className="notification-icon">🛎️</div>
              <div className="notification-details">
                <p className="notification-message">
                  <strong>Waiter call for Table:</strong> {notification.tableId}
                </p>
              </div>
              <div className="notification-timestamp">
                {notification.timestamp.toLocaleTimeString()}
              </div>
              <div className="notification-actions">
                <button
                  onClick={() => handleMarkAsDone(notification.id)}
                  className="done-button"
                >
                  Done
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <p>No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationLog;