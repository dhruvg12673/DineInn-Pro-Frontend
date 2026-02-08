import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Plus, X, Calendar, Clock, Search, Edit, Trash2, Upload } from 'lucide-react';
import './staff_attendance_css.css';

const StaffManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: '',
    monthlySalary: '', // <-- ADDED for salary
    staffPhoto: null,
    idCardPhoto: null,
    staffPhotoPreview: null,
    idCardPhotoPreview: null,
  });

  const restaurantId = localStorage.getItem('restaurantId');
  const API_BASE_URL = 'http://localhost:5000';

  const fetchStaff = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/staff?restaurantId=${restaurantId}`);
      setStaffList(res.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff data.');
    }
  }, [restaurantId]);

  const fetchAttendance = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance?restaurantId=${restaurantId}&date=${searchDate}`);
      setAttendanceList(res.data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance records.');
    }
  }, [restaurantId, searchDate]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const attendanceWithStaff = useMemo(() => attendanceList.map((a) => {
    const staff = staffList.find(s => s.id === a.staffid) || {};
    let totalWorkingTime = '';
    
    if (a.shiftduration && typeof a.shiftduration === 'object') {
        const hours = a.shiftduration.hours || 0;
        const minutes = a.shiftduration.minutes || 0;
        totalWorkingTime = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }

    return {
      id: a.id,
      name: a.fullname,
      shift: a.shift || staff.role || '',
      clockIn: a.checkin ? new Date(a.checkin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      clockOut: a.checkout ? new Date(a.checkout).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      totalWorkingTime,
      status: a.checkout ? 'Present' : 'Absent',
      avatar: '👤',
      department: staff.role || '',
      staffObject: staff
    };
  }), [attendanceList, staffList]);

  const filteredAttendance = useMemo(() => {
    if (!searchTerm) return attendanceWithStaff;
    return attendanceWithStaff.filter(record =>
      record.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      record.shift?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchTerm?.toLowerCase())
    );
  }, [attendanceWithStaff, searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    const previewFieldName = `${fieldName}Preview`;

    setFormData(prev => {
        if (prev[previewFieldName] && prev[previewFieldName].startsWith('blob:')) {
            URL.revokeObjectURL(prev[previewFieldName]);
        }
        
        if (file) {
            const newPreviewUrl = URL.createObjectURL(file);
            return { ...prev, [fieldName]: file, [previewFieldName]: newPreviewUrl };
        } else {
            return { ...prev, [fieldName]: null, [previewFieldName]: editingStaff ? editingStaff[fieldName.replace('Photo', 'photo')] : null };
        }
    });
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
  
  const resetForm = () => {
    if (formData.staffPhotoPreview && formData.staffPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.staffPhotoPreview);
    }
    if (formData.idCardPhotoPreview && formData.idCardPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.idCardPhotoPreview);
    }

    setFormData({
        fullName: '',
        phoneNumber: '',
        email: '',
        password: '',
        role: '',
        monthlySalary: '', // <-- ADDED
        staffPhoto: null,
        idCardPhoto: null,
        staffPhotoPreview: null,
        idCardPhotoPreview: null
    });
    setEditingStaff(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (staff) => {
    resetForm();
    setEditingStaff(staff);
    setFormData({
        fullName: staff.fullname || '',
        phoneNumber: staff.phonenumber || '',
        email: staff.email || '',
        password: '', // Clear password on edit
        role: staff.role || '',
        monthlySalary: staff.monthly_salary || '', // <-- ADDED
        staffPhoto: null,
        idCardPhoto: null,
        staffPhotoPreview: staff.staffphoto,
        idCardPhotoPreview: staff.idcardphoto,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!restaurantId || !formData.fullName || !formData.role) {
        alert('Full Name and Role are required.');
        return;
    }
    setIsLoading(true);
    
    try {
      const payload = {
        restaurantid: parseInt(restaurantId),
        fullname: formData.fullName,
        phonenumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        monthly_salary: formData.monthlySalary ? parseFloat(formData.monthlySalary) : 0, // <-- ADDED
        staffphoto: formData.staffPhoto ? await fileToBase64(formData.staffPhoto) : (editingStaff ? editingStaff.staffphoto : null),
        idcardphoto: formData.idCardPhoto ? await fileToBase64(formData.idCardPhoto) : (editingStaff ? editingStaff.idcardphoto : null),
      };
      
      if (editingStaff) {
        await axios.put(`${API_BASE_URL}/api/staff/${editingStaff.id}`, payload);
        alert('Staff updated successfully!');
      } else {
        if (!payload.password) {
            alert('Password is required for new staff members.');
            setIsLoading(false);
            return;
        }
        await axios.post(`${API_BASE_URL}/api/staff`, payload);
        alert('Staff added successfully!');
      }

      closeModal();
      fetchStaff();
      fetchAttendance();
    } catch (err) {
      console.error('Error saving staff:', err);
      const errorMessage = err.response?.data?.error || 'Error saving staff. Please check the console and try again.';
      alert(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
        try {
            await axios.delete(`${API_BASE_URL}/api/staff/${staffId}`);
            alert('Staff member deleted successfully.');
            fetchStaff();
            fetchAttendance();
        } catch (err) {
            console.error('Error deleting staff:', err);
            alert('Failed to delete staff member. They may have attendance records that need to be removed first.');
        }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = { 'Present': 'bg-emerald-100 text-emerald-800', 'Absent': 'bg-rose-100 text-rose-800' };
    return statusClasses[status] || 'bg-slate-100 text-slate-800';
  };
  const getShiftBadge = (shift) => {
    const shiftClasses = { 'Morning': 'bg-sky-100 text-sky-800', 'Afternoon': 'bg-violet-100 text-violet-800', 'Night': 'bg-indigo-100 text-indigo-800' };
    return shiftClasses[shift] || 'bg-slate-100 text-slate-800';
  };
  const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Staff Attendance Logs</h1>
            <p className="text-slate-600">Track and manage daily staff attendance records</p>
          </div>
          <button onClick={openAddModal} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md">
            <Plus className="w-5 h-5 mr-2" /> Add Staff
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-slate-50" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search Staff</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Search by name, shift, or department..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-slate-50" />
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="text-center"><p className="text-sm text-slate-600">Present</p><p className="text-2xl font-bold text-emerald-600">{filteredAttendance.filter(r => r.status === 'Present').length}</p></div>
              <div className="text-center"><p className="text-sm text-slate-600">Absent</p><p className="text-2xl font-bold text-rose-600">{filteredAttendance.filter(r => r.status === 'Absent').length}</p></div>
              <div className="text-center"><p className="text-sm text-slate-600">Total</p><p className="text-2xl font-bold text-slate-900">{filteredAttendance.length}</p></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Attendance for {formatDate(searchDate)}</h2>
            <p className="text-slate-600 text-sm mt-1">{filteredAttendance.length} staff member(s) found</p>
          </div>
          {filteredAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Staff</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Shift</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Clock In</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Clock Out</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Total Hours</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4"><div className="flex items-center"><div className="text-2xl mr-3">{record.avatar}</div><div><div className="font-medium text-slate-900">{record.name}</div><div className="text-sm text-slate-600">{record.department}</div></div></div></td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getShiftBadge(record.shift)}`}>{record.shift}</span></td>
                      <td className="px-6 py-4"><div className="flex items-center text-slate-900"><Clock className="w-4 h-4 mr-2 text-slate-500" />{record.clockIn}</div></td>
                      <td className="px-6 py-4"><div className="flex items-center text-slate-900"><Clock className="w-4 h-4 mr-2 text-slate-500" />{record.clockOut}</div></td>
                      <td className="px-6 py-4"><div className="font-medium text-slate-900">{record.totalWorkingTime}</div></td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(record.status)}`}>{record.status}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => openEditModal(record.staffObject)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(record.staffObject.id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (<div className="text-center py-12"><div className="text-6xl mb-4">📅</div><h3 className="text-lg font-medium text-slate-900 mb-2">No attendance records found</h3><p className="text-slate-600">{searchTerm ? 'Try adjusting your search criteria.' : 'No staff have clocked in for this date.'}</p></div>)}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-6 border-b border-slate-200"><h3 className="text-xl font-semibold text-slate-900">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h3><button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors duration-200" aria-label="Close modal"><X className="w-6 h-6" /></button></div>
          <div className="p-6 space-y-4">
            <div><label className="block mb-1 font-medium text-slate-700" htmlFor="fullName">Full Name</label><input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter full name" required /></div>
            <div><label className="block mb-1 font-medium text-slate-700" htmlFor="phoneNumber">Phone Number</label><input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter phone number" /></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block mb-1 font-medium text-slate-700" htmlFor="email">Email</label><input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter email address" /></div>
              <div><label className="block mb-1 font-medium text-slate-700" htmlFor="password">Password</label><input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter password" required={!editingStaff} disabled={!!editingStaff} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-medium text-slate-700" htmlFor="role">Role</label>
                    <input type="text" name="role" id="role" value={formData.role} onChange={handleInputChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Manager, Chef" required />
                </div>
                <div>
                    {/* NEW MONTHLY SALARY FIELD */}
                    <label className="block mb-1 font-medium text-slate-700" htmlFor="monthlySalary">Monthly Salary (₹)</label>
                    <input type="number" name="monthlySalary" id="monthlySalary" value={formData.monthlySalary} onChange={handleInputChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. 25000" />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="staffPhotoInput" className="block mb-2 font-medium text-slate-700 cursor-pointer">Staff Photo</label>
                    <label htmlFor="staffPhotoInput" className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer">
                        {formData.staffPhotoPreview ? (
                            <img src={formData.staffPhotoPreview} alt="Staff preview" className="w-full h-full object-cover rounded-xl"/>
                        ) : (
                            <div className="text-center text-slate-500">
                                <Upload className="mx-auto h-8 w-8"/>
                                <p className="mt-1 text-sm">Upload Photo</p>
                            </div>
                        )}
                    </label>
                    <input type="file" id="staffPhotoInput" accept="image/*" onChange={e => handleFileChange(e, 'staffPhoto')} className="hidden"/>
                </div>
                <div>
                    <label htmlFor="idCardPhotoInput" className="block mb-2 font-medium text-slate-700 cursor-pointer">ID Card Photo</label>
                    <label htmlFor="idCardPhotoInput" className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer">
                        {formData.idCardPhotoPreview ? (
                            <img src={formData.idCardPhotoPreview} alt="ID card preview" className="w-full h-full object-cover rounded-xl"/>
                        ) : (
                            <div className="text-center text-slate-500">
                                <Upload className="mx-auto h-8 w-8"/>
                                <p className="mt-1 text-sm">Upload ID</p>
                            </div>
                        )}
                    </label>
                    <input type="file" id="idCardPhotoInput" accept="image/*" onChange={e => handleFileChange(e, 'idCardPhoto')} className="hidden"/>
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200"><button onClick={closeModal} className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition-colors duration-200">Cancel</button><button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200" disabled={isLoading}>{isLoading ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Save Staff')}</button></div>
          </div>
          </div></div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;