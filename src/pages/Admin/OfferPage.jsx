import React, { useState, useEffect, useRef, useContext } from 'react';
import ProtectedRoute from './ProtectedRoute'; // adjust the path if needed
import { PlanContext } from './PlanContext';
import { Upload, Users, Send, Search, CheckCircle, Tag, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './OfferPage.css';
import axios from 'axios';

// The hidden component for generating the PDF layout.
const OfferPDF = ({ offerData, restaurantName }) => (
  <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '595px', padding: '20px', backgroundColor: 'lightpink' }}>
    <div style={{ padding: '20px', border: '1px solid #dee2e6', borderRadius: '8px', backgroundColor: 'white' }}>
        <h1 style={{ textAlign: 'center', color: '#495057', marginBottom: '20px' }}>{restaurantName}</h1>
        <h2 style={{ color: '#0891b2', borderBottom: '2px solid #0891b2', paddingBottom: '10px' }}>{offerData.title}</h2>
        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>"{offerData.description}"</p>

        {offerData.image && (
            <div style={{ margin: '20px 0', textAlign: 'center' }}>
                <img src={offerData.image} alt="Offer" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
            </div>
        )}

        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px' }}>Offer Details:</h3>
            {offerData.discountType === 'percentage' && (
                <p><strong>Discount:</strong> {offerData.discountValue}% off</p>
            )}
            {offerData.discountType === 'fixed' && (
                <p><strong>Discount:</strong> ₹{offerData.discountValue} off</p>
            )}
            {offerData.discountType === 'custom' && (
                <p><strong>Offer:</strong> {offerData.customText}</p>
            )}
            <p><strong>Valid Till:</strong> {new Date(offerData.validTill).toLocaleDateString('en-IN')}</p>
        </div>

        <p style={{ marginTop: '30px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
            Terms and conditions apply. This is a promotional offer.
        </p>
    </div>
  </div>
);

const RestaurantAdminPanel = ({ restaurantId }) => {
  const pdfRef = useRef();
  const [restaurantName, setRestaurantName] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    customText: '',
    validTill: '',
    image: null
  });

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
        if (!restaurantId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}`);
            setRestaurantName(res.data.name || 'Your Restaurant');
        } catch (err) {
            console.error('Failed to fetch restaurant details', err);
            setRestaurantName('Your Restaurant');
        }
    };
    fetchRestaurantDetails();
  }, [restaurantId]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!restaurantId) {
        setLoading(false);
        return;
      };

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/customers?restaurantId=${restaurantId}`);
        setCustomers(response.data);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch customers:", e);
        setError("Could not load customer data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [restaurantId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  const waitForImagesToLoad = async (element) => {
  const images = element.querySelectorAll('img');
  const promises = [];

  images.forEach((img) => {
    if (!img.complete || img.naturalHeight === 0) {
      promises.push(
        new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        })
      );
    }
  });

  await Promise.all(promises);
};


const handleSendOffer = async () => {
  const pdfElement = pdfRef.current?.firstChild;

  if (!pdfElement) {
    console.error("PDF content element for capture not found.");
    return;
  }

  const originalStyle = pdfElement.style.cssText;
  pdfElement.style.position = 'fixed';
  pdfElement.style.zIndex = '-9999';
  pdfElement.style.left = '0';
  pdfElement.style.top = '0';

  try {
    await waitForImagesToLoad(pdfElement);
    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await html2canvas(pdfElement, {
      useCORS: true,
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');

    if (!imgData || imgData.length < 1000) {
      throw new Error("Canvas generated an empty image.");
    }

    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    const selectedEmails = customers.map(c => c.email).filter(Boolean);

    await axios.post('http://localhost:5000/api/send-offer-email', {
      pdf: pdfBase64,
      emails: selectedEmails,
      offerTitle: formData.title,
    });

    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);

  } catch (error) {
    console.error("Failed during PDF generation or sending:", error);
  } finally {
    pdfElement.style.cssText = originalStyle;
  }
};



  const filteredCustomers = customers.filter(customer =>
    (customer.name && customer.name?.toLowerCase().includes(searchTerm?.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email?.toLowerCase().includes(searchTerm?.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="admin-container">
      <div ref={pdfRef}>
        <OfferPDF offerData={formData} restaurantName={restaurantName} />
      </div>

      <div className="admin-header">
        <h1>Promotional Offers</h1>
        <p>Create and send exclusive offers to your valued customers</p>
      </div>

      <div className="offer-form-card">
        <h2 className="form-section-title">
          <Tag size={20} />
          Create New Offer
        </h2>
        
        <div className="form-grid">
          <div className="form-row">
  <div className="form-group">
    <label className="form-label">Offer Title *</label>
    <input
      type="text"
      name="title"
      value={formData.title}
      onChange={handleInputChange}
      placeholder="e.g., Weekend Special Deal"
      className="form-input"
      required
    />
  </div>
  <div className="form-group">
    <label className="form-label">Valid Till *</label>
    <input
      type="date"
      name="validTill"
      value={formData.validTill}
      onChange={handleInputChange}
      className="form-input"
      required
    />
  </div>
</div>

          <div className="form-group full-width">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your offer in detail... 🍽 You can use emojis!"
              className="form-input form-textarea"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Discount Type</label>
            <div className="discount-options">
              <div className={`radio-option ${formData.discountType === 'percentage' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  id="percentage"
                  name="discountType"
                  value="percentage"
                  checked={formData.discountType === 'percentage'}
                  onChange={handleInputChange}
                />
                <label htmlFor="percentage">Percentage Discount (e.g., 20% Off)</label>
              </div>
              <div className={`radio-option ${formData.discountType === 'fixed' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  id="fixed"
                  name="discountType"
                  value="fixed"
                  checked={formData.discountType === 'fixed'}
                  onChange={handleInputChange}
                />
                <label htmlFor="fixed">Fixed Amount Off (e.g., ₹100 Off)</label>
              </div>
              <div className={`radio-option ${formData.discountType === 'custom' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  id="custom"
                  name="discountType"
                  value="custom"
                  checked={formData.discountType === 'custom'}
                  onChange={handleInputChange}
                />
                <label htmlFor="custom">Custom Offer Text (e.g., "Buy 1 Get 1 Free")</label>
              </div>
            </div>
          </div>

          {formData.discountType !== 'custom' && (
            <div className="form-group">
              <label className="form-label">
                {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (₹)'}
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                className="form-input"
              />
            </div>
          )}

          {formData.discountType === 'custom' && (
            <div className="form-group">
              <label className="form-label">Custom Offer Text</label>
              <input
                type="text"
                name="customText"
                value={formData.customText}
                onChange={handleInputChange}
                placeholder="Buy 1 Get 1 Free"
                className="form-input"
              />
            </div>
          )}

          <div className="form-group full-width">
            <label className="form-label">Upload Offer Image (Optional)</label>
            <div className={`upload-area ${formData.image ? 'has-file' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload className="upload-icon" />
                <div className="upload-text">
                  <strong>Click to upload</strong> or drag and drop<br />
                  PNG, JPG, GIF up to 5MB
                </div>
              </label>
              {formData.image && (
                <div className="image-preview">
                  <img src={formData.image} alt="Offer preview" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary">
            <FileText size={16} />
            Save as Draft
          </button>
          <button className="btn btn-primary" onClick={handleSendOffer}>
            <Send size={16} />
            Send Offer to {filteredCustomers.length} Customers
          </button>

        </div>
      </div>

      <div className="customers-section">
        <div className="customers-header">
          <h2 className="customers-title">
            <Users size={20} />
            Eligible Customers ({filteredCustomers.length})
          </h2>
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <table className="customers-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Loading customers...</td></tr>
            ) : error ? (
              <tr><td colSpan="4">{error}</td></tr>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="customer-name">{customer.name}</td>
                  <td className="customer-phone">{customer.phone}</td>
                  <td className="customer-email">{customer.email || 'N/A'}</td>
                  <td className="last-visit">{formatDate(customer.lastVisit)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showSnackbar && (
        <div className="snackbar show">
          <CheckCircle className="snackbar-icon" />
          <span>Offer sent successfully to {filteredCustomers.length} customers!</span>
        </div>
      )}
    </div>
  );
};

export default function OfferPageWithProtection() {
  const { setCurrentPlan } = useContext(PlanContext);
  const restaurantId = localStorage.getItem('restaurantId');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }
      try {
        const res = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}`);
        setCurrentPlan(res.data.plan);
      } catch (err) {
        console.error('Failed to fetch restaurant plan', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [restaurantId, setCurrentPlan]);

  if (loading) return <div>Loading access...</div>;

  return (
    <ProtectedRoute feature="offers">
      <RestaurantAdminPanel restaurantId={restaurantId} />
    </ProtectedRoute>
  );
}
