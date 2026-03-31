import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './GuestMenu.css';
import {  ArrowLeft } from 'lucide-react';
const API_URL = 'https://dineinn-pro-backend.onrender.com';

const MenuPage = ({ restaurantId, categoryid, tableNo, onOrderSuccess }) => {
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
   const [email, setEmail] = useState(''); 

  const fetchMenuData = useCallback(async () => {
    if (!restaurantId) {
      setIsLoading(false);
      setError("No restaurant specified.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/menuitems-grouped`, {
        params: { restaurantId }
      });
      setMenuData(response.data);
    } catch (err) {
      setError("Could not fetch the menu. Please try again later.");
      console.error("Failed to fetch menu:", err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const placeOrder = async () => {
    if (!customerName.trim() || cart.length === 0) {
      alert("Please enter your name and add items to your cart.");
      return;
    }

    const orderPayload = {
      customername: customerName,
       email_id: email, 
      totalamount: getTotalPrice(),
      restaurantid: restaurantId,
      deliverytype: 'dinein',
      paymenttype: 'cash',
      ispaid: false,
      isoptedin: false,
      tablenumber: tableNo,
      categoryid: categoryid,
      orderitems: cart.map(item => ({
        menuid: item.id,
        itemname: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
    };

    try {
      const response = await axios.post(`${API_URL}/api/orders`, orderPayload);
      const { billno } = response.data;

      const orderPageData = {
        id: billno,
        customerName: customerName,
        totalAmount: getTotalPrice(),
        itemCount: getTotalItems(),
        orderTime: new Date().toISOString(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
      };

      onOrderSuccess(orderPageData);

    } catch (err) {
      console.error("Failed to place order:", err);
      alert("Sorry, we couldn't place your order. Please try again.");
    }
  };

  const filteredMenuData = menuData
    .map(category => {
      const filteredItems = category.items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        (item.description && item.description?.toLowerCase().includes(searchTerm?.toLowerCase()))
      );
      return { ...category, items: filteredItems };
    })
    .filter(category => category.items.length > 0);
  const addToCart = (item, quantity) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity }]);
    }
    setSelectedItem(null);
  };
  const removeFromCart = (itemId) => setCart(cart.filter(item => item.id !== itemId));
  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) removeFromCart(itemId);
    else setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
  };
  const getTotalPrice = () => cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);

  if (isLoading) return <div>Loading menu...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="guest-menu restaurant-container">
      <header className="header">
        <div className="header-content">
          <h1 className="restaurant-title">Restaurant Menu</h1>
          <div className="header-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            {cart.length > 0 && (
              <button
                className="view-cart-btn"
                onClick={() => setShowCartModal(true)}
              >
                Cart ({getTotalItems()})
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="menu-content">
        {filteredMenuData.map((category) => (
          <section key={category.category} className="category-section">
            <h2 className="category-title">{category.category}</h2>
            <div className="items-list">
              {category.items.map(item => (
                <div
                  key={item.id}
                  className="menu-item-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="item-info">
                    <h3 className="menu-item-name">{item.name}</h3>
                    <div className="item-price">₹{parseFloat(item.price).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      {cart.length > 0 && (
        <div className="order-summary-bar">
          <div className="summary-content">
            <span className="summary-text">
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} • ₹{getTotalPrice().toFixed(2)}
            </span>
            <button
              className="place-order-btn"
              onClick={() => setShowOrderModal(true)}
            >
              Place Order
            </button>
          </div>
        </div>
      )}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedItem(null)}
              aria-label="Close modal"
            >
              ×
            </button>
            <img
              src={selectedItem.image || 'https://placehold.co/400x300/667eea/ffffff?text=No+Image'}
              alt={selectedItem.name}
              className="modal-image"
            />
            <div className="modal-info">
              <h3 className="menu-modal-title">{selectedItem.name}</h3>
              <p className="modal-description">{selectedItem.description}</p>
              {selectedItem.ingredients && (
                <div className="modal-ingredients">
                  <strong>Ingredients:</strong> {selectedItem.ingredients}
                </div>
              )}
              <div className="modal-price">₹{parseFloat(selectedItem.price).toFixed(2)}</div>
              <QuantitySelector
                onAddToCart={(quantity) => addToCart(selectedItem, quantity)}
                price={selectedItem.price}
              />
            </div>
          </div>
        </div>
      )}
      {showCartModal && (
        <div className="modal-overlay" onClick={() => setShowCartModal(false)}>
          <div className="modal-content cart-modal" onClick={e => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setShowCartModal(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <h3 className="modal-title">Your Cart</h3>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p>₹{parseFloat(item.price).toFixed(2)} each</p>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <strong>Total: ₹{getTotalPrice().toFixed(2)}</strong>
            </div>
            <button
              className="checkout-btn"
              onClick={() => {
                setShowCartModal(false);
                setShowOrderModal(true);
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content order-modal" onClick={e => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setShowOrderModal(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <h3 className="modal-title">Complete Your Order</h3>
            <div className="order-details">
              <p><strong>Total Items:</strong> {getTotalItems()}</p>
              <p><strong>Total Price:</strong> ₹{getTotalPrice().toFixed(2)}</p>
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="name-input"
              required
            />
            <input
              type="email"
              placeholder="Enter your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="name-input" // you can reuse the class or create a new one
            />
            <button
              className="confirm-order-btn"
              onClick={placeOrder}
              disabled={!customerName.trim()}
            >
              Confirm Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuantitySelector = ({ onAddToCart, price }) => {
  const [quantity, setQuantity] = useState(1);
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  return (
    <div className="quantity-selector">
      <div className="quantity-controls">
        <button className="quantity-btn" onClick={decrementQuantity} aria-label="Decrease quantity">-</button>
        <span className="quantity-display">{quantity}</span>
        <button className="quantity-btn" onClick={incrementQuantity} aria-label="Increase quantity">+</button>
      </div>
      <div className="total-price">Total: ₹{(parseFloat(price) * quantity).toFixed(2)}</div>
      <button className="add-to-cart-btn" onClick={() => onAddToCart(quantity)}>Add to Cart</button>
    </div>
  );
};

export default MenuPage;