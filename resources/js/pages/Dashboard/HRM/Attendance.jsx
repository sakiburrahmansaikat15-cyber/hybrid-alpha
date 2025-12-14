import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Loader,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Clock,
  User,
  Calendar,
} from 'lucide-react';

const ATTENDANCES_API = 'http://localhost:8000/api/hrm/attendances';
const EMPLOYEES_API = 'http://localhost:8000/api/hrm/employees';

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    clock_in: '',
    clock_out: '',
    late: false,
    early_leave: false,
    working_hours: '',
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0,
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback(
    (error, defaultMessage) => {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors || {};
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0]?.[0];
        showNotification(firstError || 'Validation error', 'error');
      } else if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
        setErrors({ _general: error.response.data.message });
      } else {
        showNotification(defaultMessage || 'Something went wrong', 'error');
        setErrors({ _general: defaultMessage });
      }
    },
    [showNotification]
  );

  const fetchAttendances = useCallback(
    async (page = 1, perPage = 10, keyword = '') => {
      setLoading(true);
      try {
        const params = { page, limit: perPage };
        if (keyword.trim()) params.keyword = keyword.trim();

        const response = await axios.get(ATTENDANCES_API, { params });
        const res = response.data;

        const attendanceData = res.pagination?.data || [];
        const formattedAttendances = attendanceData.map((item) => ({
          id: item.id,
          employee_id: item.employee?.id || null,
          employee_name: item.employee
            ? `${item.employee.first_name} ${item.employee.last_name || ''}`.trim()
            : '—',
          date: item.date,
          clock_in: item.clock_in || '—',
          clock_out: item.clock_out || '—',
          late: item.late,
          early_leave: item.early_leave,
          working_hours: item.working_hours || '—',
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));

        setAttendances(formattedAttendances);
        setPagination({
          current_page: res.pagination.current_page || 1,
          last_page: res.pagination.total_pages || 1,
          per_page: res.pagination.per_page || 10,
          total_items: res.pagination.total_items || 0,
        });
      } catch (error) {
        handleApiError(error, 'Failed to fetch attendances');
        setAttendances([]);
        setPagination({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });
      } finally {
        setLoading(false);
      }
    },
    [handleApiError]
  );

  const fetchEmployees = async () => {
    setDropdownLoading(true);
    try {
      const response = await axios.get(EMPLOYEES_API);
      const res = response.data;
      const data = res.pagination?.data || res.data || res || [];
      const formatted = data.map((emp) => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name || ''}`.trim() || emp.employee_code,
      }));
      setEmployees(formatted);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      showNotification('Unable to load employees', 'error');
      setEmployees([]);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances(1, 10);
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendances(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchAttendances]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchAttendances(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, per_page: limit }));
    fetchAttendances(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      date: '',
      clock_in: '',
      clock_out: '',
      late: false,
      early_leave: false,
      working_hours: '',
    });
    setEditingAttendance(null);
    setErrors({});
  };

  const openModal = (attendance = null) => {
    if (attendance) {
      setEditingAttendance(attendance);
      setFormData({
        employee_id: attendance.employee_id?.toString() || '',
        date: attendance.date || '',
        clock_in: attendance.clock_in || '',
        clock_out: attendance.clock_out || '',
        late: attendance.late || false,
        early_leave: attendance.early_leave || false,
        working_hours: attendance.working_hours || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('employee_id', formData.employee_id);
      submitData.append('date', formData.date);
      if (formData.clock_in) submitData.append('clock_in', formData.clock_in);
      if (formData.clock_out) submitData.append('clock_out', formData.clock_out);
      submitData.append('late', formData.late ? '1' : '0');
      submitData.append('early_leave', formData.early_leave ? '1' : '0');
      if (formData.working_hours) submitData.append('working_hours', formData.working_hours);

      let response;
      if (editingAttendance) {
        response = await axios.post(`${ATTENDANCES_API}/${editingAttendance.id}`, submitData);
        showNotification('Attendance updated successfully');
      } else {
        response = await axios.post(ATTENDANCES_API, submitData);
        showNotification('Attendance created successfully');
      }

      fetchAttendances(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save attendance');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${ATTENDANCES_API}/${id}`);
      showNotification('Attendance deleted successfully');

      const remainingItems = pagination.total_items - 1;
      const maxPage = Math.ceil(remainingItems / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;

      fetchAttendances(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total_items,
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  const formatTime = (time) => (time && time !== '—' ? time : '—');

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && attendances.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-48 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 rounded-2xl p-6 animate-pulse">
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white font-medium`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-gray-400 mt-2">Track employee daily attendance records</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Attendance
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Records', value: stats.total, icon: Calendar, color: 'blue' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 bg-${s.color}-500/10 rounded-xl`}>
                  <s.icon size={28} className={`text-${s.color}-400`} />
                </div>
              </div>
            </div>
          ))}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 opacity-50">
            <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 opacity-50">
            <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                placeholder="Search by date (YYYY-MM-DD)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {attendances.map((att) => (
            <motion.div
              key={att.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{formatDate(att.date)}</h3>
                      <p className="text-sm text-gray-400">ID: {att.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenu(actionMenu === att.id ? null : att.id);
                    }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <User size={16} />
                    {att.employee_name}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock size={16} />
                    In: {formatTime(att.clock_in)} | Out: {formatTime(att.clock_out)}
                  </div>
                  {att.working_hours !== '—' && (
                    <div className="text-gray-300">
                      Hours: <span className="font-medium">{att.working_hours}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {att.late && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                        Late
                      </span>
                    )}
                    {att.early_leave && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        Early Leave
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">Updated: {formatDate(att.updated_at)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(att)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(att.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {actionMenu === att.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                  >
                    <button
                      onClick={() => {
                        openModal(att);
                        setActionMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(att.id)}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{' '}
              {pagination.total_items}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.last_page ||
                    Math.abs(p - pagination.current_page) <= 2
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3">...</span>}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-xl border ${
                        pagination.current_page === p ? 'bg-blue-600 border-blue-500' : 'border-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {attendances.length === 0 && !loading && (
          <div className="text-center py-20">
            <Calendar size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              {searchTerm ? 'No attendance records found' : 'No attendance records yet'}
            </h3>
            <p className="text-gray-400 mb-8">
              {searchTerm ? 'Try a different date' : 'Add the first attendance record'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold"
              >
                <Plus className="inline mr-2" /> Add First Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingAttendance ? 'Edit Attendance' : 'Add New Attendance'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee *</label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    disabled={dropdownLoading}
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.employee_id ? 'border border-red-500' : ''
                    }`}
                  >
                    <option value="">
                      {dropdownLoading ? 'Loading employees...' : 'Select Employee'}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  {errors.employee_id && <p className="text-red-400 text-sm mt-1">{errors.employee_id[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.date ? 'border border-red-500' : ''
                    }`}
                  />
                  {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Clock In</label>
                  <input
                    type="time"
                    name="clock_in"
                    value={formData.clock_in}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Clock Out</label>
                  <input
                    type="time"
                    name="clock_out"
                    value={formData.clock_out}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Working Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    name="working_hours"
                    value={formData.working_hours}
                    onChange={handleInputChange}
                    placeholder="e.g. 8.5"
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="late"
                      checked={formData.late}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium">Marked as Late</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="early_leave"
                      checked={formData.early_leave}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">Early Leave</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === 'saving' ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Check size={20} />
                    )}
                    {editingAttendance ? 'Update' : 'Create'} Attendance
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;