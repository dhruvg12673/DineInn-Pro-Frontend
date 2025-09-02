import { useContext } from 'react';
import { PlanContext } from '../pages/Admin/PlanContext';
import plans from '../pages/Admin/PlanConfig';

const RestaurantAccessPanel = () => {
  const { currentPlan, setCurrentPlan } = useContext(PlanContext);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="plan">Select Plan: </label>
        <select id="plan" value={currentPlan} onChange={(e) => setCurrentPlan(e.target.value)}>
          {Object.keys(plans).map((planKey) => (
            <option key={planKey} value={planKey}>
              {plans[planKey].name}
            </option>
          ))}
        </select>
      </div>
      {/* Add other restaurant access panel content here */}
    </div>
  );
};

export default RestaurantAccessPanel; 