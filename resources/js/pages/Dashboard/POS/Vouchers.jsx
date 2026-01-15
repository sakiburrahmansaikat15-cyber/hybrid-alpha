import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, Ticket, Tag, Calendar
} from 'lucide-react';

const API_URL = '/api/pos/vouchers';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '', name: '', amount: '', description: '', is_active: 1, limit_usage: '', expiry_date: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total_items: 0 });

  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  useEffect(() => () => { if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current); }, []);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      showNotification(Object.values(validationErrors)[0]?.[0] || 'Check input fields', 'error');
    } else {
      const msg = error.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  }, [showNotification]);

  const fetchVouchers = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setVouchers(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => fetchVouchers(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchVouchers]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchVouchers(newPage);
  };

  const openModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        name: voucher.name,
        amount: voucher.amount,
        description: voucher.description || '',
        is_active: voucher.is_active,
        limit_usage: voucher.limit_usage || '',
        expiry_date: voucher.expiry_date ? voucher.expiry_date.split('T')[0] : ''
      });
    } else {
      setEditingVoucher(null);
      setFormData({ code: '', name: '', amount: '', description: '', is_active: 1, limit_usage: '', expiry_date: '' });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVoucher(null);
  };

  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code: `VOU-${random}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingVoucher) {
        await axios.put(`${API_URL}/${editingVoucher.id}`, formData);
        showNotification('Voucher updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Voucher created successfully');
      }
      fetchVouchers(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this voucher?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Voucher deleted successfully');
      fetchVouchers(1);
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-teal-500/10 border-teal-500/20 text-teal-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
              <Ticket className="text-teal-500" /> Vouchers
            </h1>
            <p className="text-sm text-slate-500">Manage discount codes and promotional coupons</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-teal-500/20">
            <Plus size={18} />
            <span>Create Voucher</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search vouchers by code or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-teal-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-teal-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && vouchers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : vouchers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {vouchers.map((voucher) => (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Code</span>
                      <div className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-mono font-bold rounded-lg border-dashed border border-teal-200 dark:border-teal-800">
                        {voucher.code}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(voucher)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(voucher.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === voucher.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{voucher.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-1">{voucher.description || 'No description'}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Value</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        ${parseFloat(voucher.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-bold uppercase mb-1 ${voucher.is_active ? 'text-teal-500' : 'text-slate-400'}`}>
                        {voucher.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {voucher.expiry_date && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(voucher.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-sm font-medium text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-teal-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-teal-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Ticket size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Vouchers Found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold dark:text-white">{editingVoucher ? 'Edit Voucher' : 'Create Voucher'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Voucher Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="Summer Sale"
                      required
                    />
                    {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Voucher Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono"
                        placeholder="SUMMER25"
                        required
                      />
                      <button type="button" onClick={generateCode} className="px-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold">GEN</button>
                    </div>
                    {errors.code && <p className="text-rose-500 text-xs mt-1">{errors.code[0]}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                    <input
                      type="number" step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="0.00"
                      required
                    />
                    {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.limit_usage}
                      onChange={e => setFormData({ ...formData, limit_usage: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all h-20 resize-none"
                    placeholder="Voucher details..."
                  ></textarea>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active == 1}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                      className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 border-gray-300"
                    />
                    <span className="font-medium text-sm">Active Voucher</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    {editingVoucher ? 'Update Voucher' : 'Create Voucher'}
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

export default Vouchers;