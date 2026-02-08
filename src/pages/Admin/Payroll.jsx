import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { X, User, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { PlanContext } from './PlanContext';
import ProtectedRoute from './ProtectedRoute';
import './Payroll.css';

const StaffPayrollPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM' format
  const [staffData, setStaffData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customPayment, setCustomPayment] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');

  const restaurantId = localStorage.getItem('restaurantId');
  const API_BASE_URL = 'http://localhost:5000';

  const months = useMemo(() => {
    const monthArray = [];
    let currentDate = new Date();
    for (let i = 0; i < 8; i++) {
      monthArray.push({
        label: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        value: currentDate.toISOString().slice(0, 7)
      });
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    return monthArray;
  }, []);

  const getDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-');
    return new Date(year, month, 0).getDate();
  };

  const workDays = getDaysInMonth(selectedMonth);

  const fetchPayrollData = async () => {
    if (!restaurantId || !selectedMonth) return;
    setIsLoading(true);
    try {
      const payrollMonthDate = `${selectedMonth}-01`;
      const res = await axios.get(`${API_BASE_URL}/api/payroll`, {
        params: { restaurantId, month: payrollMonthDate }
      });
      
      const dataWithAbsences = res.data.map(staff => ({
        ...staff,
        absentDays: workDays - staff.presentDays
      }));
      setStaffData(dataWithAbsences);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, restaurantId]);

  const calculateSalary = (staff) => {
    if (!staff.monthlySalary || workDays === 0) return 0;
    return Math.round((staff.presentDays / workDays) * staff.monthlySalary);
  };
  
  const calculateFinalTotal = (staff) => {
    const calculated = calculateSalary(staff);
    // Ensure values are numbers before calculating
    const bonus = parseFloat(staff.bonus) || 0;
    const alreadyPaid = parseFloat(staff.alreadyPaid) || 0;
    return calculated + bonus - alreadyPaid;
  };

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
    setCustomPayment('');
    setBonusAmount(staff.bonus > 0 ? staff.bonus.toString() : '');
  };

  const handlePayStaff = async () => {
    if (!selectedStaff) return;
    
    // Use the safe, numeric values for calculation
    const calculatedSalaryValue = calculateSalary(selectedStaff);
    const bonusValue = bonusAmount ? parseFloat(bonusAmount) : (parseFloat(selectedStaff.bonus) || 0);
    const alreadyPaidValue = parseFloat(selectedStaff.alreadyPaid) || 0;
    const finalTotalBeforePayment = calculatedSalaryValue + bonusValue - alreadyPaidValue;

    const paymentAmount = customPayment ? parseFloat(customPayment) : finalTotalBeforePayment;
    const newAlreadyPaid = alreadyPaidValue + paymentAmount;
    const newFinalTotal = calculatedSalaryValue + bonusValue - newAlreadyPaid;

    const payload = {
      staffId: selectedStaff.id,
      restaurantId,
      payrollMonth: `${selectedMonth}-01`,
      monthlySalary: selectedStaff.monthlySalary,
      presentDays: selectedStaff.presentDays,
      absentDays: selectedStaff.absentDays,
      bonus: bonusValue,
      alreadyPaid: newAlreadyPaid,
      status: newFinalTotal <= 0 ? 'paid' : 'pending',
    };

    try {
      await axios.post(`${API_BASE_URL}/api/payroll`, payload);
      await fetchPayrollData(); // Refresh data from backend
      setIsModalOpen(false);
      setSelectedStaff(null);
    } catch (err) {
      console.error("Failed to save payroll:", err);
      alert("Failed to save payment. Please try again.");
    }
  };
  
  const handlePresentDaysChange = (staffId, newPresentDays) => {
    const validPresentDays = Math.min(Math.max(0, newPresentDays), workDays);
    
    setStaffData(prevData =>
      prevData.map(staff =>
        staff.id === staffId
          ? { ...staff, presentDays: validPresentDays, absentDays: workDays - validPresentDays }
          : staff
      )
    );

    if(selectedStaff && selectedStaff.id === staffId){
        setSelectedStaff(prev => ({ ...prev, presentDays: validPresentDays, absentDays: workDays - validPresentDays}));
    }
  };

  const totalStaff = staffData.length;
  const pendingSalaries = staffData.filter(staff => calculateFinalTotal(staff) > 0).length;
  const paidSalaries = totalStaff - pendingSalaries;

  if (isLoading) {
    return <div className="payroll-container">Loading payroll data...</div>;
  }

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <h1 className="payroll-title">Staff Payroll Management</h1>
        <p className="payroll-subtitle">Manage employee salaries and attendance</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card total"><div className="summary-icon"><User size={24} /></div><div className="summary-content"><h3 className="summary-number">{totalStaff}</h3><p className="summary-label">Total Staff</p></div></div>
        <div className="summary-card pending"><div className="summary-icon"><Clock size={24} /></div><div className="summary-content"><h3 className="summary-number">{pendingSalaries}</h3><p className="summary-label">Pending Salaries</p></div></div>
        <div className="summary-card paid"><div className="summary-icon"><CheckCircle size={24} /></div><div className="summary-content"><h3 className="summary-number">{paidSalaries}</h3><p className="summary-label">Paid Salaries</p></div></div>
      </div>

      <div className="controls-section">
        <div className="control-group">
          <label className="control-label">Select Month</label>
          <select className="month-selector" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (<option key={month.value} value={month.value}>{month.label}</option>))}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Work Days in Month</label>
          <input type="number" className="work-days-input" value={workDays} readOnly />
        </div>
      </div>

      <div className="staff-section">
        <h2 className="staff-section-title">Staff Members - {months.find(m => m.value === selectedMonth)?.label}</h2>
        <div className="staff-grid">
          {staffData.map(staff => {
            const finalTotal = calculateFinalTotal(staff);
            const isPaid = finalTotal <= 0;
            return (
              <div key={staff.id} className={`staff-card ${isPaid ? 'paid' : 'pending'}`} onClick={() => handleStaffClick(staff)}>
                <div className="staff-header">
                  <h3 className="staff-name">{staff.name}</h3>
                  <span className={`status-badge ${isPaid ? 'paid' : 'pending'}`}>{isPaid ? 'Paid' : 'Pending'}</span>
                </div>
                <div className="staff-stats">
                  <div className="stat-item"><span className="stat-label">Present Days</span><span className="stat-value present">{staff.presentDays}/{workDays}</span></div>
                  <div className="stat-item"><span className="stat-label">Absent Days</span><span className="stat-value absent">{staff.absentDays}/{workDays}</span></div>
                </div>
                <div className="staff-salary"><span className="salary-label">Calculated Salary</span><span className="salary-amount">₹{calculateSalary(staff).toLocaleString()}</span></div>
                <div className="staff-pending">
                  <span className="pending-label">{finalTotal > 0 ? 'Pending Amount' : 'Overpaid Amount'}</span>
                  <span className={`pending-amount ${finalTotal > 0 ? 'positive' : 'negative'}`}>₹{Math.abs(finalTotal).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && selectedStaff && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Payroll Details - {selectedStaff.name}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Monthly Salary</span><span className="detail-value">₹{selectedStaff.monthlySalary.toLocaleString()}</span></div>
                <div className="detail-item"><span className="detail-label">Work Days</span><span className="detail-value">{workDays} days</span></div>
                <div className="detail-item">
                  <span className="detail-label">Present Days</span>
                  <div className="input-wrapper">
                    <input type="number" className="days-input" value={selectedStaff.presentDays} onChange={(e) => handlePresentDaysChange(selectedStaff.id, parseInt(e.target.value) || 0)} min="0" max={workDays}/>
                    <span className="days-max">/{workDays}</span>
                  </div>
                </div>
                <div className="detail-item"><span className="detail-label">Absent Days</span><span className="detail-value absent">{selectedStaff.absentDays} days</span></div>
              </div>

              <div className="calculation-section">
                <h3 className="section-title">Salary Calculation</h3>
                <div className="calculation-result"><span>Calculated Salary:</span><span className="calculated-amount">₹{calculateSalary(selectedStaff).toLocaleString()}</span></div>
              </div>

              <div className="input-section">
                <div className="input-group">
                  <label className="input-label">Bonus Amount</label>
                  <div className="input-wrapper"><DollarSign size={16} className="input-icon" /><input type="number" className="amount-input" placeholder="Enter bonus amount" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} /></div>
                </div>
                <div className="input-group">
                  <label className="input-label">Custom Payment Amount</label>
                  <div className="input-wrapper"><DollarSign size={16} className="input-icon" /><input type="number" className="amount-input" placeholder="Enter custom amount (optional)" value={customPayment} onChange={(e) => setCustomPayment(e.target.value)} /></div>
                </div>
              </div>
              
              {/* THIS IS THE CORRECTED BALANCE SECTION */}
              <div className="balance-section">
                {(() => {
                  const calculated = calculateSalary(selectedStaff);
                  const bonus = bonusAmount ? parseFloat(bonusAmount) : (parseFloat(selectedStaff.bonus) || 0);
                  const alreadyPaid = parseFloat(selectedStaff.alreadyPaid) || 0;
                  const finalTotal = calculated + bonus - alreadyPaid;

                  return (
                    <>
                      <div className="balance-item">
                        <span>Calculated Salary:</span>
                        <span>₹{calculated.toLocaleString()}</span>
                      </div>
                      <div className="balance-item">
                        <span>Bonus:</span>
                        <span>+ ₹{bonus.toLocaleString()}</span>
                      </div>
                      <div className="balance-item">
                        <span>Already Paid:</span>
                        <span>- ₹{alreadyPaid.toLocaleString()}</span>
                      </div>
                      <div className="balance-total">
                        <span>Final Total:</span>
                        <span>₹{finalTotal.toLocaleString()}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handlePayStaff} disabled={((calculateSalary(selectedStaff) + (bonusAmount ? parseFloat(bonusAmount) : (parseFloat(selectedStaff.bonus) || 0))) - (parseFloat(selectedStaff.alreadyPaid) || 0)) <= 0}>
                {((calculateSalary(selectedStaff) + (bonusAmount ? parseFloat(bonusAmount) : (parseFloat(selectedStaff.bonus) || 0))) - (parseFloat(selectedStaff.alreadyPaid) || 0)) <= 0 ? 'Already Paid' : `Pay Staff`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffPayrollWithAccess = () => {
  const { setCurrentPlan } = useContext(PlanContext);
  const [loading, setLoading] = useState(true);
  const restaurantId = localStorage.getItem('restaurantId');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`);
        const data = await res.json();
        if (data.plan) {
          setCurrentPlan(data.plan);
        } else {
          setCurrentPlan('free');
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
    <ProtectedRoute feature="payroll">
      < StaffPayrollPage/>
    </ProtectedRoute>
  );
};

export default StaffPayrollWithAccess ;