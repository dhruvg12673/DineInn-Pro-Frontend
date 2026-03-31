import React, { useState, useEffect, useContext } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, Star, AlertTriangle, ShoppingCart } from 'lucide-react';
import './Dashboard.css';
import { PlanContext } from './PlanContext';
import ProtectedRoute from './ProtectedRoute';
import {
    fetchKpiData,
    fetchSalesVsExpensesData,
    fetchTopDishesData,
    fetchPeakTimesData,
    fetchSentimentData,
    fetchRevenueSourceData,
    fetchDailyProfitData,
    fetchCustomerTypeData,
    fetchAOVData,
    fetchTopSpendersData,
    fetchPopularCategoriesData,
    fetchLowStockAlertsData,
    fetchMostTippedStaffData,
    fetchInventoryLevelsData 
} from '../../services/api';

const RestaurantDashboard = () => {
  const [selectedDateRange, setSelectedDateRange] = useState('week');

  // State for DYNAMIC data from API
  const [kpiData, setKpiData] = useState({ expenses: 0, revenue: 0, netProfit: 0 });
  const [salesVsExpenses, setSalesVsExpenses] = useState([]);
  const [dailyProfitData, setDailyProfitData] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [peakOrderTimes, setPeakOrderTimes] = useState([]);
  const [feedbackSentiment, setFeedbackSentiment] = useState([]);
  const [revenueBySource, setRevenueBySource] = useState([]);
  const [customerTypeData, setCustomerTypeData] = useState([]);
  const [aovData, setAovData] = useState([]);
  const [topSpendersData, setTopSpendersData] = useState([]);
  const [popularCategoriesData, setPopularCategoriesData] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [mostTippedStaff, setMostTippedStaff] = useState([]);
  const [inventoryLevels, setInventoryLevels] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      const restaurantId = localStorage.getItem('restaurantId');
      if (!restaurantId) {
          setError("No restaurant ID found. Please log in again.");
          setLoading(false);
          return;
      }

      try {
        const [
          kpiRes, salesVsExpensesRes, dailyProfitRes, topDishesRes,
          peakTimesRes, sentimentRes, revenueSourceRes,
          customerTypeRes, aovRes, topSpendersRes, popularCategoriesRes, lowStockRes,
          mostTippedStaffRes, inventoryLevelsRes
        ] = await Promise.all([
          fetchKpiData(selectedDateRange),
          fetchSalesVsExpensesData(selectedDateRange),
          fetchDailyProfitData(selectedDateRange),
          fetchTopDishesData(),
          fetchPeakTimesData(selectedDateRange),
          fetchSentimentData(),
          fetchRevenueSourceData(selectedDateRange),
          fetchCustomerTypeData(selectedDateRange),
          fetchAOVData(selectedDateRange),
          fetchTopSpendersData(selectedDateRange),
          fetchPopularCategoriesData(selectedDateRange),
          fetchLowStockAlertsData(),
          fetchMostTippedStaffData(selectedDateRange),
          fetchInventoryLevelsData()
        ]);

        setKpiData(kpiRes.data);
        setSalesVsExpenses(salesVsExpensesRes.data);
        setDailyProfitData(dailyProfitRes.data);
        setTopDishes(topDishesRes.data);
        setPeakOrderTimes(peakTimesRes.data);
        setFeedbackSentiment(sentimentRes.data);
        setRevenueBySource(revenueSourceRes.data);
        setCustomerTypeData(customerTypeRes.data);
        setAovData(aovRes.data);
        setTopSpendersData(topSpendersRes.data);
        setPopularCategoriesData(popularCategoriesRes.data);
        setLowStockAlerts(lowStockRes.data);
        setMostTippedStaff(mostTippedStaffRes.data);
        setInventoryLevels(inventoryLevelsRes.data);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || "Could not load dashboard data. Please check the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDateRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const CUSTOMER_COLORS = ['#4CAF50', '#2196F3'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const netProfit = kpiData.netProfit;
  const profitColor = netProfit >= 0 ? '#4CAF50' : '#F44336';

  if (loading) return <div className="loading-container">Loading Dashboard...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Restaurant Analytics Dashboard</h1>
        <div className="date-filter">
          <Calendar className="filter-icon" />
          <select value={selectedDateRange} onChange={(e) => setSelectedDateRange(e.target.value)} className="date-select">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      <div className="kpi-cards">
        <div className="kpi-card expenses"><div className="kpi-icon"><DollarSign /></div><div className="kpi-content"><h3>Expenses</h3><p className="kpi-value">{formatCurrency(kpiData.expenses)}</p></div></div>
        <div className="kpi-card revenue"><div className="kpi-icon"><TrendingUp /></div><div className="kpi-content"><h3>Revenue</h3><p className="kpi-value">{formatCurrency(kpiData.revenue)}</p></div></div>
        <div className="kpi-card profit"><div className="kpi-icon"><Star /></div><div className="kpi-content"><h3>Net Profit</h3><p className="kpi-value" style={{ color: profitColor }}>{formatCurrency(netProfit)}</p></div></div>
      </div>

      <div className="charts-grid">
        {/* --- DYNAMIC CHARTS --- */}
        <div className="chart-card full-width"><h3>Sales vs Expenses (Overall)</h3><ResponsiveContainer width="100%" height={300}><LineChart data={salesVsExpenses}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => `₹${value/1000}k`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="sales" stroke="#4CAF50" strokeWidth={3} name="Sales" /><Line type="monotone" dataKey="expenses" stroke="#F44336" strokeWidth={3} name="Expenses" /></LineChart></ResponsiveContainer></div>
        <div className="chart-card full-width"><h3>Daily Sales</h3><ResponsiveContainer width="100%" height={300}><BarChart data={dailyProfitData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => `₹${value/1000}k`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Bar dataKey="sales" fill="#4CAF50" name="Sales" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Daily Expenses</h3><ResponsiveContainer width="100%" height={300}><BarChart data={dailyProfitData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => `₹${value/1000}k`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Bar dataKey="expenses" fill="#F44336" name="Expenses" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Daily Profit</h3><ResponsiveContainer width="100%" height={300}><BarChart data={dailyProfitData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => `₹${value/1000}k`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Bar dataKey="profit" fill="#2196F3" name="Profit" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Top-Selling Dishes</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={topDishes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{topDishes.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Peak Order Times</h3><ResponsiveContainer width="100%" height={300}><BarChart data={peakOrderTimes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis /><Tooltip /><Bar dataKey="orders" fill="#2196F3" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Feedback Sentiment</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={feedbackSentiment} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{feedbackSentiment.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Revenue by Source</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={revenueBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{revenueBySource.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>New vs. Returning Customers</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={customerTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>{customerTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CUSTOMER_COLORS[index % CUSTOMER_COLORS.length]} />))}</Pie><Tooltip formatter={(value) => `${value} customers`} /><Legend /></PieChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Average Order Value (AOV)</h3><ResponsiveContainer width="100%" height={300}><LineChart data={aovData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} name="AOV" /></LineChart></ResponsiveContainer></div>
        <div className="chart-card full-width"><h3>Top 5 Spenders</h3><ResponsiveContainer width="100%" height={300}><BarChart data={topSpendersData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={(value) => formatCurrency(value)} /><YAxis dataKey="name" type="category" width={120} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Bar dataKey="total" fill="#00C49F" name="Total Spent" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card full-width"><h3>Popular Menu Categories (by Orders)</h3><ResponsiveContainer width="100%" height={300}><BarChart data={popularCategoriesData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="orders" fill="#FFBB28" name="Total Orders" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card full-width"><h3><AlertTriangle size={20} style={{ marginRight: '8px', color: '#FF9800' }}/>Inventory Low Stock Alerts</h3>{lowStockAlerts.length > 0 ? (<div className="low-stock-list">{lowStockAlerts.map((item, index) => (<div key={index} className="low-stock-item"><span className="stock-item-name">{item.item}</span><span className="stock-item-details">Current: <strong>{item.quantity} {item.unit}</strong> (Threshold: {item.threshold} {item.unit})</span></div>))}</div>) : (<div className="no-alerts"><ShoppingCart size={40} /><p>All inventory levels are currently above their thresholds. Great job!</p></div>)}</div>

        {/* --- RESTORED CHARTS --- */}
        <div className="chart-card half-width"><h3>Top 5 Stocked Items</h3><ResponsiveContainer width="100%" height={300}><BarChart data={inventoryLevels}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => `${value} units`} /><Bar dataKey="stock" fill="#4CAF50" name="Current Stock" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card half-width"><h3>Most Tipped Staff</h3><ResponsiveContainer width="100%" height={300}><BarChart data={mostTippedStaff} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={(value) => `₹${value}`} /><YAxis dataKey="name" type="category" width={80} /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="tips" fill="#9C27B0" /></BarChart></ResponsiveContainer></div>

      </div>
    </div>
  );
};

  const RestaurantDashboardpro = () => {
  const { setCurrentPlan } = useContext(PlanContext);
  const restaurantId = localStorage.getItem('restaurantId');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`https://dineinn-pro-backend.onrender.com/api/restaurants/${restaurantId}`);
        const data = await res.json();

        if (!data.plan) {
          console.warn('No plan found in response, defaulting to free');
          setCurrentPlan('free');
        } else {
          setCurrentPlan(data.plan);
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
    <ProtectedRoute feature="dashboard">
      <RestaurantDashboard />
    </ProtectedRoute>
  );
}

export default RestaurantDashboardpro;