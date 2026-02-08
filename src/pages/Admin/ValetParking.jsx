import React, { useState, useEffect, useContext } from 'react';
import { Car, Phone, User, Hash, Plus, X, Clock, CheckCircle, Search, Mail } from 'lucide-react';
import axios from 'axios';
import { PlanContext } from './PlanContext';
import ProtectedRoute from './ProtectedRoute';
import './ValetParkingApp.css';

const ValetParkingApp = () => {
  const [cars, setCars] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    ownerName: '',
    phoneNumber: '',
    carNumber: '',
    tokenNumber: '',
    email: '' // Added email field to the form state
  });

  const restaurantId = localStorage.getItem('restaurantId');

  // Generate random token number
  const generateTokenNumber = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // Fetch cars from backend for the restaurant
  const fetchCars = async () => {
    if (!restaurantId) return;
    try {
      // Ensure you are using the correct backend URL
      const res = await axios.get(`https://dineinn-pro-backend.onrender.com/api/valet?restaurantId=${restaurantId}`);
      setCars(res.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      showNotification('Failed to fetch cars from server', 'error');
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // Initialize token number when modal opens
  useEffect(() => {
    if (showModal) {
      setFormData(prev => ({
        ...prev,
        tokenNumber: generateTokenNumber()
      }));
    }
  }, [showModal]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  // Submit new car to backend
  const handleSubmit = async () => {
    // Added email to the validation check
    if (formData.ownerName && formData.phoneNumber && formData.carNumber && formData.email) {
      try {
        const postData = {
          token_number: formData.tokenNumber,
          owner_name: formData.ownerName,
          phone_number: formData.phoneNumber,
          car_number: formData.carNumber,
          email: formData.email, // Send email to the backend
          status: 'With Us',
          restaurantId: parseInt(restaurantId),
        };

        // The backend will now handle email sending
        const response = await axios.post('https://dineinn-pro-backend.onrender.com/api/valet', postData);

        // Display the success message from the backend
        showNotification(response.data.message, 'success');

        setFormData({
          ownerName: '',
          phoneNumber: '',
          carNumber: '',
          tokenNumber: '',
          email: '' // Reset email field after submission
        });
        setShowModal(false);

        fetchCars();
      } catch (error) {
        console.error('Error adding car:', error);
        // Show specific error from backend if available, otherwise a generic one
        const errorMessage = error.response?.data?.message || 'Failed to add car';
        showNotification(errorMessage, 'error');
      }
    } else {
      showNotification('Please fill in all required fields, including email', 'error');
    }
  };

  // Toggle status and update backend
  const toggleCarStatus = async (id) => {
    const car = cars.find(c => c.id === id);
    if (!car) return;

    const newStatus = car.status === 'With Us' ? 'Returned' : 'With Us';

    try {
      await axios.put(`https://dineinn-pro-backend.onrender.com/api/valet/${id}`, { status: newStatus });

      showNotification(
        `Car ${car.car_number} marked as ${newStatus}`,
        'info'
      );

      setCars(prev =>
        prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (error) {
      console.error('Error updating car status:', error);
      showNotification('Failed to update car status', 'error');
    }
  };

  // Filter cars based on search term
  const filteredCars = cars.filter(car => {
    const searchLower = searchTerm?.toLowerCase();
    return (
      car.token_number?.toLowerCase().includes(searchLower) ||
      car.owner_name?.toLowerCase().includes(searchLower) ||
      car.phone_number?.toLowerCase().includes(searchLower) ||
      car.car_number?.toLowerCase().includes(searchLower) ||
      car.status?.toLowerCase().includes(searchLower)
    );
  });

  const carsWithUs = cars.filter(car => car.status === 'With Us');

  return (
    <div className="valet-app">
      {notification.show && (
        <div className={`valet-notification valet-${notification.type}`}>
          <div className="valet-notification-content">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              className="valet-notification-close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="valet-header">
        <div className="valet-header-container">
          <div className="valet-header-content">
            <div className="valet-header-title">
              <div className="valet-header-icon"></div>
              <h1>Valet Parking Management</h1>
            </div>
            <button onClick={() => setShowModal(true)} className="valet-add-button">
              <Plus className="valet-button-icon" />
              Add Car
            </button>
          </div>
        </div>
      </div>

      <div className="valet-main-container">
        <div className="valet-stats-container">
          <div className="valet-stat-card">
            <div className="valet-stat-content">
              <div className="valet-stat-icon valet-blue">
                <Car className="valet-icon" />
              </div>
              <div className="valet-stat-info">
                <p className="valet-stat-label">Total Cars</p>
                <p className="valet-stat-value">{cars.length}</p>
              </div>
            </div>
          </div>

          <div className="valet-stat-card">
            <div className="valet-stat-content">
              <div className="valet-stat-icon valet-green">
                <CheckCircle className="valet-icon" />
              </div>
              <div className="valet-stat-info">
                <p className="valet-stat-label">With Us</p>
                <p className="valet-stat-value">{carsWithUs.length}</p>
              </div>
            </div>
          </div>

          <div className="valet-stat-card">
            <div className="valet-stat-content">
              <div className="valet-stat-icon valet-orange">
                <Clock className="valet-icon" />
              </div>
              <div className="valet-stat-info">
                <p className="valet-stat-label">Returned</p>
                <p className="valet-stat-value">{cars.length - carsWithUs.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="valet-cars-section">
          <div className="valet-section-header">
            <h2>All Cars</h2>
            <div className="valet-search-container">
              <Search className="valet-search-icon" />
              <input
                type="text"
                placeholder="Search by token, name, phone, car number, or status..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="valet-search-input"
              />
            </div>
          </div>

          <div className="valet-table-container">
            <table className="valet-cars-table">
              <thead>
                <tr>
                  <th>Token Number</th>
                  <th>Owner Name</th>
                  <th>Phone Number</th>
                  <th>Car Number</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.length > 0 ? (
                  filteredCars.map(car => (
                    <tr key={car.id}>
                      <td className="valet-token-cell">#{car.token_number}</td>
                      <td>{car.owner_name}</td>
                      <td>{car.phone_number}</td>
                      <td>{car.car_number}</td>
                      <td>
                        <span className={`valet-status-badge ${car.status === 'With Us' ? 'valet-with-us' : 'valet-returned'}`}>
                          {car.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleCarStatus(car.id)}
                          className={`valet-action-button ${car.status === 'With Us' ? 'valet-return' : 'valet-receive'}`}
                        >
                          {car.status === 'With Us' ? 'Mark Returned' : 'Mark Received'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="valet-no-results">
                      No cars found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="valet-modal-overlay">
          <div className="valet-modal">
            <div className="valet-modal-header">
              <h3>Add New Car</h3>
              <button onClick={() => setShowModal(false)} className="valet-modal-close">
                <X className="valet-icon" />
              </button>
            </div>

            <div className="valet-modal-body">
              <div className="valet-form-group">
                <label className="valet-form-label">
                  <User className="valet-label-icon" />
                  Owner Name
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="valet-form-input"
                  placeholder="Enter owner name"
                  required
                />
              </div>

              <div className="valet-form-group">
                <label className="valet-form-label">
                  <Phone className="valet-label-icon" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="valet-form-input"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="valet-form-group">
                <label className="valet-form-label">
                  <Car className="valet-label-icon" />
                  Car Number
                </label>
                <input
                  type="text"
                  name="carNumber"
                  value={formData.carNumber}
                  onChange={handleInputChange}
                  className="valet-form-input"
                  placeholder="Enter car number"
                  required
                />
              </div>

              {/* New Email Input Field */}
              <div className="valet-form-group">
                <label className="valet-form-label">
                  <Mail className="valet-label-icon" />
                  Customer Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="valet-form-input"
                  placeholder="Enter customer's email for token"
                  required
                />
              </div>

              <div className="valet-form-group">
                <label className="valet-form-label">
                  <Hash className="valet-label-icon" />
                  Token Number
                </label>
                <input
                  type="text"
                  value={formData.tokenNumber}
                  className="form-input readonly"
                  placeholder="Auto-generated"
                  readOnly
                />
              </div>

              <div className="valet-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="valet-cancel-button">
                  Cancel
                </button>
                <button type="submit" onClick={handleSubmit} className="valet-submit-button">
                  Add Car & Email Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ValetParkingWithAccess = () => {
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
    <ProtectedRoute feature="valet">
      <ValetParkingApp />
    </ProtectedRoute>
  );
};

export default ValetParkingWithAccess;
