import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { PlanContext } from './PlanContext';
import ProtectedRoute from './ProtectedRoute';
import './FeedbackReview.css';

const FeedbackCard = ({ feedback }) => (
  <div className="feedback-card">
    <div className="feedback-header">
      <div className="badge-container">
        <span className="date-badge">
          {feedback.date}
        </span>
        <span className="time-badge">
          {feedback.time}
        </span>
      </div>
    </div>
    {/* Use dangerouslySetInnerHTML to render the bold subject from the server */}
    <p className="feedback-text" dangerouslySetInnerHTML={{ __html: feedback.text }} />
  </div>
);

const FeedbackReview = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user data from localStorage to find the restaurantId
  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantId = user?.restaurantid;

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!restaurantId) {
        setError('No restaurant ID found. Please log in.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // The server endpoint already filters by restaurantId
        const res = await axios.get(`https://dineinn-pro-backend.onrender.com/api/feedback`, {
            params: { restaurantId }
        });
        setFeedbackList(res.data);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to fetch feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [restaurantId]); // Re-run effect if restaurantId changes

  if (loading) return <div className="container">Loading feedback...</div>;
  if (error) return <div className="container">Error: {error}</div>;

  return (
    <div className="container">
      <div className="content-wrapper">
        <header className="header">
          <div className="icon-container">
            <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="main-title">Guest Feedback</h1>
          <p className="subtitle">Recent reviews and comments from our valued guests</p>
        </header>
        
        <main className="main-content">
          {feedbackList.length === 0 ? (
            <p>No feedback found for your restaurant.</p>
          ) : (
            feedbackList.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))
          )}
        </main>
        
        <footer className="footer">
          <div className="footer-content">
            <div className="status-dot"></div>
            <span>Showing {feedbackList.length} recent feedback entries</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeedbackReviewPageWithAccess = () => {
  const { setCurrentPlan } = useContext(PlanContext);
  const [loading, setLoading] = useState(true);
  const restaurantId = localStorage.getItem('restaurantId');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`https://dineinn-pro-backend.onrender.com/api/restaurants/${restaurantId}`);
        const data = await res.json();
        if (data.plan) {
          setCurrentPlan(data.plan);
        } else {
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
        setCurrentPlan('free');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [restaurantId, setCurrentPlan]);

  if (loading) return <div>Loading access...</div>;

  return (
    <ProtectedRoute feature="feedback">
      < FeedbackReview />
    </ProtectedRoute>
  );
};

export default FeedbackReview;
