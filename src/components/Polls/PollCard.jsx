import React, { useState } from 'react';

const PollCard = ({ poll }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [voted, setVoted] = useState(false);

  const handleVote = (e) => {
    e.preventDefault();
    if (selectedOption) {
      console.log(`Voted for '${selectedOption}' in poll ${poll.id}`);
      setVoted(true);
    }
  };

  if (voted) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{poll.question}</h3>
        <p className="text-teal-600 font-bold">Thank you for your vote!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{poll.question}</h3>
      <form onSubmit={handleVote}>
        <div className="space-y-3 mb-4">
          {poll.options.map((option) => (
            <label key={option} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`poll-${poll.id}`}
                value={option}
                checked={selectedOption === option}
                onChange={() => setSelectedOption(option)}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
              />
              <span className="ml-3 text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        <div className="text-right">
          <button
            type="submit"
            disabled={!selectedOption}
            className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Submit Vote
          </button>
        </div>
      </form>
    </div>
  );
};

export default PollCard; 