import React from 'react';
import { Navigate } from 'react-router-dom';
import useFeatureAccess from './useFeatureAccess';

const ProtectedRoute = ({ feature, children }) => {
  const hasAccess = useFeatureAccess(feature);
  return hasAccess ? children : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute; 