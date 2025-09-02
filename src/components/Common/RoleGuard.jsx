// src/components/Common/RoleGuard.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const RoleGuard = ({ children, roles }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (user === undefined) {
    return <div>🔄 Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;
