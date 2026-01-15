import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, CreditCard, Lock, Globe, Key
} from 'lucide-react';

const API_URL = '/api/pos/payment-gateways';

const PaymentGateways = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', slug: '', config: '', is_active: 1 });
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

  const fetchGateways = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setGateways(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setGateways([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => fetchGateways(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchGateways]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchGateways(newPage);
  };

  const openModal = (gateway = null) => {
    if (gateway) {
      setEditingGateway(gateway);
      setFormData({
        name: gateway.name,
        slug: gateway.slug,
        config: typeof gateway.config === 'string' ? gateway.config : JSON.stringify(gateway.config, null, 2),
        is_active: gateway.is_active
      });
    } else {
      setEditingGateway(null);
      setFormData({ name: '', slug: '', config: '{}', is_active: 1 });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGateway(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    // Validate JSON config
    try {
      JSON.parse(formData.config);
    } catch (e) {
      setErrors({ config: ['Invalid JSON format'] });
      setOperationLoading(null);
      return;
    }

    try {
      const payload = { ...formData, config: JSON.parse(formData.config) };
      if (editingGateway) {
        await axios.put(`${API_URL}/${editingGateway.id}`, payload);
        showNotification('Gateway updated successfully');
      } else {
        await axios.post(API_URL, payload);
        showNotification('Gateway created successfully');
      }
      fetchGateways(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gateway?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Gateway deleted successfully');
      fetchGateways(1);
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
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600'}`}>
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
              <Globe className="text-cyan-500" /> Payment Gateways
            </h1>
            <p className="text-sm text-slate-500">Configure external payment processors</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-cyan-500/20">
            <Plus size={18} />
            <span>Add Gateway</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search gateways..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-cyan-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && gateways.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : gateways.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {gateways.map((gateway) => (
                <motion.div
                  key={gateway.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600">
                      <CreditCard size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(gateway)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(gateway.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === gateway.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mb-1">{gateway.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">{gateway.slug}</p>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${gateway.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {gateway.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Lock size={12} /> Configured
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
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-cyan-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-cyan-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Globe size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Payment Gateways Found</p>
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
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold dark:text-white">{editingGateway ? 'Edit Gateway' : 'Add Gateway'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gateway Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    placeholder="Stripe"
                    required
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (Identifier)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
                    placeholder="stripe"
                    required
                  />
                  {errors.slug && <p className="text-rose-500 text-xs mt-1">{errors.slug[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Configuration (JSON)</label>
                  <div className="relative">
                    <textarea
                      value={formData.config}
                      onChange={e => setFormData({ ...formData, config: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono text-xs h-40 resize-none"
                      placeholder='{"api_key": "..."}'
                      required
                    ></textarea>
                    <Key size={14} className="absolute top-4 right-4 text-slate-400" />
                  </div>
                  {errors.config && <p className="text-rose-500 text-xs mt-1">{errors.config[0]}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active == 1}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                      className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300"
                    />
                    <span className="font-medium text-sm">Active Gateway</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    {editingGateway ? 'Update Gateway' : 'Add Gateway'}
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

export default PaymentGateways;