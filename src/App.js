import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlanProvider } from './pages/Admin/PlanContext';
 import RoleGuard from './components/Common/RoleGuard';
import { socketService } from './services/socketService';

  
// Import Pages
import YourOrders from './pages/Guest/YourOrders';
import Payroll from './pages/Admin/Payroll';
import GoogleTranslate from './components/LanguageSelector';
import RestaurantAccessPanel from './pages/Admin/RestaurantAccessPanel';
import OfferPageWithProtection from './pages/Admin/OfferPage';
import HelpSupport from './pages/Admin/HelpSupport';
import Orderlist from './pages/Admin/Orderlist';
import RestaurantOverview from './pages/Admin/RestaurantOverview';
import MenuOnOff from './pages/Admin/MenuOnOff';
import Dineinn from './pages/Admin/Dineinn';
import QRGenerator from './pages/Admin/QRGenerator';
import NotificationLog from './pages/Admin/NotificationLog';
import TableManager from './pages/Admin/TableManager';
import OrderssPage from './pages/Admin/OrderssPage';
import StaffControl from './pages/Admin/StaffControl'; // ✅ correct casing
import ValetParking from './pages/Admin/ValetParking';
import Cheff from './pages/Admin/Cheff';
import Stock from './pages/Admin/stock'; // adjust the path if different
import BillingPage from './pages/Admin/BillingPage';
import AdminHome from './pages/Admin/AdminHome';
import MenuPage from './pages/Guest/MenuPage';
import PollsPage from './pages/Guest/PollsPage';
import FeedbackPage from './pages/Guest/FeedbackPage';
import TipPage from './pages/Guest/TipPage';
import OrderPage from './pages/Guest/OrderPage';
import LoginPage from './pages/Staff/LoginPage';
import AttendancePage from './pages/Admin/AttendancePage';
import POSPage from './pages/Admin/POSPage';
import Dashboard from './pages/Admin/Dashboard';
import MenuEditor from './pages/Admin/MenuEditor';
import PollManager from './pages/Admin/PollManager';
import InventoryPage from './pages/Admin/InventoryPage';
import StaffManager from './pages/Admin/StaffManager';
import FeedbackReview from './pages/Admin/FeedbackReview';
import UnauthorizedPage from './pages/Common/UnauthorizedPage';
import Guest from './pages/Guest/Guest';

// --- Security Wrapper for Owner Access ---
const ProtectedOwnerRoute = ({ children }) => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Retrieve the owner email from env (matches the bypass logic in LoginPage)
  const ownerEmail = process.env.REACT_APP_OWNER_MAIL;

  // Verify that the user exists and their email matches the master owner email
  const isOwner = user && user.email === ownerEmail;

  if (!isOwner) {
    // If not the owner, force redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};
const getLoggedInUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user;
  } catch (error) {
    return null;
  }
};
function App() {
  const user = getLoggedInUser();

  useEffect(() => {
    // If a user is logged in, connect the socket.
    if (user && user.restaurantid) {
      socketService.connect(user.restaurantid);
    }

    // The cleanup function will run when the component unmounts,
    // ensuring the user is disconnected.
    return () => {
      socketService.disconnect();
    };
  }, [user?.restaurantid]); // The effect re-runs if the user logs in or out.
  return (
    <AuthProvider>
      <PlanProvider>
      <Router>
        <div className="App">
          <GoogleTranslate /> 
          <Routes>
            
            {/* Guest Routes */}
            {/* Guest Routes */}
            <Route path="/guest/YourOrders/:restaurantId/:categoryid/:tableNo" element={<YourOrders/>} />
            <Route path="/:restaurantId/Payroll" element={<Payroll />} />
            <Route path="/guest/:restaurantId/:categoryid/:tableNo" element={<Guest />} />
            <Route path="/guest/MenuPage/:restaurantId/:categoryid/:tableNo" element={<MenuPage />} />

            <Route path="/:restaurantId/admin" element={<AdminHome />} />
            <Route path="/:restaurantId/Manager" element={<StaffControl />} />
            <Route path="/:restaurantId/Waiter" element={<POSPage />} />

            
            <Route path="/guest/OrderPage/:restaurantId/:categoryid/:tableNo" element={<OrderPage />} />
            <Route path="/guest/PollsPage/:restaurantId/:categoryid/:tableNo" element={<PollsPage />} />
            <Route path="/guest/FeedbackPage/:restaurantId/:categoryid/:tableNo" element={<FeedbackPage />} />
            <Route path="/guest/TipPage/:restaurantId/:tableCategoryId/:tableNo" element={<TipPage />} />
            <Route path="/:restaurantId/admin/billing" element={<BillingPage />} />
            <Route path="/:restaurantId/billing" element={<BillingPage />} />
            <Route path="/:restaurantId/Dashboard" element={<Dashboard />} />
            <Route path="/:restaurantId/NotificationLog" element={<NotificationLog />} />
            <Route path="/:restaurantId/MenuEditor" element={<MenuEditor />} />
            <Route path="/:restaurantId/RestaurantOverview" element={<RestaurantOverview />} />
            <Route path="/:restaurantId/Dineinn" element={<Dineinn />} />
            <Route path="/:restaurantId/MenuOnOff" element={<MenuOnOff />} />
            <Route path="/:restaurantId/HelpSupport" element={<HelpSupport />} />
            <Route path="/:restaurantId/Orderlist" element={<Orderlist />} />
            <Route path="/:restaurantId/stock" element={<Stock />} />
            <Route path="/:restaurantId/PollManager" element={<PollManager />} />
            <Route path="/:restaurantId/ValetParking" element={<ValetParking />} />
            <Route path="/:restaurantId/QRGenerator" element={<QRGenerator />} />
            <Route path="/:restaurantId/StaffManager" element={<StaffManager />} />
            <Route path="/:restaurantId/InventoryPage" element={<InventoryPage />} />
            <Route path="/:restaurantId/feedback" element={<FeedbackReview />} />
            <Route path="/:restaurantId/Cheff" element={<Cheff />} />
            <Route path="/:restaurantId/POSPage" element={<POSPage />} />
            <Route path="/:restaurantId/Admin/valetParking" element={<ValetParking/>} />
            <Route path="/:restaurantId/AttendancePage" element={<AttendancePage/>} />
            <Route path="/:restaurantId/admin/tables" element={<TableManager/>} />
            <Route path="/:restaurantId/OrderssPage" element={<OrderssPage/>} />
            {/* ✅ Protected Owner Route */}
<Route 
  path="/login/Admin/restaurantaccesspanel" 
  element={
    <ProtectedOwnerRoute>
      <RestaurantAccessPanel />
    </ProtectedOwnerRoute>
  } 
/>
            <Route path="/:restaurantId/tables" element={<TableManager />} />
            <Route path="/:restaurantId/offer" element={<OfferPageWithProtection />} />
            <Route path="/:restaurantId/Chef" element={<Cheff />} />


            {/* Auth Routes */}
            
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Staff Routes */}
            {/* ✅ Protected Owner Route */}
<Route 
  path="/login/Admin/restaurantaccesspanel" 
  element={
    <ProtectedOwnerRoute>
      <RestaurantAccessPanel />
    </ProtectedOwnerRoute>
  } 
/>
            <Route
              path="/Admin/AttendancePage"
              element={
                <RoleGuard roles={['staff', 'admin']}>
                  <AttendancePage />
                </RoleGuard>
              }
            />
            <Route
              path="/Admin/TableManager"
              element={
                <RoleGuard roles={['staff', 'admin']}>
                  <TableManager />
                </RoleGuard>
              }
            />
            
             
           
            
             
            
            

            {/* Admin Routes */}
             <Route
              path="/admin/AdminHome"
              element={
                <RoleGuard roles={['admin']}>
                  <AdminHome />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/QRGenerator"
              element={
                <RoleGuard roles={['admin']}>
                  <QRGenerator />
                </RoleGuard>
              }
            />
             <Route
              path="/admin/ValetParking"
              element={
                <RoleGuard roles={['admin']}>
                  <ValetParking />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/Dashboard"
              element={
                <RoleGuard roles={['admin']}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/MenuEditor"
              element={
                <RoleGuard roles={['admin']}>
                  <MenuEditor />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/PollManager"
              element={
                <RoleGuard roles={['admin']}>
                  <PollManager />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/InventoryPage"
              element={
                <RoleGuard roles={['admin']}>
                  <InventoryPage />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/StaffManager"
              element={
                <RoleGuard roles={['admin']}>
                  <StaffManager />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <RoleGuard roles={['admin']}>
                  <FeedbackReview />
                </RoleGuard>
              }
            />
          </Routes>
        </div>
      </Router>
      </PlanProvider>
    </AuthProvider>
  );
}

export default function WrappedApp() {
  return (
    <PlanProvider>
      <App />
    </PlanProvider>
  );
}
