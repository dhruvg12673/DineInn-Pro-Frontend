import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const MultiRestaurantLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState('login'); 
  
  const [loginForm, setLoginForm] = useState({
    restaurantId: '',
    email: '',
    password: '',
    role: 'Admin'
  });

  // Reverted to the original 3-step forgot password flow
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = ['StoreManager', 'Owner', 'Chef', 'Waiter', 'Billing'];

  // Check for query parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const viewParam = queryParams.get('view');
    
    if (viewParam === 'forgot') {
      setView('forgot');
      setMessage('Please enter your email to reset your password');
    }
  }, [location]);

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (message) setMessage('');
  };
  useEffect(() => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    navigate(`/${user.restaurantid}/${user.role.toLowerCase()}`);
  }
}, [navigate]);
  const handleLogin = async () => {
    const { restaurantId, email, password, role } = loginForm;

    if (!restaurantId || !email || !password || !role) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    if (email === 'owner@gmail.com' && restaurantId === '1' && role === 'Admin' && password === '123') {
      console.log('✅ Owner login successful');
      localStorage.setItem('user', JSON.stringify({ id: 'owner-id', restaurantid: '1', email, role }));
      navigate('/login/Admin/restaurantaccesspanel');
      setIsLoading(false);
      return;
    }

    try {
      // This will now call the updated backend route
      const response = await axios.post('https://dineinn-pro-backend.onrender.com/api/login', { restaurantId, email, password });
      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('restaurantId', user.restaurantid);
      navigate(`/${user.restaurantid}/${user.role.toLowerCase()}`);
    } catch (err) {
      // This will display the new expiry/on-hold errors from the server
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickLogin = (role, email = 'demo@example.com') => {
    const demoData = { restaurantId: 'demo-restaurant', email, password: 'demo123', role };
    localStorage.setItem('user', JSON.stringify({ id: 'demo-id', restaurantid: demoData.restaurantId, email: demoData.email, role: demoData.role }));
    localStorage.setItem('restaurantId', demoData.restaurantId);
    navigate(`/${demoData.restaurantId}/${role.toLowerCase()}`);
  };

  // --- FORGOT PASSWORD HANDLERS (3-STEP) ---

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('https://dineinn-pro-backend.onrender.com/api/forgot-password/send-otp', { email: forgotEmail });
      setMessage(`An OTP has been sent to ${forgotEmail}.`);
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await axios.post('https://dineinn-pro-backend.onrender.com/api/forgot-password/verify-otp', { email: forgotEmail, otp });
      setMessage('OTP verified successfully. You can now reset your password.');
      setForgotStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      await axios.post('https://dineinn-pro-backend.onrender.com/api/forgot-password/reset-password', { email: forgotEmail, otp, password: newPassword });
      setMessage('Your password has been updated successfully! Redirecting to login...');
      setTimeout(() => {
        setView('login');
        setMessage('');
        setError('');
        // Clear the URL query parameter
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetState = () => {
    setError('');
    setMessage('');
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep(1);
  }

  const renderForgotPasswordView = () => (
    <div className="forgot-password-view">
        {forgotStep === 1 && (
             <form onSubmit={handleSendOtp}>
                <h2 className="welcome-title">DineInnPro</h2>
                <p className="form-subtitle">Enter your email to receive an OTP.</p>
                <div className="field-group">
                    <label className="field-label">Email Address</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="field-input" placeholder="you@example.com" required />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send OTP'}</button>
            </form>
        )}
        {forgotStep === 2 && (
            <form onSubmit={handleVerifyOtp}>
                <h2 className="welcome-title">Verify OTP</h2>
                <p className="form-subtitle">Check your email for the 6-digit code.</p>
                <div className="field-group">
                    <label className="field-label">OTP</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="field-input" placeholder="Enter OTP" required />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
            </form>
        )}
        {forgotStep === 3 && (
            <form onSubmit={handleResetPassword}>
                <h2 className="welcome-title">Reset Password</h2>
                <p className="form-subtitle">Create a new, strong password.</p>
                <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="field-input" placeholder="New Password" required />
                </div>
                <div className="field-group">
                    <label className="field-label">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="field-input" placeholder="Confirm Password" required />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
        )}
        <button onClick={() => { setView('login'); resetState(); navigate('/login', { replace: true }); }} className="back-to-login-link">
            Back to Login
        </button>
    </div>
  );

  const renderLoginView = () => (
    <>
        <h1 className="welcome-title">Welcome Back</h1>
        <div className="form-fields">
            <div className="field-group">
              <label className="field-label">Restaurant ID *</label>
              <input type="text" name="restaurantId" value={loginForm.restaurantId} onChange={handleLoginInputChange} placeholder="e.g., pizzahub" className="field-input" required />
            </div>
            <div className="field-group">
              <label className="field-label">Email Address *</label>
              <input type="email" name="email" value={loginForm.email} onChange={handleLoginInputChange} placeholder="Enter your email" className="field-input" required />
            </div>
            <div className="field-group">
              <label className="field-label">Role *</label>
              <select name="role" value={loginForm.role} onChange={handleLoginInputChange} className="field-input">
                {roles.map(role => (<option key={role} value={role}>{role}</option>))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Password *</label>
              <input type="password" name="password" value={loginForm.password} onChange={handleLoginInputChange} placeholder="Enter your password" className="field-input" required />
            </div>
            <div className="forgot-password">
              <button onClick={() => { setView('forgot'); resetState(); }} className="forgot-link">Forgot password?</button>
            </div>
            <button onClick={handleLogin} className="submit-button" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
        </div>
        <div className="quick-login">
            <h3 className="quick-login-title">Quick Demo Login</h3>
            <div className="quick-login-grid">
              <button onClick={() => handleQuickLogin('Admin')} className="quick-login-button admin">Login as Admin</button>
              <button onClick={() => handleQuickLogin('Manager')} className="quick-login-button manager">Login as Manager</button>
              <button onClick={() => handleQuickLogin('Chef')} className="quick-login-button chef">Login as Chef</button>
              <button onClick={() => handleQuickLogin('Waiter')} className="quick-login-button waiter">Login as Waiter</button>
            </div>
        </div>
    </>
  );

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-content">
            <div className="logo-icon"><span>🍽️</span></div>
            <h2 className="logo-title">DineInnPro</h2>
            <p className="logo-subtitle">Multi-Restaurant Management System</p>
          </div>
        </div>
        <div className="form-section">
            {error && <div className="lo-error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            {view === 'login' ? renderLoginView() : renderForgotPasswordView()}
        </div>
      </div>
    </div>
  );
};

export default MultiRestaurantLogin;