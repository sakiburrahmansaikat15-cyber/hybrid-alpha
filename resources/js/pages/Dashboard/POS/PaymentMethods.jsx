import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, DollarSign, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, CreditCard, Wallet, TrendingUp, Filter, RefreshCw, Ticket
} from 'lucide-react';

const API_URL = '/api/pos/payment-methods';

const PaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({ name: '', type: 'cash', status: 'active' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total_items: 0 });

  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  useEffect(() => {
    return () => { if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current); };
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      showNotification(Object.values(validationErrors)[0]?.[0] || 'Please check your input', 'error');
    } else {
      showNotification(error.response?.data?.message || defaultMessage || 'Connection error', 'error');
    }
  }, [showNotification]);

  const fetchMethods = useCallback(async (page = 1, status = statusFilter, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page, status: status };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      // Handle pagination structure robustly
      const data = res.pagination?.data || res.data || [];
      if (Array.isArray(data)) {
        setMethods(data);
        if (res.pagination) {
          setPagination({
            current_page: res.pagination.current_page || 1,
            last_page: res.pagination.total_pages || res.pagination.last_page || 1,
            per_page: res.pagination.per_page || 12,
            total_items: res.pagination.total_items || res.pagination.total || 0,
          });
        }
      } else {
        setMethods([]);
      }
    } catch (error) {
      handleApiError(error, 'Failed to load payment methods');
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, statusFilter, searchTerm, handleApiError]);

  // Initial fetch and debounce search
  useEffect(() => {
    const timer = setTimeout(() => fetchMethods(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, fetchMethods]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchMethods(newPage);
    }
  };

  const handleRefresh = () => {
    fetchMethods(pagination.current_page);
    showNotification('List refreshed successfully');
  };

  const openModal = (method = null) => {
    setErrors({});
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name || '',
        type: method.type || 'cash',
        status: method.status || 'active'
      });
    } else {
      setEditingMethod(null);
      setFormData({ name: '', type: 'cash', status: 'active' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});
    try {
      let response;
      if (editingMethod) {
        response = await axios.put(`${API_URL}/${editingMethod.id}`, formData);
      } else {
        response = await axios.post(API_URL, formData);
      }
      showNotification(response.data.message || `Payment method ${editingMethod ? 'updated' : 'created'} successfully!`);
      fetchMethods(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save payment method');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Payment method deleted successfully');
      fetchMethods(1);
    } catch (error) {
      handleApiError(error, 'Failed to delete payment method');
    } finally {
      setOperationLoading(null);
    }
  };

  const typeIcons = {
    cash: <DollarSign size={24} />,
    card: <CreditCard size={24} />,
    voucher: <Ticket size={24} />,
    wallet: <Wallet size={24} />,
  };

  const typeColors = {
    cash: 'from-emerald-500/20 to-emerald-600/20 text-emerald-600',
    card: 'from-blue-500/20 to-blue-600/20 text-blue-600',
    voucher: 'from-purple-500/20 to-purple-600/20 text-purple-600',
    wallet: 'from-amber-500/20 to-amber-600/20 text-amber-600',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-aws-font transition-colors duration-300">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
              {notification.type === 'error' ? <Zap size={18} /> : <Activity size={18} />}
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white flex items-center gap-3">
              <CreditCard className="text-blue-500" size={32} />
              Payment Methods
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Configure and manage payment options for POS</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <Plus size={20} />
              <span>Add New Method</span>
            </button>
          </div>
        </div>

        {/* Stats & Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${statusFilter === status
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Methods</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white leading-none mt-0.5">{pagination.total_items}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : methods.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>
                  {methods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${typeColors[method.type] || 'from-slate-100 to-slate-200 text-slate-500'}`}>
                          {typeIcons[method.type] || <CreditCard size={24} />}
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${method.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                          {method.status}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{method.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">
                          <span>{method.type} Payment</span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
                        <button
                          onClick={() => openModal(method)}
                          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-lg shadow-sm transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-lg shadow-sm transition-colors"
                          title="Delete"
                        >
                          {operationLoading === `delete-${method.id}` ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center px-2">
                      {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                        // Simple logic for showing pages, can be enhanced
                        let p = i + 1;
                        if (pagination.last_page > 5 && pagination.current_page > 3) {
                          p = pagination.current_page - 2 + i;
                          if (p > pagination.last_page) p = pagination.last_page - (4 - i);
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${pagination.current_page === p
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-full mb-6">
                <CreditCard size={48} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Payment Methods</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                {searchTerm ? 'No matches found for your search.' : 'Get started by creating your first payment method.'}
              </p>
              {!searchTerm && (
                <button onClick={() => openModal()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                  Create Method
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Target className="text-blue-600" size={24} />
                  {editingMethod ? 'Edit Payment Method' : 'New Payment Method'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Method Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Visa Credit Card"
                    maxLength={255}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border ${errors.name ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl outline-none focus:ring-4 transition-all font-medium`}
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <div className="relative">
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 appearance-none font-medium cursor-pointer"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="voucher">Voucher</option>
                        <option value="wallet">Wallet</option>
                      </select>
                      <ChevronLeft className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                    <div className="relative">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 appearance-none font-medium cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${formData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <ChevronLeft className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={20} /> : <Target size={20} />}
                    <span>{editingMethod ? 'Update Method' : 'Create Method'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentMethods;