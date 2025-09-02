// In useFeatureAccess.js

import { useContext } from 'react';
import plans from './PlanConfig';
import { PlanContext } from './PlanContext';

const useFeatureAccess = (feature) => {
  const { currentPlan } = useContext(PlanContext);
  const allowed = plans[currentPlan]?.features || [];

  // --- START: ADD THESE LOGS FOR DEBUGGING ---
  console.group('--- Feature Access Check ---');
  console.log('Feature being checked:', feature);
  console.log('Current plan from context:', currentPlan);
  console.log('Allowed features for this plan:', allowed);
  console.log('Does this plan include the feature?', allowed.includes(feature));
  console.groupEnd();
  // --- END: ADD THESE LOGS FOR DEBUGGING ---

  return allowed.includes(feature);
};

export default useFeatureAccess;