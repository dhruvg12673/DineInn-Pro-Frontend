import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './PollsPage.css';
import {  ArrowLeft } from 'lucide-react';
const PollsPage = () => {
  const { restaurantId } = useParams();
  const [filter, setFilter] = useState('active');

  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW: State to track which polls have been voted on
  const [votedPolls, setVotedPolls] = useState({});
  const [isVoting, setIsVoting] = useState(null); // Tracks the ID of the option being voted on

  useEffect(() => {
    if (!restaurantId) {
      setIsLoading(false);
      setError("Restaurant ID is missing.");
      return;
    }
    const fetchPolls = async () => {
      try {
        const response = await axios.get('https://dineinn-pro-backend.onrender.com/api/polls', {
          params: { restaurantId }
        });
        setPolls(response.data);
      } catch (err) {
        setError("Could not fetch polls.");
        console.error("Failed to fetch polls:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolls();
  }, [restaurantId]);

  // NEW: handleVote function is now inside PollsPage
  const handleVote = async (pollId, optionId) => {
    if (votedPolls[pollId] || isVoting) return;

    setIsVoting(optionId);
    try {
      await axios.put(`https://dineinn-pro-backend.onrender.com/api/poll-options/vote/${optionId}`);

      // Update the state of the specific poll that was voted on
      setPolls(currentPolls =>
        currentPolls.map(p => {
          if (p.id === pollId) {
            const newTotalVotes = p.totalVotes + 1;
            const newOptions = p.options.map(opt =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            );
            return { ...p, options: newOptions, totalVotes: newTotalVotes };
          }
          return p;
        })
      );
      
      // Mark this poll as voted
      setVotedPolls(prev => ({ ...prev, [pollId]: true }));

    } catch (error) {
      console.error("Failed to submit vote:", error);
      alert("Could not submit your vote. Please try again.");
    } finally {
      setIsVoting(null);
    }
  };

  const filteredPolls = polls.filter(poll =>
    filter === 'all' ? true : poll.status === filter
  );

  if (isLoading) {
    return <div className="loading">Loading polls...</div>;
  }
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="polls-container-wrapper">
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
        <div className="floating-element floating-element-4"></div>
      </div>

      <header className="polls-header">
        <h1 className="polls-title">Community Polls</h1>
        <p className="polls-subtitle">
          Help us make your experience even better with your valuable feedback.
        </p>
      </header>

      <main className="polls-main-content">
        <div className="tab-switcher">
          <button
            className={`tab-button ${filter === 'active' ? 'tab-button-active' : 'tab-button-inactive'}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`tab-button ${filter === 'closed' ? 'tab-button-active' : 'tab-button-inactive'}`}
            onClick={() => setFilter('closed')}
          >
            Closed
          </button>
          <button
            className={`tab-button ${filter === 'all' ? 'tab-button-active' : 'tab-button-inactive'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>

        {filteredPolls.length > 0 ? (
          <div className="polls-grid">
            {filteredPolls.map((poll) => {
              const hasVoted = !!votedPolls[poll.id];
              return (
                <div key={poll.id} className={`poll-card ${hasVoted ? 'voted' : ''}`}>
                  <div className="poll-card-content">
                    <h3 className="poll-question">{poll.question}</h3>
                    <div className="poll-options">
                      {poll.options.map((option) => {
                        const percentage = poll.totalVotes > 0 
                          ? Math.round((option.votes / poll.totalVotes) * 100) 
                          : 0;
                        return (
                          <button
                            key={option.id}
                            className="poll-option"
                            onClick={() => handleVote(poll.id, option.id)}
                            disabled={hasVoted || isVoting}
                          >
                            <span className="option-text">{option.text}</span>
                            {hasVoted && (
                              <span className="option-percentage">{percentage}%</span>
                            )}
                            {hasVoted && (
                              <div
                                className="percentage-bar"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="poll-footer">
                      <span>Total Votes: {poll.totalVotes}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-polls">
            <h3>No polls available</h3>
            <p>There are no {filter} polls at the moment. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PollsPage;