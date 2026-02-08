import React, { useState, useEffect } from 'react';
import './RestaurantOverview.css';

// This component now fetches live data from your API
const RestaurantOverview = () => {
    // State to hold the fetched restaurant data, loading status, and any errors
    const [restaurantData, setRestaurantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // GST number states
    const [gstNumber, setGstNumber] = useState('');
    const [isEditingGst, setIsEditingGst] = useState(false);
    const [gstError, setGstError] = useState('');
    const [gstSaving, setGstSaving] = useState(false);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            // 1. Get the restaurant ID from local storage
            const restaurantId = localStorage.getItem('restaurantId');

            if (!restaurantId) {
                setError('Restaurant ID not found in local storage.');
                setLoading(false);
                return;
            }

            try {
                // 2. Fetch data from your backend API using the retrieved ID
                const response = await fetch(`https://dineinn-pro-backend.onrender.com/api/restaurants/${restaurantId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }

                const data = await response.json();
                setRestaurantData(data); // 3. Store the fetched data in state
                
                // Set GST number if available
                setGstNumber(data.gst_number || '');

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // Stop loading, whether successful or not
            }
        };

        fetchRestaurantDetails();
    }, []); // The empty dependency array [] ensures this effect runs only once

    const handlePayNow = () => {
        setShowPaymentModal(true);
    };

    const closeModal = () => {
        setShowPaymentModal(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // GST validation function
    const validateGST = (gst) => {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstRegex.test(gst);
    };

    // Handle GST edit
    const handleEditGst = () => {
        setIsEditingGst(true);
        setGstError('');
    };

    // Handle GST save
    const handleSaveGst = async () => {
        if (!gstNumber.trim()) {
            setGstError('GST number is required');
            return;
        }

        if (!validateGST(gstNumber.trim())) {
            setGstError('Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)');
            return;
        }

        setGstSaving(true);
        setGstError('');

        try {
            const restaurantId = localStorage.getItem('restaurantId');
            const response = await fetch(`https://dineinn-pro-backend.onrender.com/api/restaurants/${restaurantId}/gst`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gst_number: gstNumber.trim() }),
            });

            if (!response.ok) {
                throw new Error('Failed to update GST number');
            }

            // Update local state
            setRestaurantData(prev => ({
                ...prev,
                gst_number: gstNumber.trim()
            }));

            setIsEditingGst(false);
        } catch (err) {
            setGstError('Failed to save GST number. Please try again.');
        } finally {
            setGstSaving(false);
        }
    };

    // Handle GST cancel
    const handleCancelGst = () => {
        setGstNumber(restaurantData?.gst_number || '');
        setIsEditingGst(false);
        setGstError('');
    };
    
    // Display loading message while data is being fetched
    if (loading) {
        return <div className="ro-container"><p>Loading restaurant details...</p></div>;
    }

    // Display error message if fetching failed
    if (error) {
        return <div className="ro-container"><p>Error: {error}</p></div>;
    }

    // Display message if no data was found
    if (!restaurantData) {
        return <div className="ro-container"><p>No restaurant data available.</p></div>;
    }

    return (
        <div className="ro-container">
            <div className="ro-header">
                {/* Display dynamic restaurant name */}
                <h1 className="ro-title">{restaurantData.name || 'Restaurant Overview'}</h1>
            </div>

            {/* Restaurant Details Card - Now displays dynamic data */}
            <div className="ro-card">
                <div className="ro-card-header">
                    <h2 className="ro-card-title">Restaurant Details</h2>
                </div>
                <div className="ro-card-content">
                    <div className="ro-info-grid">
                        <div className="ro-info-item">
                            <span className="ro-label">Restaurant Name:</span>
                            {/* Optional chaining (?.) prevents errors if data is missing */}
                            <span className="ro-value">{restaurantData?.name}</span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Restaurant ID:</span>
                            <span className="ro-value">{restaurantData?.id}</span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Location:</span>
                            <span className="ro-value">
                                {/* The 'restaurants' table doesn't have city/state, so this is left static for now. 
                                    You could add these fields to your database and API response. */}
                                Mumbai, Maharashtra
                            </span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Admin Contact:</span>
                            <span className="ro-value">{restaurantData?.admin_email}</span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Status:</span>
                            <span className="ro-value">{restaurantData?.status}</span>
                        </div>
                        {/* GST Number Section */}
                        <div className="ro-info-item ro-gst-item">
                            <span className="ro-label">GST Number:</span>
                            <div className="ro-gst-section">
                                {isEditingGst ? (
                                    <div className="ro-gst-edit-container">
                                        <input
                                            type="text"
                                            className={`ro-gst-input ${gstError ? 'ro-input-error' : ''}`}
                                            value={gstNumber}
                                            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                            placeholder="Enter GST Number (e.g., 22AAAAA0000A1Z5)"
                                            maxLength={15}
                                            disabled={gstSaving}
                                        />
                                        <div className="ro-gst-buttons">
                                            <button
                                                className="ro-gst-save-btn"
                                                onClick={handleSaveGst}
                                                disabled={gstSaving}
                                            >
                                                {gstSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                className="ro-gst-cancel-btn"
                                                onClick={handleCancelGst}
                                                disabled={gstSaving}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        {gstError && <div className="ro-gst-error">{gstError}</div>}
                                    </div>
                                ) : (
                                    <div className="ro-gst-display">
                                        <span className="ro-value">
                                            {restaurantData?.gst_number || 'Not provided'}
                                        </span>
                                        <button
                                            className="ro-gst-edit-btn"
                                            onClick={handleEditGst}
                                        >
                                            {restaurantData?.gst_number ? 'Edit' : 'Add'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Details Card - Now displays dynamic data */}
            <div className="ro-card">
                <div className="ro-card-header">
                    <h2 className="ro-card-title">Subscription Details</h2>
                </div>
                <div className="ro-card-content">
                    <div className="ro-info-grid">
                        <div className="ro-info-item">
                            <span className="ro-label">User Email:</span>
                            <span className="ro-value">{restaurantData?.admin_email}</span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Subscription Plan:</span>
                            <span className="ro-value">{restaurantData?.plan}</span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Start Date:</span>
                            <span className="ro-value">{formatDate(restaurantData?.start_date)}</span>
                        </div>
                        <div className="ro-info-item">
                            <span className="ro-label">Expiry Date:</span>
                            <span className="ro-value">{formatDate(restaurantData?.expiry_date)}</span>
                        </div>
                    </div>
                    <div className="ro-payment-section">
                        <button 
                            className="ro-pay-button"
                            onClick={handlePayNow}
                        >
                            Pay Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal (no changes needed here) */}
            {showPaymentModal && (
                <div className="ro-modal-overlay" onClick={closeModal}>
                    <div className="ro-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ro-modal-header">
                            <h3 className="ro-modal-title">Payment Details</h3>
                            <button 
                                className="ro-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>
                        </div>
                        <div className="ro-modal-body">
                            <div className="ro-qr-container">
    <div className="ro-qr-wrapper">
        {/* Replace 'your-qr-image-path.png' with the actual path to your QR code image */}
        <img 
    src="/dhruv-qr.jpeg" 
    alt="Payment QR Code" 
    className="ro-payment-qr"
/>
    </div>
    <p className="ro-payment-text">
        Scan the QR code above to complete your payment
    </p>
    <div className="ro-payment-amount">
        <span className="ro-amount">₹2,999</span>
        <span className="ro-amount-label">Annual Subscription</span>
    </div>
</div>
                        </div>
                        <div className="ro-modal-footer">
                            <button 
                                className="ro-cancel-button"
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantOverview;
