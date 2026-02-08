import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TipPage.css';

const API_BASE = 'http://localhost:5000';

const TipPage = () => {
  const [tipAmount, setTipAmount] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  
  // Extract parameters from the URL as defined in your App.js routes
  const { restaurantId, tableCategoryId, tableNo } = params;

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
    // 1. Validate the tip amount
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      alert('Please enter a valid tip amount.');
      return;
    }
    
    // 2. Ensure all identifying information is present to avoid the 400 Bad Request
    if (!restaurantId || !tableNo || !tableCategoryId) {
      alert('Missing table information. Please re-scan the QR code.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // 3. Find the active unpaid order for this specific table
      // Sending 'tableNo' directly as "Table 2" to match the database 'tablename' column
      const orderRes = await axios.get(`${API_BASE}/api/orders/by-table`, {
        params: { 
          restaurantId, 
          tableNumber: tableNo, 
          tableCategoryId 
        },
      });
      
      const activeOrder = orderRes.data;

      if (!activeOrder || !activeOrder.id) {
        alert('No active bill found for this table.');
        setIsSubmitting(false);
        return;
      }
      
      // 4. Post the tip linked to the active order ID and the selected staff member
      await axios.post(`${API_BASE}/api/tips`, {
        restaurantid: restaurantId,
        staffid: staffId || null, // Links the waiter's name for display on the bill
        orderid: activeOrder.id,
        amount: parseFloat(tipAmount)
      });

      alert(`Success! ₹${tipAmount} has been added to your bill.`);
      
      // Clear form and return to the landing page
      setTipAmount('');
      setStaffId('');
      navigate(-1); 

    } catch (error) {
      console.error("Failed to add tip:", error);
      if (error.response && error.response.status === 400) {
        alert('Request Error: ' + (error.response.data.error || 'Check table settings.'));
      } else {
        alert('Could not add tip. Please ensure you have an active order.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tip-page-container">
      {/* Animated Background Elements */}
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
      </div>

      <div className="tip-card">
        <div className="tip-header">
          <h1>Add Tip</h1>
          <p>Your tip will be added to the final bill for {tableNo}</p>
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
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Select Waiter (Optional)</label>
          <div className="select-wrapper">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="form-select"
            >
              <option value="">Choose Waiter...</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullname}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          className="add-bill-btn" 
          disabled={isSubmitting || !tipAmount}
        >
          {isSubmitting ? 'Adding...' : 'Add to Bill'}
        </button>

        <div className="tip-footer">
          <p>This amount will be included in your final payment.</p>
        </div>
      </div>
    </div>
  );
};

export default TipPage;