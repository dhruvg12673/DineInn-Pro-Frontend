import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Using the original CSS file as requested
import './Inventory.css'; 

// This component manages the expenses for a specific restaurant.
const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    totalPaid: '',
    staffPaid: '',
    paidTo: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // 1. Get the restaurantId from localStorage. This is set when the user logs in.
  const restaurantId = localStorage.getItem('restaurantId');
  const API_BASE_URL = 'https://dineinn-pro-backend.onrender.com'; // Define your API base URL once

  // Function to fetch expenses from the backend
  const fetchExpenses = async () => {
    if (!restaurantId) {
      setError('Restaurant ID not found. Please log in again.');
      return;
    }
    try {
      // 2. Send the restaurantId as a query parameter to the backend API.
      // The backend will use this ID to fetch only the relevant expenses.
      const res = await axios.get(`${API_BASE_URL}/api/expenses`, {
        params: { restaurantId },
      });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses. Please check the console for details.');
    }
  };

  // Fetch expenses when the component mounts or when restaurantId changes.
  useEffect(() => {
    if (restaurantId) {
      fetchExpenses();
    }
  }, [restaurantId]);

  // Filter expenses based on the search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredExpenses(expenses);
    } else {
      const lowercasedFilter = searchTerm?.toLowerCase();
      const filtered = expenses.filter((expense) =>
        Object.values(expense).some(value =>
          String(value)?.toLowerCase().includes(lowercasedFilter)
        )
      );
      setFilteredExpenses(filtered);
    }
  }, [searchTerm, expenses]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for creating or updating an expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) {
      setError('Cannot submit expense without a Restaurant ID.');
      return;
    }

    const payload = { ...formData };

    try {
      if (editingId) {
        // If editing, send a PUT request to the specific expense ID
        await axios.put(`${API_BASE_URL}/api/expenses/${editingId}`, payload);
        setEditingId(null);
      } else {
        // 3. For new expenses, add the restaurantId to the payload.
        await axios.post(`${API_BASE_URL}/api/expenses`, {
          ...payload,
          restaurantId: parseInt(restaurantId),
        });
      }

      // Reset form and refetch expenses to update the list
      setFormData({
        description: '', amount: '', totalPaid: '', staffPaid: '',
        paidTo: '', phoneNumber: '', date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setError('Failed to submit expense. Please check the console for details.');
    }
  };

  // Set up the form for editing an existing expense
  const handleEditExpense = (expense) => {
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      totalPaid: expense.totalPaid || '',
      staffPaid: expense.staffPaid || '',
      paidTo: expense.paidTo || '',
      phoneNumber: expense.phoneNumber || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
    });
    setEditingId(expense.id);
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  // Delete an expense
  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense entry?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/expenses/${id}`);
        fetchExpenses(); // Refetch to update the list
      } catch (err) {
        console.error('Failed to delete expense', err);
        setError('Failed to delete expense.');
      }
    }
  };

  // Cancel the editing mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      description: '', amount: '', totalPaid: '', staffPaid: '',
      paidTo: '', phoneNumber: '', date: new Date().toISOString().split('T')[0],
    });
  };

  // Export data to CSV
  const handleExportReport = () => {
    const csvContent = [
      ['#', 'Description', 'Amount/Rate', 'Total Paid', 'Staff Who Paid', 'Paid To', 'Phone Number', 'Date'],
      ...filteredExpenses.map((expense, index) => [
        index + 1,
        `"${expense.description.replace(/"/g, '""')}"`, // Handle commas in description
        expense.amount,
        expense.totalPaid,
        expense.staffPaid,
        expense.paidTo,
        expense.phoneNumber,
        formatDate(expense.date),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense-report.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric'});
  };

  // Logic for header cards
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.totalPaid || 0), 0);
  const totalEntries = expenses.length;
  const getRecentExpenses = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return expenses.filter((e) => {
      const date = new Date(e.date);
      return date >= weekAgo && date <= today;
    }).length;
  };

  // The JSX structure is restored from your original InventoryPage.jsx file
  return (
    <div className="expense-container">
      <div className="header-cards">
        <div className="card">
          <div className="card-header">
            <div className="card-icon total-expenses">💰</div>
            <div className="card-title">Total Expenses</div>
          </div>
          <div className="card-value">{formatCurrency(totalExpenses)}</div>
          <div className="card-subtitle">Total amount spent</div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-icon expense-entries">📊</div>
            <div className="card-title">Expense Entries</div>
          </div>
          <div className="card-value">{totalEntries}</div>
          <div className="card-subtitle">Total entries</div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-icon recent-expenses">🚚</div>
            <div className="card-title">Recent Expenses</div>
          </div>
          <div className="card-value">{getRecentExpenses()}</div>
          <div className="card-subtitle">This week</div>
        </div>
      </div>

      <div className="search-export-section">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input type="text" className="search-input" placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="export-btn" onClick={handleExportReport}>
          📋 Export Report
        </button>
      </div>

      <div className="add-expense-form">
        <h2 className="form-title">
          {editingId ? '✏️ Edit Expense Entry' : '➕ Add New Expense Entry'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Description*</label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="form-input" placeholder="e.g., Office Supplies" required />
            </div>
            <div className="form-group">
              <label className="form-label">Amount/Rate*</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="form-input" placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Total Paid*</label>
              <input type="number" name="totalPaid" value={formData.totalPaid} onChange={handleInputChange} className="form-input" placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Staff Who Paid*</label>
              <input type="text" name="staffPaid" value={formData.staffPaid} onChange={handleInputChange} className="form-input" placeholder="Enter staff name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Paid To*</label>
              <input type="text" name="paidTo" value={formData.paidTo} onChange={handleInputChange} className="form-input" placeholder="Enter recipient name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Recipient Phone*</label>
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="form-input" placeholder="+91 98765 43210" required />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Expense*</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="form-input" required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="submit-btn">
              {editingId ? '💾 Update Expense' : '➕ Add Expense'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="cancel-edit-btn">
                ❌ Cancel Edit
              </button>
            )}
          </div>
        </form>
        {error && <p className="error-message" style={{color: 'red', marginTop: '1rem'}}>{error}</p>}
      </div>

      <div className="expense-list-section">
        <h2 className="list-title">📋 Expense Entries ({filteredExpenses.length})</h2>
        {filteredExpenses.length === 0 ? (
          <div className="no-expenses">
            <div className="empty-state-text">{searchTerm ? 'No expenses match your search' : 'No expenses found. Add one above!'}</div>
          </div>
        ) : (
          <div className="expense-table-container">
            <div className="expense-table-header">
              <div className="expense-header-cell">Description</div>
              <div className="expense-header-cell">Rate</div>
              <div className="expense-header-cell">Total Paid</div>
              <div className="expense-header-cell">Paid By</div>
              <div className="expense-header-cell">Paid To</div>
              <div className="expense-header-cell">Date</div>
              <div className="expense-header-cell">Actions</div>
            </div>
            {filteredExpenses.map(expense => (
              <div key={expense.id} className="expense-item">
                <div className="expense-item-description">{expense.description}</div>
                <div className="expense-item-rate">{formatCurrency(expense.amount)}</div>
                <div className="expense-item-total">{formatCurrency(expense.totalPaid)}</div>
                <div className="expense-item-staff">{expense.staffPaid}</div>
                <div className="expense-item-paidto">
                  <div className="paidto-name">{expense.paidTo}</div>
                  <div className="paidto-phone">{expense.phoneNumber}</div>
                </div>
                <div className="expense-item-date">{formatDate(expense.date)}</div>
                <div className="expense-item-actions">
                  <button onClick={() => handleEditExpense(expense)} className="expense-edit-btn">✏️ Edit</button>
                  <button onClick={() => handleDeleteExpense(expense.id)} className="expense-delete-btn">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensePage;
