import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PollManager.css';

const PollCard = ({ poll, onDelete }) => {
  const getPercentage = (votes) => {
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'closed': return 'status-closed';
      case 'draft': return 'status-draft';
      default: return 'status-draft';
    }
  };

  // Handler to call the onDelete function passed from the parent
  const handleDeleteClick = () => {
    // A confirmation dialog to prevent accidental deletions
    if (window.confirm(`Are you sure you want to permanently delete this poll?\n\n"${poll.question}"`)) {
      onDelete(poll.id);
    }
  };

  return (
    <div className="poll-card">
      <div className="poll-image">
        <img
          src={poll.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop'}
          alt="Poll visual"
        />
        {/* The status badge is now a button if the poll is active */}
        <div 
          className={`poll-status ${getStatusColor(poll.status)} ${poll.status === 'active' ? 'deletable' : ''}`}
          onClick={poll.status === 'active' ? handleDeleteClick : null}
          title={poll.status === 'active' ? 'Click to delete this poll' : `Status: ${poll.status}`}
        >
          {(poll.status || 'draft').toUpperCase()}
        </div>
      </div>

      <div className="poll-content">
        <div className="poll-header">
          <h3 className="poll-question">{poll.question}</h3>
          <div className="poll-meta">
            <span className="poll-options">{poll.options.map(opt => opt.text).join(', ')}</span>
            <span className="poll-votes">Votes: {poll.totalVotes}</span>
          </div>
        </div>

        <div className="poll-results">
          {poll.options.map((option, index) => {
            const percentage = getPercentage(option.votes);
            return (
              <div key={index} className="result-item">
                <div className="result-header">
                  <span className="option-name">{option.text}</span>
                  <span className="option-percentage">{percentage}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="poll-actions">
          <button className="view-poll-btn">View Poll</button>
        </div>
      </div>
    </div>
  );
};

const CreatePollModal = ({ isOpen, onClose, onPollCreated }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const restaurantId = localStorage.getItem('restaurantId');

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) {
      alert('Restaurant ID not found. Please login again.');
      return;
    }

    try {
      const filteredOptions = options.filter(opt => opt.trim());
      if (!question.trim() || filteredOptions.length < 2) {
        alert('Please enter a question and at least 2 options.');
        return;
      }

      await axios.post('https://dineinn-pro-backend.onrender.com/api/polls', {
        restaurantId,
        question,
        options: filteredOptions
      });

      setQuestion('');
      setOptions(['', '', '']);
      onPollCreated();
      onClose();
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Poll</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="poll-form">
          <div className="form-group">
            <label htmlFor="question">Poll Question</label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your poll question..."
              required
            />
          </div>

          <div className="form-group">
            <label>Poll Options</label>
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required={index < 2}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="remove-option-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button type="button" onClick={addOption} className="add-option-btn">
                + Add Option
              </button>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="create-btn">Create Poll</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PollManager = () => {
  const [polls, setPolls] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const restaurantId = localStorage.getItem('restaurantId');

  const fetchPolls = async () => {
    if (!restaurantId) {
      alert('Restaurant ID not found. Please login.');
      return;
    }

    try {
      const res = await axios.get(`https://dineinn-pro-backend.onrender.com/api/polls?restaurantId=${restaurantId}`);
      setPolls(res.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
      alert('Failed to fetch polls. Check console or server.');
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Function to handle the deletion of a poll
  const handleDeletePoll = async (pollId) => {
    try {
      // Make the API call to the new DELETE endpoint
      await axios.delete(`https://dineinn-pro-backend.onrender.com/api/polls/${pollId}`);
      
      // Update the UI by filtering out the deleted poll from the state
      setPolls(currentPolls => currentPolls.filter(poll => poll.id !== pollId));
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete the poll. Please try again.');
    }
  };

  return (
    <div className="poll-manager">
      <header className="page-header">
        <h1 className="page-title">Poll Manager</h1>
        <button onClick={() => setIsModalOpen(true)} className="create-poll-btn">
          Create New Poll
        </button>
      </header>

      <main className="polls-grid">
        {polls.length === 0 ? (
          <p>No polls available. Create one!</p>
        ) : (
          polls.map((poll) => (
            <PollCard 
              key={poll.id} 
              poll={poll} 
              onDelete={handleDeletePoll} // Pass the delete handler to the card
            />
          ))
        )}
      </main>

      <CreatePollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPollCreated={fetchPolls}
      />
    </div>
  );
};

export default PollManager;
