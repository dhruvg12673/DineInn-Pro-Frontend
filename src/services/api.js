import axios from 'axios';

// Define the base URL for your backend API
const API_BASE = 'https://dineinn-pro-backend.onrender.com';

// Create an Axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE,
});

// Helper function to safely get the restaurantId from localStorage
const getRestaurantId = () => {
    try {
        // First, try to get the user object which contains the restaurantid
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.restaurantid) {
            return user.restaurantid;
        }
        // As a fallback, try getting restaurantId directly (for older setups)
        const restaurantId = localStorage.getItem('restaurantId');
        if (restaurantId) {
            return restaurantId;
        }
        throw new Error("No restaurant ID found in localStorage.");
    } catch (error) {
        console.error("Could not retrieve restaurant ID:", error);
        // Return null or handle the error as appropriate for your application
        return null;
    }
};


// --- KPI & CORE METRICS ---
export const fetchKpiData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/kpis', { params: { restaurantId, range } });
};

export const fetchSalesVsExpensesData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/sales-vs-expenses', { params: { restaurantId, range } });
};

export const fetchDailyProfitData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/daily-profit', { params: { restaurantId, range } });
};

// --- DISH & ORDER ANALYSIS ---
export const fetchTopDishesData = () => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/top-dishes', { params: { restaurantId } });
};

export const fetchPeakTimesData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/peak-order-times', { params: { restaurantId, range } });
};

export const fetchPopularCategoriesData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/popular-categories', { params: { restaurantId, range } });
};

// --- CUSTOMER ANALYSIS ---
export const fetchCustomerTypeData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/customer-type', { params: { restaurantId, range } });
};

export const fetchAOVData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/aov', { params: { restaurantId, range } });
};

export const fetchTopSpendersData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/top-spenders', { params: { restaurantId, range } });
};

export const fetchSentimentData = () => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/feedback-sentiment', { params: { restaurantId } });
};

// --- STAFF & OPERATIONS ---
export const fetchMostTippedStaffData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/most-tipped-staff', { params: { restaurantId, range } });
};

// --- REVENUE & INVENTORY ---
export const fetchRevenueSourceData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/revenue-by-source', { params: { restaurantId, range } });
};

export const fetchLowStockAlertsData = () => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/low-stock-alerts', { params: { restaurantId } });
};

// **NEW**: Function to fetch inventory levels for the dashboard chart
export const fetchInventoryLevelsData = () => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/inventory-levels', { params: { restaurantId } });
};

// NOTE: The `fetchAttendanceData` function was removed from the dashboard,
// but if you need it elsewhere, it would look like this:
/*
export const fetchAttendanceData = (range) => {
  const restaurantId = getRestaurantId();
  return api.get('/api/dashboard/staff-attendance', { params: { restaurantId, range } });
};
*/
