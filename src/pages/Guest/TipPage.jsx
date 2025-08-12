import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './TipPage.css';

const API_BASE = 'https://dineinn-pro-backend.onrender.com';

const TipPage = () => {
  const [tipAmount, setTipAmount] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useParams();
  const restaurantId = params.restaurantId;
  const tableNumber = params.tableNo; 

  useEffect(() => {
    if (restaurantId) {
      axios.get(`${API_BASE}/api/staff?restaurantId=${restaurantId}`)
        .then(res => {
          setStaffList(res.data);
        })
        .catch(err => console.error("Failed to fetch staff list:", err));
    }
  }, [restaurantId]);

  const handleSubmit = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      alert('Please enter a valid tip amount.');
      return;
    }
    
    if (!restaurantId || !tableNumber) {
      alert('Error: Missing restaurant or table information in the URL. Cannot proceed.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const orderRes = await axios.get(`${API_BASE}/api/orders/by-table`, {
        params: { restaurantId, tableNumber },
      });
      const activeOrderId = orderRes.data.id;

      if (!activeOrderId) {
        // This case handles if the API returns a success code but no ID.
        alert('Could not find an active bill for this table.');
        setIsSubmitting(false);
        return;
      }
      
      await axios.post(`${API_BASE}/api/tips`, {
        restaurantid: restaurantId,
        staffid: staffId || null,
        orderid: activeOrderId,
        amount: tipAmount
      });

      alert('Thank you! Your tip will be added to your final bill.');

    } catch (error) {
      console.error("Failed to add tip:", error);

      // ✅ IMPROVED ERROR HANDLING: Check for the specific 404 error.
      if (error.response && error.response.status === 404) {
        // This message is much clearer for the guest.
        alert('Could not find an active bill for this table. A tip can only be added before the bill is paid.');
      } else {
        // For all other potential errors (network, server issues, etc.)
        alert('An unexpected error occurred while adding your tip. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tip-page-container">
      <div className="tip-card">
        <div className="tip-header">
          <h1>Add Tip</h1>
          <p>Show your appreciation for great service</p>
        </div>

        <div className="form-group">
          <label className="form-label">Tip Amount</label>
          <div className="input-container">
            <span className="dollar-sign">₹</span>
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

        <div className="form-group">
          <label className="form-label">Waiter/Chef Name (Optional)</label>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="form-select"
          >
            <option value="">Select Staff...</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullname}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleSubmit} className="add-bill-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add to Bill'}
        </button>

        <div className="tip-footer">
          <p>Your tip helps support our amazing team</p>
        </div>
      </div>
    </div>
  );
};

export default TipPage;