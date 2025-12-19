import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight, MoreVertical, DollarSign, User, Calendar } from 'lucide-react';

const PAYROLL_API = 'http://localhost:8000/api/hrm/payroll';
const EMPLOYEES_API = 'http://localhost:8000/api/hrm/employees';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    month: '',
    year: '',
    basic_salary: '',
    total_allowance: '',
    total_deduction: '',
    net_salary: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0,
  });

  // Month names for search matching
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

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

  const fetchPayrolls = useCallback(
    async (page = 1, perPage = 10, keyword = '') => {
      setLoading(true);
      try {
        const params = { page, limit: perPage };

        // Handle month name search (convert to number if possible)
        if (keyword.trim()) {
          const lowerKeyword = keyword.toLowerCase().trim();

          // Check if keyword matches a month name
          let monthNumber = null;
          const fullMatchIndex = monthNames.indexOf(lowerKeyword);
          const shortMatchIndex = shortMonthNames.findIndex(short => short === lowerKeyword);

          if (fullMatchIndex !== -1) {
            monthNumber = fullMatchIndex + 1;
          } else if (shortMatchIndex !== -1) {
            monthNumber = shortMatchIndex + 1;
          } else if (!isNaN(lowerKeyword) && lowerKeyword.length <= 4) {
            // Allow direct year or month number search
            const num = parseInt(lowerKeyword);
            if (num >= 1 && num <= 12) monthNumber = num;
            else if (num >= 2000 && num <= 2100) params.keyword = num; // year search
          }

          if (monthNumber) {
            params.keyword = monthNumber.toString();
          } else if (lowerKeyword.length >= 4) {
            // Likely a year
            params.keyword = lowerKeyword;
          }
        }

        const response = await axios.get(PAYROLL_API, { params });
        const res = response.data;

        const payrollData = res.pagination?.data || [];
        const formattedPayrolls = payrollData.map((item) => ({
          id: item.id,
          employee_id: item.employee?.id || null,
          employee_name: item.employee
            ? `${item.employee.first_name} ${item.employee.last_name || ''}`.trim()
            : 'Unknown Employee',
          month: parseInt(item.month),
          year: parseInt(item.year),
          basic_salary: parseFloat(item.basic_salary || 0),
          total_allowance: parseFloat(item.total_allowance || 0),
          total_deduction: parseFloat(item.total_deduction || 0),
          net_salary: parseFloat(item.net_salary || 0),
          status: item.status || 'pending',
        }));

        setPayrolls(formattedPayrolls);
        setPagination({
          current_page: res.pagination.current_page || 1,
          last_page: res.pagination.total_pages || 1,
          per_page: res.pagination.per_page || 10,
          total_items: res.pagination.total_items || 0,
        });
      } catch (error) {
        handleApiError(error, 'Failed to fetch payrolls');
        setPayrolls([]);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError]
  );

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(EMPLOYEES_API);
      const data = response.data.pagination?.data || response.data.data || response.data || [];
      const formatted = data.map((emp) => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
      }));
      setEmployees(formatted);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      showNotification('Unable to load employees list', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPayrolls(1, 10);
    fetchEmployees();
  }, [fetchPayrolls, fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayrolls(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchPayrolls]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchPayrolls(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, per_page: limit }));
    fetchPayrolls(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      month: '',
      year: '',
      basic_salary: '',
      total_allowance: '',
      total_deduction: '',
      net_salary: '',
      status: 'pending',
    });
    setEditingPayroll(null);
    setErrors({});
  };

  const openModal = (payroll = null) => {
    if (payroll) {
      setEditingPayroll(payroll);
      setFormData({
        employee_id: payroll.employee_id?.toString() || '',
        month: payroll.month.toString(),
        year: payroll.year.toString(),
        basic_salary: payroll.basic_salary.toString(),
        total_allowance: payroll.total_allowance.toString(),
        total_deduction: payroll.total_deduction.toString(),
        net_salary: payroll.net_salary.toString(),
        status: payroll.status,
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const submitData = {
      employee_id: formData.employee_id,
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      basic_salary: parseFloat(formData.basic_salary) || 0,
      total_allowance: formData.total_allowance ? parseFloat(formData.total_allowance) : null,
      total_deduction: formData.total_deduction ? parseFloat(formData.total_deduction) : null,
      net_salary: parseFloat(formData.net_salary) || 0,
      status: formData.status,
    };

    try {
      if (editingPayroll) {
        await axios.post(`${PAYROLL_API}/${editingPayroll.id}`, submitData);
        showNotification('Payroll updated successfully');
      } else {
        await axios.post(PAYROLL_API, submitData);
        showNotification('Payroll created successfully');
      }
      fetchPayrolls(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save payroll');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${PAYROLL_API}/${id}`);
      showNotification('Payroll deleted successfully');
      const remainingItems = pagination.total_items - 1;
      const maxPage = Math.ceil(remainingItems / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;
      fetchPayrolls(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const formatCurrency = (amount) =>
    `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatMonthYear = (month, year) => {
    if (!month || !year) return '—';
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-500/10';
      case 'rejected': return 'text-red-400 bg-red-500/10';
      default: return 'text-yellow-400 bg-yellow-500/10';
    }
  };

  const stats = { total: pagination.total_items };

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && payrolls.length === 0) {
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
              Payroll Management
            </h1>
            <p className="text-gray-400 mt-2">Manage monthly payroll processing and payments</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Payroll
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Payroll Records', value: stats.total, icon: DollarSign, color: 'blue' },
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

        {/* Search & Limit */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by month name (e.g. January, Jan, December) or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
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

        {/* Rest of the component remains unchanged */}
        {/* Payroll Grid, Pagination, Empty State, Modal — all same as before */}
        {/* ... (same as your original code from here down) */}
        
        {/* Payroll Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {payrolls.map((payroll) => (
            <motion.div
              key={payroll.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <DollarSign size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{payroll.employee_name}</h3>
                      <p className="text-sm text-gray-400">ID: {payroll.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenu(actionMenu === payroll.id ? null : payroll.id);
                    }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Period</span>
                    <span className="font-medium">{formatMonthYear(payroll.month, payroll.year)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Basic Salary</span>
                    <span className="font-medium">{formatCurrency(payroll.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Allowances</span>
                    <span className="font-medium">{formatCurrency(payroll.total_allowance)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Deductions</span>
                    <span className="font-medium">{formatCurrency(payroll.total_deduction)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Net Salary</span>
                    <span className="font-bold text-lg">{formatCurrency(payroll.net_salary)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payroll.status)}`}>
                      {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-700/30">
                  <button
                    onClick={() => openModal(payroll)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(payroll.id)}
                    disabled={operationLoading === `delete-${payroll.id}`}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {actionMenu === payroll.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                  >
                    <button
                      onClick={() => {
                        openModal(payroll);
                        setActionMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(payroll.id)}
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
                        pagination.current_page === p
                          ? 'bg-blue-600 border-blue-500'
                          : 'border-gray-600'
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
        {payrolls.length === 0 && !loading && (
          <div className="text-center py-20">
            <DollarSign size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              {searchTerm ? 'No payroll records found' : 'No payroll records created yet'}
            </h3>
            <p className="text-gray-400 mb-8">
              {searchTerm ? 'Try a different month name or year' : 'Create the first payroll entry to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold"
              >
                <Plus className="inline mr-2" /> Create First Payroll
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal remains unchanged */}
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
                  {editingPayroll ? 'Edit Payroll' : 'Create New Payroll'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* All form fields same as before */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee *</label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.employee_id ? 'border border-red-500' : ''
                    }`}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  {errors.employee_id && <p className="text-red-400 text-sm mt-1">{errors.employee_id[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Month *</label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.month ? 'border border-red-500' : ''
                      }`}
                    >
                      <option value="">Month</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    {errors.month && <p className="text-red-400 text-sm mt-1">{errors.month[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Year *</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      min="2000"
                      placeholder="2025"
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.year ? 'border border-red-500' : ''
                      }`}
                    />
                    {errors.year && <p className="text-red-400 text-sm mt-1">{errors.year[0]}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Basic Salary *</label>
                  <input
                    type="number"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="50000"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.basic_salary ? 'border border-red-500' : ''
                    }`}
                  />
                  {errors.basic_salary && <p className="text-red-400 text-sm mt-1">{errors.basic_salary[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Total Allowance</label>
                  <input
                    type="number"
                    name="total_allowance"
                    value={formData.total_allowance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.total_allowance ? 'border border-red-500' : ''
                    }`}
                  />
                  {errors.total_allowance && <p className="text-red-400 text-sm mt-1">{errors.total_allowance[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Total Deduction</label>
                  <input
                    type="number"
                    name="total_deduction"
                    value={formData.total_deduction}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.total_deduction ? 'border border-red-500' : ''
                    }`}
                  />
                  {errors.total_deduction && <p className="text-red-400 text-sm mt-1">{errors.total_deduction[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Net Salary *</label>
                  <input
                    type="number"
                    name="net_salary"
                    value={formData.net_salary}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="45000"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.net_salary ? 'border border-red-500' : ''
                    }`}
                  />
                  {errors.net_salary && <p className="text-red-400 text-sm mt-1">{errors.net_salary[0]}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.status ? 'border border-red-500' : ''
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {errors.status && <p className="text-red-400 text-sm mt-1">{errors.status[0]}</p>}
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
                    {editingPayroll ? 'Update' : 'Create'} Payroll
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

export default Payroll;