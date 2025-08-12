import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AttendancePage.css';

const AttendancePage = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [shift, setShift] = useState('');
  const [activeRecord, setActiveRecord] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const restaurantId = localStorage.getItem('restaurantId');
  const API_BASE_URL = 'http://localhost:5000';

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const getCurrentDate = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchStaff = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/staff?restaurantId=${restaurantId}`);
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError('Could not load staff list.');
    }
  }, [restaurantId]);

  const fetchAttendanceRecords = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API_BASE_URL}/api/attendance?restaurantId=${restaurantId}&date=${today}`);
      setAttendanceRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
      setError('Could not load today\'s attendance.');
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchStaff();
    fetchAttendanceRecords();
  }, [fetchStaff, fetchAttendanceRecords]);

  useEffect(() => {
    if (selectedStaffId) {
      const openRecord = attendanceRecords.find(
        record => record.staffid === Number(selectedStaffId) && !record.checkout
      );
      setActiveRecord(openRecord || null);
    } else {
      setActiveRecord(null);
    }
  }, [selectedStaffId, attendanceRecords]);

  const handleStaffChange = (e) => {
    setSelectedStaffId(e.target.value);
  };

  const resetForm = () => {
    setSelectedStaffId('');
    setShift('');
    setActiveRecord(null);
  };

  const handleClockIn = async () => {
    if (!selectedStaffId || !shift) {
      alert('Please select a staff member and a shift.');
      return;
    }
    if (activeRecord) {
      alert('This staff member is already clocked in.');
      return;
    }
    setIsLoading(true);
    try {
      // ✅ FIX: Removed the `checkin` timestamp. The server will generate it.
      const payload = {
        staffid: Number(selectedStaffId),
        restaurantid: Number(restaurantId),
        shift,
      };
      await axios.post(`${API_BASE_URL}/api/attendance`, payload);
      await fetchAttendanceRecords();
      alert('Clocked in successfully!');
      resetForm();
    } catch (err) {
      console.error('Clock In failed:', err.response?.data || err.message);
      alert('Clock In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeRecord) {
      alert('No active session found for this staff member to clock out.');
      return;
    }
    setIsLoading(true);
    try {
      // ✅ FIX: The payload is now empty. The server knows which record to update
      // and will generate the checkout timestamp itself.
      await axios.put(`${API_BASE_URL}/api/attendance/${activeRecord.id}`, {});
      await fetchAttendanceRecords();
      alert('Clocked out successfully!');
      resetForm();
    } catch (err) {
      console.error('Clock Out failed:', err.response?.data || err.message);
      alert('Clock Out failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateDuration = (checkin, checkout) => {
    if (!checkin || !checkout) return '-';
    const diffMs = new Date(checkout) - new Date(checkin);
    if (diffMs < 0) return 'Invalid';
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="attendance-container">
      <div className="attendance-wrapper">
        <div className="header">
          <div className="header-content"><h1 className="title">Staff Attendance</h1><p className="subtitle">{getCurrentDate()}</p></div>
          <div className="status-indicator"><div className={`status-dot ${activeRecord ? 'active' : 'inactive'}`}></div><span className="status-text">{activeRecord ? 'Session Active' : 'Ready to Clock In'}</span></div>
        </div>
        <div className="clock-card">
          <div className="card-header"><h2 className="card-title">Clock In/Out</h2></div>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Staff Member</label>
              <div className="select-wrapper">
                <select className="form-select" value={selectedStaffId} onChange={handleStaffChange}>
                  <option value="">Select Staff Member</option>
                  {staffList.map((staff) => (<option key={staff.id} value={staff.id}>{staff.fullname}</option>))}
                </select>
                <div className="select-arrow"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Shift</label>
              <div className="shift-options">
                {['Morning', 'Afternoon', 'Night'].map((shiftType) => (
                  <button key={shiftType} className={`shift-button ${shift === shiftType ? 'active' : ''}`} onClick={() => setShift(shiftType)} type="button" disabled={!!activeRecord}>
                    <span className="shift-icon">{shiftType === 'Morning' && '☀️'}{shiftType === 'Afternoon' && '🌇'}{shiftType === 'Night' && '🌙'}</span>
                    {shiftType}
                  </button>
                ))}
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={handleClockIn} className="btn btn-clock-in" disabled={!selectedStaffId || !!activeRecord || isLoading}>
                <span className="btn-icon">➡️</span> Clock In
              </button>
              <button onClick={handleClockOut} className="btn btn-clock-out" disabled={!selectedStaffId || !activeRecord || isLoading}>
                <span className="btn-icon">⬅️</span> Clock Out
              </button>
            </div>
            {activeRecord && (
              <div className="time-display">
                <div className="time-info">
                  <span className="time-label">Clocked in at:</span>
                  <span className="time-value">{formatTime(activeRecord.checkin)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="records-card">
          <div className="card-header"><h2 className="card-title">Today's Attendance Records</h2><div className="records-count">{attendanceRecords.length} {attendanceRecords.length === 1 ? 'record' : 'records'}</div></div>
          <div className="records-content">
            {attendanceRecords.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🤷</div><p className="empty-text">No attendance records yet</p><p className="empty-subtext">Clock in to start tracking attendance</p></div>
            ) : (
              <div className="table-container">
                <table className="attendance-table">
                  <thead><tr><th>Staff Member</th><th>Date</th><th>Shift</th><th>Clock In</th><th>Clock Out</th><th>Duration</th></tr></thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="staff-cell"><div className="staff-info"><div className="staff-avatar">{record.fullname.split(' ').map(n => n[0]).join('')}</div><span>{record.fullname}</span></div></td>
                        <td>{formatDate(record.checkin)}</td>
                        <td><span className={`shift-badge ${record.shift ? record.shift.toLowerCase() : ''}`}>{record.shift}</span></td>
                        <td className="time-cell">{formatTime(record.checkin)}</td>
                        <td className="time-cell">{record.checkout ? formatTime(record.checkout) : '-'}</td>
                        <td className="duration-cell">{calculateDuration(record.checkin, record.checkout)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
