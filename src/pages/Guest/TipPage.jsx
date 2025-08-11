import React, { useState } from 'react';
import './TipPage.css';

const TipPage = () => {
  const [tipAmount, setTipAmount] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const serviceOptions = [
    'Taste of Food',
    'Hospitality',
    'Cleanliness',
    'Ambience',
    'Quick Service',
    'Friendliness of Staff',
    'Chef\'s Special',
    'Table Service',
    'Drinks Quality'
  ];

  const handleSubmit = () => {
    if (!tipAmount) {
      alert('Please enter a tip amount');
      return;
    }
    
    console.log({
      tipAmount,
      waiterName,
      selectedService
    });
    
    alert(`Tip of $${tipAmount} added to bill successfully!`);
  };

  return (
    <div className="tip-page-container">
      <div className="tip-card">
        {/* Header */}
        <div className="tip-header">
          <h1>Add Tip</h1>
          <p>Show your appreciation for great service</p>
        </div>

        {/* Tip Amount Input */}
        <div className="form-group">
          <label className="form-label">
            Tip Amount
          </label>
          <div className="input-container">
            <span className="dollar-sign">$</span>
            <input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="0.00"
              className="form-input with-dollar"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Waiter/Chef Name Input */}
        <div className="form-group">
          <label className="form-label">
            Waiter/Chef Name
            <span className="optional-text">(Optional)</span>
          </label>
          <input
            type="text"
            value={waiterName}
            onChange={(e) => setWaiterName(e.target.value)}
            placeholder="Enter name"
            className="form-input"
          />
        </div>

        {/* Service Selection Dropdown */}
        <div className="form-group">
          <label className="form-label">
            Select Service You Liked
          </label>
          <div className="input-container">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="form-select"
            >
              <option value="">Choose a service...</option>
              {serviceOptions.map((service, index) => (
                <option key={index} value={service}>
                  {service}
                </option>
              ))}
            </select>
            <div className="select-arrow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Add to Bill Button */}
        <button
          onClick={handleSubmit}
          className="add-bill-btn"
        >
          Add to Bill
        </button>

        {/* Footer */}
        <div className="tip-footer">
          <p>
            Your tip helps support our amazing team
          </p>
        </div>
      </div>
    </div>
  );
};

export default TipPage;