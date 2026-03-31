import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './QRGenerator.css'; // Using the same CSS as your original file

const Cashflow = () => {
  // State for data, loading, and errors
  const [billedAmounts, setBilledAmounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ totalBilled: 0, totalExpenses: 0, totalProfit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('today');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  const restaurantId = localStorage.getItem('restaurantId');
  const API_BASE_URL = 'https://dineinn-pro-backend.onrender.com';

  // Helper function to get date range based on filter
  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const formatDate = (date) => date.toISOString().split('T')[0];

    switch (selectedDateFilter) {
      case 'today':
        return { start: formatDate(today), end: formatDate(today) };
      case 'yesterday':
        return { start: formatDate(yesterday), end: formatDate(yesterday) };
      case 'last7days':
        return { start: formatDate(lastWeek), end: formatDate(today) };
      case 'custom':
        return { start: customFromDate, end: customToDate };
      default:
        return { start: formatDate(today), end: formatDate(today) };
    }
  };

  // Effect to fetch data when date filters or restaurantId change
  useEffect(() => {
    const { start, end } = getDateRange();

    if (!restaurantId || !start || !end) {
        // Don't fetch if required parameters are missing
        if(!restaurantId) setError("Restaurant ID not found. Please log in.");
        return;
    }

    const fetchFinancials = async () => {
      setIsLoading(true);
      setError('');
      try {
        // This function calls the /api/financials endpoint on the server
        const response = await axios.get(`${API_BASE_URL}/api/financials`, {
          params: {
            restaurantId,
            startDate: start,
            endDate: end,
          },
        });
        const { summary, billedAmounts, expenses } = response.data;
        setTotals(summary);
        setBilledAmounts(billedAmounts);
        setExpenses(expenses);
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
        setError('Could not load financial data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancials();
  }, [restaurantId, selectedDateFilter, customFromDate, customToDate]);


  // Memoized filtering for search functionality on the frontend
  const filteredData = useMemo(() => {
    const filterBySearch = (items, searchFields) => {
      if (!searchTerm) return items;
      return items.filter(item =>
        searchFields.some(field =>
          item[field]?.toString()?.toLowerCase().includes(searchTerm?.toLowerCase())
        )
      );
    };

    return {
      filteredBilled: filterBySearch(billedAmounts, ['invoiceNo', 'customerName']),
      filteredExpenses: filterBySearch(expenses, ['description', 'paidTo']),
    };
  }, [searchTerm, billedAmounts, expenses]);


  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Helper function to format dates for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // The UI remains unchanged from your original file
  return (
    <div className="cashflow-container">
      {/* Header Section */}
      <div className="cashflow-header">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon profit">💰</div>
              <div className="stat-info">
                <h3>Total Profit</h3>
                <p>{formatCurrency(totals.totalProfit)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon billed">📈</div>
              <div className="stat-info">
                <h3>Total Billed Amount</h3>
                <p>{formatCurrency(totals.totalBilled)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon expenses">📉</div>
              <div className="stat-info">
                <h3>Total Expenses</h3>
                <p>{formatCurrency(totals.totalExpenses)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer, invoice, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-filter">
            <div className="date-quick-buttons">
              {['today', 'yesterday', 'last7days', 'custom'].map(filter => (
                <button
                  key={filter}
                  className={`quick-btn ${selectedDateFilter === filter ? 'active' : ''}`}
                  onClick={() => setSelectedDateFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1).replace('7', ' 7 ')}
                </button>
              ))}
            </div>
            {selectedDateFilter === 'custom' && (
              <div className="date-inputs">
                <input type="date" className="date-input" value={customFromDate} onChange={(e) => setCustomFromDate(e.target.value)} />
                <span>to</span>
                <input type="date" className="date-input" value={customToDate} onChange={(e) => setCustomToDate(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && <div className="loading-state">Loading financial data...</div>}
      {error && <div className="error-state">{error}</div>}

      {/* Lists Container */}
      {!isLoading && !error && (
        <div className="lists-container">
          {/* Cash In List */}
          <div className="list-section">
            <div className="list-header"><h2 className="list-title"><span className="cash-in-icon">💳</span> Cash In (Billed Amounts)</h2></div>
            <div className="list-content">
              {filteredData.filteredBilled.length > 0 ? (
                filteredData.filteredBilled.map((item) => (
                  <div key={item.id} className="transaction-item">
                    <div className="transaction-main">
                      <div className="transaction-info">
                        <h4>{item.invoiceNo}</h4>
                        <p>{item.customerName}</p>
                      </div>
                      <div className="transaction-amount cash-in-amount">{formatCurrency(item.amount)}</div>
                    </div>
                    <div className="transaction-details">
                      <span className="payment-type">{item.paymentType}</span>
                      <span>{formatDateDisplay(item.date)} at {item.time}</span>
                    </div>
                  </div>
                ))
              ) : (<div className="empty-state"><div className="empty-state-icon">💳</div><p>No transactions found</p></div>)}
            </div>
            <div className="list-footer"><div className="list-total"><span className="total-label">Total Cash In:</span><span className="total-amount cash-in-total">{formatCurrency(totals.totalBilled)}</span></div></div>
          </div>

          {/* Cash Out List */}
          <div className="list-section">
            <div className="list-header"><h2 className="list-title"><span className="cash-out-icon">💸</span> Cash Out (Expenses)</h2></div>
            <div className="list-content">
              {filteredData.filteredExpenses.length > 0 ? (
                filteredData.filteredExpenses.map((item) => (
                  <div key={item.id} className="transaction-item">
                    <div className="transaction-main">
                      <div className="transaction-info">
                        <h4>{item.description}</h4>
                        <p>Paid by {item.paidBy} to {item.paidTo}</p>
                      </div>
                      <div className="transaction-amount cash-out-amount">-{formatCurrency(item.amount)}</div>
                    </div>
                    <div className="transaction-details"><span>{formatDateDisplay(item.date)}</span></div>
                  </div>
                ))
              ) : (<div className="empty-state"><div className="empty-state-icon">💸</div><p>No expenses found</p></div>)}
            </div>
            <div className="list-footer"><div className="list-total"><span className="total-label">Total Cash Out:</span><span className="total-amount cash-out-total">-{formatCurrency(totals.totalExpenses)}</span></div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashflow;