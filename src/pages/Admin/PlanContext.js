import React, { createContext, useState } from 'react';

export const PlanContext = createContext();

export const PlanProvider = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState('free');

  return (
    <PlanContext.Provider value={{ currentPlan, setCurrentPlan }}>
      {children}
    </PlanContext.Provider>
  );
}; 