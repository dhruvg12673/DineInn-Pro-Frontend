import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './stock_css.css';

const unitOptions = ['kg', 'gram', 'litre', 'ml', 'piece', 'box', 'packet'];

const StockManagement = () => {
  const restaurantId = localStorage.getItem('restaurantId');
  const [stockData, setStockData] = useState([]);
  const [newStock, setNewStock] = useState({
    itemName: '',
    quantity: '',
    unit: 'kg',
    rate: '',
    totalPrice: 0,
    supplierName: '',
    supplierNumber: '',
    threshold:'',
    dateReceived: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [scannedData, setScannedData] = useState('');

  // Calculate total price automatically
  useEffect(() => {
    const quantity = parseFloat(newStock.quantity) || 0;
    const rate = parseFloat(newStock.rate) || 0;
    const total = quantity * rate;
    setNewStock(prev => ({ ...prev, totalPrice: total }));
  }, [newStock.quantity, newStock.rate]);

  // Fetch stock data from backend filtered by restaurantId
  useEffect(() => {
    if (!restaurantId) return;

    const fetchStock = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/inventory?restaurantId=${restaurantId}`);
        // Map backend fields to frontend fields for display consistency
        const mapped = res.data.map(item => ({
          id: item.id,
          itemName: item.item,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          totalPrice: item.totalprice,
          supplierName: item.suppliername,
          supplierNumber: item.suppliernumber,
          threshold: item.threshold,
          dateReceived: item.datereceived
        }));
        setStockData(mapped);
      } catch (err) {
        console.error('Failed to fetch stock data:', err);
        alert('Could not load stock data');
      }
    };

    fetchStock();
  }, [restaurantId]);

  // Scanner initialization effect
  useEffect(() => {
    if (isScannerOpen) {
      const interval = setInterval(() => {
        const element = document.getElementById('barcode-reader');
        if (element && !scannerInstance) {
          clearInterval(interval);

          const scanner = new Html5QrcodeScanner(
            'barcode-reader',
            {
              qrbox: { width: 280, height: 280 },
              fps: 10,
              aspectRatio: 1.0,
            },
            false
          );

          const onScanSuccess = (decodedText, decodedResult) => {
            setScannedData(decodedText);
            processScanResult(decodedText);
            scanner.clear();
            setScannerInstance(null);
            setIsScannerOpen(false);
          };

          const onScanError = (error) => {
            // Silently handle scan errors
          };

          scanner.render(onScanSuccess, onScanError);
          setScannerInstance(scanner);
        }
      }, 100);

      return () => {
        clearInterval(interval);
        if (scannerInstance) {
          scannerInstance.clear();
          setScannerInstance(null);
        }
      };
    }
  }, [isScannerOpen, scannerInstance]);

  // Process scanned result
  const processScanResult = (scannedText) => {
    try {
      // First try to parse as JSON
      const jsonData = JSON.parse(scannedText);
      if (typeof jsonData === 'object' && jsonData !== null) {
        setNewStock(prev => ({
          ...prev,
          itemName: jsonData.itemName || jsonData.name || jsonData.item || prev.itemName,
          rate: jsonData.rate || jsonData.price || jsonData.cost || prev.rate,
          supplierName: jsonData.supplierName || jsonData.supplier || jsonData.vendor || prev.supplierName,
          supplierNumber: jsonData.supplierNumber || jsonData.phone || jsonData.contact || prev.supplierNumber,
          quantity: jsonData.quantity || jsonData.qty || prev.quantity,
          unit: jsonData.unit || prev.unit,
          threshold: jsonData.threshold || jsonData.minStock || prev.threshold
        }));
        alert('✅ Product data loaded from barcode!');
        return;
      }
    } catch (error) {
      // Not JSON, try other formats
    }

    // Try to parse as comma-separated values
    const parts = scannedText.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      setNewStock(prev => ({
        ...prev,
        itemName: parts[0] || prev.itemName,
        rate: parts[1] || prev.rate,
        supplierName: parts[2] || prev.supplierName,
        supplierNumber: parts[3] || prev.supplierNumber,
        quantity: parts[4] || prev.quantity,
        unit: parts[5] || prev.unit
      }));
      alert('✅ Product data loaded from barcode!');
      return;
    }

    // Try to parse as pipe-separated values
    const pipeParts = scannedText.split('|').map(part => part.trim());
    if (pipeParts.length >= 2) {
      setNewStock(prev => ({
        ...prev,
        itemName: pipeParts[0] || prev.itemName,
        rate: pipeParts[1] || prev.rate,
        supplierName: pipeParts[2] || prev.supplierName,
        supplierNumber: pipeParts[3] || prev.supplierNumber
      }));
      alert('✅ Product data loaded from barcode!');
      return;
    }

    // If no structured format, treat as item name
    if (scannedText.trim()) {
      setNewStock(prev => ({
        ...prev,
        itemName: scannedText.trim()
      }));
      alert('✅ Item name loaded from barcode!');
    } else {
      alert('⚠️ No recognizable data found in barcode');
    }
  };

  const closeScannerModal = () => {
    if (scannerInstance) {
      scannerInstance.clear();
      setScannerInstance(null);
    }
    setIsScannerOpen(false);
  };

  const handleInputChange = (field, value) => {
    setNewStock(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!restaurantId) {
      alert('No restaurantId found. Please log in.');
      return;
    }

    const stockEntryToSend = {
      item: newStock.itemName.trim(),
      quantity: parseFloat(newStock.quantity),
      unit: newStock.unit,
      rate: parseFloat(newStock.rate),
      totalprice: parseFloat(newStock.totalPrice),
      suppliername: newStock.supplierName.trim(),
      suppliernumber: newStock.supplierNumber.trim(),
      threshold: parseInt(newStock.threshold, 10),
      datereceived: newStock.dateReceived,
      restaurantid: parseInt(restaurantId, 10)
    };

    try {
      if (editingId) {
        // Update existing stock item
        await axios.put(`http://localhost:5000/api/inventory/${editingId}`, stockEntryToSend);

        setStockData(prev =>
          prev.map(item =>
            item.id === editingId
              ? { id: editingId, ...newStock }
              : item
          )
        );
        setEditingId(null);
      } else {
        // Add new stock item
        const res = await axios.post('http://localhost:5000/api/inventory', stockEntryToSend);
        // Map response fields
        const addedItem = {
          id: res.data.id,
          itemName: res.data.item,
          quantity: res.data.quantity,
          unit: res.data.unit,
          rate: res.data.rate,
          totalPrice: res.data.totalprice,
          supplierName: res.data.suppliername,
          supplierNumber: res.data.suppliernumber,
          threshold: res.data.threshold,
          dateReceived: res.data.datereceived
        };
        setStockData(prev => [...prev, addedItem]);
      }

      // Reset form after add/update
      setNewStock({
        itemName: '',
        quantity: '',
        unit: 'kg',
        rate: '',
        totalPrice: 0,
        supplierName: '',
        supplierNumber: '',
        threshold:'',
        dateReceived: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error saving stock:', err.response?.data || err.message);
      alert('Failed to save stock entry');
    }
  };

  const handleEditStock = (id) => {
    const item = stockData.find(i => i.id === id);
    if (!item) return;
    setNewStock({ ...item });
    setEditingId(id);
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      setStockData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting stock:', err.response?.data || err.message);
      alert('Failed to delete stock item');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewStock({
      itemName: '',
      quantity: '',
      unit: 'kg',
      rate: '',
      totalPrice: 0,
      supplierName: '',
      supplierNumber: '',
      threshold: '',
      dateReceived: new Date().toISOString().split('T')[0]
    });
  };

  // Filter for search input on itemName or supplierName
  const filteredStockData = stockData.filter(item =>
    item.itemName?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    item.supplierName?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  const totalItems = stockData.length;
  const totalValue = stockData.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const recentDeliveries = stockData.filter(item => {
    const d = new Date(item.dateReceived);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  const formatCurrency = amount =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = date =>
    new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleExport = () => {
    const headers = ['Item', 'Quantity', 'Unit', 'Rate', 'Total', 'Supplier', 'Phone', 'Threshold', 'Date'];
    const csv = [
      headers.join(','),
      ...stockData.map(i =>
        [i.itemName, i.quantity, i.unit, i.rate, i.totalPrice, i.supplierName, i.supplierNumber, i.threshold, i.dateReceived].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stock-dashboard-container">
      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="scanner-modal-overlay">
          <div className="scanner-modal">
            <div className="scanner-modal-header">
              <h3 className="scanner-modal-title">📷 Scan QR Code / Barcode</h3>
              <button 
                onClick={closeScannerModal}
                className="scanner-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="scanner-modal-body">
              <div id="barcode-reader" className="barcode-reader-container"></div>
              <div className="scanner-instructions">
                <p>📱 Position the QR code or barcode within the camera frame</p>
                <p>💡 Supports JSON, CSV, and text formats</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="stock-header">
        <h1 className="stock-main-title">📦 Stock Management</h1>
        <p className="stock-subtitle">Track your inventory purchases and supplier information</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-icon">📊</span>
            <span className="summary-title">Total Items</span>
          </div>
          <div className="summary-value">{totalItems}</div>
          <div className="summary-subtitle">Stock entries</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-icon">💰</span>
            <span className="summary-title">Total Value</span>
          </div>
          <div className="summary-value">{formatCurrency(totalValue)}</div>
          <div className="summary-subtitle">Inventory worth</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-icon">🚚</span>
            <span className="summary-title">Recent Deliveries</span>
          </div>
          <div className="summary-value">{recentDeliveries}</div>
          <div className="summary-subtitle">This week</div>
        </div>
      </div>

      {/* Search and Export Controls */}
      <div className="stock-top-controls">
        <div className="stock-search-container">
          <span className="stock-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search items or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="stock-search-input"
          />
        </div>
        <div className="controls-right">
          <button onClick={handleExport} className="stock-export-btn">
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Add/Edit Stock Form */}
      <div className="add-stock-card">
        <h2 className="stock-form-title">{editingId ? '✏️ Edit Stock Entry' : '➕ Add New Stock Entry'}</h2>

        <form onSubmit={handleAddStock}>
          <div className="stock-form-grid">
            <div className="stock-form-group">
              <label className="stock-form-label">Item Name *</label>
              <input
                type="text"
                placeholder="Enter item name"
                value={newStock.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                className="stock-form-input"
                required
              />
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Quantity *</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={newStock.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="stock-form-input"
                required
              />
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Unit</label>
              <select
                value={newStock.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="stock-form-select"
              >
                {unitOptions.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Rate per Unit *</label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={newStock.rate}
                onChange={(e) => handleInputChange('rate', e.target.value)}
                className="stock-form-input"
                required
              />
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Total Price</label>
              <input
                type="text"
                value={formatCurrency(newStock.totalPrice)}
                className="stock-form-input total-price-display"
                readOnly
              />
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Supplier Name *</label>
              <input
                type="text"
                placeholder="Enter supplier name"
                value={newStock.supplierName}
                onChange={(e) => handleInputChange('supplierName', e.target.value)}
                className="stock-form-input"
                required
              />
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Supplier Number *</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={newStock.supplierNumber}
                onChange={(e) => handleInputChange('supplierNumber', e.target.value)}
                className="stock-form-input"
                required
              />
            </div>

            <div className="stock-form-group">
             <label className="stock-form-label">Threshold *</label>
             <input
              type="number"
              placeholder="Enter threshold"
              min="0"
              value={newStock.threshold}
              onChange={(e) => handleInputChange('threshold', e.target.value)}
              className="stock-form-input"
              required
             />
            </div>

            <div className="stock-form-group">
              <label className="stock-form-label">Date Received</label>
              <input
                type="date"
                value={newStock.dateReceived}
                onChange={(e) => handleInputChange('dateReceived', e.target.value)}
                className="stock-form-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="stock-add-btn">
              {editingId ? '💾 Update Stock Entry' : '➕ Add Stock Entry'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px 0 rgba(107, 114, 128, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px 0 rgba(107, 114, 128, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px 0 rgba(107, 114, 128, 0.2)';
                }}
              >
                ❌ Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Stock List */}
      <div className="stock-list-card">
        <h2 className="stock-list-title">
          📋 Current Stock Inventory ({filteredStockData.length} items)
        </h2>

        {filteredStockData.length === 0 ? (
          <div className="stock-empty-state">
            <div className="stock-empty-state-icon">📦</div>
            <div className="stock-empty-state-text">
              {searchQuery ? 'No items match your search criteria' : 'No stock entries found. Add your first item above!'}
            </div>
          </div>
        ) : (
          <>
            <div className="stock-table-header">
              <div className="stock-header-cell">Item Name</div>
              <div className="stock-header-cell">Quantity</div>
              <div className="stock-header-cell">Rate</div>
              <div className="stock-header-cell">Total</div>
              <div className="stock-header-cell">Supplier</div>
              <div className="stock-header-cell">Date</div>
              <div className="stock-header-cell">Actions</div>
            </div>

            {filteredStockData.map(item => (
              <div key={item.id} className="stock-item">
                <div className="stock-item-name">{item.itemName}</div>
                <div className="stock-item-quantity">
                  {item.quantity} {item.unit}
                </div>
                <div className="stock-item-rate">
                  {formatCurrency(item.rate)}/{item.unit}
                </div>
                <div className="stock-item-total">
                  {formatCurrency(item.totalPrice)}
                </div>
                <div className="stock-item-supplier">
                  <div className="supplier-name">{item.supplierName}</div>
                  <div className="supplier-phone">{item.supplierNumber}</div>
                </div>
                
                <div className="stock-item-date">{formatDate(item.dateReceived)}</div>
                <div className="stock-item-actions">
                  <button onClick={() => handleEditStock(item.id)} className="stock-edit-btn">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDeleteStock(item.id)} className="stock-delete-btn">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default StockManagement;