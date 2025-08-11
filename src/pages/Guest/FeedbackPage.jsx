import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './FeedbackPage.css';

const FeedbackPage = () => {
  // Get both restaurantId and tableid from the URL params
  const { restaurantId, tableid } = useParams(); 

  const [activeTab, setActiveTab] = useState('feedback');
  const [formData, setFormData] = useState({
    rating: 0,
    subject: '',
    message: '',
    isAnonymous: false,
    wouldRecommend: null,
    visitFrequency: ''
  });

  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const resetForm = () => {
    setFormData({
      rating: 0,
      subject: '',
      message: '',
      isAnonymous: false,
      wouldRecommend: null,
      visitFrequency: ''
    });
    setHoveredStar(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // The restaurantId is now taken directly from the URL.
    if (!restaurantId) {
      alert('Restaurant ID is missing from the URL.');
      return;
    }

    if (!formData.message.trim()) {
      alert('Please enter your feedback message.');
      return;
    }

    try {
      const payload = {
        restaurantid: parseInt(restaurantId), // Use restaurantId from URL
        tableid: tableid ? parseInt(tableid) : null,
        type: activeTab,
        message: formData.message.trim(),
        rating: formData.rating,
        subject: formData.subject.trim(),
        is_anonymous: formData.isAnonymous, // Corrected key to match server
        would_recommend: formData.wouldRecommend, // Corrected key to match server
        visit_frequency: formData.visitFrequency // Corrected key to match server
      };

      // Ensure your server is running and accessible at this URL
      await axios.post('https://dineinn-pro-backend.onrender.com/api/feedback', payload);

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="feedback-container-submitted">
        <div className="success-screen">
          <div className="success-icon">
            <span className="success-icon-text">✓</span>
          </div>
          <h2 className="success-title">Thank You!</h2>
          <p className="success-message">
            Your {activeTab} has been submitted successfully!
          </p>
          <button
            className="success-button"
            onClick={() => {
              setSubmitted(false);
              resetForm();
            }}
          >
            Submit Another {activeTab === 'feedback' ? 'Feedback' : 'Idea'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
        <div className="floating-element floating-element-4"></div>
      </div>

      <header className="header">
        <h1 className="header-title">
          Your Voice Matters!
        </h1>
        <p className="header-subtitle">
          Share your thoughts with us!
        </p>
      </header>

      <main className="main-content">
        <div className="content-container">
          <div className="tab-switcher">
            <button
              className={`tab-button ${activeTab === 'feedback' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('feedback')}
            >
              Feedback
            </button>
            <button
              className={`tab-button ${activeTab === 'suggestions' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('suggestions')}
            >
              Ideas
            </button>
          </div>

          <div className="form-container">
            <div className="form-content">
              <div className="form-header">
                <h3 className="form-title">
                  {activeTab === 'feedback' ? 'How was your experience?' : 'Share Your Ideas'}
                </h3>
                <p className="form-subtitle">
                  {activeTab === 'feedback'
                    ? 'Tell us about your experience!'
                    : 'Share your brilliant ideas!'
                  }
                </p>
              </div>

              <div className="toggle-container">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleInputChange}
                    className="toggle-input"
                  />
                  <div className="toggle-slider"></div>
                  <span className="toggle-text">
                    {formData.isAnonymous ? 'Anonymous' : 'Show my info'}
                  </span>
                </label>
              </div>

              <div className="input-wrapper">
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder={activeTab === 'feedback' ? 'Quick summary...' : 'Your idea in a nutshell...'}
                  className="input-field"
                  required
                />
              </div>

              <div className="input-wrapper">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={activeTab === 'feedback'
                    ? 'Tell us everything about your experience...'
                    : 'Share your brilliant idea...'
                  }
                  className="textarea-field"
                  required
                ></textarea>
              </div>

              {activeTab === 'feedback' && (
                <div className="additional-questions">
                  <div>
                    <label className="question-label">
                      Would you recommend us?
                    </label>
                    <div className="radio-group">
                      {[
                        { value: 'yes', label: 'Yes, definitely!' },
                        { value: 'maybe', label: 'Maybe' },
                        { value: 'no', label: 'Not really' }
                      ].map((option) => (
                        <label key={option.value} className="radio-option">
                          <input
                            type="radio"
                            name="wouldRecommend"
                            value={option.value}
                            checked={formData.wouldRecommend === option.value}
                            onChange={handleInputChange}
                            className="radio-input"
                          />
                          <div className={`radio-circle ${
                            formData.wouldRecommend === option.value
                              ? 'radio-circle-checked'
                              : ''
                          }`}>
                            {formData.wouldRecommend === option.value && (
                              <div className="radio-dot"></div>
                            )}
                          </div>
                          <span className="radio-label">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="input-wrapper">
                    <select
                      name="visitFrequency"
                      value={formData.visitFrequency}
                      onChange={handleInputChange}
                      className="select-field"
                    >
                      <option value="">How often do you visit?</option>
                      <option value="first-time">First time here</option>
                      <option value="weekly">Weekly regular</option>
                      <option value="monthly">Monthly visitor</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="rarely">Rarely</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="button-secondary"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="button-primary"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeedbackPage;
