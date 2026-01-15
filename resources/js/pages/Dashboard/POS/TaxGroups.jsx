import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, Layers, Calculator
} from 'lucide-react';

const API_URL = '/api/pos/tax-groups';
const TAX_RATES_API = '/api/pos/tax-rates';

const TaxGroups = () => {
  const [groups, setGroups] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', tax_rates: [] }); // array of rate IDs
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

  const fetchGroups = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setGroups(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  const fetchRates = useCallback(async () => {
    try {
      const response = await axios.get(TAX_RATES_API);
      setRates(response.data.pagination?.data || response.data.data || []);
    } catch (e) { console.error('Failed to load rates'); }
  }, []);

  useEffect(() => {
    fetchRates();
    const timer = setTimeout(() => fetchGroups(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchGroups, fetchRates]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchGroups(newPage);
  };

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        tax_rates: group.tax_rates ? group.tax_rates.map(r => r.id) : []
      });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', tax_rates: [] });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGroup(null);
  };

  const toggleRateSelection = (rateId) => {
    setFormData(prev => {
      const newRates = prev.tax_rates.includes(rateId)
        ? prev.tax_rates.filter(id => id !== rateId)
        : [...prev.tax_rates, rateId];
      return { ...prev, tax_rates: newRates };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingGroup) {
        await axios.put(`${API_URL}/${editingGroup.id}`, formData);
        showNotification('Tax group updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Tax group created successfully');
      }
      fetchGroups(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax group?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Tax group deleted successfully');
      fetchGroups(1);
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
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-sky-500/10 border-sky-500/20 text-sky-600'}`}>
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
              <Layers className="text-sky-500" /> Tax Groups
            </h1>
            <p className="text-sm text-slate-500">Combine multiple tax rates into groups</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-sky-500/20">
            <Plus size={18} />
            <span>Create Group</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-sky-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-sky-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && groups.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : groups.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {groups.map((group) => {
                const totalRate = group.tax_rates?.reduce((acc, r) => acc + parseFloat(r.rate), 0) || 0;
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600">
                        <Layers size={20} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openModal(group)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(group.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                          {operationLoading === group.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 truncate">{group.name}</h3>

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {group.tax_rates?.map(rate => (
                          <span key={rate.id} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {rate.name} ({parseFloat(rate.rate)}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Combined Rate</span>
                      <div className="flex items-center gap-1 text-xl font-black text-sky-600 dark:text-sky-500">
                        <Calculator size={16} /> {totalRate.toFixed(2)}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-sm font-medium text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-sky-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-sky-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Layers size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Tax Groups Found</p>
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
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold dark:text-white">{editingGroup ? 'Edit Tax Group' : 'New Tax Group'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    placeholder="GST + PST"
                    required
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Tax Rates</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    {rates.map(rate => (
                      <div
                        key={rate.id}
                        onClick={() => toggleRateSelection(rate.id)}
                        className={`
                            cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all
                            ${formData.tax_rates.includes(rate.id)
                            ? 'bg-sky-50 border-sky-500 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                            : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600'}
                          `}
                      >
                        <span className="font-medium text-sm">{rate.name}</span>
                        <span className="text-xs font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {parseFloat(rate.rate)}%
                        </span>
                      </div>
                    ))}
                    {rates.length === 0 && <p className="text-xs text-slate-400 col-span-2 text-center py-2">No tax rates available</p>}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    {editingGroup ? 'Update Group' : 'Create Group'}
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

export default TaxGroups;