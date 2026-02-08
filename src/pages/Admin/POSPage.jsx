import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PlanContext } from '../Admin/PlanContext'; 
import ProtectedRoute from '../Admin/ProtectedRoute';
import './POSInterface.css';

const API_BASE = 'https://dineinn-pro-backend.onrender.com';

const POSInterface = () => {
  // State for table categories and individual tables
  const [tableCategories, setTableCategories] = useState([]);
  const [selectedTableCategoryId, setSelectedTableCategoryId] = useState('');
  const [tableOptions, setTableOptions] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');

  // State for menu data and filtering
  const [menuData, setMenuData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // State for the current order being built
  const [currentOrder, setCurrentOrder] = useState([]);

  // State for staff and waiters
  const [waiterList, setWaiterList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(''); // To hold the selected waiter

  // Get restaurantId from localStorage
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.restaurantid) {
        setRestaurantId(user.restaurantid);
      } else {
        alert('Could not find restaurant details. Please log in again.');
      }
    } catch (e) {
      alert('Could not read user data. Please log in again.');
    }
  }, []);

  // Fetch table categories when the component mounts
  useEffect(() => {
    const fetchTableCategories = async () => {
      if (!restaurantId) return;
      try {
        const res = await axios.get(`${API_BASE}/api/categories`, {
          params: { restaurantId },
        });
        setTableCategories(res.data || []);
        if (res.data.length > 0) {
          setSelectedTableCategoryId(res.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching table categories:', error);
      }
    };
    fetchTableCategories();
  }, [restaurantId]);

  // Fetch tables whenever a new table category is selected
  useEffect(() => {
    const fetchTables = async () => {
      if (!restaurantId || !selectedTableCategoryId) return;
      try {
        const res = await axios.get(`${API_BASE}/api/tables`, {
          params: { restaurantId, categoryId: selectedTableCategoryId },
        });

        setTableOptions(res.data || []);
        if (res.data.length > 0) {
          setSelectedTable(res.data[0].tablenumber);
        } else {
          setSelectedTable('');
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };
    fetchTables();
  }, [restaurantId, selectedTableCategoryId]);

  // Fetch all menu items, grouped by category, when the component mounts
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurantId) return;
      try {
        // Fetch all items, including unavailable ones
        const res = await axios.get(`${API_BASE}/api/menuitems-grouped`, {
          params: { restaurantId: restaurantId, show_all: true },
        });

        const groupedMenu = {};
        res.data.forEach(group => {
          // Map all item data, including the availability status
          groupedMenu[group.category] = group.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            is_available: item.is_available,
          }));
        });

        setMenuData(groupedMenu);
        if (res.data.length > 0) {
          setSelectedCategory(res.data[0].category);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };
    fetchMenuItems();
  }, [restaurantId]);
  
  // Fetch waiters when the component mounts
  useEffect(() => {
    const fetchWaiters = async () => {
        if (!restaurantId) return;
        try {
            const res = await axios.get(`${API_BASE}/api/staff`, {
                params: { restaurantId },
            });
            // Filter staff to only include those with the role 'Waiter'
            const waiters = res.data.filter(
                (staff) => staff.role && staff.role?.toLowerCase() === 'waiter'
            );
            setWaiterList(waiters);
        } catch (error) {
            console.error('Error fetching waiters:', error);
        }
    };
    fetchWaiters();
  }, [restaurantId]);


  // Filter menu items based on the selected category and search term
  const filteredItems = menuData[selectedCategory]?.filter(item =>
    item.name?.toLowerCase().includes(searchTerm?.toLowerCase())
  ) || [];

  // Add a selected menu item to the current order or increment its quantity
  const handleAddToOrder = (item) => {
    // Prevent adding if not available
    if (!item.is_available) return;
    
    setCurrentOrder(prevOrder => {
      const existing = prevOrder.find(i => i.id === item.id);
      if (existing) {
        return prevOrder.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
  };

  // Increase or decrease the quantity of an item in the order
  const handleQuantityChange = (itemId, delta) => {
    setCurrentOrder(prevOrder =>
      prevOrder
        .map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter(item => item.quantity > 0) // Remove item if quantity is 0 or less
    );
  };

  // Calculate the total price of the current order
  const totalPrice = currentOrder.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Handle the final "Place Order" action
  const handlePlaceOrder = async () => {
    if (!restaurantId) {
      alert('Cannot place order: Restaurant ID is missing.');
      return;
    }
    if (currentOrder.length === 0) {
      alert('Cannot place an empty order.');
      return;
    }
    if (!selectedTable) {
        alert('Please select a table.');
        return;
    }
    if (!selectedStaffId) {
        alert('Please select a waiter.');
        return;
    }

    const orderItemsForApi = currentOrder.map(item => ({
      menuid: item.id,
      itemname: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const orderData = {
      restaurantid: restaurantId,
      customername: `${selectedTable}`,
      customerno: null,
      deliverytype: 'dinein',
      paymenttype: 'pending',
      totalamount: totalPrice,
      orderitems: orderItemsForApi,
      isoptedin: false,
      ispaid: false,
      tablenumber: selectedTable,
      categoryid: selectedTableCategoryId,
      staff_id: selectedStaffId // Use the selected waiter's ID
    };

    try {
      await axios.post(`${API_BASE}/api/orders`, orderData);
      alert(`Order for ${selectedTable} has been placed successfully and sent to the kitchen!`);
      setCurrentOrder([]); // Clear the order form on success
    } catch (error) {
      console.error('Failed to place order:', error);
      const errorMsg = error.response?.data?.error || 'Failed to place order. Please try again.';
      alert(errorMsg);
    }
  };

  return (
    <div className="pos-container">
      <div className="order-entry-panel">
        <div className="panel-header">
          <h1>Order Entry</h1>
          <select
            className="table-category-dropdown"
            value={selectedTableCategoryId}
            onChange={e => setSelectedTableCategoryId(e.target.value)}
          >
            {tableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="table-dropdown"
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
          >
            {tableOptions.map(table => (
              <option key={table.id} value={table.tablenumber}>
                {table.tablenumber}
              </option>
            ))}
          </select>
          
          {/* New Staff/Waiter Dropdown */}
          <select
            className="table-dropdown"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            <option value="" disabled>Select Waiter</option>
            {waiterList.map((waiter) => (
              <option key={waiter.id} value={waiter.id}>
                {waiter.fullname}
              </option>
            ))}
          </select>
        </div>

        <div className="menu-container">
          <div className="categories-sidebar">
            <h3>Categories</h3>
            {Object.keys(menuData).map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-items-section">
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="menu-items-grid">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <button
                    key={item.id}
                    className={`menu-item-button ${!item.is_available ? 'unavailable' : ''}`}
                    onClick={() => handleAddToOrder(item)}
                    disabled={!item.is_available}
                  >
                     {item.name}
                     {!item.is_available && <span className="unavailable-tag">Unavailable</span>}
                  </button>
                ))
              ) : (
                <p>No menu items found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="order-summary-panel">
        <div className="order-summary-card">
          <div className="order-header">
            <h2>Current Order for {selectedTable}</h2>
          </div>

          <div className="order-items">
            {currentOrder.length > 0 ? (
              currentOrder.map((item, idx) => (
                <div key={item.id} className="order-item">
                  <div className="order-item-details">
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        -
                      </button>
                      <span className="quantity">x{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {idx < currentOrder.length - 1 && (
                    <div className="order-item-divider"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-order">
                <p>No items in order</p>
              </div>
            )}
          </div>

          <div className="order-total">
            <div className="total-line">
              <span className="total-label">Total:</span>
              <span className="total-amount">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="order-actions">
            <button className="action-btn place-order-btn" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const POSPageWithAccess = () => {
  const { setCurrentPlan } = useContext(PlanContext);
  const [loading, setLoading] = useState(true);
  const restaurantId = localStorage.getItem('restaurantId');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`https://dineinn-pro-backend.onrender.com/api/restaurants/${restaurantId}`);
        const data = await res.json();
        if (data.plan) {
          setCurrentPlan(data.plan);
        } else {
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
        setCurrentPlan('free');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [restaurantId, setCurrentPlan]);

  if (loading) return <div>Loading access...</div>;

  return (
    <ProtectedRoute feature="pos">
      <POSInterface />
    </ProtectedRoute>
  );
};

export default POSPageWithAccess;