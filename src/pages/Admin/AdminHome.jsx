import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './AdminHome.css';

const socket = io('https://dineinn-pro-backend.onrender.com'); 

const AdminHome = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Operations');
  const [currentTime, setCurrentTime] = useState(new Date());
  ;
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
    lastLogin: "Today at 2:30 PM",
    profilePicture: "https://via.placeholder.com/80x80/4a9b8e/ffffff?text=U",
    restaurantName: ""
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRestaurantId = localStorage.getItem('restaurantId');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserData({
        name: user.restaurantName || `Restaurant ${user.restaurantid || restaurantId}`,
        email: user.email || "",
        role: user.role || "",
        lastLogin: "Today at 2:30 PM",
        profilePicture: `https://via.placeholder.com/80x80/4a9b8e/ffffff?text=${(user.restaurantName || 'R').charAt(0).toUpperCase()}`,
        restaurantName: user.restaurantName || `Restaurant ${user.restaurantid || restaurantId}`
      });
    }
  }, [restaurantId]);

  // Load notification count from localStorage on mount
  useEffect(() => {
    const storedCount = localStorage.getItem(`_${restaurantId}`);
    if (storedCount) {
      (parseInt(storedCount, 10));
    }
  }, [restaurantId]);

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleEditProfile = () => {
    console.log("Edit profile clicked");
    setIsProfileModalOpen(false);
  };

  const handleChangePassword = () => {
    console.log("Change password clicked");
    setIsProfileModalOpen(false);
    localStorage.removeItem('user');
    localStorage.removeItem('restaurantId');
    navigate('/login?view=forgot');
  };

  // Handle notification button click
  const handleNotificationClick = () => {
    navigate(`/${restaurantId}/notificationlog`);
    // Clear notification count when user views notifications
    
    localStorage.removeItem(`notificationCount_${restaurantId}`);
  };

  // Handle analytics button click
  const handleAnalyticsClick = () => {
    navigate(`/${restaurantId}/dashboard`);
  };

  useEffect(() => {
    socket.on('waiter-call', ({ restaurantId, categoryId, tableId }) => {
      const notificationSound = new Audio('/notification.mp3');
      notificationSound.play();
      
      // Increment notification count
     
      localStorage.setItem(`_${restaurantId}`, toString());
      
      alert(
        `🚨 Waiter Call!\nRestaurant: ${restaurantId}\nCategory: ${categoryId}\nTable: ${tableId}`
      );
    });

    return () => {
      socket.off('waiter-call');
    };
  }, [restaurantId]);

  const handleLogout = () => {
  console.log("Logging out and clearing session data...");
  
  // 1. Clear the specific user and restaurant data
  localStorage.removeItem('user');
  localStorage.removeItem('restaurantId');
  
  // 2. OPTIONAL: Clear any other session-specific keys you've created
  // This clears the notification count for this specific restaurant
  localStorage.removeItem(`_${restaurantId}`);
  
  // 3. Close any open modals
  setIsProfileModalOpen(false);
  
  // 4. Redirect to login page
  navigate('/login');
  
  // 5. Force a page reload (Optional but recommended)
  // This ensures all state in memory is wiped out completely
  window.location.reload();
};

  // Social media links
  const socialLinks = [
    { name: 'Facebook', icon: '📘', url: 'https://facebook.com/dineinpro', color: '#1877f2' },
    { name: 'Instagram', icon: '📷', url: 'https://instagram.com/dineinpro', color: '#e4405f' },
    { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/dineinpro', color: '#1da1f2' },
    { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com/company/dineinpro', color: '#0077b5' },
    { name: 'YouTube', icon: '📺', url: 'https://youtube.com/dineinpro', color: '#ff0000' },
  ];

  const handleSocialClick = (url) => {
    window.open(url, '_blank');
  };

  // Categories for sidebar
  const categories = [
    {
      id: 'Billing',
      label: 'Billing',
      icon: '',
    },
    {
      id: 'Operations',
      label: 'Operations',
      icon: '',
    },
    {
      id: 'Reports',
      label: 'Reports',
      icon: '',
    },
    {
      id: 'Settings',
      label: 'Settings',
      icon: '',
    },
    {
      id: 'Staff',
      label: 'Staff ',
      icon: '',
    },
    {
      id: 'CRM',
      label: 'CRM ',
      icon: '',
    },
    {
      id: 'Help',
      label: 'Help & Support',
      icon: '',
    },
  ];

  // All nav items organized by category
  const navItemsByCategory = {
    Billing: [
      {
        label: 'Table Manager',
        path: '/admin/tables',
        icon: '🪑',
        description: 'Manage restaurant table layout',
        bgColor: 'card-bg'
      },
      {
        label: 'Order Manager',
        path: '/admin/OrderssPage',
        icon: '📋',
        description: 'Manage Orders',
        bgColor: 'card-bg'
      },
      
    ],
    Operations: [
      {
        label: 'Notification Logs',
        path: '/admin/NotificationLog',
        icon: '🔔',
        description: 'View waiter call logs',
        bgColor: 'card-bg'
      },
      {
        label: 'Menu Editor',
        path: '/admin/MenuEditor',
        icon: '🍽',
        description: 'Manage menu items',
        bgColor: 'card-bg'
      },
      {
        label: 'Stock',
        path: '/admin/stock',
        icon: '📉',
        description: 'Manage stock levels',
        bgColor: 'card-bg'
      },
      {
        label: 'Billing',
        path: '/admin/billing',
        icon: '🧾',
        description: 'Generate bills for customers',
        bgColor: 'card-bg'
      },
      {
        label: 'Expenses',
        path: '/admin/InventoryPage',
        icon: '📦',
        description: 'Track Expenses',
        bgColor: 'card-bg'
      },
      {
        label: 'Valet Parking',
        path: '/admin/valetParking',
        icon: '🚗',
        description: 'Manage valet parking',
        bgColor: 'card-bg'
      },
      {
        label: 'CashFlow',
        path: '/admin/QRGenerator',
        icon: '💵',
        description: 'Manage CashFlow',
        bgColor: 'card-bg'
      },
      {
        label: 'Orders List',
        path: '/admin/Orderlist',
        icon: '📋',
        description: 'Orders List',
        bgColor: 'card-bg'
      },
      {
        label: 'Menu On/Off',
        path: '/admin/MenuOnOff',
        icon: '🔄',
        description: 'Manage menu items',
        bgColor: 'card-bg'
      },
    ],
    Reports: [
      {
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: '📊',
        description: 'Go to dashboard',
        bgColor: 'card-bg'
      },
    ],
    CRM: [
      {
        label: 'Feedback Review',
        path: '/admin/feedback',
        icon: '📝',
        description: 'Review customer feedback',
        bgColor: 'card-bg'
      },
      {
        label: 'Poll Manager',
        path: '/admin/PollManager',
        icon: '📋',
        description: 'Create and manage polls',
        bgColor: 'card-bg'
      },
      {
        label: 'Customer Offers',
        path: '/admin/offer',
        icon: '🎁',
        description: 'Create & send offers to customers',
        bgColor: 'card-bg'
      },
    ],
    Staff: [
      {
        label: 'Staff Manager',
        path: '/admin/StaffManager',
        icon: '👥',
        description: 'Manage staff information',
        bgColor: 'card-bg'
      },
      {
        label: 'Staff Attendance',
        path: '/admin/AttendancePage',
        icon: '👥',
        description: 'Manage staff information',
        bgColor: 'card-bg'
      },
      {
        label: 'Staff Ordering',
        path: '/admin/POSPage',
        icon: '👥',
        description: 'Manage staff information',
        bgColor: 'card-bg'
      },
      {
        label: 'KDS',
        path: '/admin/Cheff',
        icon: '👥',
        description: 'Manage staff information',
        bgColor: 'card-bg'
      },
      {
        label: 'Staff Payroll',
        path: '/admin/Payroll',
        icon: '💰',
        description: 'Manage staff Salaries',
        bgColor: 'card-bg'
      },
    ],
    Settings: [
      {
        label: 'Language',
        path: '/admin/LanguagePage',
        icon: '🌐',
        description: 'Select your language',
        bgColor: 'card-bg'
      },
      {
        label: 'RestaurantOverview',
        path: '/admin/RestaurantOverview',
        icon: '🏪',
        description: 'YourRestaurantOverview',
        bgColor: 'card-bg'
      },
      {
        label: 'About Us',
        path: '/admin/Dineinn',
        icon: 'ℹ️',
        description: 'About Us',
        bgColor: 'card-bg'
      },
    ],
    Help: [
      {
        label: 'Help & Support',
        path: '/admin/HelpSupport',
        icon: '📞',
        description: 'Get help and support',
        bgColor: 'card-bg'
      },
    ],
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const getCurrentItems = () => {
    return navItemsByCategory[activeCategory] || [];
  };

  const getCategoryTitle = () => {
    return activeCategory === 'Help' ? 'Help & Support' : activeCategory;
  };

  return ( 
    <div className="admin-container">
      <div className="admin-header">
        <div className="bistro-admin">
          🍴 {userData.restaurantName || 'Manager Panel'}
          <div className="brand-tagline">Powered by DineInnPro™</div>
        </div>
        <div className="nav-links">
          <div className="live-time">
            <span className="time-icon">🕐</span>
            <span className="current-time">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="header-support-hub">
  <div className="support-contact-item">
    <div className="support-icon-circle">📞</div>
    <div className="support-text-stack">
      <span className="support-label">Support</span>
      <span className="support-value">+91 9324175216</span>
    </div>
  </div>
  <div className="support-contact-item">
    <div className="support-icon-circle">✉️</div>
    <div className="support-text-stack">
      <span className="support-label">Email Us</span>
      <span className="support-value">dineinnpro@gmail.com</span>
    </div>
  </div>
</div>
          <div className="profile-icon" onClick={handleProfileClick}>👤</div>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="profile-modal-overlay" onClick={handleCloseModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Profile</h3>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="profile-modal-content">
              <div className="profile-info">
                <div className="profile-picture">
                  <img src={userData.profilePicture} alt="Profile" />
                </div>
                <div className="profile-details">
                  <h4>{userData.restaurantName}</h4>
                  <p className="profile-email">{userData.email}</p>
                  <p className="profile-role">{userData.role}</p>
                  <p className="profile-last-login">Last login: {userData.lastLogin}</p>
                </div>
              </div>
              
              <div className="profile-actions">
                <button className="profile-btn edit-btn" onClick={handleEditProfile}>
                  Edit Profile
                </button>
                <button className="profile-btn password-btn" onClick={handleChangePassword}>
                  Change Password
                </button>
                <button className="profile-btn logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-main">
        {/* Sidebar */}
        <div className="admin-sidebar">
          {/* Brand Info Section */}
          <div className="sidebar-brand-info">
            
            <div className="brand-name">DineInnPro</div>
            <div className="brand-version">v2.4.1</div>
          </div>

          {/* System Status */}
          <div className="system-status">
            <div className="status-item">
              <span className="status-dot online"></span>
              <span>System Online</span>
            </div>
            <div className="status-item">
              <span className="status-dot"></span>
              <span>Restaurant ID: {restaurantId}</span>
            </div>
          </div>

          {categories.map((category) => (
            <div
              key={category.id}
              className={`sidebar-category ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span className="sidebar-category-icon">{category.icon}</span>
              <span>{category.label}</span>
            </div>
          ))}
          
        </div>

        {/* Main Content */}
        <div className="admin-content">
          {/* Content Header with Additional Info */}
          <div className="content-header">
            <div className="title-section">
              <h1 className="admin-title">{getCategoryTitle()}</h1>
              <div className="breadcrumb">
                <span>🏠 Dashboard</span>
                <span className="breadcrumb-separator">›</span>
                <span>{getCategoryTitle()}</span>
              </div>
            </div>
            <div className="header-stats">
              <div className="stat-badge" onClick={handleNotificationClick} style={{ cursor: 'pointer', position: 'relative' }}>
                <span className="badge-icon">🔔</span>
                <span className="badge-text"> Notifications</span>
                {   }
              </div>
              <div className="stat-badge" onClick={handleAnalyticsClick} style={{ cursor: 'pointer' }}>
                <span className="badge-icon">📊</span>
                <span className="badge-text">Live Analytics</span>
              </div>
            </div>
          </div>
          <div className="admin-grid">
            {getCurrentItems().map((item) => (
              <div
                key={item.label}
                onClick={() => navigate(`/${restaurantId}/${item.path.split('/').pop()?.toLowerCase()}`)}
                className={`admin-card ${item.bgColor}`}
              >
                <div className="card-icon">{item.icon}</div>
                <div className="card-content">
                  <h3 className="card-title">{item.label}</h3>
                  <p className="card-description">{item.description}</p>
                </div>
                <div className="card-badge">
                  <span className="badge-new">✨ Active</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          </div>
      </div>
    </div>
  );
};

export default AdminHome;